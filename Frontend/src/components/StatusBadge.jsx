import React from 'react';
import { Check, AlertCircle, Clock } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';

export const StatusBadge = ({
  status,
  amount,
  size = 'md',
  showIcon = true,
  className = '',
}) => {
  const normStatus = (status || '').toUpperCase();

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs font-medium px-2.5 py-0.5 gap-1.5',
    lg: 'text-xs font-medium px-3 py-1 gap-2',
  };

  let config = {
    bg: 'bg-zinc-100 dark:bg-zinc-900',
    text: 'text-zinc-800 dark:text-zinc-200',
    border: 'border-zinc-200 dark:border-zinc-800',
    icon: Clock,
    label: status,
  };

  if (normStatus === 'FULLY_PAID' || normStatus === 'PAID' || normStatus === 'SUCCESS') {
    config = {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      text: 'text-emerald-700 dark:text-emerald-300 font-semibold',
      border: 'border-emerald-200 dark:border-emerald-800/60',
      icon: Check,
      label: 'Fully Paid',
    };
  } else if (normStatus === 'PARTIALLY_PAID' || normStatus === 'PARTIAL') {
    config = {
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      text: 'text-amber-700 dark:text-amber-300 font-semibold',
      border: 'border-amber-200 dark:border-amber-800/60',
      icon: Clock,
      label: amount ? `Partially Paid (${formatCurrency(amount)} due)` : 'Partially Paid',
    };
  } else if (normStatus === 'UNPAID' || normStatus === 'DUE') {
    config = {
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      text: 'text-rose-700 dark:text-rose-300 font-semibold',
      border: 'border-rose-200 dark:border-rose-800/60',
      icon: AlertCircle,
      label: amount ? `Unpaid (${formatCurrency(amount)})` : 'Unpaid',
    };
  } else if (normStatus === 'FAILED') {
    config = {
      bg: 'bg-zinc-900 text-zinc-50 border-zinc-900 dark:bg-zinc-100 dark:text-zinc-950 dark:border-zinc-100',
      text: 'text-white dark:text-zinc-950',
      border: 'border-zinc-900 dark:border-zinc-100',
      icon: AlertCircle,
      label: 'Failed',
    };
  }

  const IconComponent = config.icon;

  return (
    <span
      className={`inline-flex items-center rounded-md border ${config.bg} ${config.text} ${config.border} ${
        sizeClasses[size] || sizeClasses.md
      } ${className}`}
    >
      {showIcon && <IconComponent className="w-3 h-3 shrink-0 stroke-[2.5]" />}
      <span>{config.label}</span>
    </span>
  );
};
