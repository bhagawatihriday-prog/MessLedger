import React from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, Calendar, Check } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';
import { StatusBadge } from './StatusBadge';
import { Button } from './Button';

export const BillSummary = ({ bill }) => {
  if (!bill) return null;

  const isFullyPaid = bill.totalPayable === 0;

  return (
    <div className="card-base p-6 sm:p-7">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
        {/* Left Column: Month info, amount, and payment button */}
        <div className="flex flex-col justify-between h-full space-y-5">
          <div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                    {bill.month}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Cycle: {bill.billingCycle || 'Current Period'}
                  </p>
                </div>
              </div>

              <StatusBadge
                status={isFullyPaid ? 'PAID' : 'DUE'}
                amount={bill.totalPayable}
              />
            </div>

            {/* Current Month Bill Amount */}
            <div className="mt-5 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Current Month Bill
              </p>
              <div className="mt-1 flex items-baseline gap-3">
                <span className="text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
                  {formatCurrency(bill.baseBill)}
                </span>
                {bill.lateFine > 0 && (
                  <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                    +{formatCurrency(bill.lateFine)} fine
                  </span>
                )}
              </div>
              {bill.previousDue > 0 && (
                <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                  + {formatCurrency(bill.previousDue)} unpaid balance from {bill.previousDuesBreakdown?.length || 2} previous cycles
                </p>
              )}
            </div>
          </div>

          {/* Pay Action Section */}
          <div className="pt-2">
            {isFullyPaid ? (
              <div className="w-full py-2.5 px-3 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-medium flex items-center justify-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                <span>No outstanding payment for this cycle</span>
              </div>
            ) : (
              <Link to="/login/dashboard/payment" className="block w-full">
                <Button
                  variant="primary"
                  size="md"
                  fullWidth
                  icon={CreditCard}
                  iconPosition="left"
                >
                  Pay Now
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Right Column: Itemized Breakdown List */}
        <div className="space-y-2 bg-zinc-50 dark:bg-zinc-900/60 rounded-lg p-4 sm:p-5 border border-zinc-200 dark:border-zinc-800 text-xs">
          <div className="text-xs font-semibold text-zinc-950 dark:text-zinc-100 mb-3 pb-2 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <span>Bill Breakdown</span>
            {bill.unpaidMonthsCount > 1 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium">
                {bill.unpaidMonthsCount} Months Cumulative
              </span>
            )}
          </div>

          <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
            <span>Current Month ({bill.month})</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {formatCurrency(bill.baseBill)}
            </span>
          </div>

          {bill.paidAmount > 0 && (
            <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
              <span>Paid Amount</span>
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                -{formatCurrency(bill.paidAmount)}
              </span>
            </div>
          )}

          <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
            <span>Current Month Due</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {formatCurrency(bill.dueAmount)}
            </span>
          </div>

          {bill.previousDue > 0 && (
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-zinc-700 dark:text-zinc-300 font-medium">
                <span>Previous Unpaid Dues</span>
                <span className="font-semibold text-zinc-950 dark:text-zinc-50">
                  +{formatCurrency(bill.previousDue)}
                </span>
              </div>
              {bill.previousDuesBreakdown && bill.previousDuesBreakdown.length > 0 && (
                <div className="pl-2.5 border-l-2 border-zinc-200 dark:border-zinc-700 space-y-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                  {bill.previousDuesBreakdown.map((item) => (
                    <div key={item.month} className="flex justify-between items-center">
                      <span>• {item.month}</span>
                      <span className="font-mono">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {bill.lateFine > 0 && (
            <div className="flex justify-between text-zinc-900 dark:text-zinc-200 font-medium pt-1">
              <span>Late Fine ({bill.fineDays || 0} overdue days @ ₹20/day, max ₹600/mo)</span>
              <span>+{formatCurrency(bill.lateFine)}</span>
            </div>
          )}

          {Math.abs(bill.dietRebate || 0) > 0 && (
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium pt-1">
              <span>Diet Rebate Concession ({bill.dietRebateDays || 0} days)</span>
              <span>-{formatCurrency(Math.abs(bill.dietRebate))}</span>
            </div>
          )}

          <div className="pt-2.5 mt-2 border-t border-zinc-200 dark:border-zinc-800 flex justify-between text-xs font-semibold text-zinc-950 dark:text-zinc-50">
            <span>Total Payable</span>
            <span className="text-sm font-bold">
              {formatCurrency(bill.totalPayable)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
