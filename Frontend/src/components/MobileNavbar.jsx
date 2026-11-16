import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Menu,
  X,
  Home,
  CreditCard,
  User,
  Settings,
  LogOut,
  Building2,
  Shield,
  Users,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth, useTheme } from '../context';
import { NotificationBell } from './NotificationBell';
import { Logo } from './Logo';

export const MobileNavbar = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    setDrawerOpen(false);
    navigate('/login');
  };

  const isAuthority = user?.role === 'ADMIN' || user?.role === 'SENIOR_WARDEN' || user?.role === 'WARDEN';
  const roleDisplay = user?.role === 'WARDEN' ? 'WARDEN' : (isAuthority ? 'SENIOR WARDEN' : 'STUDENT');

  const navLinks = isAuthority
    ? [
        { label: user?.role === 'WARDEN' ? 'Warden Console' : 'Senior Warden Console', path: '/admin/dashboard', icon: Shield },
        { label: 'Boarders Roster', path: '/admin/boarders', icon: Users },
        { label: 'Official Profile', path: '/login/dashboard/profile', icon: User },
        { label: 'Settings', path: '/login/dashboard/settings', icon: Settings },
      ]
    : [
        { label: 'Dashboard', path: '/login/dashboard', icon: Home },
        { label: 'Pay Mess Bill', path: '/login/dashboard/payment', icon: CreditCard },
        { label: 'My Profile', path: '/login/dashboard/profile', icon: User },
        { label: 'Settings', path: '/login/dashboard/settings', icon: Settings },
      ];

  return (
    <div className="md:hidden">
      {/* Mobile Top App Bar */}
      <div className="flex items-center justify-between px-4 h-13 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="p-1.5 rounded text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 focus:outline-none"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Logo to={isAuthority ? '/admin/dashboard' : '/login/dashboard'} size="sm" />
        </div>

        {user?.hostel && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-[11px] font-medium text-zinc-800 dark:text-zinc-200">
            <Building2 className="w-3 h-3 text-zinc-500" />
            <span>{user.hostel.toUpperCase()}</span>
          </div>
        )}

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={toggleTheme}
            className="p-1.5 rounded text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors focus:outline-none"
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <NotificationBell />
        </div>
      </div>

      {/* Drawer Backdrop */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Slide-over Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 shadow-2xl transform transition-transform duration-200 ease-in-out flex flex-col ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="p-4 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800">
          <Logo size="sm" />
          <button
            onClick={() => setDrawerOpen(false)}
            className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card */}
        <div className="p-4 bg-zinc-50 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800">
          <p className="text-xs font-semibold text-zinc-950 dark:text-zinc-50">
            {user?.name}
          </p>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
            {user?.email}
          </p>
          <div className="flex items-center gap-2 mt-2 text-[11px]">
            <span className="px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-medium">
              {roleDisplay}
            </span>
            <span className="text-zinc-500 dark:text-zinc-400">
              {user?.hostel ? user.hostel.toUpperCase() : ''}{!isAuthority && user?.room ? ` • #${user.room}` : ''}
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-2 space-y-1 flex-1 overflow-y-auto">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setDrawerOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-zinc-100 dark:bg-zinc-850 text-zinc-950 dark:text-zinc-50 font-semibold'
                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0 text-zinc-500" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Drawer Footer */}
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-md transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
