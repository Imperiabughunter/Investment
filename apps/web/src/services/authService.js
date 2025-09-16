import ApiService from './api';

// Constants for cache keys and TTL values
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_INFO_KEY = 'user_info';
const TOKEN_CACHE_KEY = 'token_cache';

// Cache TTL in milliseconds
const USER_CACHE_TTL = 30 * 60 * 1000; // 30 minutes
const TOKEN_CACHE_TTL = 60 * 60 * 1000; // 1 hour

class AuthService {
  constructor() {
    this.apiService = new ApiService();
    // In-memory cache for web
    this.memoryCache = {
      [TOKEN_CACHE_KEY]: null,
      [USER_INFO_KEY]: null,
      tokenExpiry: null,
      userExpiry: null
    };
  }

  /**
   * Attempts to log in a user with the provided credentials.
   * Supports both JSON (Node.js backend) and form data (Python backend) formats.
   * @param {string} email - The user's email
   * @param {string} password - The user's password
   * @returns {Promise<Object>} - The user data
   */
  async login(email, password) {
    try {
      // Check if server is available before attempting login
      const isServerAvailable = await this.apiService.isConnected();
      if (!isServerAvailable) {
        throw new Error('Unable to connect to the server. Please check your internet connection and try again.');
      }

      // First try JSON format (Node.js backend)
      try {
        const response = await this.apiService.post('/auth/login', { email, password });
        
        if (response && response.data) {
          // Store tokens
          localStorage.setItem(ACCESS_TOKEN_KEY, response.data.access_token);
          localStorage.setItem(REFRESH_TOKEN_KEY, response.data.refresh_token);
          
          // Cache token with expiry
          this._cacheToken(response.data);
          
          // Store user info
          if (response.data.user) {
            localStorage.setItem(USER_INFO_KEY, JSON.stringify(response.data.user));
            this._cacheUserInfo(response.data.user);
          }
          
          return response.data;
        }
      } catch (jsonError) {
        console.warn('JSON login format failed, trying form data format:', jsonError);
        
        // If JSON format fails, try form data format (Python backend)
        const formData = new FormData();
        formData.append('username', email); // Python FastAPI uses 'username'
        formData.append('password', password);
        
        const response = await this.apiService.post('/auth/login', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        if (response && response.data) {
          // Store tokens - handle both formats
          const accessToken = response.data.access_token || response.data.token;
          const refreshToken = response.data.refresh_token || response.data.refresh;
          
          if (accessToken) {
            localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
            
            // Cache token with expiry
            this._cacheToken({
              access_token: accessToken,
              refresh_token: refreshToken
            });
            
            // For Python backend, we might need to fetch user info separately
            if (response.data.user) {
              localStorage.setItem(USER_INFO_KEY, JSON.stringify(response.data.user));
              this._cacheUserInfo(response.data.user);
            } else {
              // Try to get user info if not included in response
              this.getCurrentUser(true);
            }
            
            return response.data;
          }
        }
        
        throw new Error('Login failed. Invalid response format.');
      }
    } catch (error) {
      console.error('Login error:', error);
      // Clear any partial data that might have been stored
      this.logout();
      throw error;
    }
  }

  /**
   * Logs out the current user by removing tokens and user info
   */
  logout() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_INFO_KEY);
    
    // Clear memory cache
    this.memoryCache[TOKEN_CACHE_KEY] = null;
    this.memoryCache[USER_INFO_KEY] = null;
    this.memoryCache.tokenExpiry = null;
    this.memoryCache.userExpiry = null;
    
