import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '../services';
import { useAuth } from '../contexts/AuthContext';

export const useProfile = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated, updateProfile: updateAuthProfile } = useAuth();

  // Get user profile
  const useUserProfile = () => {
    return useQuery({
      queryKey: ['user-profile'],
      queryFn: () => authService.getUserProfile(),
      enabled: isAuthenticated,
      staleTime: 1000 * 60 * 5, // 5 minutes
    });
  };

  // Update user profile
  const useUpdateProfile = () => {
    return useMutation({
      mutationFn: (profileData) => authService.updateProfile(profileData),
      onSuccess: (updatedUser) => {
        // Update auth context
        updateAuthProfile(updatedUser);
        
        // Invalidate profile query
        queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      },
    });
  };

  // Change password
  const useChangePassword = () => {
    return useMutation({
      mutationFn: ({ currentPassword, newPassword }) => 
        authService.changePassword(currentPassword, newPassword),
    });
  };

  // Submit KYC verification
  const useSubmitKYC = () => {
    return useMutation({
      mutationFn: (kycData) => authService.submitKYCVerification(kycData),
      onSuccess: () => {
        // Invalidate profile query
        queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      },
    });
  };

  // Get KYC verification status
  const useKYCStatus = () => {
    return useQuery({
      queryKey: ['kyc-status'],
      queryFn: () => authService.getKYCVerificationStatus(),
      enabled: isAuthenticated,
      staleTime: 1000 * 60 * 5, // 5 minutes
    });
  };

  return {
    useUserProfile,
    useUpdateProfile,
    useChangePassword,
    useSubmitKYC,
    useKYCStatus,
  };
};