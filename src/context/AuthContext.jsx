import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { userService } from '../services/userService';
import { MOCK_STUDENT_USER, MOCK_ADMIN_USER } from '../mocks/user';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state on app mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const stored = authService.getStoredAuth();
        if (stored && stored.user) {
          setUser(stored.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Failed to restore auth session:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials) => {
    setLoading(true);
    try {
      const response = await authService.login(credentials);
      setUser(response.user);
      return response;
    } finally {
      setLoading(false);
    }
  };

  const register = async (studentData) => {
    setLoading(true);
    try {
      const response = await authService.register(studentData);
      setUser(response.user);
      return response;
    } finally {
      setLoading(false);
    }
  };

  const registerAdmin = async (adminData) => {
    setLoading(true);
    try {
      const response = await authService.registerAdmin(adminData);
      setUser(response.user);
      return response;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const response = await authService.googleAuth();
      setUser(response.user);
      return response;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const updateUser = async (updates) => {
    try {
      const updatedUser = await userService.updateProfile(updates);
      setUser(updatedUser);
      return updatedUser;
    } catch (error) {
      throw error;
    }
  };

  // Switch demo account for presentation
  const switchDemoRole = (role) => {
    if (role === 'ADMIN') {
      setUser(MOCK_ADMIN_USER);
      localStorage.setItem('messledger_token', 'mock_admin_token');
      localStorage.setItem('messledger_user', JSON.stringify(MOCK_ADMIN_USER));
    } else {
      setUser(MOCK_STUDENT_USER);
      localStorage.setItem('messledger_token', 'mock_student_token');
      localStorage.setItem('messledger_user', JSON.stringify(MOCK_STUDENT_USER));
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    register,
    registerAdmin,
    loginWithGoogle,
    logout,
    updateUser,
    switchDemoRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
