import api, { isMockMode, simulateDelay } from './api';
import { MOCK_NOTIFICATIONS } from './mockData';

const NOTIF_STORAGE_KEY = 'messledger_notifications';

export const notificationService = {
  /**
   * Fetches student notifications
   */
  async getNotifications() {
    if (isMockMode) {
      await simulateDelay(200);
      const saved = localStorage.getItem(NOTIF_STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // fallback
        }
      }
      return MOCK_NOTIFICATIONS;
    }

    try {
      return await api.get('/notifications');
    } catch (error) {
      console.warn('Using fallback notifications:', error.message);
      const saved = localStorage.getItem(NOTIF_STORAGE_KEY);
      return saved ? JSON.parse(saved) : MOCK_NOTIFICATIONS;
    }
  },

  /**
   * Marks a single notification as read
   */
  async markAsRead(id) {
    if (isMockMode) {
      const items = await this.getNotifications();
      const updated = items.map((item) =>
        item.id === id ? { ...item, isRead: true } : item
      );
      localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    }

    try {
      return await api.put(`/notifications/${id}/read`);
    } catch {
      const items = await this.getNotifications();
      const updated = items.map((item) =>
        item.id === id ? { ...item, isRead: true } : item
      );
      localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    }
  },

  /**
   * Marks all notifications as read
   */
  async markAllAsRead() {
    if (isMockMode) {
      const items = await this.getNotifications();
      const updated = items.map((item) => ({ ...item, isRead: true }));
      localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    }

    try {
      return await api.put('/notifications/mark-all-read');
    } catch {
      const items = await this.getNotifications();
      const updated = items.map((item) => ({ ...item, isRead: true }));
      localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    }
  },
};
