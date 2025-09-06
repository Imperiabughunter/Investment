import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { walletService } from '../services';
import { useAuth } from '../contexts/AuthContext';

export const useWallet = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  // Get wallet information
  const useWalletInfo = () => {
    return useQuery({
      queryKey: ['wallet'],
      queryFn: () => walletService.getWalletInfo(),
      enabled: isAuthenticated,
      staleTime: 1000 * 60 * 5, // 5 minutes
    });
  };

  // Get transaction history
  const useTransactionHistory = (params) => {
    return useQuery({
      queryKey: ['transactions', params],
      queryFn: () => walletService.getTransactionHistory(params),
      enabled: isAuthenticated,
      staleTime: 1000 * 60 * 5, // 5 minutes
    });
  };

  // Request withdrawal
  const useRequestWithdrawal = () => {
    return useMutation({
      mutationFn: (data) => walletService.requestWithdrawal(data),
      onSuccess: () => {
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['wallet'] });
        queryClient.invalidateQueries({ queryKey: ['withdrawals'] });
      },
    });
  };

  // Get withdrawal history
  const useWithdrawalHistory = (params) => {
    return useQuery({
      queryKey: ['withdrawals', params],
      queryFn: () => walletService.getWithdrawalHistory(params),
      enabled: isAuthenticated,
      staleTime: 1000 * 60 * 5, // 5 minutes
    });
  };

  // Generate crypto deposit address
  const useGenerateCryptoAddress = () => {
    return useMutation({
      mutationFn: (data) => walletService.generateCryptoDepositAddress(data),
    });
  };

  // Get crypto deposit history
  const useCryptoDepositHistory = (params) => {
    return useQuery({
      queryKey: ['crypto-deposits', params],
      queryFn: () => walletService.getCryptoDepositHistory(params),
      enabled: isAuthenticated,
      staleTime: 1000 * 60 * 5, // 5 minutes
    });
  };

  // Add bank account
  const useAddBankAccount = () => {
    return useMutation({
      mutationFn: (data) => walletService.addBankAccount(data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
      },
    });
  };

  // Get bank accounts
  const useBankAccounts = () => {
    return useQuery({
      queryKey: ['bank-accounts'],
      queryFn: () => walletService.getBankAccounts(),
      enabled: isAuthenticated,
      staleTime: 1000 * 60 * 5, // 5 minutes
    });
  };

  // Delete bank account
  const useDeleteBankAccount = () => {
    return useMutation({
      mutationFn: (accountId) => walletService.deleteBankAccount(accountId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
      },
    });
  };

  return {
    useWalletInfo,
    useTransactionHistory,
    useRequestWithdrawal,
    useWithdrawalHistory,
    useGenerateCryptoAddress,
    useCryptoDepositHistory,
    useAddBankAccount,
    useBankAccounts,
    useDeleteBankAccount,
  };
};