    // Optionally call backend logout endpoint if needed
    try {
      this.apiService.post('/auth/logout');
    } catch (error) {
      console.warn('Logout from server failed:', error);
      // Continue with local logout even if server logout fails
    }
  }

  /**
   * Gets the current user information, with optional force refresh
   * @param {boolean} forceRefresh - Whether to force a refresh from the server
   * @returns {Promise<Object>} - The user data
   */
  async getCurrentUser(forceRefresh = false) {
    try {
      // Check memory cache first if not forcing refresh
      if (!forceRefresh && 
          this.memoryCache[USER_INFO_KEY] && 
          this.memoryCache.userExpiry && 
          Date.now() < this.memoryCache.userExpiry) {
        return this.memoryCache[USER_INFO_KEY];
      }
      
      // Check localStorage if memory cache is empty or expired
      const userInfoStr = localStorage.getItem(USER_INFO_KEY);
      if (!forceRefresh && userInfoStr) {
        try {
          const userInfo = JSON.parse(userInfoStr);
          // Cache the parsed user info
          this._cacheUserInfo(userInfo);
          return userInfo;
        } catch (parseError) {
          console.warn('Error parsing cached user info:', parseError);
          // Continue to fetch from server if parsing fails
        }
      }
      
      // If we need to refresh or no cached data, fetch from server
      const token = await this._getAccessToken();
      if (!token) {
        throw new Error('No access token available');
      }
      
      // Try to get user info from server
      const response = await this.apiService.get('/auth/me');
      
      if (response && response.data) {
        // Handle different response formats
        const userData = response.data.user || response.data;
        
        // Update cache
        localStorage.setItem(USER_INFO_KEY, JSON.stringify(userData));
        this._cacheUserInfo(userData);
        
        return userData;
      }
      
      throw new Error('Failed to get user information');
    } catch (error) {
      console.error('Get current user error:', error);
      
      // If unauthorized, clear tokens and user info
      if (error.status === 401 || error.message?.includes('unauthorized')) {
        this.logout();
      }
      
      throw error;
    }
  }

  /**
   * Refreshes the access token using the refresh token
   * @returns {Promise<string>} - The new access token
   */
  async _refreshToken() {
    try {
      // Check if we have a cached token that's still valid
      if (this.memoryCache[TOKEN_CACHE_KEY] && 
          this.memoryCache.tokenExpiry && 
          Date.now() < this.memoryCache.tokenExpiry) {
        return this.memoryCache[TOKEN_CACHE_KEY].access_token;
      }
      
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
      // First try Python backend format (RefreshTokenRequest)
      try {
        const response = await this.apiService.post('/auth/refresh', { refresh_token: refreshToken });
        
        if (response && response.data) {
          // Handle Python backend response format
          const accessToken = response.data.access_token;
          const newRefreshToken = response.data.refresh_token;
          
          if (accessToken) {
            localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
            
            if (newRefreshToken) {
              localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
            }
            
            // Cache the new token
            this._cacheToken({
              access_token: accessToken,
              refresh_token: newRefreshToken || refreshToken
            });
            
            return accessToken;
          }
        }
      } catch (jsonError) {
        console.warn('Standard JSON refresh format failed, trying alternative format:', jsonError);
        
        // If standard format fails, try Node.js backend format
        try {
          const response = await this.apiService.post('/auth/refresh', { refreshToken });
          
          if (response && response.data && response.data.accessToken) {
            localStorage.setItem(ACCESS_TOKEN_KEY, response.data.accessToken);
            
            if (response.data.refreshToken) {
              localStorage.setItem(REFRESH_TOKEN_KEY, response.data.refreshToken);
            }
            
            // Cache the new token
            this._cacheToken({
              access_token: response.data.accessToken,
              refresh_token: response.data.refreshToken || refreshToken
            });
            
            return response.data.accessToken;
          }
        } catch (altJsonError) {
          console.warn('Alternative JSON format failed, trying form data format:', altJsonError);
          
          // If JSON formats fail, try form data format as last resort
          const formData = new FormData();
          formData.append('refresh_token', refreshToken);
          
          const response = await this.apiService.post('/auth/refresh', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
          
          if (response && response.data) {
            const accessToken = response.data.access_token || response.data.token;
            const newRefreshToken = response.data.refresh_token || response.data.refresh;
            
            if (accessToken) {
              localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
              
              if (newRefreshToken) {
                localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
              }
              
              // Cache the new token
              this._cacheToken({
                access_token: accessToken,
                refresh_token: newRefreshToken || refreshToken
              });
              
              return accessToken;
            }
          }
        }
        
        throw new Error('Token refresh failed. Invalid response format.');
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      
      // Clear tokens on refresh failure
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      
      // Clear memory cache
      this.memoryCache[TOKEN_CACHE_KEY] = null;
      this.memoryCache.tokenExpiry = null;
      
      throw error;
    }
  }

  /**
   * Gets the current access token, refreshing if necessary
   * @returns {Promise<string>} - The access token
   */
  async _getAccessToken() {
    // Check memory cache first
    if (this.memoryCache[TOKEN_CACHE_KEY] && 
        this.memoryCache.tokenExpiry && 
        Date.now() < this.memoryCache.tokenExpiry) {
      return this.memoryCache[TOKEN_CACHE_KEY].access_token;
    }
    
    // Try to get from localStorage
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    
    if (token) {
      // Cache the token
      this._cacheToken({ access_token: token });
      return token;
    }
    
    // If no token, try to refresh
    return this._refreshToken();
  }

  /**
   * Caches token data with expiry time
   * @param {Object} tokenData - The token data to cache
   */
  _cacheToken(tokenData) {
    if (!tokenData || !tokenData.access_token) return;
    
    this.memoryCache[TOKEN_CACHE_KEY] = tokenData;
    this.memoryCache.tokenExpiry = Date.now() + TOKEN_CACHE_TTL;
  }

  /**
   * Caches user info with expiry time
   * @param {Object} userInfo - The user info to cache
   */
  _cacheUserInfo(userInfo) {
    if (!userInfo) return;
    
    this.memoryCache[USER_INFO_KEY] = userInfo;
    this.memoryCache.userExpiry = Date.now() + USER_CACHE_TTL;
  }

  /**
   * Checks if the user is authenticated
   * @returns {Promise<boolean>} - Whether the user is authenticated
   */
  async isAuthenticated() {
    try {
      const token = await this._getAccessToken();
      return !!token;
    } catch (error) {
      return false;
    }
  }

  /**
   * Registers a new user
   * @param {Object} userData - The user data for registration
   * @returns {Promise<Object>} - The registration response
   */
  async register(userData) {
    try {
      // Check if server is available
      const isServerAvailable = await this.apiService.isConnected();
      if (!isServerAvailable) {
        throw new Error('Unable to connect to the server. Please check your internet connection and try again.');
      }
      
      const response = await this.apiService.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Requests a password reset for a user
   * @param {string} email - The user's email
   * @returns {Promise<Object>} - The response
   */
  async requestPasswordReset(email) {
    try {
      const response = await this.apiService.post('/auth/password-reset-request', { email });
      return response.data;
    } catch (error) {
      console.error('Password reset request error:', error);
      throw error;
    }
  }

  /**
   * Resets a user's password with a reset token
   * @param {string} token - The reset token
   * @param {string} newPassword - The new password
   * @returns {Promise<Object>} - The response
   */
  async resetPassword(token, newPassword) {
    try {
      const response = await this.apiService.post('/auth/password-reset', {
        token,
        new_password: newPassword
      });
      return response.data;
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  }
}

export default new AuthService();