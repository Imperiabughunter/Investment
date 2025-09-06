import api from './api';

/**
 * Wallet service for handling wallet operations
 */
class WalletService {
  /**
   * Get user wallet information
   * @returns {Promise<Object>} - Wallet data
   */
  async getUserWallet() {
    return api.get('/wallets/me');
  }

  /**
   * Get wallet transaction history
   * @param {Object} params - Query parameters (page, limit, type, etc.)
   * @returns {Promise<Object>} - Transaction history data
   */
  async getTransactionHistory(params = {}) {
    return api.get('/wallets/me/transactions', params);
  }

  /**
   * Request withdrawal
   * @param {Object} withdrawalData - Withdrawal data (amount, bank_account, etc.)
   * @returns {Promise<Object>} - Withdrawal request data
   */
  async requestWithdrawal(withdrawalData) {
    return api.post('/wallets/me/withdraw', withdrawalData);
  }

  /**
   * Get withdrawal history
   * @param {Object} params - Query parameters (page, limit, status, etc.)
   * @returns {Promise<Object>} - Withdrawal history data
   */
  async getWithdrawalHistory(params = {}) {
    return api.get('/wallets/me/withdrawals', params);
  }

  /**
   * Generate crypto deposit address
   * @param {string} currency - Cryptocurrency code (BTC, ETH, etc.)
   * @returns {Promise<Object>} - Deposit address data
   */
  async generateDepositAddress(currency) {
    return api.post('/crypto-deposits/generate-address', { currency });
  }

  /**
   * Get crypto deposit history
   * @param {Object} params - Query parameters (page, limit, status, etc.)
   * @returns {Promise<Object>} - Deposit history data
   */
  async getDepositHistory(params = {}) {
    return api.get('/crypto-deposits/history', params);
  }

  /**
   * Add bank account
   * @param {Object} bankAccountData - Bank account data
   * @returns {Promise<Object>} - Bank account data
   */
  async addBankAccount(bankAccountData) {
    return api.post('/wallets/me/bank-accounts', bankAccountData);
  }

  /**
   * Get bank accounts
   * @returns {Promise<Array>} - List of bank accounts
   */
  async getBankAccounts() {
    return api.get('/wallets/me/bank-accounts');
  }

  /**
   * Delete bank account
   * @param {string} accountId - Bank account ID
   * @returns {Promise<Object>} - Response data
   */
  async deleteBankAccount(accountId) {
    return api.delete(`/wallets/me/bank-accounts/${accountId}`);
  }
}

export default new WalletService();