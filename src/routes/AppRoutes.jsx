import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Common Route Guards
import { ProtectedRoute } from '../components/common/ProtectedRoute';
import { RoleProtectedRoute } from '../components/common/RoleProtectedRoute';

// Auth Pages
import { Login } from '../pages/auth/Login';
import { Register } from '../pages/auth/Register';
import { AdminRegister } from '../pages/auth/AdminRegister';
import { Unauthorized } from '../pages/auth/Unauthorized';

// Dashboard Pages
import { Dashboard } from '../pages/dashboard/Dashboard';
import { Payment } from '../pages/dashboard/Payment';
import { EditProfile } from '../pages/dashboard/EditProfile';
import { Settings } from '../pages/dashboard/Settings';
import { Notifications } from '../pages/dashboard/Notifications';

// Admin Pages
import { AdminDashboard } from '../pages/admin/AdminDashboard';

// 404
import { NotFound } from '../pages/NotFound';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Root redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Public Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/register/admin" element={<AdminRegister />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Protected Student Dashboard Routes */}
      <Route
        path="/login/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/login/dashboard/payment"
        element={
          <ProtectedRoute>
            <Payment />
          </ProtectedRoute>
        }
      />
      <Route
        path="/login/dashboard/profile"
        element={
          <ProtectedRoute>
            <EditProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/login/dashboard/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/login/dashboard/notifications"
        element={
          <ProtectedRoute>
            <Notifications />
          </ProtectedRoute>
        }
      />

      {/* Role Protected Admin Routes */}
      <Route
        path="/admin/dashboard"
        element={
          <RoleProtectedRoute allowedRole="ADMIN">
            <AdminDashboard />
          </RoleProtectedRoute>
        }
      />

      {/* Catch-all 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};
