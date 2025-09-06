import api from './api';

/**
 * Admin service for handling admin operations
 */
class AdminService {
  /**
   * Get dashboard statistics
   * @returns {Promise<Object>} - Dashboard statistics
   */
  async getDashboardStats() {
    return api.get('/admin/dashboard/stats');
  }

  /**
   * Get all users
   * @param {Object} params - Query parameters (page, limit, search, etc.)
   * @returns {Promise<Object>} - Users data
   */
  async getUsers(params = {}) {
    return api.get('/admin/users', params);
  }

  /**
   * Get user details
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - User details
   */
  async getUserDetails(userId) {
    return api.get(`/admin/users/${userId}`);
  }

  /**
   * Update user
   * @param {string} userId - User ID
   * @param {Object} userData - User data to update
   * @returns {Promise<Object>} - Updated user data
   */
  async updateUser(userId, userData) {
    return api.put(`/admin/users/${userId}`, userData);
  }

  /**
   * Get pending KYC verifications
   * @param {Object} params - Query parameters (page, limit, etc.)
   * @returns {Promise<Object>} - KYC verifications data
   */
  async getPendingKYC(params = {}) {
    return api.get('/admin/kyc/pending', params);
  }

  /**
   * Approve KYC verification
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Response data
   */
  async approveKYC(userId) {
    return api.post(`/admin/kyc/${userId}/approve`);
  }

  /**
   * Reject KYC verification
   * @param {string} userId - User ID
   * @param {Object} rejectionData - Rejection data (reason, etc.)
   * @returns {Promise<Object>} - Response data
   */
  async rejectKYC(userId, rejectionData) {
    return api.post(`/admin/kyc/${userId}/reject`, rejectionData);
  }

  /**
   * Get all investment plans
   * @param {Object} params - Query parameters (page, limit, etc.)
   * @returns {Promise<Object>} - Investment plans data
   */
  async getInvestmentPlans(params = {}) {
    return api.get('/admin/investment-plans', params);
  }

  /**
   * Create investment plan
   * @param {Object} planData - Investment plan data
   * @returns {Promise<Object>} - Created investment plan
   */
  async createInvestmentPlan(planData) {
    return api.post('/admin/investment-plans', planData);
  }

  /**
   * Update investment plan
   * @param {string} planId - Investment plan ID
   * @param {Object} planData - Investment plan data to update
   * @returns {Promise<Object>} - Updated investment plan
   */
  async updateInvestmentPlan(planId, planData) {
    return api.put(`/admin/investment-plans/${planId}`, planData);
  }

  /**
   * Delete investment plan
   * @param {string} planId - Investment plan ID
   * @returns {Promise<Object>} - Response data
   */
  async deleteInvestmentPlan(planId) {
    return api.delete(`/admin/investment-plans/${planId}`);
  }

  /**
   * Get all investments
   * @param {Object} params - Query parameters (page, limit, status, etc.)
   * @returns {Promise<Object>} - Investments data
   */
  async getAllInvestments(params = {}) {
    return api.get('/admin/investments', params);
  }

  /**
   * Get investment details
   * @param {string} investmentId - Investment ID
   * @returns {Promise<Object>} - Investment details
   */
  async getInvestmentDetails(investmentId) {
    return api.get(`/admin/investments/${investmentId}`);
  }

  /**
   * Get all loan products
   * @param {Object} params - Query parameters (page, limit, etc.)
   * @returns {Promise<Object>} - Loan products data
   */
  async getLoanProducts(params = {}) {
    return api.get('/admin/loan-products', params);
  }

  /**
   * Create loan product
   * @param {Object} productData - Loan product data
   * @returns {Promise<Object>} - Created loan product
   */
  async createLoanProduct(productData) {
    return api.post('/admin/loan-products', productData);
  }

  /**
   * Update loan product
   * @param {string} productId - Loan product ID
   * @param {Object} productData - Loan product data to update
   * @returns {Promise<Object>} - Updated loan product
   */
  async updateLoanProduct(productId, productData) {
    return api.put(`/admin/loan-products/${productId}`, productData);
  }

