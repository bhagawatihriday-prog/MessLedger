import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  Check,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { notificationService } from '../services/notificationService';
import { formatRelativeTime } from '../utils/formatDate';
import { PageContainer } from '../components/PageContainer';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { SkeletonCard } from '../components/Loader';
import { useToast } from '../context';

export const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('ALL'); // 'ALL', 'UNREAD'
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data || []);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    const updated = await notificationService.markAsRead(id);
    setNotifications(updated);
  };

  const handleMarkAllRead = async () => {
    const updated = await notificationService.markAllAsRead();
    setNotifications(updated);
    toast.success('All notifications marked as read.');
  };

  const filtered = notifications.filter((n) => {
    if (filter === 'UNREAD') return !n.isRead;
    return true;
  });

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-zinc-900 dark:text-zinc-100 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-zinc-900 dark:text-zinc-100 shrink-0" />;
      case 'danger':
        return <AlertCircle className="w-5 h-5 text-zinc-900 dark:text-zinc-100 shrink-0" />;
      default:
        return <Info className="w-5 h-5 text-zinc-900 dark:text-zinc-100 shrink-0" />;
    }
  };

  return (
    <PageContainer>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-950 dark:text-zinc-50 tracking-tight">
              Notification Center
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Stay informed about mess billing cycles, payment confirmations, and notices
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
            <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs">
              <button
                type="button"
                onClick={() => setFilter('ALL')}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  filter === 'ALL'
                    ? 'bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setFilter('UNREAD')}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  filter === 'UNREAD'
                    ? 'bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100'
                }`}
              >
                Unread
              </button>
            </div>

            <Button
              variant="outline"
              size="sm"
              icon={Check}
              onClick={handleMarkAllRead}
            >
              Mark all read
            </Button>
          </div>
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="space-y-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No notifications"
            description="You're all caught up! No notifications matching this filter."
          />
        ) : (
          <div className="card-base divide-y divide-zinc-200 dark:divide-zinc-800 overflow-hidden">
            {filtered.map((item) => (
              <div
                key={item.id}
                className={`p-5 transition-colors flex items-start gap-4 ${
                  !item.isRead
                    ? 'bg-zinc-50 dark:bg-zinc-900/60'
                    : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/30'
                }`}
              >
                <div className="mt-0.5">{getIcon(item.type)}</div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4
                      className={`text-sm ${
                        !item.isRead
                          ? 'font-bold text-zinc-950 dark:text-zinc-100'
                          : 'font-semibold text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      {item.title}
                    </h4>
                    {!item.isRead && (
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-950 dark:bg-zinc-100 shrink-0" />
                    )}
                  </div>

                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed">
                    {item.message}
                  </p>

                  <div className="flex items-center gap-4 mt-3 text-[11px] text-zinc-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatRelativeTime(item.timestamp)}
                    </span>

                    {item.link && (
                      <Link
                        to={item.link}
                        className="font-medium text-zinc-950 dark:text-zinc-100 hover:underline underline-offset-4 flex items-center gap-1"
                      >
                        <span>Take action</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    )}

                    {!item.isRead && (
                      <button
                        type="button"
                        onClick={() => handleMarkAsRead(item.id)}
                        className="hover:text-zinc-900 dark:hover:text-zinc-100 text-zinc-500"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
};
