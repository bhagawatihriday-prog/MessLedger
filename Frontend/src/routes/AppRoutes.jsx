import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Route Guards
import { ProtectedRoute, RoleProtectedRoute } from '../components';

// Pages
import {
  Login,
  AdminRegister,
  Unauthorized,
  Dashboard,
  Payment,
  EditProfile,
  Settings,
  Notifications,
  AdminDashboard,
  AdminBoarders,
  NotFound,
} from '../pages';
export const AppRoutes = () => {
  return (
    <Routes>
      {/* Homepage */}
      <Route path="/" element={<Login />} />

      {/* Public Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Navigate to="/login" replace />} />
      <Route path="/register/admin" element={<Navigate to="/admin-register" replace />} />
      <Route path="/admin-register" element={<AdminRegister />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Protected Student Dashboard Routes */}
      <Route
        path="/login/dashboard"
        element={
          <RoleProtectedRoute allowedRole="STUDENT">
            <Dashboard />
          </RoleProtectedRoute>
        }
      />
      <Route
        path="/login/dashboard/payment"
        element={
          <RoleProtectedRoute allowedRole="STUDENT">
            <Payment />
          </RoleProtectedRoute>
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
      <Route
        path="/admin/boarders"
        element={
          <RoleProtectedRoute allowedRole="ADMIN">
            <AdminBoarders />
          </RoleProtectedRoute>
        }
      />

      {/* Catch-all 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};
