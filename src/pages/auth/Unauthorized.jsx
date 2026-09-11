import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldX, ArrowLeft, Home } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';

export const Unauthorized = () => {
  const { user } = useAuth();
  const location = useLocation();
  const requiredRole = location.state?.requiredRole || 'ADMIN';

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900 transition-colors">
      <div className="max-w-md w-full card-base p-8 text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto border border-rose-200 dark:border-rose-900">
          <ShieldX className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Access Restricted
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            You do not have permission to view this section. This page requires{' '}
            <strong className="text-slate-700 dark:text-slate-300 font-semibold">
              {requiredRole}
            </strong>{' '}
            privileges, but you are currently signed in as a{' '}
            <strong className="text-indigo-600 dark:text-indigo-400 font-semibold">
              {user?.role || 'Guest'}
            </strong>.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
          Signed in as: <span className="font-semibold text-slate-900 dark:text-slate-100">{user?.name}</span> ({user?.email})
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link to="/login/dashboard" className="w-full sm:w-auto">
            <Button variant="primary" size="md" fullWidth icon={Home}>
              Return to Student Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
