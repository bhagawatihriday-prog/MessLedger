import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  UtensilsCrossed,
  Building2,
  User,
  Settings,
  LogOut,
  ChevronDown,
  Shield,
  CreditCard,
  LayoutDashboard,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { NotificationBell } from '../dashboard/NotificationBell';
import { HOSTEL_FULL_NAMES } from '../../utils/constants';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'ML';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const hostelDisplayName = user?.hostel
    ? `${user.hostel} Hostel`
    : 'Hostel Mess';

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo and Brand */}
          <div className="flex items-center gap-3">
            <Link
              to="/login/dashboard"
              className="flex items-center gap-2.5 group focus:outline-none"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-sm shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  Mess<span className="text-indigo-600 dark:text-indigo-400">Ledger</span>
                </span>
                <span className="hidden sm:inline-block ml-2 text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                  {user?.role === 'ADMIN' ? 'Admin Portal' : 'Student Portal'}
                </span>
              </div>
            </Link>
          </div>

          {/* Center: Prominent Hostel Name Display */}
          <div className="flex items-center justify-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 text-slate-800 dark:text-slate-200 shadow-xs">
              <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span className="text-xs sm:text-sm font-semibold tracking-wide">
                {hostelDisplayName}
              </span>
              {user?.room && (
                <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">
                  • Room {user.room}
                </span>
              )}
            </div>
          </div>

          {/* Right: Notifications & Profile Dropdown */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Links on Tablet/Desktop */}
            <nav className="hidden md:flex items-center gap-1 mr-2">
              <Link
                to="/login/dashboard"
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  location.pathname === '/login/dashboard'
                    ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 dark:text-indigo-400'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100'
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/login/dashboard/payment"
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  location.pathname === '/login/dashboard/payment'
                    ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 dark:text-indigo-400'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100'
                }`}
              >
                Pay Dues
              </Link>
            </nav>

            {/* Notification Bell */}
            <NotificationBell />

            {/* Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                aria-expanded={profileDropdownOpen}
                aria-label="User menu"
              >
                {/* Avatar */}
                {user?.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt={user.name}
                    className="w-8 h-8 rounded-lg object-cover ring-2 ring-indigo-500/20"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-indigo-700 text-white font-semibold text-xs flex items-center justify-center shadow-xs">
                    {getInitials(user?.name)}
                  </div>
                )}

                <div className="hidden sm:block text-left">
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                    {user?.name || 'User'}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                    {user?.rollNo || user?.role}
                  </div>
                </div>

                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
              </button>

              {/* Profile Dropdown Menu */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                  {/* User info header */}
                  <div className="px-4 py-3.5 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {user?.name || 'Bhargav Jyoti'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {user?.email || 'student@gmail.com'}
                    </p>
                    <div className="mt-2 flex items-center gap-1.5">
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                        {user?.role || 'STUDENT'}
                      </span>
                      {user?.hostel && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {user.hostel} • Room {user.room || '204'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Links */}
                  <div className="py-1.5">
                    <Link
                      to="/login/dashboard/profile"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      <span>Edit Profile</span>
                    </Link>

                    <Link
                      to="/login/dashboard/settings"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Settings className="w-4 h-4 text-slate-400" />
                      <span>Settings</span>
                    </Link>

                    {user?.role === 'ADMIN' && (
                      <Link
                        to="/admin/dashboard"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Shield className="w-4 h-4" />
                        <span>Admin Overview</span>
                      </Link>
                    )}
                  </div>

                  {/* Logout */}
                  <div className="border-t border-slate-100 dark:border-slate-800 p-1.5">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
