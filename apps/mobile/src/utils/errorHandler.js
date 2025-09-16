/**
 * Utility functions for consistent error handling across the mobile application
 */

/**
 * Format API error message based on error object
 * @param {Error} error - Error object from API call
 * @returns {Object} Formatted error with message and details
 */
export const formatApiError = (error) => {
  // Default error message
  let message = 'An unexpected error occurred. Please try again.';
  let details = null;
  let statusCode = null;
  
  // Handle custom API errors with additional properties
  if (error) {
    // Extract status code if available
    statusCode = error.status || (error.response && error.response.status) || (error.data && error.data.status_code);
    
    // Extract details from error data
    if (error.data) {
      details = error.data.detail || error.data.message || null;
    }
    
    // Use custom message if available
    if (error.data?.detail) {
      message = error.data.detail;
    } else if (error.data?.message) {
      message = error.data.message;
    } else if (error.message && !error.message.includes('unexpected')) {
      message = error.message;
    }
    
    // Format based on status code
    if (statusCode) {
      if (statusCode === 401) {
        message = 'Your session has expired. Please log in again.';
      } else if (statusCode === 403) {
        message = 'You do not have permission to perform this action.';
      } else if (statusCode === 404) {
        message = 'The requested resource was not found.';
      } else if (statusCode === 429) {
        const retryAfter = error?.retryAfter || 'some time';
        message = `Too many requests. Please try again after ${retryAfter} seconds.`;
      } else if (statusCode === 503 || statusCode === 502 || statusCode === 504) {
        message = 'Service temporarily unavailable. Please try again later.';
      } else if (statusCode >= 500) {
        message = 'Server error. Please try again later.';
      } else if (statusCode === 400) {
        // For validation errors, try to extract field-specific errors
        if (error?.data?.errors || error?.data?.validation_errors) {
          const validationErrors = error?.data?.errors || error?.data?.validation_errors;
          if (typeof validationErrors === 'object') {
            const errorMessages = Object.entries(validationErrors)
              .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
              .join('; ');
            if (errorMessages) {
              message = `Validation error: ${errorMessages}`;
            } else {
              message = 'Please check your input and try again.';
            }
          }
        }
      }
    }
  }
  
  return {
    message,
    details,
    statusCode,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Handle API errors consistently across the application
 * @param {Error} error - The error from API call
 * @param {Function} setError - State setter for error message
 * @param {Function} setLoading - State setter for loading state
 * @param {Function} onLogout - Optional callback for handling auth errors
 * @param {Function} navigation - React Navigation object for redirects
 */
export const handleApiError = (error, setError, setLoading, onLogout = null, navigation = null) => {
  const formattedError = formatApiError(error);
  
  // Set error message for display
  if (setError) {
    setError(formattedError.message);
  }
  
  // Turn off loading state if provided
  if (setLoading) {
    setLoading(false);
  }
  
  // Handle authentication errors
  if (formattedError.statusCode === 401 && onLogout) {
    // Clear auth tokens and redirect to login
    onLogout();
    if (navigation) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    }
  }
  
  // Log error for debugging
  console.error('API Error:', formattedError);
  
  return formattedError;
};

/**
 * Show an alert for API errors
 * @param {Error} error - The error from API call
 * @param {Function} Alert - React Native Alert component
 */
export const showErrorAlert = (error, Alert) => {
  if (!Alert) return;
  
  const formattedError = formatApiError(error);
  
  Alert.alert(
    'Error',
    formattedError.message,
    [{ text: 'OK', onPress: () => console.log('OK Pressed') }],
    { cancelable: false }
  );
};

/**
 * Create a toast notification for an API error using a toast library
 * @param {Error} error - The error from API call
 * @param {Function} toast - Toast notification function from library
 */
export const showErrorToast = (error, toast) => {
  if (!toast) return;
  
  const formattedError = formatApiError(error);
  
  toast.show({
    type: 'error',
    text1: 'Error',
    text2: formattedError.message,
    visibilityTime: 4000,
    autoHide: true,
    topOffset: 30,
    bottomOffset: 40,
  });
};