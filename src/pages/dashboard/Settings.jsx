import React, { useState } from 'react';
import { Sun, Moon, Laptop, LayoutGrid, Bell, Shield, Sparkles } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { THEME_MODES } from '../../utils/constants';
import { PageContainer } from '../../components/layout/PageContainer';
import { Button } from '../../components/common/Button';

export const Settings = () => {
  const { theme, setTheme, gridView, setGridView } = useTheme();
  const { user, switchDemoRole } = useAuth();
  const { toast } = useToast();

  const [billAlerts, setBillAlerts] = useState(true);
  const [fineReminders, setFineReminders] = useState(true);
  const [feastNotices, setFeastNotices] = useState(false);

  const themeOptions = [
    {
      id: THEME_MODES.LIGHT,
      name: 'Light',
      icon: Sun,
      description: 'Clean high-contrast light mode with slate accents',
    },
    {
      id: THEME_MODES.DARK,
      name: 'Dark',
      icon: Moon,
      description: 'Deep slate dark mode engineered for low-light comfort',
    },
    {
      id: THEME_MODES.SYSTEM,
      name: 'System',
      icon: Laptop,
      description: 'Automatically synchronizes with your device preferences',
    },
  ];

  return (
    <PageContainer>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Settings & Preferences
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Customize appearance, dashboard presentation, and billing notifications
          </p>
        </div>

        {/* 1. Appearance / Theme */}
        <div className="card-base p-6 sm:p-7">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-4">
            Appearance
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {themeOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = theme === opt.id;

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setTheme(opt.id);
                    toast.info(`Theme changed to ${opt.name}`);
                  }}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 dark:border-indigo-500 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className={`p-2 rounded-lg ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600" />
                    )}
                  </div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {opt.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {opt.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Dashboard Layout: Grid View Toggle (Per Section 28) */}
        <div className="card-base p-6 sm:p-7">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <LayoutGrid className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Dashboard Multi-Column Grid View
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Organizes bill summary and payment status side-by-side on desktop
                </p>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={gridView}
              onClick={() => {
                setGridView(!gridView);
                toast.info(`Grid view ${!gridView ? 'enabled' : 'disabled'}`);
              }}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                gridView ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  gridView ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* 3. Notification Preferences */}
        <div className="card-base p-6 sm:p-7 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Bell className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Notification Preferences
            </h3>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            <div className="py-3 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  Monthly Bill Generation Alert
                </p>
                <p className="text-slate-400">
                  Receive in-app reminder as soon as the hostel superintendent publishes bills
                </p>
              </div>
              <input
                type="checkbox"
                checked={billAlerts}
                onChange={(e) => setBillAlerts(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
            </div>

            <div className="py-3 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  Late Fine Warning Alerts
                </p>
                <p className="text-slate-400">
                  Receive advance warning 48 hours prior to the ₹20/day penalty levy
                </p>
              </div>
              <input
                type="checkbox"
                checked={fineReminders}
                onChange={(e) => setFineReminders(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
            </div>

            <div className="py-3 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  Special Feast & Mess Committee Notices
                </p>
                <p className="text-slate-400">
                  Weekly menu updates and celebratory holiday feasts
                </p>
              </div>
              <input
                type="checkbox"
                checked={feastNotices}
                onChange={(e) => setFeastNotices(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* 4. Presentation / Role Switcher */}
        <div className="card-base p-6 sm:p-7">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-indigo-500" />
                Active Account Role: <span className="font-bold">{user?.role}</span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Switch between Student and Admin viewpoints for project demonstration
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const nextRole = user?.role === 'STUDENT' ? 'ADMIN' : 'STUDENT';
                switchDemoRole(nextRole);
                toast.success(`Switched role to ${nextRole}`);
              }}
            >
              Switch to {user?.role === 'STUDENT' ? 'Admin' : 'Student'}
            </Button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};
