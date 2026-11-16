import React, { forwardRef, useId } from 'react';
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
    const generatedId = useId();
    const selectId = id || name || generatedId;

    return (
      <div className={`w-full ${className}`}>
        {label && (
          <label
            htmlFor={selectId}
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

          <select
            ref={ref}
            id={selectId}
            name={name}
            value={value}
            disabled={disabled}
            onChange={onChange}
            className={`w-full text-sm rounded-lg border bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 transition-colors duration-150 py-2 outline-none appearance-none cursor-pointer ${
              Icon ? 'pl-9' : 'pl-3'
            } pr-10 ${
              error
                ? 'border-zinc-950 focus:ring-1 focus:ring-zinc-950 dark:border-zinc-200 dark:focus:ring-zinc-200'
                : 'border-zinc-300 dark:border-zinc-800 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 dark:focus:border-zinc-200 dark:focus:ring-zinc-200'
            } ${disabled ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-400 cursor-not-allowed' : ''}`}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option, idx) => {
              if (option && option.group && Array.isArray(option.items)) {
                return (
                  <optgroup
                    key={option.group || idx}
                    label={option.group}
                    className="font-semibold text-zinc-500 dark:text-zinc-400 dark:bg-zinc-950"
                  >
                    {option.items.map((subOpt) => {
                      const optValue = typeof subOpt === 'object' ? subOpt.value : subOpt;
                      const optLabel = typeof subOpt === 'object' ? subOpt.label : subOpt;
                      return (
                        <option
                          key={optValue}
                          value={optValue}
                          className="font-normal text-zinc-900 dark:text-zinc-50 dark:bg-zinc-950"
                        >
                          {optLabel}
                        </option>
                      );
                    })}
                  </optgroup>
                );
              }

              const optValue = typeof option === 'object' ? option.value : option;
              const optLabel = typeof option === 'object' ? option.label : option;
              return (
                <option key={optValue} value={optValue} className="dark:bg-zinc-950">
                  {optLabel}
                </option>
              );
            })}
          </select>

          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-zinc-400">
            <ChevronDown className="w-4 h-4" />
          </div>
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

Select.displayName = 'Select';
