import fetchToWeb from '../__create/fetch';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
const ACCESS_TOKEN_KEY = 'access_token';

// Network timeout in milliseconds
const REQUEST_TIMEOUT = 15000;

/**
 * Base API service with common methods for making HTTP requests
 */
class ApiService {
  constructor(baseUrl = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Make a GET request
   * @param {string} endpoint - API endpoint
   * @param {Object} params - Query parameters
   * @returns {Promise<any>} - Response data
   */
  async get(endpoint, params = {}) {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key]);
      }
    });

    const headers = await this._getAuthHeaders();
    
    // Create AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    
    try {
      const response = await fetchToWeb(url.toString(), {
        headers,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return this._handleResponse(response);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${REQUEST_TIMEOUT}ms`);
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
    const headers = await this._getAuthHeaders();
    headers['Content-Type'] = 'application/json';
    
    // Create AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    
    try {
      const response = await fetchToWeb(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return this._handleResponse(response);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${REQUEST_TIMEOUT}ms`);
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
    const headers = await this._getAuthHeaders();
    headers['Content-Type'] = 'application/json';
    
    // Create AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    
    try {
      const response = await fetchToWeb(`${this.baseUrl}${endpoint}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return this._handleResponse(response);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${REQUEST_TIMEOUT}ms`);
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
    const headers = await this._getAuthHeaders();
    headers['Content-Type'] = 'application/json';
    
    // Create AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    
    try {
      const response = await fetchToWeb(`${this.baseUrl}${endpoint}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(data),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return this._handleResponse(response);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${REQUEST_TIMEOUT}ms`);
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
    const headers = await this._getAuthHeaders();
    
    // Create AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    
    try {
      const response = await fetchToWeb(`${this.baseUrl}${endpoint}`, {
        method: 'DELETE',
        headers,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return this._handleResponse(response);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${REQUEST_TIMEOUT}ms`);
      }
      throw error;
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
    const endpoint = response.url.replace(this.baseUrl, '');
    
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
      customError.endpoint = endpoint;
      customError.timestamp = new Date().toISOString();
      customError.requestId = response.headers.get('x-request-id') || 'unknown';
      
      // Log the error for debugging
      console.error(`API Error (${response.status}):`, {
        endpoint,
        status: response.status,
        message: customError.message,
        requestId: customError.requestId,
        timestamp: customError.timestamp,
        data: error
      });
      
      // Handle specific error cases
      if (response.status === 503 || response.status === 502 || response.status === 504) {
        // Server unavailable errors - can trigger UI notification
        console.warn('Server unavailable, status:', response.status);
        this._dispatchEvent('server:unavailable', { endpoint });
      } else if (response.status === 401) {
        // Unauthorized - clear tokens from secure storage
        try {
          await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
          await SecureStore.deleteItemAsync('refresh_token');
          await SecureStore.deleteItemAsync('token_expiry');
          await SecureStore.deleteItemAsync('token_cache');
          await SecureStore.deleteItemAsync('user_cache');
          
          // Dispatch session expired event
          this._dispatchEvent('auth:session_expired', { message: customError.message });
          
          // Optionally trigger navigation to login screen
          if (typeof global.handleAuthError === 'function') {
            global.handleAuthError({ error: customError.message });
          }
        } catch (storageError) {
          console.warn('Failed to clear auth tokens:', storageError);
        }
      } else if (response.status === 429) {
        // Rate limiting - add retry information if available
        const retryAfter = response.headers.get('Retry-After');
        if (retryAfter) {
          customError.retryAfter = parseInt(retryAfter, 10);
          customError.message = `${customError.message}. Please retry after ${retryAfter} seconds.`;
        }
        this._dispatchEvent('api:rate_limited', { retryAfter, message: customError.message });
      } else if (response.status === 400) {
        // Bad request - validation errors
        this._dispatchEvent('api:validation_error', { data: error });
      } else if (response.status === 403) {
        // Forbidden - permission denied
        this._dispatchEvent('auth:permission_denied', { message: customError.message });
      } else if (response.status === 404) {
        // Not found
        this._dispatchEvent('api:resource_not_found', { endpoint });
      } else if (response.status >= 500) {
        // Server errors
        this._dispatchEvent('api:server_error', { message: customError.message, status: response.status });
      }
      
      // Report error to remote logging service if available
      if (typeof global.reportErrorToRemote === 'function') {
        try {
          global.reportErrorToRemote({
            type: 'api_error',
            error: customError,
            context: {
              url: response.url,
              status: response.status,
              endpoint: customError.endpoint
            }
          });
        } catch (e) {
          console.warn('Failed to report error to remote service', e);
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
      parseError.endpoint = endpoint;
      parseError.status = response.status;
      parseError.statusText = response.statusText;
      
      throw parseError;
    }
  }
  
  /**
   * Helper method to dispatch events consistently
   * @param {string} eventName - Name of the event to dispatch
   * @param {Object} detail - Event details
   * @private
   */
  _dispatchEvent(eventName, detail = {}) {
    // For React Native, we can use DeviceEventEmitter or a custom event system
    if (global.EventEmitter) {
      global.EventEmitter.emit(eventName, detail);
    }
    
    // Log the event for debugging
    console.log(`Event dispatched: ${eventName}`, detail);
  }

  /**
   * Get authentication headers for requests
   * @returns {Promise<Object>} - Headers object with auth token if available
   * @private
   */
  async _getAuthHeaders() {
    const headers = {};
    
    try {
      const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn('Failed to get auth token:', error);
    }
    
    return headers;
  }
  
  /**
   * Check if we're currently connected to the internet and server is available
   * @returns {Promise<boolean>} - True if connected and server available, false otherwise
   */
  async isConnected() {
    try {
      // Try to fetch a small resource to check connectivity
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      try {
        // First try health endpoint
        const response = await fetchToWeb(`${this.baseUrl}/health`, {
          method: 'HEAD',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        if (response.ok) {
          return true;
        }
      } catch (healthError) {
        console.warn('Health endpoint check failed, trying fallback:', healthError.message);
      }
      
      // If health endpoint fails, try a basic endpoint like /api or /
      try {
        const fallbackController = new AbortController();
        const fallbackTimeoutId = setTimeout(() => fallbackController.abort(), 5000);
        
        const response = await fetchToWeb(`${this.baseUrl}`, {
          method: 'HEAD',
          signal: fallbackController.signal
        });
        
        clearTimeout(fallbackTimeoutId);
        return response.status < 500; // Any non-server error is considered available
      } catch (fallbackError) {
        console.warn('Fallback endpoint check failed:', fallbackError.message);
        return false;
      }
    } catch (error) {
      console.warn('Server availability check failed:', error.message);
      return false;
    }
  }
}

export default new ApiService();