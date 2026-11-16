import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Building2,
  User,
  Settings,
  LogOut,
  ChevronDown,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth, useTheme } from '../context';
import { NotificationBell } from './NotificationBell';
import { Logo } from './Logo';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
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

  const isAuthority = user?.role === 'ADMIN' || user?.role === 'SENIOR_WARDEN' || user?.role === 'WARDEN';
  const authorityBadge = user?.role === 'WARDEN' ? 'Warden' : (isAuthority ? 'Senior Warden' : 'Student');
  const roleDisplay = user?.role === 'WARDEN' ? 'WARDEN' : (isAuthority ? 'SENIOR WARDEN' : 'STUDENT');

  const hostelDisplayName = user?.hostel
    ? `${user.hostel.toUpperCase()} Hostel`
    : 'Hostel Mess';

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Left: Logo and Brand */}
          <div className="flex items-center gap-3">
            <Logo
              to={isAuthority ? '/admin/dashboard' : '/login/dashboard'}
              badge={authorityBadge}
            />
          </div>

          {/* Center: Prominent Hostel Name Display */}
          <div className="flex items-center justify-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100">
              <Building2 className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              <span className="text-xs font-medium tracking-tight">
                {hostelDisplayName}
              </span>
              {!isAuthority && user?.room && (
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  • Room {user.room}
                </span>
              )}
            </div>
          </div>

          {/* Right: Navigation, Notifications & Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            <nav className="hidden md:flex items-center gap-1 mr-1">
              {isAuthority ? (
                <>
                  <Link
                    to="/admin/dashboard"
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      location.pathname === '/admin/dashboard'
                        ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-zinc-50 font-semibold'
                        : 'text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100'
                    }`}
                  >
                    Console
                  </Link>
                  <Link
                    to="/admin/boarders"
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      location.pathname === '/admin/boarders'
                        ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-zinc-50 font-semibold'
                        : 'text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100'
                    }`}
                  >
                    Boarders
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/login/dashboard"
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      location.pathname === '/login/dashboard'
                        ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-zinc-50 font-semibold'
                        : 'text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100'
                    }`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/login/dashboard/payment"
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      location.pathname === '/login/dashboard/payment'
                        ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-zinc-50 font-semibold'
                        : 'text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100'
                    }`}
                  >
                    Pay Dues
                  </Link>
                </>
              )}
            </nav>

            {/* Notification Bell */}
            <NotificationBell />

            {/* Quick Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-1.5 rounded-md text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-900 transition-colors focus:outline-none"
              aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
              title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors focus:outline-none"
                aria-expanded={profileDropdownOpen}
                aria-label="User menu"
              >
                {user?.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt={user.name}
                    className="w-7 h-7 rounded-md object-cover border border-zinc-300 dark:border-zinc-700"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-md bg-zinc-950 text-white dark:bg-zinc-50 dark:text-zinc-950 font-semibold text-[11px] flex items-center justify-center">
                    {getInitials(user?.name)}
                  </div>
                )}

                <div className="hidden sm:block text-left">
                  <div className="text-xs font-medium text-zinc-900 dark:text-zinc-100 leading-tight">
                    {user?.name || 'User'}
                  </div>
                </div>

                <ChevronDown className="w-3 h-3 text-zinc-400 hidden sm:block" />
              </button>

              {/* Profile Dropdown Menu */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-60 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-lg z-50 overflow-hidden">
                  <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800">
                    <p className="text-xs font-semibold text-zinc-950 dark:text-zinc-50 truncate">
                      {user?.name || 'Bhargav Jyoti'}
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                      {user?.email || 'student@gmail.com'}
                    </p>
                    <div className="mt-2 flex items-center gap-1.5 text-[10px]">
                      <span className="font-medium px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                        {roleDisplay}
                      </span>
                      {user?.hostel && (
                        <span className="text-zinc-500 dark:text-zinc-400">
                          {user.hostel.toUpperCase()}
                          {!isAuthority && user?.room
                            ? ` • Room ${user.room}`
                            : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-1">
                    <Link
                      to="/login/dashboard/profile"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-md transition-colors"
                    >
                      <User className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{isAuthority ? 'Official Profile' : 'Edit Profile'}</span>
                    </Link>
                    <Link
                      to="/login/dashboard/settings"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-md transition-colors"
                    >
                      <Settings className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Settings</span>
                    </Link>
                  </div>

                  <div className="border-t border-zinc-200 dark:border-zinc-800 p-1">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-md transition-colors text-left"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
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
