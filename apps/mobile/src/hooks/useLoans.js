import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { loanService } from '../services';
import { useAuth } from '../contexts/AuthContext';

export const useLoans = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  // Get loan products
  const useLoanProducts = () => {
    return useQuery({
      queryKey: ['loan-products'],
      queryFn: () => loanService.getLoanProducts(),
      staleTime: 1000 * 60 * 10, // 10 minutes
    });
  };

  // Get loan product details
  const useLoanProductDetails = (productId) => {
    return useQuery({
      queryKey: ['loan-products', productId],
      queryFn: () => loanService.getLoanProductDetails(productId),
      enabled: !!productId,
      staleTime: 1000 * 60 * 10, // 10 minutes
    });
  };

  // Apply for loan
  const useApplyForLoan = () => {
    return useMutation({
      mutationFn: (data) => loanService.applyForLoan(data),
      onSuccess: () => {
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['user-loans'] });
        queryClient.invalidateQueries({ queryKey: ['wallet'] });
      },
    });
  };

  // Get user loans
  const useUserLoans = (params) => {
    return useQuery({
      queryKey: ['user-loans', params],
      queryFn: () => loanService.getUserLoans(params),
      enabled: isAuthenticated,
      staleTime: 1000 * 60 * 5, // 5 minutes
    });
  };

  // Get user loan details
  const useUserLoanDetails = (loanId) => {
    return useQuery({
      queryKey: ['user-loans', loanId],
      queryFn: () => loanService.getUserLoanDetails(loanId),
      enabled: isAuthenticated && !!loanId,
      staleTime: 1000 * 60 * 5, // 5 minutes
    });
  };

  // Get loan payment schedule
  const useLoanPaymentSchedule = (loanId) => {
    return useQuery({
      queryKey: ['loan-payment-schedule', loanId],
      queryFn: () => loanService.getLoanPaymentSchedule(loanId),
      enabled: isAuthenticated && !!loanId,
      staleTime: 1000 * 60 * 5, // 5 minutes
    });
  };

  // Get loan payment history
  const useLoanPaymentHistory = (loanId) => {
    return useQuery({
      queryKey: ['loan-payment-history', loanId],
      queryFn: () => loanService.getLoanPaymentHistory(loanId),
      enabled: isAuthenticated && !!loanId,
      staleTime: 1000 * 60 * 5, // 5 minutes
    });
  };

  // Make loan payment
  const useMakeLoanPayment = () => {
    return useMutation({
      mutationFn: (data) => loanService.makeLoanPayment(data),
      onSuccess: (_, { loanId }) => {
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['user-loans'] });
        queryClient.invalidateQueries({ queryKey: ['user-loans', loanId] });
        queryClient.invalidateQueries({ queryKey: ['loan-payment-history', loanId] });
        queryClient.invalidateQueries({ queryKey: ['loan-payment-schedule', loanId] });
        queryClient.invalidateQueries({ queryKey: ['wallet'] });
      },
    });
  };

  // Request loan extension
  const useRequestLoanExtension = () => {
    return useMutation({
      mutationFn: (data) => loanService.requestLoanExtension(data),
      onSuccess: (_, { loanId }) => {
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['user-loans', loanId] });
        queryClient.invalidateQueries({ queryKey: ['loan-payment-schedule', loanId] });
      },
    });
  };

  // Calculate loan details
  const useCalculateLoanDetails = () => {
    return useMutation({
      mutationFn: (data) => loanService.calculateLoanDetails(data),
    });
  };

  return {
    useLoanProducts,
    useLoanProductDetails,
    useApplyForLoan,
    useUserLoans,
    useUserLoanDetails,
    useLoanPaymentSchedule,
    useLoanPaymentHistory,
    useMakeLoanPayment,
    useRequestLoanExtension,
    useCalculateLoanDetails,
  };
};