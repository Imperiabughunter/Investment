import { useCallback, useState } from 'react';
import authService from '../services/authService';

function useAuth() {
  const callbackUrl = typeof window !== 'undefined' 
    ? new URLSearchParams(window.location.search).get('callbackUrl')
    : null;
  const [isLoading, setIsLoading] = useState(false);

  const signInWithCredentials = useCallback(async (options) => {
    setIsLoading(true);
    try {
      const response = await authService.login(options.email, options.password);
      
      // If redirect is true, navigate to the callback URL
      if (options.redirect && response.access_token) {
        // Small delay to ensure token is properly stored
        setTimeout(() => {
          window.location.href = options.callbackUrl || callbackUrl || '/admin';
        }, 100);
        return response;
      }
      
      setIsLoading(false);
      return response;
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
      
      // Enhanced error handling with more specific error messages
      let errorCode = 'UnknownError';
      
      // Check for network and server connectivity issues
      if (error.message?.includes('Failed to fetch') || 
          error.message?.includes('Network error') || 
          error.message?.includes('connect') || 
          error.message?.includes('timeout')) {
        errorCode = 'NetworkError';
      } else if (error.message?.includes('unavailable')) {
        errorCode = 'ServiceUnavailable';
      } else if (error.status === 401) {
        errorCode = 'CredentialsSignin';
      } else if (error.status === 503) {
        errorCode = 'ServiceUnavailable';
      }
      
      const enhancedError = new Error(error.message || 'Authentication failed');
      enhancedError.code = errorCode;
      throw enhancedError;
    }
  }, [callbackUrl])

  const signUpWithCredentials = useCallback(async (options) => {
    // This would need to be implemented in authService
    // For now, just redirect to signup page
    if (options.redirect) {
      window.location.href = '/account/signup';
    }
    return { success: false, message: 'Signup not implemented' };
  }, []);

  const signInWithGoogle = useCallback((options) => {
    // Not implemented, would need OAuth integration
    console.warn('Google sign-in not implemented');
    return { success: false };
  }, []);
  
  const signInWithFacebook = useCallback((options) => {
    // Not implemented, would need OAuth integration
    console.warn('Facebook sign-in not implemented');
    return { success: false };
  }, []);
  
  const signInWithTwitter = useCallback((options) => {
    // Not implemented, would need OAuth integration
    console.warn('Twitter sign-in not implemented');
    return { success: false };
  }, []);

  const signOut = useCallback(async () => {
    await authService.logout();
    window.location.href = '/account/signin';
  }, []);

  return {
    signInWithCredentials,
    signUpWithCredentials,
    signInWithGoogle,
    signInWithFacebook,
    signInWithTwitter,
    signOut,
    isLoading
  }
}

export default useAuth;