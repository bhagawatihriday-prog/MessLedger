import api, { isMockMode, simulateDelay } from './api';
import { MOCK_STUDENT_USER } from './mockData';

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
      const response = await api.get('/user/profile');
      const user = response?.user || response;
      if (user) {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      }
      return user;
    } catch (error) {
      console.warn('Using fallback user profile:', error.message);
      const saved = localStorage.getItem(USER_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
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
      const response = await api.put('/user/profile', updates);
      const updated = response?.user || response;
      if (updated) {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated));
      }
      return updated;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to update profile.');
    }
  },

  /**
   * Reallocates a student's room number (Admin Only)
   */
  async updateStudentRoom(userId, room) {
    if (isMockMode) {
      await simulateDelay(300);
      return { success: true, room };
    }
    return await api.put(`/user/${userId}/room`, { room });
  },

  /**
   * Deletes a user account by ID, roll number, or email (Admin Only)
   */
  async deleteUser(identifier) {
    if (isMockMode) {
      await simulateDelay(350);

      // In mock mode, if a roll number is passed or matching boarder exists, unmark them
      try {
        const boardersRaw = localStorage.getItem('messledger_boarders');
        if (boardersRaw) {
          const boarders = JSON.parse(boardersRaw);
          const updatedBoarders = boarders.map((b) => {
            if (
              b.id === identifier ||
              (b.rollNo && b.rollNo.toUpperCase() === identifier.toUpperCase()) ||
              (b.email && b.email.toLowerCase() === identifier.toLowerCase())
            ) {
              return { ...b, isRegistered: false, registeredAt: null };
            }
            return b;
          });
          localStorage.setItem('messledger_boarders', JSON.stringify(updatedBoarders));
        }
      } catch (_e) {
        // ignore
      }

      // Check if logged in user was deleted
      const currentUser = JSON.parse(localStorage.getItem(USER_STORAGE_KEY) || '{}');
      if (
        currentUser.id === identifier ||
        (currentUser.rollNo && currentUser.rollNo.toUpperCase() === identifier.toUpperCase()) ||
        (currentUser.email && currentUser.email.toLowerCase() === identifier.toLowerCase())
      ) {
        localStorage.removeItem(USER_STORAGE_KEY);
        localStorage.removeItem('messledger_token');
      }

      return {
        success: true,
        message: `User account (${identifier}) deleted successfully.`,
      };
    }

    try {
      const endpoint = identifier ? `/user/${encodeURIComponent(identifier)}` : '/user';
      const response = await api.delete(endpoint);
      return response;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to delete user account.');
    }
  },

  /**
   * Bulk deletes student user accounts by roll numbers, IDs, or emails (Admin Only)
   */
  async deleteUsersBulk({ rollNos = [], ids = [], emails = [] }) {
    if (isMockMode) {
      await simulateDelay(350);
      const upperRolls = new Set(rollNos.map((r) => r.toUpperCase()));
      const lowerEmails = new Set(emails.map((e) => e.toLowerCase()));
      const idSet = new Set(ids);

      try {
        const boardersRaw = localStorage.getItem('messledger_boarders');
        if (boardersRaw) {
          const boarders = JSON.parse(boardersRaw);
          const updatedBoarders = boarders.map((b) => {
            if (
              idSet.has(b.id) ||
              (b.rollNo && upperRolls.has(b.rollNo.toUpperCase())) ||
              (b.email && lowerEmails.has(b.email.toLowerCase()))
            ) {
              return { ...b, isRegistered: false, registeredAt: null };
            }
            return b;
          });
          localStorage.setItem('messledger_boarders', JSON.stringify(updatedBoarders));
        }
      } catch (_e) {
        // ignore
      }

      return {
        success: true,
        count: rollNos.length || ids.length,
        message: 'Selected user accounts deleted successfully.',
      };
    }

    try {
      const response = await api.post('/user/bulk-delete', { rollNos, ids, emails });
      return response;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to bulk delete user accounts.');
    }
  },

  /**
   * Fetches registered students for the admin's hostel
   */
  async getStudents() {
    if (isMockMode) {
      await simulateDelay(200);
      return [];
    }
    try {
      const response = await api.get('/user/students');
      return response || [];
    } catch (error) {
      console.warn('Failed to load registered students:', error.message);
      return [];
    }
  },
};

