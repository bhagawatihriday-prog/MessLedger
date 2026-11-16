import React from 'react';
import { Loader2 } from 'lucide-react';

const variantClasses = {
  primary:
    'bg-zinc-950 hover:bg-zinc-800 text-white font-medium active:bg-black focus-visible:ring-1 focus-visible:ring-zinc-950 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200 dark:active:bg-zinc-300 dark:focus-visible:ring-zinc-200 shadow-xs',
  secondary:
    'bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-medium dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-100',
  outline:
    'border border-zinc-300 hover:bg-zinc-100/70 text-zinc-900 font-medium dark:border-zinc-700 dark:hover:bg-zinc-800 dark:text-zinc-100',
  danger:
    'bg-zinc-900 hover:bg-black text-white font-medium dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white',
  ghost:
    'bg-transparent hover:bg-zinc-100 text-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800',
  success:
    'bg-zinc-950 hover:bg-zinc-800 text-white font-medium dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200',
  'inverse-outline':
    'border border-zinc-700 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-100 font-medium shadow-xs focus-visible:ring-1 focus-visible:ring-zinc-400',
  'inverse-primary':
    'bg-white hover:bg-zinc-100 text-zinc-950 font-semibold shadow-xs focus-visible:ring-1 focus-visible:ring-white',
  white:
    'bg-white hover:bg-zinc-100 text-zinc-950 font-semibold shadow-xs focus-visible:ring-1 focus-visible:ring-white',
};

const sizeClasses = {
  sm: 'px-2.5 py-1.5 text-xs rounded-md gap-1.5',
  md: 'px-3.5 py-2 text-sm rounded-md gap-2',
  lg: 'px-4.5 py-2.5 text-sm font-medium rounded-md gap-2',
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
        className={`inline-flex items-center justify-center transition-colors duration-150 outline-none select-none ${
          variantClasses[variant] || variantClasses.primary
        } ${sizeClasses[size] || sizeClasses.md} ${
          fullWidth ? 'w-full' : ''
        } ${
          isDisabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer'
        } ${className}`}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
            <span>{children}</span>
          </>
        ) : (
          <>
            {Icon && iconPosition === 'left' && <Icon className="w-3.5 h-3.5 shrink-0" />}
            <span>{children}</span>
            {Icon && iconPosition === 'right' && <Icon className="w-3.5 h-3.5 shrink-0" />}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
