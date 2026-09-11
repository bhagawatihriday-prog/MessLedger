import React from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, Calendar, AlertTriangle, CheckCircle, Info, ArrowRight } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';
import { StatusBadge } from '../common/StatusBadge';
import { Button } from '../common/Button';

export const BillSummary = ({ bill }) => {
  if (!bill) return null;

  const isFullyPaid = bill.totalPayable === 0;
  const isOverdue = bill.status === 'OVERDUE' || (bill.lateFine > 0 && bill.dueAmount > 0);

  return (
    <div className="card-base p-6 sm:p-7 flex flex-col justify-between relative overflow-hidden">
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Calendar className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {bill.month}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Billing cycle: {bill.billingCycle || 'Current Period'}
              </p>
            </div>
          </div>

          <StatusBadge
            status={isFullyPaid ? 'PAID' : isOverdue ? 'OVERDUE' : 'DUE'}
            amount={bill.totalPayable}
          />
        </div>

        {/* Current Month Bill Amount Highlight */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Current Month Bill
          </p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              {formatCurrency(bill.baseBill)}
            </span>
            {bill.lateFine > 0 && (
              <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2.5 py-1 rounded-full border border-rose-200 dark:border-rose-900">
                + {formatCurrency(bill.lateFine)} Late Fine
              </span>
            )}
          </div>
        </div>

        {/* Breakdown Table/List */}
        <div className="mt-5 space-y-2.5 bg-slate-50/80 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>Base Bill</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {formatCurrency(bill.baseBill)}
            </span>
          </div>

          <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
            <span>Paid Amount</span>
            <span className="font-semibold">
              -{formatCurrency(bill.paidAmount)}
            </span>
          </div>

          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>Remaining Due</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {formatCurrency(bill.dueAmount)}
            </span>
          </div>

          {bill.lateFine > 0 && (
            <div className="flex justify-between text-rose-600 dark:text-rose-400">
              <span>Late Fine ({bill.fineDays || 5} days @ ₹20/day)</span>
              <span className="font-semibold">
                +{formatCurrency(bill.lateFine)}
              </span>
            </div>
          )}

          {bill.previousDue > 0 && (
            <div className="flex justify-between text-amber-600 dark:text-amber-400">
              <span>Previous Due</span>
              <span className="font-semibold">
                +{formatCurrency(bill.previousDue)}
              </span>
            </div>
          )}

          <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between text-sm font-bold text-slate-900 dark:text-slate-100">
            <span>Total Payable</span>
            <span className={bill.totalPayable > 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-emerald-600'}>
              {formatCurrency(bill.totalPayable)}
            </span>
          </div>
        </div>
      </div>

      {/* Pay Action Section */}
      <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
        {isFullyPaid ? (
          <div className="w-full py-2.5 px-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>✓ No outstanding payment for this month</span>
          </div>
        ) : (
          <Link to="/login/dashboard/payment" className="block w-full">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              icon={CreditCard}
              iconPosition="left"
              className="font-semibold shadow-sm"
            >
              Pay Now {formatCurrency(bill.totalPayable)}
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
};
