import React from 'react';
import { Link } from 'react-router-dom';
import { UtensilsCrossed, Home, ArrowLeft } from 'lucide-react';
import { Button } from '../components/common/Button';

export const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900 transition-colors">
      <div className="max-w-md w-full card-base p-8 text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto border border-indigo-200 dark:border-indigo-900">
          <UtensilsCrossed className="w-8 h-8" />
        </div>

        <div>
          <span className="text-4xl font-extrabold text-indigo-600 dark:text-indigo-400">
            404
          </span>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-2">
            Page Not Found
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            The page you are looking for does not exist or has been moved.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/login/dashboard" className="w-full sm:w-auto">
            <Button variant="primary" size="md" fullWidth icon={Home}>
              Go to Dashboard
            </Button>
          </Link>
          <Link to="/login" className="w-full sm:w-auto">
            <Button variant="outline" size="md" fullWidth icon={ArrowLeft}>
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
