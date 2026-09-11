import React from 'react';
import { Loader2 } from 'lucide-react';

export const Spinner = ({ size = 'md', className = '' }) => {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  return (
    <Loader2
      className={`animate-spin text-indigo-600 dark:text-indigo-400 ${sizeMap[size] || sizeMap.md} ${className}`}
    />
  );
};

export const PageLoader = ({ text = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
      <Spinner size="lg" />
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 animate-pulse">
        {text}
      </p>
    </div>
  );
};

export const SkeletonText = ({ lines = 3, className = '' }) => {
  return (
    <div className={`space-y-2.5 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`h-4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse ${
            i === lines - 1 ? 'w-3/5' : 'w-full'
          }`}
        />
      ))}
    </div>
  );
};

export const SkeletonCard = ({ className = '' }) => {
  return (
    <div
      className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 animate-pulse ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
        <div className="h-8 w-8 rounded-lg bg-slate-200 dark:bg-slate-800" />
      </div>
      <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
      <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
    </div>
  );
};

export const SkeletonTable = ({ rows = 5 }) => {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl"
        >
          <div className="flex items-center gap-3 w-1/3">
            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800" />
            <div className="space-y-1.5 w-full">
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-4/5" />
              <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
            </div>
          </div>
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/6" />
          <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-full w-20" />
        </div>
      ))}
    </div>
  );
};
