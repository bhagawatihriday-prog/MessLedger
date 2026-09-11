import React from 'react';
import { Smartphone, CreditCard, Landmark, Check } from 'lucide-react';
import { PAYMENT_METHODS } from '../../utils/constants';

export const PaymentMethods = ({
  selectedMethod,
  onMethodChange,
  upiId,
  onUpiIdChange,
  selectedBank,
  onBankChange,
}) => {
  const methods = [
    {
      id: PAYMENT_METHODS.UPI,
      title: 'UPI Payment',
      subtitle: 'Google Pay, PhonePe, Paytm, BHIM UPI',
      icon: Smartphone,
      badge: 'Fastest',
    },
    {
      id: PAYMENT_METHODS.CARD,
      title: 'Credit / Debit Card',
      subtitle: 'Visa, Mastercard, RuPay, Maestro',
      icon: CreditCard,
    },
    {
      id: PAYMENT_METHODS.NET_BANKING,
      title: 'Net Banking',
      subtitle: 'All major Indian banks supported',
      icon: Landmark,
    },
  ];

  const popularBanks = [
    'State Bank of India',
    'HDFC Bank',
    'ICICI Bank',
    'Axis Bank',
    'Punjab National Bank',
    'Canara Bank',
  ];

  return (
    <div className="card-base p-6 sm:p-7">
      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4">
        Select Payment Method
      </h3>

      {/* Method Selection Options */}
      <div className="space-y-3">
        {methods.map((method) => {
          const Icon = method.icon;
          const isSelected = selectedMethod === method.id;

          return (
            <div
              key={method.id}
              onClick={() => onMethodChange(method.id)}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/30 dark:border-indigo-500 shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-600 text-white'
                        : 'border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>

                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    <Icon className="w-4 h-4" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {method.title}
                      </span>
                      {method.badge && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          {method.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {method.subtitle}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dynamic Sub-Form based on Selected Method */}
      <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800">
        {selectedMethod === PAYMENT_METHODS.UPI && (
          <div className="space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Enter Virtual Payment Address (VPA / UPI ID)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={upiId}
                onChange={(e) => onUpiIdChange(e.target.value)}
                placeholder="e.g. yourname@okhdfcbank or 9876543210@paytm"
                className="form-input-base text-sm"
              />
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[11px] text-slate-400 self-center mr-1">Quick:</span>
              {['@okhdfcbank', '@okicici', '@paytm', '@ybl'].map((suffix) => (
                <button
                  key={suffix}
                  type="button"
                  onClick={() => {
                    const prefix = upiId.split('@')[0] || 'student';
                    onUpiIdChange(`${prefix}${suffix}`);
                  }}
                  className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                >
                  {suffix}
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedMethod === PAYMENT_METHODS.CARD && (
          <div className="space-y-3">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Razorpay Checkout will open securely to accept your card details with 3D Secure OTP verification.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 font-medium text-slate-700 dark:text-slate-300">
                Visa
              </div>
              <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 font-medium text-slate-700 dark:text-slate-300">
                Mastercard
              </div>
              <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 font-medium text-slate-700 dark:text-slate-300">
                RuPay
              </div>
              <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 font-medium text-slate-700 dark:text-slate-300">
                Maestro
              </div>
            </div>
          </div>
        )}

        {selectedMethod === PAYMENT_METHODS.NET_BANKING && (
          <div className="space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Select Your Bank
            </label>
            <select
              value={selectedBank}
              onChange={(e) => onBankChange(e.target.value)}
              className="form-input-base text-sm"
            >
              <option value="">Choose a bank...</option>
              {popularBanks.map((bank) => (
                <option key={bank} value={bank}>
                  {bank}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
};
