import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { investmentService } from '../services';
import { useAuth } from '../contexts/AuthContext';

export const useInvestments = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  // Get investment plans
  const useInvestmentPlans = () => {
    return useQuery({
      queryKey: ['investment-plans'],
      queryFn: () => investmentService.getInvestmentPlans(),
      staleTime: 1000 * 60 * 10, // 10 minutes
    });
  };

  // Get investment plan details
  const useInvestmentPlanDetails = (planId) => {
    return useQuery({
      queryKey: ['investment-plans', planId],
      queryFn: () => investmentService.getInvestmentPlanDetails(planId),
      enabled: !!planId,
      staleTime: 1000 * 60 * 10, // 10 minutes
    });
  };

  // Create investment
  const useCreateInvestment = () => {
    return useMutation({
      mutationFn: (data) => investmentService.createInvestment(data),
      onSuccess: () => {
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['user-investments'] });
        queryClient.invalidateQueries({ queryKey: ['wallet'] });
      },
    });
  };

  // Get user investments
  const useUserInvestments = (params) => {
    return useQuery({
      queryKey: ['user-investments', params],
      queryFn: () => investmentService.getUserInvestments(params),
      enabled: isAuthenticated,
      staleTime: 1000 * 60 * 5, // 5 minutes
    });
  };

  // Get user investment details
  const useUserInvestmentDetails = (investmentId) => {
    return useQuery({
      queryKey: ['user-investments', investmentId],
      queryFn: () => investmentService.getUserInvestmentDetails(investmentId),
      enabled: isAuthenticated && !!investmentId,
      staleTime: 1000 * 60 * 5, // 5 minutes
    });
  };

  // Get user investment returns
  const useUserInvestmentReturns = (investmentId) => {
    return useQuery({
      queryKey: ['user-investment-returns', investmentId],
      queryFn: () => investmentService.getUserInvestmentReturns(investmentId),
      enabled: isAuthenticated && !!investmentId,
      staleTime: 1000 * 60 * 5, // 5 minutes
    });
  };

  // Cancel investment
  const useCancelInvestment = () => {
    return useMutation({
      mutationFn: (investmentId) => investmentService.cancelInvestment(investmentId),
      onSuccess: (_, investmentId) => {
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['user-investments'] });
        queryClient.invalidateQueries({ queryKey: ['user-investments', investmentId] });
        queryClient.invalidateQueries({ queryKey: ['wallet'] });
      },
    });
  };

  // Reinvest investment
  const useReinvestInvestment = () => {
    return useMutation({
      mutationFn: (data) => investmentService.reinvestInvestment(data.investmentId, data.amount),
      onSuccess: (_, { investmentId }) => {
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['user-investments'] });
        queryClient.invalidateQueries({ queryKey: ['user-investments', investmentId] });
        queryClient.invalidateQueries({ queryKey: ['wallet'] });
      },
    });
  };

  // Get investment statistics
  const useInvestmentStatistics = () => {
    return useQuery({
      queryKey: ['investment-statistics'],
      queryFn: () => investmentService.getInvestmentStatistics(),
      enabled: isAuthenticated,
      staleTime: 1000 * 60 * 5, // 5 minutes
    });
  };

  return {
    useInvestmentPlans,
    useInvestmentPlanDetails,
    useCreateInvestment,
    useUserInvestments,
    useUserInvestmentDetails,
    useUserInvestmentReturns,
    useCancelInvestment,
    useReinvestInvestment,
    useInvestmentStatistics,
  };
};