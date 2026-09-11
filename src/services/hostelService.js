import api, { isMockMode, simulateDelay } from './api';
import { MOCK_HOSTELS } from '../mocks/hostels';

export const hostelService = {
  /**
   * Fetches the complete list of hostels with room rosters and administrator contacts
   */
  async getHostels() {
    if (isMockMode) {
      await simulateDelay(250);
      return MOCK_HOSTELS;
    }

    try {
      return await api.get('/hostels');
    } catch (error) {
      console.warn('Backend unavailable, falling back to mock hostels:', error.message);
      return MOCK_HOSTELS;
    }
  },

  /**
   * Fetches hostel details by short name (e.g. 'LBBH')
   */
  async getHostelByName(name) {
    if (isMockMode) {
      await simulateDelay(150);
      return MOCK_HOSTELS.find((h) => h.name.toUpperCase() === (name || '').toUpperCase()) || MOCK_HOSTELS[0];
    }

    try {
      return await api.get(`/hostels/${name}`);
    } catch {
      return MOCK_HOSTELS.find((h) => h.name.toUpperCase() === (name || '').toUpperCase()) || MOCK_HOSTELS[0];
    }
  },

  /**
   * Helper to get rooms for a specific hostel
   */
  async getRoomsByHostel(hostelName) {
    const hostel = await this.getHostelByName(hostelName);
    return hostel ? hostel.rooms : [];
  },
};
