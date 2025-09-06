import api from './api';

/**
 * Loan service for handling loan operations
 */
class LoanService {
  /**
   * Get available loan products
   * @param {Object} params - Query parameters (page, limit, etc.)
   * @returns {Promise<Object>} - Loan products data
   */
  async getLoanProducts(params = {}) {
    return api.get('/loans/products', params);
  }

  /**
   * Get loan product details
   * @param {string} productId - Loan product ID
   * @returns {Promise<Object>} - Loan product details
   */
  async getLoanProductDetails(productId) {
    return api.get(`/loans/products/${productId}`);
  }

  /**
   * Apply for a loan
   * @param {Object} loanData - Loan application data
   * @returns {Promise<Object>} - Loan application data
   */
  async applyForLoan(loanData) {
    return api.post('/loans/apply', loanData);
  }

  /**
   * Get user loans
   * @param {Object} params - Query parameters (page, limit, status, etc.)
   * @returns {Promise<Object>} - User loans data
   */
  async getUserLoans(params = {}) {
    return api.get('/loans/me', params);
  }

  /**
   * Get loan details
   * @param {string} loanId - Loan ID
   * @returns {Promise<Object>} - Loan details
   */
  async getLoanDetails(loanId) {
    return api.get(`/loans/me/${loanId}`);
  }

  /**
   * Get loan payment schedule
   * @param {string} loanId - Loan ID
   * @returns {Promise<Object>} - Loan payment schedule
   */
  async getLoanPaymentSchedule(loanId) {
    return api.get(`/loans/me/${loanId}/schedule`);
  }

  /**
   * Make loan payment
   * @param {string} loanId - Loan ID
   * @param {Object} paymentData - Payment data (amount, etc.)
   * @returns {Promise<Object>} - Payment confirmation
   */
  async makeLoanPayment(loanId, paymentData) {
    return api.post(`/loans/me/${loanId}/pay`, paymentData);
  }

  /**
   * Get loan payment history
   * @param {string} loanId - Loan ID
   * @param {Object} params - Query parameters (page, limit, etc.)
   * @returns {Promise<Object>} - Loan payment history
   */
  async getLoanPaymentHistory(loanId, params = {}) {
    return api.get(`/loans/me/${loanId}/payments`, params);
  }

  /**
   * Request loan extension
   * @param {string} loanId - Loan ID
   * @param {Object} extensionData - Extension request data
   * @returns {Promise<Object>} - Extension request confirmation
   */
  async requestLoanExtension(loanId, extensionData) {
    return api.post(`/loans/me/${loanId}/extension`, extensionData);
  }

  /**
   * Calculate loan details before applying
   * @param {Object} calculationData - Calculation parameters
   * @returns {Promise<Object>} - Calculated loan details
   */
  async calculateLoan(calculationData) {
    return api.post('/loans/calculate', calculationData);
  }
}

export default new LoanService();