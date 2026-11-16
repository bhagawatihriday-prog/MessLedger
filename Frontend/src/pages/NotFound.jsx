import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '../components/Button';
import { LogoIcon } from '../components/Logo';

export const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-white dark:bg-zinc-950 transition-colors">
      <div className="max-w-md w-full card-base p-8 text-center space-y-5">
        <div className="w-12 h-12 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 flex items-center justify-center mx-auto border border-zinc-200 dark:border-zinc-800">
          <LogoIcon className="w-6 h-6" />
        </div>

        <div>
          <span className="text-4xl font-extrabold text-zinc-950 dark:text-zinc-50 tracking-tight">
            404
          </span>
          <h2 className="text-xl font-bold text-zinc-950 dark:text-zinc-50 mt-2">
            Page Not Found
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
            The page you are looking for does not exist or has been moved.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
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
