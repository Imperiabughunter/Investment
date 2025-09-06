import api from './api';

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
    return api.post('/auth/login', { email, password });
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
  async getCurrentUser() {
    return api.get('/users/me');
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