  /**
   * Delete loan product
   * @param {string} productId - Loan product ID
   * @returns {Promise<Object>} - Response data
   */
  async deleteLoanProduct(productId) {
    return api.delete(`/admin/loan-products/${productId}`);
  }

  /**
   * Get all loans
   * @param {Object} params - Query parameters (page, limit, status, etc.)
   * @returns {Promise<Object>} - Loans data
   */
  async getAllLoans(params = {}) {
    return api.get('/admin/loans', params);
  }

  /**
   * Get loan details
   * @param {string} loanId - Loan ID
   * @returns {Promise<Object>} - Loan details
   */
  async getLoanDetails(loanId) {
    return api.get(`/admin/loans/${loanId}`);
  }

  /**
   * Approve loan application
   * @param {string} loanId - Loan ID
   * @returns {Promise<Object>} - Response data
   */
  async approveLoan(loanId) {
    return api.post(`/admin/loans/${loanId}/approve`);
  }

  /**
   * Reject loan application
   * @param {string} loanId - Loan ID
   * @param {Object} rejectionData - Rejection data (reason, etc.)
   * @returns {Promise<Object>} - Response data
   */
  async rejectLoan(loanId, rejectionData) {
    return api.post(`/admin/loans/${loanId}/reject`, rejectionData);
  }

  /**
   * Get all transactions
   * @param {Object} params - Query parameters (page, limit, type, etc.)
   * @returns {Promise<Object>} - Transactions data
   */
  async getAllTransactions(params = {}) {
    return api.get('/admin/transactions', params);
  }

  /**
   * Approve transaction
   * @param {string} transactionId - Transaction ID
   * @returns {Promise<Object>} - Response data
   */
  async approveTransaction(transactionId) {
    return api.put(`/admin/transactions/${transactionId}/approve`);
  }

  /**
   * Reject transaction
   * @param {string} transactionId - Transaction ID
   * @param {Object} rejectionData - Rejection data (reason, etc.)
   * @returns {Promise<Object>} - Response data
   */
  async rejectTransaction(transactionId, rejectionData) {
    return api.put(`/admin/transactions/${transactionId}/reject`, rejectionData);
  }

  /**
   * Get transaction details
   * @param {string} transactionId - Transaction ID
   * @returns {Promise<Object>} - Transaction details
   */
  async getTransactionDetails(transactionId) {
    return api.get(`/admin/transactions/${transactionId}`);
  }

  /**
   * Get all withdrawals
   * @param {Object} params - Query parameters (page, limit, status, etc.)
   * @returns {Promise<Object>} - Withdrawals data
   */
  async getAllWithdrawals(params = {}) {
    return api.get('/admin/withdrawals', params);
  }

  /**
   * Approve withdrawal
   * @param {string} withdrawalId - Withdrawal ID
   * @param {Object} approvalData - Approval data (transaction_id, etc.)
   * @returns {Promise<Object>} - Response data
   */
  async approveWithdrawal(withdrawalId, approvalData) {
    return api.post(`/admin/withdrawals/${withdrawalId}/approve`, approvalData);
  }

  /**
   * Reject withdrawal
   * @param {string} withdrawalId - Withdrawal ID
   * @param {Object} rejectionData - Rejection data (reason, etc.)
   * @returns {Promise<Object>} - Response data
   */
  async rejectWithdrawal(withdrawalId, rejectionData) {
    return api.post(`/admin/withdrawals/${withdrawalId}/reject`, rejectionData);
  }

  /**
   * Send broadcast notification
   * @param {Object} notificationData - Notification data
   * @returns {Promise<Object>} - Response data
   */
  async sendBroadcastNotification(notificationData) {
    return api.post('/admin/notifications/broadcast', notificationData);
  }

  /**
   * Get audit logs
   * @param {Object} params - Query parameters (page, limit, user_id, etc.)
   * @returns {Promise<Object>} - Audit logs data
   */
  async getAuditLogs(params = {}) {
    return api.get('/admin/audit-logs', params);
  }
}

export default new AdminService();