import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldX, Home, LogIn, ArrowLeft } from 'lucide-react';
import { PageContainer } from '../components/PageContainer';
import { Button } from '../components/Button';
import { useAuth } from '../context';

export const Unauthorized = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const requiredRole = location.state?.requiredRole || 'ADMIN';

  return (
    <PageContainer showBottomNav={false} className="flex items-center justify-center py-12 min-h-[75vh]">
      <div className="max-w-md w-full card-base p-7 sm:p-8 text-center space-y-6">
        <div className="w-14 h-14 rounded-xl bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 flex items-center justify-center mx-auto border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <ShieldX className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
            <span>HTTP 403 Forbidden</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-950 dark:text-zinc-50 tracking-tight">
            Access Restricted
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
            {user ? (
              <>
                This section requires <strong className="text-zinc-900 dark:text-zinc-100">{requiredRole}</strong> privileges. You are currently signed in as a <strong className="text-zinc-900 dark:text-zinc-100">{user.role || 'Student'}</strong>.
              </>
            ) : (
              <>
                You need to be signed in with an authorized <strong className="text-zinc-900 dark:text-zinc-100">{requiredRole}</strong> account to view this section.
              </>
            )}
          </p>
        </div>

        {user ? (
          <div className="p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400 text-left space-y-1">
            <div className="text-[10px] uppercase font-semibold text-zinc-400">Current Session</div>
            <div className="font-semibold text-zinc-950 dark:text-zinc-100 flex items-center justify-between">
              <span>{user.name}</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-mono">
                {user.role}
              </span>
            </div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">{user.email}</div>
          </div>
        ) : (
          <div className="p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400">
            No active session detected. Please sign in with university credentials.
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {user ? (
            <>
              <Link to="/login/dashboard" className="w-full sm:w-1/2">
                <Button variant="primary" size="md" fullWidth icon={Home}>
                  My Dashboard
                </Button>
              </Link>
              <Link to="/login" className="w-full sm:w-1/2" onClick={() => logout()}>
                <Button variant="outline" size="md" fullWidth icon={ArrowLeft}>
                  Switch Account
                </Button>
              </Link>
            </>
          ) : (
            <Link to="/login" className="w-full">
              <Button variant="primary" size="md" fullWidth icon={LogIn}>
                Sign In to MessLedger
              </Button>
            </Link>
          )}
        </div>
      </div>
    </PageContainer>
  );
};
