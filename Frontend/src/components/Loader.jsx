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
      className={`animate-spin text-zinc-900 dark:text-zinc-100 ${sizeMap[size] || sizeMap.md} ${className}`}
    />
  );
};

export const Loader = Spinner;

export const PageLoader = ({ text = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
      <Spinner size="lg" />
      <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
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
          className={`h-4 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse ${
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
      className={`bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-4 animate-pulse ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3" />
        <div className="h-8 w-8 rounded-md bg-zinc-200 dark:bg-zinc-800" />
      </div>
      <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2" />
      <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4" />
    </div>
  );
};

export const SkeletonTable = ({ rows = 5 }) => {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between p-4 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg"
        >
          <div className="flex items-center gap-3 w-1/3">
            <div className="w-9 h-9 rounded-md bg-zinc-200 dark:bg-zinc-800" />
            <div className="space-y-1.5 w-full">
              <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-4/5" />
              <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2" />
            </div>
          </div>
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/6" />
          <div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded-md w-20" />
        </div>
      ))}
    </div>
  );
};
