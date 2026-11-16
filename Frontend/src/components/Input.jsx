import React, { forwardRef, useState, useId } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export const Input = forwardRef(
  (
    {
      label,
      error,
      helperText,
      icon: Icon,
      type = 'text',
      id,
      name,
      placeholder,
      required = false,
      disabled = false,
      className = '',
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;
    const inputId = id || name || generatedId;

    return (
      <div className={`w-full ${className}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5"
          >
            {label}
            {required && <span className="text-zinc-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          {Icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-500">
              <Icon className="w-4 h-4" />
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            name={name}
            type={inputType}
            placeholder={placeholder}
            disabled={disabled}
            className={`w-full text-sm rounded-lg border bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 dark:placeholder-zinc-600 transition-colors duration-150 py-2 outline-none ${
              Icon ? 'pl-9' : 'pl-3'
            } ${isPassword ? 'pr-10' : 'pr-3'} ${
              error
                ? 'border-zinc-950 focus:ring-1 focus:ring-zinc-950 dark:border-zinc-200 dark:focus:ring-zinc-200'
                : 'border-zinc-300 dark:border-zinc-800 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 dark:focus:border-zinc-200 dark:focus:ring-zinc-200'
            } ${disabled ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-400 cursor-not-allowed' : ''}`}
            {...props}
          />

          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 focus:outline-none"
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}
        </div>

        {error && (
          <p className="mt-1 text-xs text-zinc-900 dark:text-zinc-200 font-medium">
            {error}
          </p>
        )}

        {!error && helperText && (
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
