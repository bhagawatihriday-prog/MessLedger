import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

export const Select = forwardRef(
  (
    {
      label,
      error,
      helperText,
      id,
      name,
      placeholder = 'Select an option',
      options = [],
      required = false,
      disabled = false,
      icon: Icon,
      className = '',
      onChange,
      value,
      ...props
    },
    ref
  ) => {
    const selectId = id || name || `select_${Math.random().toString(36).substring(2, 8)}`;

    return (
      <div className={`w-full ${className}`}>
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
          >
            {label}
            {required && <span className="text-rose-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          {Icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              <Icon className="w-4 h-4" />
            </div>
          )}

          <select
            ref={ref}
            id={selectId}
            name={name}
            value={value}
            disabled={disabled}
            onChange={onChange}
            className={`w-full text-sm rounded-xl border bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-150 py-2.5 outline-none appearance-none cursor-pointer focus:ring-2 ${
              Icon ? 'pl-9' : 'pl-3.5'
            } pr-10 ${
              error
                ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200/50 dark:border-rose-800 dark:focus:ring-rose-900/30'
                : 'border-slate-300 dark:border-slate-700 focus:border-indigo-600 focus:ring-indigo-100 dark:focus:border-indigo-500 dark:focus:ring-indigo-950/40'
            } ${disabled ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed' : ''}`}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => {
              const optValue = typeof option === 'object' ? option.value : option;
              const optLabel = typeof option === 'object' ? option.label : option;
              return (
                <option key={optValue} value={optValue} className="dark:bg-slate-900">
                  {optLabel}
                </option>
              );
            })}
          </select>

          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>

        {error && (
          <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium">
            {error}
          </p>
        )}

        {!error && helperText && (
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{helperText}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
