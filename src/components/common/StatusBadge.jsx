import React from 'react';
import { CheckCircle, AlertTriangle, AlertCircle, Clock } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';

export const StatusBadge = ({
  status,
  amount,
  size = 'md',
  showIcon = true,
  className = '',
}) => {
  const normStatus = (status || '').toUpperCase();

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs font-medium px-2.5 py-1 gap-1.5',
    lg: 'text-sm font-medium px-3.5 py-1.5 gap-2',
  };

  let config = {
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-200 dark:border-slate-700',
    icon: Clock,
    label: status,
  };

  if (normStatus === 'PAID' || normStatus === 'SUCCESS') {
    config = {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-200 dark:border-emerald-800/60',
      icon: CheckCircle,
      label: 'Paid',
    };
  } else if (normStatus === 'DUE') {
    config = {
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      text: 'text-amber-700 dark:text-amber-300',
      border: 'border-amber-200 dark:border-amber-800/60',
      icon: AlertTriangle,
      label: amount ? `${formatCurrency(amount)} Due` : 'Payment Due',
    };
  } else if (normStatus === 'OVERDUE' || normStatus === 'FAILED') {
    config = {
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      text: 'text-rose-700 dark:text-rose-300',
      border: 'border-rose-200 dark:border-rose-800/60',
      icon: AlertCircle,
      label: amount ? `${formatCurrency(amount)} Overdue` : 'Payment Overdue',
    };
  }

  const IconComponent = config.icon;

  return (
    <span
      className={`inline-flex items-center rounded-full border ${config.bg} ${config.text} ${config.border} ${
        sizeClasses[size] || sizeClasses.md
      } ${className}`}
    >
      {showIcon && <IconComponent className="w-3.5 h-3.5 shrink-0" />}
      <span>{config.label}</span>
    </span>
  );
};
