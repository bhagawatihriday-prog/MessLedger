import api from './api';

export const rebateService = {
  /**
   * Retrieves all active rebates for the admin's hostel (or student's own rebate)
   */
  async getRebates() {
    try {
      const rebates = await api.get('/rebates');
      return Array.isArray(rebates) ? rebates : [];
    } catch (error) {
      console.warn('Failed to fetch rebates:', error.message);
      return [];
    }
  },

  /**
   * Applies / persists a diet rebate concession in the database
   */
  async applyRebate(rebateData) {
    return await api.post('/rebates', rebateData);
  },

  /**
   * Removes / deletes an active diet rebate concession
   */
  async removeRebate(studentId) {
    return await api.delete(`/rebates/${studentId}`);
  },
};
