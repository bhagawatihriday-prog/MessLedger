import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Menu,
  X,
  UtensilsCrossed,
  Home,
  CreditCard,
  History,
  User,
  Settings,
  LogOut,
  Building2,
  Shield,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { NotificationBell } from '../dashboard/NotificationBell';

export const MobileNavbar = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user, logout, switchDemoRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    setDrawerOpen(false);
    navigate('/login');
  };

  const navLinks = [
    { label: 'Dashboard', path: '/login/dashboard', icon: Home },
    { label: 'Pay Mess Bill', path: '/login/dashboard/payment', icon: CreditCard },
    { label: 'My Profile', path: '/login/dashboard/profile', icon: User },
    { label: 'Settings', path: '/login/dashboard/settings', icon: Settings },
  ];

  return (
    <div className="md:hidden">
      {/* Mobile Top App Bar */}
      <div className="flex items-center justify-between px-4 h-14 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link to="/login/dashboard" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
            <span className="font-bold text-base tracking-tight text-slate-900 dark:text-slate-100">
              Mess<span className="text-indigo-600 dark:text-indigo-400">Ledger</span>
            </span>
          </Link>
        </div>

        {/* Center hostel pill */}
        {user?.hostel && (
          <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
            <Building2 className="w-3 h-3 text-indigo-500" />
            <span>{user.hostel}</span>
          </div>
        )}

        <div className="flex items-center gap-1">
          <NotificationBell />
        </div>
      </div>

      {/* Drawer Backdrop */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs transition-opacity"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Slide-over Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-2xl transform transition-transform duration-200 ease-in-out flex flex-col ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
            <span className="font-bold text-lg text-slate-900 dark:text-slate-100">
              MessLedger
            </span>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {user?.name}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
            {user?.email}
          </p>
          <div className="flex items-center gap-2 mt-2 text-xs">
            <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-medium">
              {user?.role}
            </span>
            <span className="text-slate-500 dark:text-slate-400">
              {user?.hostel} • #{user?.room}
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setDrawerOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {user?.role === 'ADMIN' && (
            <Link
              to="/admin/dashboard"
              onClick={() => setDrawerOpen(false)}
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
            >
              <Shield className="w-4 h-4 shrink-0" />
              <span>Admin Management</span>
            </Link>
          )}

          {/* Quick Demo Switcher in Drawer */}
          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
            <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Presentation Mode
            </p>
            <button
              type="button"
              onClick={() => {
                switchDemoRole(user?.role === 'STUDENT' ? 'ADMIN' : 'STUDENT');
                setDrawerOpen(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <span className="flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 text-indigo-500" />
                Switch to {user?.role === 'STUDENT' ? 'Admin' : 'Student'}
              </span>
            </button>
          </div>
        </nav>

        {/* Drawer Footer */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
