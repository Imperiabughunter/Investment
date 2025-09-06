import api from './api';

/**
 * Notification service for handling user notifications
 */
class NotificationService {
  /**
   * Get user notifications
   * @param {Object} params - Query parameters (page, limit, read, etc.)
   * @returns {Promise<Object>} - User notifications data
   */
  async getUserNotifications(params = {}) {
    return api.get('/notifications', params);
  }

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   * @returns {Promise<Object>} - Response data
   */
  async markAsRead(notificationId) {
    return api.patch(`/notifications/${notificationId}/read`);
  }

  /**
   * Mark all notifications as read
   * @returns {Promise<Object>} - Response data
   */
  async markAllAsRead() {
    return api.patch('/notifications/read-all');
  }

  /**
   * Delete notification
   * @param {string} notificationId - Notification ID
   * @returns {Promise<Object>} - Response data
   */
  async deleteNotification(notificationId) {
    return api.delete(`/notifications/${notificationId}`);
  }

  /**
   * Update notification preferences
   * @param {Object} preferences - Notification preferences
   * @returns {Promise<Object>} - Updated preferences
   */
  async updateNotificationPreferences(preferences) {
    return api.put('/notifications/preferences', preferences);
  }

  /**
   * Get notification preferences
   * @returns {Promise<Object>} - Notification preferences
   */
  async getNotificationPreferences() {
    return api.get('/notifications/preferences');
  }

  /**
   * Register device for push notifications
   * @param {Object} deviceData - Device data (token, platform, etc.)
   * @returns {Promise<Object>} - Response data
   */
  async registerDevice(deviceData) {
    return api.post('/notifications/devices', deviceData);
  }

  /**
   * Unregister device from push notifications
   * @param {string} deviceToken - Device token
   * @returns {Promise<Object>} - Response data
   */
  async unregisterDevice(deviceToken) {
    return api.delete(`/notifications/devices/${deviceToken}`);
  }
}

export default new NotificationService();