import api from './api';
import * as SecureStore from 'expo-secure-store';

// Constants for token storage keys
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const TOKEN_EXPIRY_KEY = 'token_expiry';
const USER_CACHE_KEY = 'user_cache';
const TOKEN_CACHE_KEY = 'token_cache';

// Cache settings
const USER_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const TOKEN_CACHE_TTL = 60 * 1000; // 1 minute

/**
 * Authentication service for handling user authentication
 */
class AuthService {
  /**
   * Login with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} - User data with access token
   */
  async login(email, password) {
    try {
      // First check if server is available
      const isConnected = await api.isConnected();
      if (!isConnected) {
        throw new Error('Unable to reach authentication server. Please check your internet connection and try again.');
      }
      
      // Create form data for Python backend compatibility (primary method)
      const formData = new FormData();
      formData.append('username', email); // Python FastAPI uses 'username'
      formData.append('password', password);
      
      try {
        // First try form data format (Python backend)
        const response = await api.post('/auth/login', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        // Handle response from Python backend
        if (response && (response.access_token || response.data?.access_token)) {
          // Extract tokens and user data
          const accessToken = response.access_token || response.data?.access_token;
          const refreshToken = response.refresh_token || response.data?.refresh_token;
          const expiresIn = response.expires_in || response.data?.expires_in || 3600;
          const userData = response.user || response.data?.user;
      
      // Store tokens and expiry
      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
      await SecureStore.setItemAsync(TOKEN_EXPIRY_KEY, 
        (Date.now() + (expiresIn * 1000)).toString());
      
      // Cache user data if available
      if (userData) {
        const userCache = {
          user: userData,
          timestamp: Date.now()
        };
        await SecureStore.setItemAsync(USER_CACHE_KEY, JSON.stringify(userCache));
      }
      
      return { data: { user: userData, access_token: accessToken } };
    } catch (error) {
      console.error('Login error:', error);
      if (!error.response && !error.message.includes('Unable to reach')) {
        throw new Error('Unable to reach authentication server. Please check your internet connection and try again.');
      }
      throw error;
    }
  }

  /**
   * Logout user and clear tokens
   * @returns {Promise<void>}
   */
  async logout() {
    try {
      // Try to call logout endpoint if we have a refresh token
      try {
        const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
        if (refreshToken) {
          await api.post('/auth/logout', { refresh_token: refreshToken });
        }
      } catch (logoutError) {
        // Continue with local logout even if server logout fails
        console.warn('Server logout failed:', logoutError);
      }
      
      // Clear all stored authentication data
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(TOKEN_EXPIRY_KEY);
      await SecureStore.deleteItemAsync(USER_CACHE_KEY);
    } catch (error) {
      console.error('Error during logout:', error);
      // Ensure tokens are cleared even if there's an error
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(TOKEN_EXPIRY_KEY);
      await SecureStore.deleteItemAsync(USER_CACHE_KEY);
    }
  }

  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} - Created user data
   */
  async register(userData) {
    return api.post('/auth/register', userData);
  }

  /**
   * Request password reset
   * @param {string} email - User email
   * @returns {Promise<Object>} - Response data
   */
  async requestPasswordReset(email) {
    return api.post('/auth/password-reset/request', { email });
  }

  /**
   * Reset password with token
   * @param {string} token - Reset token
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} - Response data
   */
  async resetPassword(token, newPassword) {
    return api.post('/auth/password-reset/confirm', { token, new_password: newPassword });
  }

  /**
   * Get current user profile
   * @returns {Promise<Object>} - User profile data
   */
  /**
   * Refresh the access token using the refresh token
   * @returns {Promise<string>} - New access token
   * @private
   */
  async _refreshToken() {
    try {
      // Check if we have a cached token that's still valid
      const tokenCacheJson = await SecureStore.getItemAsync(TOKEN_CACHE_KEY);
      if (tokenCacheJson) {
        try {
          const tokenCache = JSON.parse(tokenCacheJson);
          const cacheAge = Date.now() - tokenCache.timestamp;
          
          // Use cache if it's still valid
          if (cacheAge < TOKEN_CACHE_TTL && tokenCache.accessToken) {
            console.log('Using cached access token');
            return tokenCache.accessToken;
          }
        } catch (cacheError) {
          console.warn('Error parsing token cache:', cacheError);
          // Continue with refresh if cache parsing fails
        }
      }
      
      const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
      // First try Python backend format (RefreshTokenRequest)
      try {
        const response = await api.post('/auth/refresh', { refresh_token: refreshToken });
        
        // Handle Python backend response format
        if (response && response.access_token) {
          const accessToken = response.access_token;
          const newRefreshToken = response.refresh_token;
          const expiresIn = response.expires_in || 3600;
          const userData = response.user;
          
          // Store the new tokens and update cache
          await this._storeTokensAndUpdateCache(accessToken, newRefreshToken, expiresIn, userData);
          return accessToken;
        }
      } catch (firstError) {
        console.warn('Standard refresh format failed, trying alternative format:', firstError);
        
        try {
          // Try Node.js backend format
          const response = await api.post('/auth/refresh', { refreshToken });
          
          if (response && response.data && response.data.accessToken) {
            const accessToken = response.data.accessToken;
            const newRefreshToken = response.data.refreshToken;
            const expiresIn = response.data.expiresIn || 3600;
            const userData = response.data.user;
            
            // Store the new tokens and update cache
            await this._storeTokensAndUpdateCache(accessToken, newRefreshToken, expiresIn, userData);
            return accessToken;
          }
        } catch (secondError) {
          console.warn('Alternative format failed, trying data property format:', secondError);
          
          try {
            // Try Node.js backend format with data property
            const response = await api.post('/auth/refresh', { refresh_token: refreshToken });
            
            if (response && response.data && response.data.access_token) {
              const accessToken = response.data.access_token;
              const newRefreshToken = response.data.refresh_token;
              const expiresIn = response.data.expires_in || 3600;
              const userData = response.data.user;
              
              // Store the new tokens and update cache
              await this._storeTokensAndUpdateCache(accessToken, newRefreshToken, expiresIn, userData);
              return accessToken;
            }
          } catch (thirdError) {
            console.error('All refresh token formats failed:', thirdError);
            throw new Error('Failed to refresh authentication token');
          }
        }
      }
      
      throw new Error('Invalid response from refresh token endpoint');
      
      // This code should not be reached as we now use _storeTokensAndUpdateCache
      // Adding fallback just in case
      await this._storeTokensAndUpdateCache(accessToken, newRefreshToken, expiresIn, userData);
      
      return accessToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      // Clear tokens on refresh failure
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(TOKEN_EXPIRY_KEY);
      await SecureStore.deleteItemAsync(TOKEN_CACHE_KEY);
      throw new Error('Session expired - Please login again');
    }
  }

  /**
   * Get current user profile with caching
   * @param {boolean} forceRefresh - Force refresh from server
   * @returns {Promise<Object>} - User profile data
   */
  /**
   * Helper method to store tokens and update caches
   * @param {string} accessToken - The access token
   * @param {string} refreshToken - The refresh token
   * @param {number} expiresIn - Token expiry in seconds
   * @param {Object} userData - User data if available
   * @returns {Promise<void>}
   * @private
   */
  async _storeTokensAndUpdateCache(accessToken, refreshToken, expiresIn, userData) {
    // Store the new access token
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
    
    // Update refresh token if provided
    if (refreshToken) {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
    }
    
    // Update token expiry
    const expiryTime = Date.now() + (expiresIn * 1000);
    await SecureStore.setItemAsync(TOKEN_EXPIRY_KEY, expiryTime.toString());
    
    // Cache the token for future use
    const tokenCache = {
      accessToken: accessToken,
      timestamp: Date.now()
    };
    await SecureStore.setItemAsync(TOKEN_CACHE_KEY, JSON.stringify(tokenCache));
    
    // Update user cache if user data is included
    if (userData) {
      const userCache = {
        user: userData,
        timestamp: Date.now()
      };
      await SecureStore.setItemAsync(USER_CACHE_KEY, JSON.stringify(userCache));
    }
  }

  /**
   * Get current user profile with caching
   * @param {boolean} forceRefresh - Force refresh from server
   * @returns {Promise<Object>} - User profile data
   */
  async getCurrentUser(forceRefresh = false) {
    try {
      // Check for cached user data first if not forcing refresh
      if (!forceRefresh) {
        const cachedUserData = await SecureStore.getItemAsync(USER_CACHE_KEY);
        if (cachedUserData) {
          try {
            const userCache = JSON.parse(cachedUserData);
            const cacheAge = Date.now() - userCache.timestamp;
            
            // Use cache if it's less than TTL
            if (cacheAge < USER_CACHE_TTL && userCache.user) {
              console.log('Using cached user data');
              return { data: userCache.user, fromCache: true };
            }
          } catch (cacheError) {
            console.warn('Error parsing user cache:', cacheError);
            // Continue with fetch if cache parsing fails
          }
        }
      }
      
      // Check token expiry
      const tokenExpiry = await SecureStore.getItemAsync(TOKEN_EXPIRY_KEY);
      
      if (!tokenExpiry || Date.now() > parseInt(tokenExpiry)) {
        await this._refreshToken();
      }
      
      // Fetch fresh user data
      const response = await api.get('/users/me');
      
      // Handle different response formats from different backends
      let userData;
      if (response.data) {
        // Node.js backend format
        userData = response.data;
      } else {
        // Python backend format
        userData = response;
      }
      
      // Update cache with fresh data
      const userCache = {
        user: userData,
        timestamp: Date.now()
      };
      await SecureStore.setItemAsync(USER_CACHE_KEY, JSON.stringify(userCache));
      
      return { data: userData, fromCache: false };
    } catch (error) {
      console.error('Error getting current user:', error);
      if (error.response?.status === 401 || error.status === 401) {
        // Clear tokens on authentication failure
        await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
        await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
        await SecureStore.deleteItemAsync(TOKEN_EXPIRY_KEY);
        await SecureStore.deleteItemAsync(TOKEN_CACHE_KEY);
        await SecureStore.deleteItemAsync(USER_CACHE_KEY);
      }
      throw error;
    }
  }
  }

  /**
   * Update user profile
   * @param {Object} profileData - Profile data to update
   * @returns {Promise<Object>} - Updated user profile
   */
  async updateProfile(profileData) {
    return api.put('/users/me', profileData);
  }

  /**
   * Change user password
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} - Response data
   */
  async changePassword(currentPassword, newPassword) {
    return api.post('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword
    });
  }

  /**
   * Submit KYC verification documents
   * @param {Object} kycData - KYC verification data
   * @returns {Promise<Object>} - Response data
   */
  async submitKYC(kycData) {
    return api.post('/users/kyc', kycData);
  }

  /**
   * Get KYC verification status
   * @returns {Promise<Object>} - KYC status data
   */
  async getKYCStatus() {
    return api.get('/users/kyc/status');
  }
}

export default new AuthService();