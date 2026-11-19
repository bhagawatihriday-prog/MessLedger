import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Check, Clock, AlertCircle } from 'lucide-react';
import { notificationService } from '../services/notificationService';
import { formatRelativeTime } from '../utils/formatDate';

export const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const items = await notificationService.getNotifications();
      setNotifications(items || []);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Auto-refresh every 30 seconds to keep unread badges live
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleNotificationClick = async (item) => {
    if (!item.isRead) {
      notificationService.markAsRead(item.id).catch(() => {});
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
      );
    }
    setIsOpen(false);
    if (item.link) {
      navigate(item.link);
    }
  };

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const toggleDropdown = () => {
    if (!isOpen) {
      fetchNotifications();
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={toggleDropdown}
        className="relative p-1.5 rounded-md text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800 transition-colors focus:outline-none"
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-zinc-950 dark:bg-zinc-100 text-[9px] font-bold text-white dark:text-zinc-950">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-88 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-semibold text-zinc-950 dark:text-zinc-50">
                Notifications
              </h4>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] font-medium bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 rounded border border-zinc-200 dark:border-zinc-700">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 flex items-center gap-1 font-medium"
              >
                <Check className="w-3 h-3" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-72 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {loading ? (
              <div className="py-6 text-center text-xs text-zinc-400">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="py-6 text-center text-xs text-zinc-400">
                No notifications right now.
              </div>
            ) : (
              notifications.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`p-3 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors cursor-pointer flex gap-2.5 items-start ${
                    !item.isRead ? 'bg-zinc-50/70 dark:bg-zinc-900/30' : ''
                  }`}
                >
                  <AlertCircle className="w-3.5 h-3.5 text-zinc-500 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs ${!item.isRead ? 'font-semibold text-zinc-950 dark:text-zinc-50' : 'text-zinc-700 dark:text-zinc-300'}`}>
                      {item.title}
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-2">
                      {item.message}
                    </p>
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-zinc-400">
                      <Clock className="w-3 h-3" />
                      <span>{formatRelativeTime(item.timestamp || item.createdAt)}</span>
                    </div>
                  </div>
                  {!item.isRead && (
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-950 dark:bg-zinc-100 shrink-0 mt-1.5" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer View All */}
          <div className="p-2 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-center">
            <Link
              to="/login/dashboard/notifications"
              onClick={() => setIsOpen(false)}
              className="text-xs font-medium text-zinc-900 dark:text-zinc-100 hover:underline block py-1"
            >
              View All Notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
