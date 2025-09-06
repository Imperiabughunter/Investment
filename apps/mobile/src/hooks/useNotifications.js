import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '../services';
import { useAuth } from '../contexts/AuthContext';

export const useNotifications = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  // Get user notifications
  const useUserNotifications = (params) => {
    return useQuery({
      queryKey: ['notifications', params],
      queryFn: () => notificationService.getUserNotifications(params),
      enabled: isAuthenticated,
      staleTime: 1000 * 60, // 1 minute
    });
  };

  // Mark notification as read
  const useMarkNotificationAsRead = () => {
    return useMutation({
      mutationFn: (notificationId) => notificationService.markNotificationAsRead(notificationId),
      onSuccess: () => {
        // Invalidate notifications query
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      },
    });
  };

  // Mark all notifications as read
  const useMarkAllNotificationsAsRead = () => {
    return useMutation({
      mutationFn: () => notificationService.markAllNotificationsAsRead(),
      onSuccess: () => {
        // Invalidate notifications query
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      },
    });
  };

  // Delete notification
  const useDeleteNotification = () => {
    return useMutation({
      mutationFn: (notificationId) => notificationService.deleteNotification(notificationId),
      onSuccess: () => {
        // Invalidate notifications query
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      },
    });
  };

  // Get notification preferences
  const useNotificationPreferences = () => {
    return useQuery({
      queryKey: ['notification-preferences'],
      queryFn: () => notificationService.getNotificationPreferences(),
      enabled: isAuthenticated,
      staleTime: 1000 * 60 * 5, // 5 minutes
    });
  };

  // Update notification preferences
  const useUpdateNotificationPreferences = () => {
    return useMutation({
      mutationFn: (preferences) => notificationService.updateNotificationPreferences(preferences),
      onSuccess: () => {
        // Invalidate notification preferences query
        queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
      },
    });
  };

  // Register device for push notifications
  const useRegisterDevice = () => {
    return useMutation({
      mutationFn: (deviceData) => notificationService.registerDeviceForPushNotifications(deviceData),
    });
  };

  // Unregister device from push notifications
  const useUnregisterDevice = () => {
    return useMutation({
      mutationFn: (deviceToken) => notificationService.unregisterDeviceFromPushNotifications(deviceToken),
    });
  };

  return {
    useUserNotifications,
    useMarkNotificationAsRead,
    useMarkAllNotificationsAsRead,
    useDeleteNotification,
    useNotificationPreferences,
    useUpdateNotificationPreferences,
    useRegisterDevice,
    useUnregisterDevice,
  };
};