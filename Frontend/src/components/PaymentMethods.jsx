import React from 'react';
import { QrCode, Smartphone, CreditCard, Landmark, ShieldCheck } from 'lucide-react';

export const PaymentMethods = () => {
  const channels = [
    {
      icon: QrCode,
      title: 'Instant UPI & QR Code',
      description: 'Google Pay, PhonePe, Paytm, BHIM, Cred. Scan dynamic QR or tap to open UPI app.',
      badge: 'Fastest',
    },
    {
      icon: CreditCard,
      title: 'Debit & Credit Cards',
      description: 'Visa, MasterCard, RuPay, Maestro with 3D Secure OTP verification.',
    },
    {
      icon: Landmark,
      title: 'Net Banking',
      description: 'SBI, HDFC, ICICI, Axis, PNB, Canara, and 50+ partner Indian banks.',
    },
  ];

  return (
    <div className="card-base p-6 sm:p-7 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
            Accepted Payment Channels
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            All modes processed securely via Razorpay Checkout
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>PCI-DSS Certified</span>
        </div>
      </div>

      {/* Payment Options Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {channels.map((channel) => {
          const Icon = channel.icon;
          return (
            <div
              key={channel.title}
              className="p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100">
                    <Icon className="w-4 h-4" />
                  </div>
                  {channel.badge && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300/40 dark:border-emerald-700/50">
                      {channel.badge}
                    </span>
                  )}
                </div>
                <h4 className="text-xs font-semibold text-zinc-950 dark:text-zinc-50">
                  {channel.title}
                </h4>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                  {channel.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Helpful Hint */}
      <div className="p-3 rounded-md bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
        <Smartphone className="w-4 h-4 text-zinc-600 dark:text-zinc-300 shrink-0" />
        <span>
          <strong>No manual typing required:</strong> Click <strong>Pay Now</strong> below to launch the gateway and choose your preferred UPI app, scan the dynamic QR code, or enter your card details.
        </span>
      </div>
    </div>
  );
};

export default PaymentMethods;
