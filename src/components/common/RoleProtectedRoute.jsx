import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { PageLoader } from './Loader';

export const RoleProtectedRoute = ({ allowedRole, children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PageLoader text="Verifying permissions..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user?.role !== allowedRole) {
    return <Navigate to="/unauthorized" state={{ requiredRole: allowedRole }} replace />;
  }

  return children;
};
