import React from 'react';
import { Calendar, AlertCircle, ShieldCheck } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';

export const PaymentSummary = ({ bill }) => {
  if (!bill) return null;

  return (
    <div className="card-base p-6 sm:p-7">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Pay Mess Bill
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {bill.month} • Billing Cycle
          </p>
        </div>
        <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
          <Calendar className="w-5 h-5" />
        </div>
      </div>

      {/* Breakdown Items */}
      <div className="mt-5 space-y-3 text-sm">
        <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
          <span>Base Bill</span>
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {formatCurrency(bill.baseBill)}
          </span>
        </div>

        {bill.paidAmount > 0 && (
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
            <span>Already Paid</span>
            <span className="font-semibold">
              -{formatCurrency(bill.paidAmount)}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
          <span>Previous Due</span>
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {formatCurrency(bill.previousDue || 0)}
          </span>
        </div>

        <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
          <span>Late Fine ({bill.fineDays || 0} days @ ₹20/day)</span>
          <span
            className={`font-semibold ${
              bill.lateFine > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-slate-100'
            }`}
          >
            {formatCurrency(bill.lateFine || 0)}
          </span>
        </div>

        {/* Divider */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-base font-bold text-slate-900 dark:text-slate-100">
                Total Payable
              </span>
              <p className="text-[11px] text-slate-400">Inclusive of all mess levies</p>
            </div>
            <span className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 tracking-tight">
              {formatCurrency(bill.totalPayable)}
            </span>
          </div>
        </div>
      </div>

      {/* Due date notice */}
      <div className="mt-5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>Payment Due Date:</span>
        <span className="font-semibold text-slate-700 dark:text-slate-300">
          {formatDate(bill.paymentDeadline)}
        </span>
      </div>

      {/* Security badge */}
      <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
        <ShieldCheck className="w-4 h-4 text-emerald-500" />
        <span>256-Bit Encrypted University Payment Gateway</span>
      </div>
    </div>
  );
};
