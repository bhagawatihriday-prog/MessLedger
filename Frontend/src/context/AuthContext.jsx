import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { userService } from '../services/userService';

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
          const isAdminUser = stored.user.role === 'ADMIN' || stored.user.role === 'SENIOR_WARDEN' || stored.user.role === 'WARDEN';
          const cleanUser = {
            ...stored.user,
            hostel: stored.user.hostel ? stored.user.hostel.toUpperCase() : stored.user.hostel,
            room: isAdminUser ? null : stored.user.room,
          };
          setUser(cleanUser);
          localStorage.setItem('messledger_user', JSON.stringify(cleanUser));
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

  const loginWithGoogle = async (credential) => {
    setLoading(true);
    try {
      const response = await authService.googleAuth(credential);
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
    const updatedUser = await userService.updateProfile(updates);
    setUser(updatedUser);
    return updatedUser;
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
