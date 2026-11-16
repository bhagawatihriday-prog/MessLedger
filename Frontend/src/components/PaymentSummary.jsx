import React from 'react';
import { Calendar, ShieldCheck, CheckCircle2, Circle, Sparkles, Info, Layers } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';

export const PaymentSummary = ({
  bill,
  paymentType = 'FULL',
  onPaymentTypeChange,
  customAmount = '',
  onCustomAmountChange,
  amountToPay,
}) => {
  if (!bill) return null;

  const totalPayable = Math.max(0, parseFloat(bill.totalPayable || 0));
  const effectivePay = amountToPay !== undefined ? amountToPay : totalPayable;
  const remainingBalance = Math.max(0, totalPayable - effectivePay);
  const currentMonthDue = parseFloat(bill.dueAmount || 0);
  const previousDue = parseFloat(bill.previousDue || 0);

  // Generate sensible preset chips
  const presetChips = [];
  if (currentMonthDue > 0 && currentMonthDue < totalPayable) {
    presetChips.push({
      label: `Current Month (${formatCurrency(currentMonthDue)})`,
      value: currentMonthDue,
    });
  }
  const halfAmount = Math.round(totalPayable / 2);
  if (halfAmount > 0 && halfAmount < totalPayable && halfAmount !== currentMonthDue) {
    presetChips.push({
      label: `50% Balance (${formatCurrency(halfAmount)})`,
      value: halfAmount,
    });
  }
  if (totalPayable >= 1000 && !presetChips.some((c) => c.value === 1000)) {
    presetChips.push({ label: '₹1,000', value: 1000 });
  }
  if (totalPayable >= 2000 && !presetChips.some((c) => c.value === 2000)) {
    presetChips.push({ label: '₹2,000', value: 2000 });
  }
  if (totalPayable >= 3000 && !presetChips.some((c) => c.value === 3000)) {
    presetChips.push({ label: '₹3,000', value: 3000 });
  }

  const parsedCustom = parseFloat(customAmount);
  const isCustomExceeded = !isNaN(parsedCustom) && parsedCustom > totalPayable;
  const isCustomZeroOrNegative = !isNaN(parsedCustom) && parsedCustom <= 0 && customAmount !== '';

  return (
    <div className="card-base p-6 sm:p-7 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-lg font-bold text-zinc-950 dark:text-zinc-50">
            Pay Mess Bill
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            {bill.month} • Billing Statement
          </p>
        </div>
        <div className="p-1.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
          <Calendar className="w-4 h-4" />
        </div>
      </div>

      {/* Itemized Breakdown List */}
      <div className="space-y-2.5 text-xs">
        <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400">
          <span>Base Bill</span>
          <span className="font-semibold text-zinc-950 dark:text-zinc-50">
            {formatCurrency(bill.baseBill)}
          </span>
        </div>

        {bill.paidAmount > 0 && (
          <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400">
            <span>Already Paid</span>
            <span className="font-semibold text-zinc-950 dark:text-zinc-50">
              -{formatCurrency(bill.paidAmount)}
            </span>
          </div>
        )}

        {bill.previousDue > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400">
              <span>Previous Unpaid Dues</span>
              <span className="font-semibold text-zinc-950 dark:text-zinc-50">
                {formatCurrency(bill.previousDue)}
              </span>
            </div>
            {bill.previousDuesBreakdown && bill.previousDuesBreakdown.length > 0 && (
              <div className="pl-2.5 border-l-2 border-zinc-200 dark:border-zinc-700 space-y-0.5 text-[11px] text-zinc-400">
                {bill.previousDuesBreakdown.map((item) => (
                  <div key={item.month} className="flex justify-between items-center">
                    <span>• {item.month}</span>
                    <span>{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {bill.lateFine > 0 && (
          <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400">
            <span>Late Fine ({bill.fineDays || 0} overdue days @ ₹20/day)</span>
            <span className="font-semibold text-zinc-950 dark:text-zinc-50">
              {formatCurrency(bill.lateFine)}
            </span>
          </div>
        )}

        {Math.abs(bill.dietRebate || 0) > 0 && (
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
            <span>Diet Rebate Concession ({bill.dietRebateDays || 0} days)</span>
            <span className="font-semibold">
              -{formatCurrency(Math.abs(bill.dietRebate))}
            </span>
          </div>
        )}

        <div className="pt-2 flex items-center justify-between text-zinc-500 dark:text-zinc-400">
          <span className="font-medium">Total Ledger Due</span>
          <span className="font-bold text-zinc-950 dark:text-zinc-50">
            {formatCurrency(totalPayable)}
          </span>
        </div>
      </div>

      {/* Payment Option Selector (Full vs Partial) */}
      <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
        <label className="block text-xs font-semibold text-zinc-900 dark:text-zinc-100">
          Payment Amount Option
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Option 1: Pay Full */}
          <button
            type="button"
            onClick={() => onPaymentTypeChange && onPaymentTypeChange('FULL')}
            className={`p-3.5 rounded-lg border text-left transition-all flex flex-col justify-between ${
              paymentType === 'FULL'
                ? 'border-zinc-950 dark:border-zinc-100 bg-zinc-50/80 dark:bg-zinc-900/70 shadow-xs'
                : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-transparent'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-zinc-950 dark:text-zinc-50">
                  Pay Full Balance
                </span>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Clear all active and overdue cycles
                </p>
              </div>
              {paymentType === 'FULL' ? (
                <CheckCircle2 className="w-4 h-4 text-zinc-950 dark:text-zinc-50 shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-zinc-300 dark:text-zinc-700 shrink-0" />
              )}
            </div>
            <div className="mt-3 text-sm font-extrabold text-zinc-950 dark:text-zinc-50">
              {formatCurrency(totalPayable)}
            </div>
          </button>

          {/* Option 2: Pay Partial */}
          <button
            type="button"
            onClick={() => onPaymentTypeChange && onPaymentTypeChange('PARTIAL')}
            className={`p-3.5 rounded-lg border text-left transition-all flex flex-col justify-between ${
              paymentType === 'PARTIAL'
                ? 'border-zinc-950 dark:border-zinc-100 bg-zinc-50/80 dark:bg-zinc-900/70 shadow-xs'
                : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-transparent'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-zinc-950 dark:text-zinc-50">
                    Pay Partial Due
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300/40 dark:border-emerald-700/50">
                    Flexible
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Pay any custom sum towards dues
                </p>
              </div>
              {paymentType === 'PARTIAL' ? (
                <CheckCircle2 className="w-4 h-4 text-zinc-950 dark:text-zinc-50 shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-zinc-300 dark:text-zinc-700 shrink-0" />
              )}
            </div>
            <div className="mt-3 text-sm font-extrabold text-zinc-950 dark:text-zinc-50">
              Custom Amount
            </div>
          </button>
        </div>

        {/* When Partial Payment is Active */}
        {paymentType === 'PARTIAL' && (
          <div className="mt-3 p-4 rounded-lg bg-zinc-50/90 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 space-y-3.5">
            <div>
              <label className="block text-[11px] font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Amount You Wish to Pay Now (₹)
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-zinc-500 dark:text-zinc-400 font-bold text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  min="1"
                  max={totalPayable}
                  step="1"
                  value={customAmount}
                  onChange={(e) => onCustomAmountChange && onCustomAmountChange(e.target.value)}
                  placeholder={`Min ₹1 - Max ${totalPayable}`}
                  className="w-full pl-8 pr-16 py-2 rounded-md bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-950 dark:text-zinc-50 text-sm font-semibold focus:outline-hidden focus:ring-1 focus:ring-zinc-950 dark:focus:ring-zinc-100"
                />
                <button
                  type="button"
                  onClick={() => onCustomAmountChange && onCustomAmountChange(String(totalPayable))}
                  className="absolute right-2 px-2 py-1 text-[11px] font-semibold rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  Max Due
                </button>
              </div>

              {/* Validation warnings */}
              {isCustomExceeded && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
                  ⚠️ Amount exceeds total balance of {formatCurrency(totalPayable)}. You will be charged {formatCurrency(totalPayable)}.
                </p>
              )}
              {isCustomZeroOrNegative && (
                <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">
                  ⚠️ Please enter an amount of at least ₹1.
                </p>
              )}
            </div>

            {/* Quick Preset Amount Chips */}
            {presetChips.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block font-medium">
                  Quick Select Preset:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {presetChips.map((chip) => {
                    const isSelected = parsedCustom === chip.value;
                    return (
                      <button
                        key={chip.label}
                        type="button"
                        onClick={() => onCustomAmountChange && onCustomAmountChange(String(chip.value))}
                        className={`text-[11px] px-2.5 py-1 rounded-md font-medium transition-all ${
                          isSelected
                            ? 'bg-zinc-950 text-white dark:bg-zinc-50 dark:text-zinc-950 shadow-xs'
                            : 'bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-600'
                        }`}
                      >
                        {chip.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Dynamic Live Balance Preview */}
            <div className="p-3 rounded-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-600 dark:text-zinc-400">Paying Now:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(effectivePay)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-600 dark:text-zinc-400">Remaining Due After Payment:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  {formatCurrency(remainingBalance)}
                </span>
              </div>
              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-start gap-1.5 text-[10px] text-zinc-500 dark:text-zinc-400">
                <Info className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                <span>
                  Payment is automatically applied to your oldest overdue month first. Unpaid balance carries forward to your subsequent mess statement.
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Final Amount Payable Display */}
      <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-sm font-bold text-zinc-950 dark:text-zinc-50">
              {paymentType === 'PARTIAL' ? 'Amount to Pay Now' : 'Total Payable'}
            </span>
            <p className="text-[11px] text-zinc-400">
              {paymentType === 'PARTIAL'
                ? `Partial settlement • ${formatCurrency(remainingBalance)} remaining`
                : 'Full clearance inclusive of all mess levies'}
            </p>
          </div>
          <span className="text-2xl sm:text-3xl font-extrabold text-zinc-950 dark:text-zinc-50 tracking-tight">
            {formatCurrency(effectivePay)}
          </span>
        </div>
      </div>

      {/* Due date notice */}
      <div className="p-2.5 rounded-md bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
        <span>Payment Due Date:</span>
        <span className="font-medium text-zinc-900 dark:text-zinc-100">
          {formatDate(bill.paymentDeadline)}
        </span>
      </div>

      {/* Security badge */}
      <div className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-400">
        <ShieldCheck className="w-3.5 h-3.5 text-zinc-500" />
        <span>Encrypted University Gateway Verification • Instant Ledger Credit</span>
      </div>
    </div>
  );
};

