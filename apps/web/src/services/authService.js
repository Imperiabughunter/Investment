import api from './api';

/**
 * Authentication service for handling auth operations
 */
class AuthService {
  /**
   * Login with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} - Auth data with token
   */
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    if (response.token) {
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    return response;
  }

  /**
   * Register a new admin user (only super admins can do this)
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} - Created user data
   */
  async registerAdmin(userData) {
    return api.post('/admin/users/create', userData);
  }

  /**
   * Logout current user
   */
  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
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
   * @param {string} password - New password
   * @returns {Promise<Object>} - Response data
   */
  async resetPassword(token, password) {
    return api.post('/auth/password-reset/confirm', { token, password });
  }

  /**
   * Change password
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} - Response data
   */
  async changePassword(currentPassword, newPassword) {
    return api.post('/auth/password/change', {
      current_password: currentPassword,
      new_password: newPassword,
    });
  }

  /**
   * Get current user profile
   * @returns {Promise<Object>} - User profile data
   */
  async getProfile() {
    return api.get('/auth/profile');
  }

  /**
   * Update user profile
   * @param {Object} profileData - Profile data to update
   * @returns {Promise<Object>} - Updated profile data
   */
  async updateProfile(profileData) {
    const response = await api.put('/auth/profile', profileData);
    if (response.user) {
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    return response;
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} - True if authenticated
   */
  isAuthenticated() {
    return !!localStorage.getItem('token');
  }

  /**
   * Get current user data
   * @returns {Object|null} - User data or null
   */
  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  /**
   * Check if current user has specific role
   * @param {string} role - Role to check
   * @returns {boolean} - True if user has role
   */
  hasRole(role) {
    const user = this.getCurrentUser();
    return user && user.role === role;
  }

  /**
   * Check if current user is super admin
   * @returns {boolean} - True if super admin
   */
  isSuperAdmin() {
    return this.hasRole('super_admin');
  }
}

export default new AuthService();