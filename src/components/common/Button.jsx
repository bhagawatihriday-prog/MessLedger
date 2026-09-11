import React from 'react';
import { Loader2 } from 'lucide-react';

const variantClasses = {
  primary:
    'bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm hover:shadow active:bg-indigo-800 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900',
  secondary:
    'bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100 focus-visible:ring-2 focus-visible:ring-slate-400',
  outline:
    'border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium dark:border-slate-700 dark:hover:bg-slate-800/60 dark:text-slate-200 focus-visible:ring-2 focus-visible:ring-slate-400',
  danger:
    'bg-rose-600 hover:bg-rose-700 text-white font-medium shadow-sm hover:shadow focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2',
  ghost:
    'bg-transparent hover:bg-slate-100 text-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-slate-400',
  success:
    'bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm hover:shadow focus-visible:ring-2 focus-visible:ring-emerald-500',
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
  md: 'px-4 py-2.2 text-sm rounded-lg gap-2',
  lg: 'px-5 py-2.8 text-base rounded-xl gap-2.5',
};

export const Button = React.forwardRef(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled = false,
      fullWidth = false,
      icon: Icon,
      iconPosition = 'left',
      type = 'button',
      className = '',
      onClick,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        onClick={onClick}
        className={`inline-flex items-center justify-center transition-all duration-150 outline-none select-none ${
          variantClasses[variant] || variantClasses.primary
        } ${sizeClasses[size] || sizeClasses.md} ${
          fullWidth ? 'w-full' : ''
        } ${
          isDisabled ? 'opacity-60 cursor-not-allowed pointer-events-none' : 'cursor-pointer'
        } ${className}`}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            <span>{children}</span>
          </>
        ) : (
          <>
            {Icon && iconPosition === 'left' && <Icon className="w-4 h-4 shrink-0" />}
            <span>{children}</span>
            {Icon && iconPosition === 'right' && <Icon className="w-4 h-4 shrink-0" />}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
