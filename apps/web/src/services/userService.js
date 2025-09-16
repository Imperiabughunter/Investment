import api from './api';

/**
 * User service for handling user operations
 */
class UserService {
  /**
   * Get user dashboard statistics
   * @returns {Promise<Object>} - Dashboard statistics
   */
  async getDashboardStats() {
    return api.get('/users/dashboard-stats');
  }

  /**
   * Get user profile
   * @returns {Promise<Object>} - User profile data
   */
  async getProfile() {
    return api.get('/users/profile');
  }

  /**
   * Update user profile
   * @param {Object} profileData - Profile data to update
   * @returns {Promise<Object>} - Updated profile data
   */
  async updateProfile(profileData) {
    return api.put('/users/profile', profileData);
  }

  /**
   * Get user investments
   * @param {Object} params - Query parameters (page, limit, status, etc.)
   * @returns {Promise<Object>} - User investments data
   */
  async getInvestments(params = {}) {
    return api.get('/users/investments', params);
  }

  /**
   * Get user loans
   * @param {Object} params - Query parameters (page, limit, status, etc.)
   * @returns {Promise<Object>} - User loans data
   */
  async getLoans(params = {}) {
    return api.get('/users/loans', params);
  }

  /**
   * Get user transactions
   * @param {Object} params - Query parameters (page, limit, type, etc.)
   * @returns {Promise<Object>} - User transactions data
   */
  async getTransactions(params = {}) {
    return api.get('/users/transactions', params);
  }

  /**
   * Get user wallet balance
   * @returns {Promise<Object>} - Wallet balance data
   */
  async getWalletBalance() {
    return api.get('/wallets/balance');
  }

  /**
   * Create investment
   * @param {Object} investmentData - Investment data
   * @returns {Promise<Object>} - Created investment
   */
  async createInvestment(investmentData) {
    return api.post('/investments', investmentData);
  }

  /**
   * Apply for loan
   * @param {Object} loanData - Loan application data
   * @returns {Promise<Object>} - Loan application response
   */
  async applyForLoan(loanData) {
    return api.post('/loans/apply', loanData);
  }

  /**
   * Request withdrawal
   * @param {Object} withdrawalData - Withdrawal request data
   * @returns {Promise<Object>} - Withdrawal request response
   */
  async requestWithdrawal(withdrawalData) {
    return api.post('/wallets/withdraw', withdrawalData);
  }

  /**
   * Get available investment plans
   * @returns {Promise<Object>} - Investment plans data
   */
  async getInvestmentPlans() {
    return api.get('/investments/plans');
  }

  /**
   * Get available loan products
   * @returns {Promise<Object>} - Loan products data
   */
  async getLoanProducts() {
    return api.get('/loans/products');
  }

  /**
   * Upload KYC documents
   * @param {FormData} formData - KYC documents form data
   * @returns {Promise<Object>} - Upload response
   */
  async uploadKYCDocuments(formData) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${api.baseUrl}/users/kyc/upload`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    return api._handleResponse(response);
  }

  /**
   * Get user notifications
   * @param {Object} params - Query parameters (page, limit, read, etc.)
   * @returns {Promise<Object>} - User notifications data
   */
  async getNotifications(params = {}) {
    return api.get('/users/notifications', params);
  }

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   * @returns {Promise<Object>} - Response data
   */
  async markNotificationAsRead(notificationId) {
    return api.put(`/users/notifications/${notificationId}/read`);
  }
}

export default new UserService();