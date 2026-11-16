import api, { isMockMode, simulateDelay } from './api';
import { MOCK_STUDENT_USER, MOCK_ADMIN_USER, DEMO_CREDENTIALS } from './mockData';
import { boarderService } from './boarderService';

const TOKEN_KEY = 'messledger_token';
const USER_KEY = 'messledger_user';

export const authService = {
  /**
   * Log in with email and password
   */
  async login({ email, password, _rememberMe = false }) {
    if (isMockMode) {
      await simulateDelay(400);

      // Check for admin match
      if (email.toLowerCase().includes('admin') || email.toLowerCase() === DEMO_CREDENTIALS.admin.email.toLowerCase()) {
        const adminUser = { ...MOCK_ADMIN_USER, email };
        const token = `mock_jwt_admin_${Date.now()}`;
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(adminUser));
        return { user: adminUser, token };
      }

      // Default student match
      const studentUser = {
        ...MOCK_STUDENT_USER,
        email,
        name: email.split('@')[0].replace('.', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      };
      const token = `mock_jwt_student_${Date.now()}`;
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(studentUser));
      return { user: studentUser, token };
    }

    try {
      const response = await api.post('/auth/login', { email, password });
      const { user, token } = response;
      if (token) localStorage.setItem(TOKEN_KEY, token);
      if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
      return response;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'Invalid email or password.');
    }
  },

  /**
   * Register a new student account
   */
  async register(studentData) {
    if (isMockMode) {
      await simulateDelay(450);

      // Verify student credentials against the authorized Boarder Master List
      boarderService.verifyStudentForRegistration(studentData);

      const newUser = {
        id: `usr_${Date.now()}`,
        name: studentData.name,
        email: studentData.email,
        role: 'STUDENT',
        rollNo: studentData.rollNo,
        hostel: studentData.hostel,
        room: studentData.room,
        phone: studentData.phone || '',
        profilePicture: null,
        joinedDate: new Date().toISOString().split('T')[0],
      };
      const token = `mock_jwt_${newUser.id}`;
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(newUser));

      // Mark the boarder as registered in the master list
      boarderService.markBoarderRegistered(studentData.rollNo);

      return { user: newUser, token };
    }

    try {
      const response = await api.post('/auth/register', studentData);
      const { user, token } = response;
      if (token) localStorage.setItem(TOKEN_KEY, token);
      if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
      return response;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'Registration failed. Please check your details.');
    }
  },

  /**
   * Register an authorized administrator (requires invitation token)
   */
  async registerAdmin(adminData) {
    if (isMockMode) {
      await simulateDelay(450);

      // Validate invite token conceptually
      if (!adminData.inviteToken || adminData.inviteToken.trim().length < 6) {
        throw new Error('Invalid or expired admin invitation token. Authorization restricted.');
      }

      const newAdmin = {
        id: `adm_${Date.now()}`,
        name: adminData.name,
        email: adminData.email,
        role: 'ADMIN',
        designation: adminData.designation,
        hostel: adminData.hostel || '',
        phone: adminData.phone || '',
        profilePicture: null,
        joinedDate: new Date().toISOString().split('T')[0],
      };
      const token = `mock_jwt_admin_${newAdmin.id}`;
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(newAdmin));
      return { user: newAdmin, token };
    }

    try {
      const response = await api.post('/auth/admin-register', adminData);
      const { user, token } = response;
      if (token) localStorage.setItem(TOKEN_KEY, token);
      if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
      return response;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'Admin authorization failed.');
    }
  },

  /**
   * Verify an admin invitation token before unlocking registration form
   */
  async verifyInviteToken(token) {
    if (isMockMode) {
      await simulateDelay(300);
      if (token && token.trim().length >= 6) {
        return { valid: true };
      }
      throw new Error('Invalid or expired admin invitation token.');
    }

    try {
      const response = await api.post('/auth/verify-invite-token', { token: token.trim() });
      return response;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'Invalid or expired invitation token.');
    }
  },

  /**
   * Authenticate via Google OAuth
   */
  async googleAuth(credential) {
    if (isMockMode) {
      await simulateDelay(350);
      const googleUser = {
        ...MOCK_STUDENT_USER,
        id: 'usr_google_001',
        name: 'Bhargav Jyoti (Google)',
        email: 'bhargav.google@hostel.edu',
        profilePicture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      };
      const token = `mock_jwt_google_${Date.now()}`;
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(googleUser));
      return { user: googleUser, token };
    }

    try {
      const response = await api.post('/auth/google', { credential });
      const { user, token } = response;
      if (token) localStorage.setItem(TOKEN_KEY, token);
      if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
      return response;
    } catch (error) {
      const data = error.response?.data || {};
      const err = new Error(data.message || error.message || 'Google authentication failed.');
      err.isRosterRestricted = Boolean(
        error.isRosterRestricted ||
        data.isRosterRestricted ||
        error.response?.status === 403 ||
        error.status === 403
      );
      err.email = data.email || error.email || null;
      err.status = error.response?.status || error.status;
      err.response = error.response;
      throw err;
    }
  },

  /**
   * Clear session credentials and backend cookie
   */
  async logout() {
    try {
      if (!isMockMode) {
        await api.post('/auth/logout');
      }
    } catch (err) {
      console.warn('Backend logout warning:', err);
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  },

  /**
   * Get current stored session
   */
  getStoredAuth() {
    const token = localStorage.getItem(TOKEN_KEY);
    const userStr = localStorage.getItem(USER_KEY);
    if (!token || !userStr) return null;

    try {
      return { token, user: JSON.parse(userStr) };
    } catch {
      return null;
    }
  },
};
