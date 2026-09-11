import api, { isMockMode, simulateDelay } from './api';
import { MOCK_STUDENT_USER } from '../mocks/user';

const USER_STORAGE_KEY = 'messledger_user';

export const userService = {
  /**
   * Fetches current authenticated user profile
   */
  async getProfile() {
    if (isMockMode) {
      await simulateDelay(200);
      const saved = localStorage.getItem(USER_STORAGE_KEY);
      return saved ? JSON.parse(saved) : MOCK_STUDENT_USER;
    }

    try {
      return await api.get('/user/profile');
    } catch (error) {
      console.warn('Using fallback user profile:', error.message);
      const saved = localStorage.getItem(USER_STORAGE_KEY);
      return saved ? JSON.parse(saved) : MOCK_STUDENT_USER;
    }
  },

  /**
   * Updates user profile attributes (name, room, phone, profilePicture)
   */
  async updateProfile(updates) {
    if (isMockMode) {
      await simulateDelay(350);
      const saved = localStorage.getItem(USER_STORAGE_KEY);
      const current = saved ? JSON.parse(saved) : MOCK_STUDENT_USER;
      const updated = { ...current, ...updates };
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    }

    try {
      return await api.put('/user/profile', updates);
    } catch (error) {
      console.warn('Backend update failed, updating local state:', error.message);
      const saved = localStorage.getItem(USER_STORAGE_KEY);
      const current = saved ? JSON.parse(saved) : MOCK_STUDENT_USER;
      const updated = { ...current, ...updates };
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    }
  },
};
