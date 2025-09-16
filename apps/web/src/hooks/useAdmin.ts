import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services';
import { useAuth } from '@/contexts/AuthContext';

export const useAdmin = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  // Dashboard statistics
  const useDashboardStats = () => {
    return useQuery({
      queryKey: ['dashboard', 'stats'],
      queryFn: () => adminService.getDashboardStats(),
      enabled: isAuthenticated,
    });
  };

  // User management
  const useUsers = (params?: any) => {
    return useQuery({
      queryKey: ['users', 'list', params],
      queryFn: () => adminService.getUsers(params),
      enabled: isAuthenticated,
    });
  };

  const useUserDetails = (userId: string) => {
    return useQuery({
      queryKey: ['users', 'detail', userId],
      queryFn: () => adminService.getUserDetails(userId),
      enabled: isAuthenticated && !!userId,
    });
  };

  const useUpdateUser = () => {
    return useMutation({
      mutationFn: (data: { userId: string; userData: any }) => 
        adminService.updateUser(data.userId, data.userData),
      onSuccess: (_, { userId }) => {
        // Invalidate both the list and the specific user detail
        queryClient.invalidateQueries({ queryKey: ['users', 'list'] });
        queryClient.invalidateQueries({ queryKey: ['users', 'detail', userId] });
      },
    });
  };

  // KYC verification
  const usePendingKYC = (params?: any) => {
    return useQuery({
      queryKey: ['pending-kyc', params],
      queryFn: () => adminService.getPendingKYC(params),
      enabled: isAuthenticated,
      staleTime: 1000 * 60 * 5, // 5 minutes
    });
  };

  const useApproveKYC = () => {
    return useMutation({
      mutationFn: (userId: string) => adminService.approveKYC(userId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['pending-kyc'] });
        queryClient.invalidateQueries({ queryKey: ['users'] });
      },
    });
  };

  const useRejectKYC = () => {
    return useMutation({
      mutationFn: (data: { userId: string; reason: string }) => 
        adminService.rejectKYC(data.userId, { reason: data.reason }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['pending-kyc'] });
        queryClient.invalidateQueries({ queryKey: ['users'] });
      },
    });
  };

  // Investment plans
  const useInvestmentPlans = () => {
    return useQuery({
      queryKey: ['investment-plans-admin'],
      queryFn: () => adminService.getInvestmentPlans(),
      enabled: isAuthenticated,
      staleTime: 1000 * 60 * 5, // 5 minutes
    });
  };

  const useCreateInvestmentPlan = () => {
    return useMutation({
      mutationFn: (planData: any) => adminService.createInvestmentPlan(planData),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['investment-plans-admin'] });
      },
    });
  };

  const useUpdateInvestmentPlan = () => {
    return useMutation({
      mutationFn: (data: { planId: string; planData: any }) => 
        adminService.updateInvestmentPlan(data.planId, data.planData),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['investment-plans-admin'] });
      },
    });
  };

  const useDeleteInvestmentPlan = () => {
    return useMutation({
      mutationFn: (planId: string) => adminService.deleteInvestmentPlan(planId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['investment-plans-admin'] });
      },
    });
  };

  // Investments
  const useInvestments = (params?: any) => {
    return useQuery({
      queryKey: ['investments-admin', params],
      queryFn: () => adminService.getAllInvestments(params),
      enabled: isAuthenticated,
      staleTime: 1000 * 60 * 5, // 5 minutes
    });
  };

  const useInvestmentDetails = (investmentId: string) => {
    return useQuery({
      queryKey: ['investments-admin', investmentId],
      queryFn: () => adminService.getInvestmentDetails(investmentId),
      enabled: isAuthenticated && !!investmentId,
      staleTime: 1000 * 60 * 5, // 5 minutes
    });
  };

  // Loan products
  const useLoanProducts = () => {
    return useQuery({
      queryKey: ['loan-products-admin'],
      queryFn: () => adminService.getLoanProducts(),
      enabled: isAuthenticated,
      staleTime: 1000 * 60 * 5, // 5 minutes
    });
  };

  const useCreateLoanProduct = () => {
    return useMutation({
      mutationFn: (productData: any) => adminService.createLoanProduct(productData),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['loan-products-admin'] });
      },
    });
  };

  const useUpdateLoanProduct = () => {
    return useMutation({
      mutationFn: (data: { productId: string; productData: any }) => 
        adminService.updateLoanProduct(data.productId, data.productData),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['loan-products-admin'] });
      },
    });
  };

  const useDeleteLoanProduct = () => {
    return useMutation({
      mutationFn: (productId: string) => adminService.deleteLoanProduct(productId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['loan-products-admin'] });
      },
    });
  };

  // Loans
  const useLoans = (params?: any) => {
    return useQuery({
      queryKey: ['loans-admin', params],
      queryFn: () => adminService.getAllLoans(params),
      enabled: isAuthenticated,
      staleTime: 1000 * 60 * 5, // 5 minutes
    });
  };

  const useLoanDetails = (loanId: string) => {
    return useQuery({
      queryKey: ['loans-admin', loanId],
      queryFn: () => adminService.getLoanDetails(loanId),
      enabled: isAuthenticated && !!loanId,
      staleTime: 1000 * 60 * 5, // 5 minutes
    });
  };

  const useApproveLoan = () => {
    return useMutation({
      mutationFn: (loanId: string) => adminService.approveLoan(loanId),
      onSuccess: (_, loanId) => {
        queryClient.invalidateQueries({ queryKey: ['loans-admin'] });
        queryClient.invalidateQueries({ queryKey: ['loans-admin', loanId] });
      },
    });
  };

  const useRejectLoan = () => {
    return useMutation({
      mutationFn: (data: { loanId: string; reason: string }) => 
        adminService.rejectLoan(data.loanId, data.reason),
      onSuccess: (_, { loanId }) => {
        queryClient.invalidateQueries({ queryKey: ['loans-admin'] });
        queryClient.invalidateQueries({ queryKey: ['loans-admin', loanId] });
      },
    });
  };

  // Transactions
  const useTransactions = (params?: any) => {
    return useQuery({
      queryKey: ['transactions-admin', params],
      queryFn: () => adminService.getAllTransactions(params),
      enabled: isAuthenticated,
      staleTime: 1000 * 60 * 5, // 5 minutes
    });
  };

  const useTransactionDetails = (transactionId: string) => {
    return useQuery({
      queryKey: ['transactions-admin', transactionId],
      queryFn: () => adminService.getTransactionDetails(transactionId),
      enabled: isAuthenticated && !!transactionId,
      staleTime: 1000 * 60 * 5, // 5 minutes
    });
  };

  // Withdrawals
  const useWithdrawals = (params?: any) => {
    return useQuery({
      queryKey: ['withdrawals-admin', params],
      queryFn: () => adminService.getAllWithdrawals(params),
      enabled: isAuthenticated,
      staleTime: 1000 * 60 * 5, // 5 minutes
    });
  };

  const useApproveWithdrawal = () => {
    return useMutation({
      mutationFn: (data: { withdrawalId: string; approvalData: any }) => 
        adminService.approveWithdrawal(data.withdrawalId, data.approvalData),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['withdrawals-admin'] });
      },
    });
  };

  const useRejectWithdrawal = () => {
    return useMutation({
      mutationFn: (data: { withdrawalId: string; reason: string }) => 
        adminService.rejectWithdrawal(data.withdrawalId, { reason: data.reason }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['withdrawals-admin'] });
      },
    });
  };

  // Notifications
  const useSendBroadcastNotification = () => {
    return useMutation({
      mutationFn: (data: { title: string; message: string; userIds?: string[] }) => 
        adminService.sendBroadcastNotification(data),
    });
  };

  // Audit logs
  const useAuditLogs = (params?: any) => {
    return useQuery({
      queryKey: ['audit-logs', params],
      queryFn: () => adminService.getAuditLogs(params),
      enabled: isAuthenticated,
      staleTime: 1000 * 60 * 5, // 5 minutes
    });
  };

  return {
    useDashboardStats,
    useUsers,
    useUserDetails,
    useUpdateUser,
    usePendingKYC,
    useApproveKYC,
    useRejectKYC,
    useInvestmentPlans,
    useCreateInvestmentPlan,
    useUpdateInvestmentPlan,
    useDeleteInvestmentPlan,
    useInvestments,
    useInvestmentDetails,
    useLoanProducts,
    useCreateLoanProduct,
    useUpdateLoanProduct,
    useDeleteLoanProduct,
    useLoans,
    useLoanDetails,
    useApproveLoan,
    useRejectLoan,
    useTransactions,
    useTransactionDetails,
    useWithdrawals,
    useApproveWithdrawal,
    useRejectWithdrawal,
    useSendBroadcastNotification,
    useAuditLogs,
  };
};