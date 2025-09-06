import api from './api';

/**
 * Investment service for handling investment operations
 */
class InvestmentService {
  /**
   * Get available investment plans
   * @param {Object} params - Query parameters (page, limit, etc.)
   * @returns {Promise<Object>} - Investment plans data
   */
  async getInvestmentPlans(params = {}) {
    return api.get('/investment-plans', params);
  }

  /**
   * Get investment plan details
   * @param {string} planId - Investment plan ID
   * @returns {Promise<Object>} - Investment plan details
   */
  async getInvestmentPlanDetails(planId) {
    return api.get(`/investment-plans/${planId}`);
  }

  /**
   * Create a new investment
   * @param {Object} investmentData - Investment data (plan_id, amount, etc.)
   * @returns {Promise<Object>} - Created investment data
   */
  async createInvestment(investmentData) {
    return api.post('/investments', investmentData);
  }

  /**
   * Get user investments
   * @param {Object} params - Query parameters (page, limit, status, etc.)
   * @returns {Promise<Object>} - User investments data
   */
  async getUserInvestments(params = {}) {
    return api.get('/investments/me', params);
  }

  /**
   * Get investment details
   * @param {string} investmentId - Investment ID
   * @returns {Promise<Object>} - Investment details
   */
  async getInvestmentDetails(investmentId) {
    return api.get(`/investments/me/${investmentId}`);
  }

  /**
   * Get investment returns
   * @param {string} investmentId - Investment ID
   * @param {Object} params - Query parameters (page, limit, etc.)
   * @returns {Promise<Object>} - Investment returns data
   */
  async getInvestmentReturns(investmentId, params = {}) {
    return api.get(`/investments/me/${investmentId}/returns`, params);
  }

  /**
   * Cancel investment (if allowed)
   * @param {string} investmentId - Investment ID
   * @returns {Promise<Object>} - Response data
   */
  async cancelInvestment(investmentId) {
    return api.post(`/investments/me/${investmentId}/cancel`);
  }

  /**
   * Reinvest matured investment
   * @param {string} investmentId - Investment ID
   * @param {Object} reinvestData - Reinvestment data (plan_id, etc.)
   * @returns {Promise<Object>} - Reinvestment data
   */
  async reinvestInvestment(investmentId, reinvestData) {
    return api.post(`/investments/me/${investmentId}/reinvest`, reinvestData);
  }

  /**
   * Get investment statistics
   * @returns {Promise<Object>} - Investment statistics
   */
  async getInvestmentStatistics() {
    return api.get('/investments/me/statistics');
  }
}

export default new InvestmentService();