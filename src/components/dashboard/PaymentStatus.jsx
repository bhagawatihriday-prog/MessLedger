import React from 'react';
import { AlertTriangle, Clock, CheckCircle2, Utensils, Info } from 'lucide-react';
import { formatDate } from '../../utils/formatDate';
import { formatCurrency } from '../../utils/formatCurrency';

export const PaymentStatus = ({ bill }) => {
  if (!bill) return null;

  const isPaid = bill.totalPayable === 0;

  return (
    <div className="card-base p-6 sm:p-7 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Payment Status
          </h3>
          <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Big Alert Banner */}
        <div className="mt-4">
          {isPaid ? (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Mess Dues Cleared</span>
              </div>
              <p className="mt-1 text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
                Your hostel mess ledger for {bill.month} is in good standing. No overdue fees or penalties recorded.
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100">
              <div className="flex items-center gap-2 font-bold text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Payment Outstanding: {formatCurrency(bill.totalPayable)}</span>
              </div>
              <p className="mt-1 text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                Deadline: <strong>{formatDate(bill.paymentDeadline)}</strong>. Please settle your dues to avoid accumulating additional late charges.
              </p>
            </div>
          )}
        </div>

        {/* Business Fine Policy Note */}
        <div className="mt-4 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
          <div className="flex items-start gap-2.5">
            <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Late Fine Policy:
              </span>{' '}
              Unsettled bills past the last day of the calendar month accrue a penalty of <strong>₹20 per day</strong> until full clearance.
            </div>
          </div>
        </div>

        {/* Meal Consumption Overview */}
        {bill.mealCounts && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              <Utensils className="w-3.5 h-3.5 text-indigo-500" />
              <span>Attended Meals Breakdown</span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <div className="font-bold text-slate-800 dark:text-slate-200">
                  {bill.mealCounts.breakfast}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Breakfast</div>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <div className="font-bold text-slate-800 dark:text-slate-200">
                  {bill.mealCounts.lunch}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Lunch</div>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <div className="font-bold text-slate-800 dark:text-slate-200">
                  {bill.mealCounts.dinner}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Dinner</div>
              </div>
              <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 text-indigo-900 dark:text-indigo-200">
                <div className="font-bold">
                  {bill.mealCounts.specialFeasts}
                </div>
                <div className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-0.5">Feasts</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
