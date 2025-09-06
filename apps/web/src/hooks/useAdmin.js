import { useState, useEffect, useCallback } from 'react';
import adminService from '@/services/adminService';

/**
 * Custom hook for admin operations
 * Provides access to all admin-related functionality
 */
export function useAdmin() {
  /**
   * Hook for fetching dashboard statistics
   * @returns {Object} Dashboard statistics data, loading state, and error
   */
  const useDashboardStats = () => {
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchStats = useCallback(async () => {
      try {
        setIsLoading(true);
        const response = await adminService.getDashboardStats();
        setData(response);
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to fetch dashboard statistics');
      } finally {
        setIsLoading(false);
      }
    }, []);

    useEffect(() => {
      fetchStats();
    }, [fetchStats]);

    return { data, isLoading, error, refetch: fetchStats };
  };

  /**
   * Hook for fetching users
   * @param {Object} initialParams - Initial query parameters
   * @returns {Object} Users data, loading state, error, and pagination controls
   */
  const useUsers = (initialParams = { page: 1, limit: 10 }) => {
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [params, setParams] = useState(initialParams);

    const fetchUsers = useCallback(async () => {
      try {
        setIsLoading(true);
        const response = await adminService.getUsers(params);
        setData(response);
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to fetch users');
      } finally {
        setIsLoading(false);
      }
    }, [params]);

    useEffect(() => {
      fetchUsers();
    }, [fetchUsers]);

    const changePage = (page) => {
      setParams((prev) => ({ ...prev, page }));
    };

    const changeLimit = (limit) => {
      setParams((prev) => ({ ...prev, limit, page: 1 }));
    };

    const search = (searchTerm) => {
      setParams((prev) => ({ ...prev, search: searchTerm, page: 1 }));
    };

    return { 
      data, 
      isLoading, 
      error, 
      refetch: fetchUsers, 
      changePage, 
      changeLimit, 
      search,
      params 
    };
  };

  /**
   * Hook for fetching pending KYC verifications
   * @param {Object} initialParams - Initial query parameters
   * @returns {Object} KYC data, loading state, error, and pagination controls
   */
  const usePendingKYC = (initialParams = { page: 1, limit: 10 }) => {
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [params, setParams] = useState(initialParams);

    const fetchPendingKYC = useCallback(async () => {
      try {
        setIsLoading(true);
        const response = await adminService.getPendingKYC(params);
        setData(response);
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to fetch pending KYC verifications');
      } finally {
        setIsLoading(false);
      }
    }, [params]);

    useEffect(() => {
      fetchPendingKYC();
    }, [fetchPendingKYC]);

    const changePage = (page) => {
      setParams((prev) => ({ ...prev, page }));
    };

    const changeLimit = (limit) => {
      setParams((prev) => ({ ...prev, limit, page: 1 }));
    };

    const approveKYC = async (userId) => {
      try {
        await adminService.approveKYC(userId);
        fetchPendingKYC();
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    };

    const rejectKYC = async (userId, reason) => {
      try {
        await adminService.rejectKYC(userId, { reason });
        fetchPendingKYC();
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    };

    return { 
      data, 
      isLoading, 
      error, 
      refetch: fetchPendingKYC, 
      changePage, 
      changeLimit, 
      approveKYC,
      rejectKYC,
      params 
    };
  };

  /**
   * Hook for managing investment plans
   * @param {Object} initialParams - Initial query parameters
   * @returns {Object} Investment plans data, loading state, error, and CRUD operations
   */
  const useInvestmentPlans = (initialParams = { page: 1, limit: 10 }) => {
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [params, setParams] = useState(initialParams);

    const fetchInvestmentPlans = useCallback(async () => {
      try {
        setIsLoading(true);
        const response = await adminService.getInvestmentPlans(params);
        setData(response);
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to fetch investment plans');
      } finally {
        setIsLoading(false);
      }
    }, [params]);

    useEffect(() => {
      fetchInvestmentPlans();
    }, [fetchInvestmentPlans]);

    const changePage = (page) => {
      setParams((prev) => ({ ...prev, page }));
    };

    const changeLimit = (limit) => {
      setParams((prev) => ({ ...prev, limit, page: 1 }));
    };

    const createPlan = async (planData) => {
      try {
        await adminService.createInvestmentPlan(planData);
        fetchInvestmentPlans();
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    };

    const updatePlan = async (planId, planData) => {
      try {
        await adminService.updateInvestmentPlan(planId, planData);
        fetchInvestmentPlans();
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    };

    const deletePlan = async (planId) => {
      try {
        await adminService.deleteInvestmentPlan(planId);
        fetchInvestmentPlans();
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    };

    return { 
      data, 
      isLoading, 
      error, 
      refetch: fetchInvestmentPlans, 
      changePage, 
      changeLimit, 
      createPlan,
      updatePlan,
      deletePlan,
      params 
    };
  };

  /**
   * Hook for managing investments
   * @param {Object} initialParams - Initial query parameters
   * @returns {Object} Investments data, loading state, error, and pagination controls
   */
  const useInvestments = (initialParams = { page: 1, limit: 10 }) => {
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [params, setParams] = useState(initialParams);

    const fetchInvestments = useCallback(async () => {
      try {
        setIsLoading(true);
        const response = await adminService.getAllInvestments(params);
        setData(response);
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to fetch investments');
      } finally {
        setIsLoading(false);
      }
    }, [params]);

    useEffect(() => {
      fetchInvestments();
    }, [fetchInvestments]);

    const changePage = (page) => {
      setParams((prev) => ({ ...prev, page }));
    };

    const changeLimit = (limit) => {
      setParams((prev) => ({ ...prev, limit, page: 1 }));
    };

    const filterByStatus = (status) => {
      setParams((prev) => ({ ...prev, status, page: 1 }));
    };

    return { 
      data, 
      isLoading, 
      error, 
      refetch: fetchInvestments, 
      changePage, 
      changeLimit, 
      filterByStatus,
      params 
    };
  };

  /**
   * Hook for managing transactions
   * @param {Object} initialParams - Initial query parameters
   * @returns {Object} Transactions data, loading state, error, and pagination controls
   */
  const useTransactions = (initialParams = { page: 1, limit: 10 }) => {
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [params, setParams] = useState(initialParams);

    const fetchTransactions = useCallback(async () => {
      try {
        setIsLoading(true);
        const response = await adminService.getAllTransactions(params);
        setData(response);
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to fetch transactions');
      } finally {
        setIsLoading(false);
      }
    }, [params]);

    useEffect(() => {
      fetchTransactions();
    }, [fetchTransactions]);

    const changePage = (page) => {
      setParams((prev) => ({ ...prev, page }));
    };

    const changeLimit = (limit) => {
      setParams((prev) => ({ ...prev, limit, page: 1 }));
    };

    const filterByStatus = (status) => {
      setParams((prev) => ({ ...prev, status, page: 1 }));
    };

    const approveTransaction = async (transactionId) => {
      try {
        await adminService.approveTransaction(transactionId);
        fetchTransactions();
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    };

    const rejectTransaction = async (transactionId, reason) => {
      try {
        await adminService.rejectTransaction(transactionId, { reason });
        fetchTransactions();
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    };

    return { 
      data, 
      isLoading, 
      error, 
      refetch: fetchTransactions, 
      changePage, 
      changeLimit, 
      filterByStatus,
      approveTransaction,
      rejectTransaction,
      params 
    };
  };

  /**
   * Hook for managing withdrawals
   * @param {Object} initialParams - Initial query parameters
   * @returns {Object} Withdrawals data, loading state, error, and pagination controls
   */
  const useWithdrawals = (initialParams = { page: 1, limit: 10 }) => {
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [params, setParams] = useState(initialParams);

    const fetchWithdrawals = useCallback(async () => {
      try {
        setIsLoading(true);
        const response = await adminService.getAllWithdrawals(params);
        setData(response);
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to fetch withdrawals');
      } finally {
        setIsLoading(false);
      }
    }, [params]);

    useEffect(() => {
      fetchWithdrawals();
    }, [fetchWithdrawals]);

    const changePage = (page) => {
      setParams((prev) => ({ ...prev, page }));
    };

    const changeLimit = (limit) => {
      setParams((prev) => ({ ...prev, limit, page: 1 }));
    };

    const filterByStatus = (status) => {
      setParams((prev) => ({ ...prev, status, page: 1 }));
    };

    const approveWithdrawal = async (withdrawalId, approvalData = {}) => {
      try {
        await adminService.approveWithdrawal(withdrawalId, approvalData);
        fetchWithdrawals();
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    };

    const rejectWithdrawal = async (withdrawalId, reason) => {
      try {
        await adminService.rejectWithdrawal(withdrawalId, { reason });
        fetchWithdrawals();
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    };

    return { 
      data, 
      isLoading, 
      error, 
      refetch: fetchWithdrawals, 
      changePage, 
      changeLimit, 
      filterByStatus,
      approveWithdrawal,
      rejectWithdrawal,
      params 
    };
  };

  /**
   * Hook for managing notifications
   * @param {Object} initialParams - Initial query parameters
   * @returns {Object} Notifications functionality
   */
  const useNotifications = (initialParams = { page: 1, limit: 10 }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const sendBroadcast = async (notificationData) => {
      try {
        setIsLoading(true);
        await adminService.sendBroadcastNotification(notificationData);
        setError(null);
        return { success: true };
      } catch (err) {
        setError(err.message || 'Failed to send broadcast notification');
        return { success: false, error: err.message };
      } finally {
        setIsLoading(false);
      }
    };

    return { 
      isLoading, 
      error, 
      sendBroadcast
    };
  };

  /**
   * Hook for fetching audit logs
   * @param {Object} initialParams - Initial query parameters
   * @returns {Object} Audit logs data, loading state, error, and pagination controls
   */
  const useAuditLogs = (initialParams = { page: 1, limit: 10 }) => {
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [params, setParams] = useState(initialParams);

    const fetchAuditLogs = useCallback(async () => {
      try {
        setIsLoading(true);
        const response = await adminService.getAuditLogs(params);
        setData(response);
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to fetch audit logs');
      } finally {
        setIsLoading(false);
      }
    }, [params]);

    useEffect(() => {
      fetchAuditLogs();
    }, [fetchAuditLogs]);

    const changePage = (page) => {
      setParams((prev) => ({ ...prev, page }));
    };

    const changeLimit = (limit) => {
      setParams((prev) => ({ ...prev, limit, page: 1 }));
    };

    const filterByUser = (userId) => {
      setParams((prev) => ({ ...prev, user_id: userId, page: 1 }));
    };

    const filterByAction = (actionType) => {
      setParams((prev) => ({ ...prev, action_type: actionType, page: 1 }));
    };

    const filterByDateRange = (startDate, endDate) => {
      setParams((prev) => ({ 
        ...prev, 
        start_date: startDate, 
        end_date: endDate, 
        page: 1 
      }));
    };

    return { 
      data, 
      isLoading, 
      error, 
      refetch: fetchAuditLogs, 
      changePage, 
      changeLimit, 
      filterByUser,
      filterByAction,
      filterByDateRange,
      params 
    };
  };

  /**
   * Hook for managing loans
   * @param {Object} initialParams - Initial query parameters
   * @returns {Object} Loans data, loading state, error, and pagination controls
   */
  const useLoans = (initialParams = { page: 1, limit: 10 }) => {
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [params, setParams] = useState(initialParams);

    const fetchLoans = useCallback(async () => {
      try {
        setIsLoading(true);
        const response = await adminService.getAllLoans(params);
        setData(response);
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to fetch loans');
      } finally {
        setIsLoading(false);
      }
    }, [params]);

    useEffect(() => {
      fetchLoans();
    }, [fetchLoans]);

    const changePage = (page) => {
      setParams((prev) => ({ ...prev, page }));
    };

    const changeLimit = (limit) => {
      setParams((prev) => ({ ...prev, limit, page: 1 }));
    };

    const filterByStatus = (status) => {
      setParams((prev) => ({ ...prev, status, page: 1 }));
    };

    const approveLoan = async (loanId) => {
      try {
        await adminService.approveLoan(loanId);
        fetchLoans();
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    };

    const rejectLoan = async (loanId, reason) => {
      try {
        await adminService.rejectLoan(loanId, { reason });
        fetchLoans();
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    };

    return { 
      data, 
      isLoading, 
      error, 
      refetch: fetchLoans, 
      changePage, 
      changeLimit, 
      filterByStatus,
      approveLoan,
      rejectLoan,
      params 
    };
  };

  /**
   * Hook for managing loan products
   * @param {Object} initialParams - Initial query parameters
   * @returns {Object} Loan products data, loading state, error, and CRUD operations
   */
  const useLoanProducts = (initialParams = { page: 1, limit: 10 }) => {
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [params, setParams] = useState(initialParams);

    const fetchLoanProducts = useCallback(async () => {
      try {
        setIsLoading(true);
        const response = await adminService.getLoanProducts(params);
        setData(response);
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to fetch loan products');
      } finally {
        setIsLoading(false);
      }
    }, [params]);

    useEffect(() => {
      fetchLoanProducts();
    }, [fetchLoanProducts]);

    const changePage = (page) => {
      setParams((prev) => ({ ...prev, page }));
    };

    const changeLimit = (limit) => {
      setParams((prev) => ({ ...prev, limit, page: 1 }));
    };

    const createProduct = async (productData) => {
      try {
        await adminService.createLoanProduct(productData);
        fetchLoanProducts();
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    };

    const updateProduct = async (productId, productData) => {
      try {
        await adminService.updateLoanProduct(productId, productData);
        fetchLoanProducts();
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    };

    const deleteProduct = async (productId) => {
      try {
        await adminService.deleteLoanProduct(productId);
        fetchLoanProducts();
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    };

    return { 
      data, 
      isLoading, 
      error, 
      refetch: fetchLoanProducts, 
      changePage, 
      changeLimit, 
      createProduct,
      updateProduct,
      deleteProduct,
      params 
    };
  };

  // Return all admin hooks
  return {
    useDashboardStats,
    useUsers,
    usePendingKYC,
    useInvestmentPlans,
    useInvestments,
    useTransactions,
    useWithdrawals,
    useNotifications,
    useAuditLogs,
    useLoans,
    useLoanProducts
  };
}

export default useAdmin;