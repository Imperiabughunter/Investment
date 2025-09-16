/**
 * Base API service with common methods for making HTTP requests
 */
class ApiService {
  constructor(baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') {
    this.baseUrl = baseUrl;
    this.isServerAvailable = true;
    this.lastServerCheckTime = 0;
  }

  /**
   * Get authorization header with JWT token
   * @returns {Object} - Headers object with Authorization
   * @private
   */
  async _getAuthHeaders() {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    
    const token = localStorage.getItem('token');
    if (token) {
      // Check if token is expired and needs refresh
      const tokenExpiry = localStorage.getItem('tokenExpiry');
      const isExpired = tokenExpiry && parseInt(tokenExpiry) < Date.now();
      
      if (isExpired) {
        try {
          // Try to refresh the token
          const refreshToken = localStorage.getItem('refreshToken');
          if (refreshToken) {
            await this._refreshToken(refreshToken);
          }
        } catch (error) {
          console.error('Failed to refresh token:', error);
          // Continue with the current token even if expired
        }
      }
      
      // Get the potentially refreshed token
      const currentToken = localStorage.getItem('token');
      headers['Authorization'] = `Bearer ${currentToken}`;
    }
    
    return headers;
  }
  
  // Refresh token helper
  async _refreshToken(refreshToken) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
        signal: controller.signal,
        credentials: 'include'
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }
      
      const data = await response.json();
      
      if (data.access_token) {
        localStorage.setItem('token', data.access_token);
        
        // Update refresh token if provided
        if (data.refresh_token) {
          localStorage.setItem('refreshToken', data.refresh_token);
        }
        
        // Update token expiry
        const expiresIn = data.expires_in || 3600;
        const expiryTime = Date.now() + expiresIn * 1000;
        localStorage.setItem('tokenExpiry', expiryTime.toString());
      } else {
        throw new Error('Invalid token response');
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Make a GET request
   * @param {string} endpoint - API endpoint
   * @param {Object} params - Query parameters
   * @returns {Promise<any>} - Response data
   */
  async get(endpoint, params = {}) {
    try {
      // Check server availability first
      if (!this.isServerAvailable) {
        await this._checkServerAvailability();
        if (!this.isServerAvailable) {
          throw new Error('Server is currently unavailable. Please try again later.');
        }
      }
      
      const url = new URL(`${this.baseUrl}${endpoint}`);
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          url.searchParams.append(key, params[key]);
        }
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      // Get headers with potential token refresh
      const headers = await this._getAuthHeaders();

      try {
        const response = await fetch(url.toString(), {
          method: 'GET',
          headers,
          signal: controller.signal,
          credentials: 'include' // Include cookies in the request
        });
        
        clearTimeout(timeoutId);
        return await this._handleResponse(response);
      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }
    } catch (error) {
      console.error(`GET ${endpoint} error:`, error);
      
      if (error.name === 'AbortError') {
        throw new Error(`Request to ${endpoint} timed out. Please try again later.`);
      } else if (error.message === 'Failed to fetch' || error.message.includes('NetworkError')) {
        throw new Error('Network error. Please check your connection and try again.');
      } else if (error.status === 401) {
        // Handle unauthorized error - clear tokens and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('tokenExpiry');
        throw new Error('Your session has expired. Please log in again.');
      }
      throw error;
    }
  }

  /**
   * Make a POST request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body
   * @returns {Promise<any>} - Response data
   */
  async post(endpoint, data = {}) {
    try {
      // Check server availability first
      if (!this.isServerAvailable) {
        await this._checkServerAvailability();
        if (!this.isServerAvailable) {
          throw new Error('Server is currently unavailable. Please try again later.');
        }
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      // Get headers with potential token refresh
      const headers = await this._getAuthHeaders();

      try {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          method: 'POST',
          headers,
          body: JSON.stringify(data),
          signal: controller.signal,
          credentials: 'include' // Include cookies in the request
        });
        
        clearTimeout(timeoutId);
        return await this._handleResponse(response);
      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }
    } catch (error) {
      console.error(`POST ${endpoint} error:`, error);
      
      if (error.name === 'AbortError') {
        throw new Error(`Request to ${endpoint} timed out. Please try again later.`);
      } else if (error.message === 'Failed to fetch' || error.message.includes('NetworkError')) {
        throw new Error('Network error. Please check your connection and try again.');
      } else if (error.status === 401) {
        // Handle unauthorized error - clear tokens and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('tokenExpiry');
        throw new Error('Your session has expired. Please log in again.');
      }
      throw error;
    }
  }

  /**
   * Make a PUT request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body
   * @returns {Promise<any>} - Response data
   */
  async put(endpoint, data = {}) {
    try {
      // Check server availability first
      if (!this.isServerAvailable) {
        await this._checkServerAvailability();
        if (!this.isServerAvailable) {
          throw new Error('Server is currently unavailable. Please try again later.');
        }
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      // Get headers with potential token refresh
      const headers = await this._getAuthHeaders();

      try {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(data),
          signal: controller.signal,
          credentials: 'include' // Include cookies in the request
        });
        
        clearTimeout(timeoutId);
        return await this._handleResponse(response);
      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }
    } catch (error) {
      console.error(`PUT ${endpoint} error:`, error);
      
      if (error.name === 'AbortError') {
        throw new Error(`Request to ${endpoint} timed out. Please try again later.`);
      } else if (error.message === 'Failed to fetch' || error.message.includes('NetworkError')) {
        throw new Error('Network error. Please check your connection and try again.');
      } else if (error.status === 401) {
        // Handle unauthorized error - clear tokens and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('tokenExpiry');
        throw new Error('Your session has expired. Please log in again.');
      }
      throw error;
    }
  }

  /**
   * Make a PATCH request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body
   * @returns {Promise<any>} - Response data
   */
  async patch(endpoint, data = {}) {
    try {
      // Check server availability first
      if (!this.isServerAvailable) {
        await this._checkServerAvailability();
        if (!this.isServerAvailable) {
          throw new Error('Server is currently unavailable. Please try again later.');
        }
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      // Get headers with potential token refresh
      const headers = await this._getAuthHeaders();

      try {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(data),
          signal: controller.signal,
          credentials: 'include' // Include cookies in the request
        });
        
        clearTimeout(timeoutId);
        return await this._handleResponse(response);
      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }
    } catch (error) {
      console.error(`PATCH ${endpoint} error:`, error);
      
      if (error.name === 'AbortError') {
        throw new Error(`Request to ${endpoint} timed out. Please try again later.`);
      } else if (error.message === 'Failed to fetch' || error.message.includes('NetworkError')) {
        throw new Error('Network error. Please check your connection and try again.');
      } else if (error.status === 401) {
        // Handle unauthorized error - clear tokens and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('tokenExpiry');
        throw new Error('Your session has expired. Please log in again.');
      }
      throw error;
    }
  }

  /**
   * Make a DELETE request
   * @param {string} endpoint - API endpoint
   * @returns {Promise<any>} - Response data
   */
  async delete(endpoint) {
    try {
      // Check server availability first
      if (!this.isServerAvailable) {
        await this._checkServerAvailability();
        if (!this.isServerAvailable) {
          throw new Error('Server is currently unavailable. Please try again later.');
        }
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      // Get headers with potential token refresh
      const headers = await this._getAuthHeaders();

      try {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          method: 'DELETE',
          headers,
          signal: controller.signal,
          credentials: 'include' // Include cookies in the request
        });
        
        clearTimeout(timeoutId);
        return await this._handleResponse(response);
      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }
    } catch (error) {
      console.error(`DELETE ${endpoint} error:`, error);
      
      if (error.name === 'AbortError') {
        throw new Error(`Request to ${endpoint} timed out. Please try again later.`);
      } else if (error.message === 'Failed to fetch' || error.message.includes('NetworkError')) {
        throw new Error('Network error. Please check your connection and try again.');
      } else if (error.status === 401) {
        // Handle unauthorized error - clear tokens and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('tokenExpiry');
        throw new Error('Your session has expired. Please log in again.');
      }
      throw error;
    }
  }

  /**
   * Check if the server is available
   * @returns {Promise<boolean>} - True if server is available, false otherwise
   * @private
   */
  async _checkServerAvailability() {
    // Don't check too frequently
    const now = Date.now();
    if (this.lastServerCheckTime && now - this.lastServerCheckTime < 30000) {
      return this.isServerAvailable;
    }
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      try {
        // First try health endpoint
        const response = await fetch(`${this.baseUrl}/health`, {
          method: 'GET',
          signal: controller.signal,
          credentials: 'include',
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (response.ok) {
          clearTimeout(timeoutId);
          this.isServerAvailable = true;
          this.lastServerCheckTime = now;
          return true;
        }
      } catch (healthError) {
        console.warn('Health endpoint check failed, trying fallback:', healthError.message);
      }
      
      // If health endpoint fails, try a basic endpoint like /api or /
      try {
        const response = await fetch(`${this.baseUrl}`, {
          method: 'GET',
          signal: controller.signal,
          credentials: 'include',
          headers: {
            'Accept': 'application/json'
          }
        });
        
        clearTimeout(timeoutId);
        this.isServerAvailable = response.status < 500; // Any non-server error is considered available
        this.lastServerCheckTime = now;
        return this.isServerAvailable;
      } catch (fallbackError) {
        console.warn('Fallback endpoint check failed:', fallbackError.message);
        throw fallbackError; // Re-throw to be caught by outer catch
      }
    } catch (error) {
      console.warn('Server availability check failed:', error.message);
      this.isServerAvailable = false;
      this.lastServerCheckTime = now;
      
      // Dispatch an event that can be listened to by other components
      const serverDownEvent = new CustomEvent('server:unavailable', { 
        detail: { error: error.message } 
      });
      window.dispatchEvent(serverDownEvent);
      
      return false;
    }
  }

  /**
   * Handle API response with enhanced error handling and recovery mechanisms
   * @param {Response} response - Fetch response
   * @returns {Promise<any>} - Response data
   * @private
   */
  async _handleResponse(response) {
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    
    if (!response.ok) {
      let error;
      try {
        error = isJson ? await response.json() : { message: response.statusText };
      } catch (e) {
        error = { message: response.statusText || 'Unknown error' };
      }
      
      // Create a custom error with additional properties
      const customError = new Error(error.message || error.detail || 'Something went wrong');
      customError.status = response.status;
      customError.statusText = response.statusText;
      customError.data = error;
      customError.endpoint = response.url.replace(this.baseUrl, '');
      customError.timestamp = new Date().toISOString();
      customError.requestId = response.headers.get('x-request-id') || 'unknown';
      
      // Log the error for debugging
      console.error('API Error:', {
        status: response.status,
        endpoint: customError.endpoint,
        message: customError.message,
        requestId: customError.requestId,
        timestamp: customError.timestamp,
        data: error
      });
      
      // Handle specific error cases
      if (response.status === 503 || response.status === 502 || response.status === 504) {
        // Server unavailable or gateway errors - update server availability status
        this.isServerAvailable = false;
        this.lastServerCheckTime = Date.now();
        
        // Dispatch an event that can be listened to by other components
        const serverDownEvent = new CustomEvent('server:unavailable', { 
          detail: { error: customError.message, status: response.status } 
        });
        window.dispatchEvent(serverDownEvent);
      } else if (response.status === 401) {
        // Unauthorized - clear tokens
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('tokenExpiry');
        localStorage.removeItem('user_info');
        
        // Dispatch auth error event
        const authErrorEvent = new CustomEvent('auth:session_expired', { 
          detail: { error: customError.message } 
        });
        window.dispatchEvent(authErrorEvent);
      } else if (response.status === 429) {
        // Rate limiting - add retry information if available
        const retryAfter = response.headers.get('Retry-After');
        if (retryAfter) {
          customError.retryAfter = parseInt(retryAfter, 10);
          customError.message = `${customError.message}. Please retry after ${retryAfter} seconds.`;
        }
        window.dispatchEvent(new CustomEvent('api:rate_limited', { 
          detail: { retryAfter, error: customError.message } 
        }));
      } else if (response.status === 400) {
        // Bad request - validation errors
        window.dispatchEvent(new CustomEvent('api:validation_error', { 
          detail: { data: error } 
        }));
      } else if (response.status === 403) {
        // Forbidden - permission denied
        window.dispatchEvent(new CustomEvent('auth:permission_denied', { 
          detail: { error: customError.message } 
        }));
      } else if (response.status === 404) {
        // Not found
        window.dispatchEvent(new CustomEvent('api:resource_not_found', { 
          detail: { endpoint: customError.endpoint } 
        }));
      } else if (response.status >= 500) {
        // Server errors
        window.dispatchEvent(new CustomEvent('api:server_error', { 
          detail: { error: customError.message, status: response.status } 
        }));
      }
      
      // Report error to monitoring service if available
      if (typeof window.reportErrorToMonitoring === 'function') {
        try {
          window.reportErrorToMonitoring({
            type: 'api_error',
            error: customError,
            context: {
              url: response.url,
              status: response.status,
              endpoint: customError.endpoint
            }
          });
        } catch (reportError) {
          console.warn('Failed to report error to monitoring service', reportError);
        }
      }
      
      throw customError;
    }
    
    try {
      return isJson ? await response.json() : await response.text();
    } catch (error) {
      console.error('Error parsing response:', error);
      const parseError = new Error('Failed to parse server response');
      parseError.originalError = error;
      parseError.endpoint = response.url.replace(this.baseUrl, '');
      parseError.status = response.status;
      parseError.statusText = response.statusText;
      
      throw parseError;
    }
  }
}

export default new ApiService();