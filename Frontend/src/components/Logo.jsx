import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Modern FinTech Monogram "M" with Ledger Balance Bars
 * Sleek, geometric, high-contrast vector mark
 */
export const LogoIcon = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Left ledger pillar */}
    <rect x="3" y="4" width="3.25" height="16" rx="1.5" fill="currentColor" />
    
    {/* Right ledger pillar */}
    <rect x="17.75" y="4" width="3.25" height="16" rx="1.5" fill="currentColor" />
    
    {/* Central chevron forming the 'M' */}
    <path
      d="M6.25 6.5L12 13.5L17.75 6.5"
      stroke="currentColor"
      strokeWidth="2.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    
    {/* Financial balance baseline bar */}
    <rect x="9.5" y="17" width="5" height="2.5" rx="1.25" fill="currentColor" />
  </svg>
);

/**
 * Reusable MessLedger Brand Logo Component
 */
export const Logo = ({
  size = 'md', // 'sm' | 'md' | 'lg'
  showText = true,
  badge = null,
  to = null,
  className = '',
}) => {
  const sizeMap = {
    sm: {
      box: 'w-7 h-7 rounded-md',
      icon: 'w-3.5 h-3.5',
      text: 'text-sm',
      badge: 'text-[9px] px-1.5 py-0.2',
    },
    md: {
      box: 'w-8 h-8 rounded-md',
      icon: 'w-4 h-4',
      text: 'text-base',
      badge: 'text-[10px] px-1.5 py-0.5',
    },
    lg: {
      box: 'w-11 h-11 rounded-xl shadow-sm',
      icon: 'w-6 h-6',
      text: 'text-xl',
      badge: 'text-xs px-2 py-0.5',
    },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  const content = (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Icon Badge Box */}
      <div
        className={`${currentSize.box} bg-zinc-950 dark:bg-zinc-50 text-white dark:text-zinc-950 flex items-center justify-center font-bold shrink-0 transition-transform active:scale-95`}
      >
        <LogoIcon className={currentSize.icon} />
      </div>

      {/* Brand Text */}
      {showText && (
        <div className="flex items-center gap-2">
          <span
            className={`${currentSize.text} font-bold tracking-tight text-zinc-950 dark:text-zinc-50`}
          >
            MessLedger
          </span>
          {badge && (
            <span
              className={`${currentSize.badge} font-medium tracking-wide rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300`}
            >
              {badge}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="focus:outline-none inline-flex items-center">
        {content}
      </Link>
    );
  }

  return content;
};
