import React from 'react';

export const StatCard = ({
  title,
  value,
  subtext,
  icon: Icon,
  variant = 'default', // 'default', 'success', 'warning', 'danger', 'primary'
  badge,
  onClick,
  className = '',
}) => {
  const variantStyles = {
    default: {
      iconBg: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
      border: 'border-slate-200 dark:border-slate-800',
    },
    primary: {
      iconBg: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400',
      border: 'border-slate-200 dark:border-slate-800',
    },
    success: {
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400',
      border: 'border-slate-200 dark:border-slate-800',
    },
    warning: {
      iconBg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400',
      border: 'border-slate-200 dark:border-slate-800',
    },
    danger: {
      iconBg: 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400',
      border: 'border-slate-200 dark:border-slate-800',
    },
  };

  const style = variantStyles[variant] || variantStyles.default;

  return (
    <div
      onClick={onClick}
      className={`card-base p-5 transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md' : ''
      } ${className}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {title}
        </p>
        {Icon && (
          <div className={`p-2.5 rounded-xl ${style.iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-2.5 flex items-baseline justify-between">
        <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {value}
        </h3>
        {badge && <div className="ml-2">{badge}</div>}
      </div>

      {subtext && (
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
          {subtext}
        </p>
      )}
    </div>
  );
};
