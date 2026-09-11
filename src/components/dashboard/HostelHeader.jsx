import React from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, Calendar, Sparkles } from 'lucide-react';
import { Button } from '../common/Button';
import { formatCurrency } from '../../utils/formatCurrency';

export const HostelHeader = ({ user, bill }) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = user?.name ? user.name.split(' ')[0] : 'Student';
  const hasDue = bill && bill.totalPayable > 0;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-6 sm:p-8 shadow-sm">
      {/* Background subtle mesh decoration */}
      <div className="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
      <div className="absolute right-1/4 -bottom-12 w-48 h-48 rounded-full bg-indigo-400/10 blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/20">
              <Sparkles className="w-3 h-3" />
              {user?.hostel || 'LBBH'} • Room {user?.room || '204'}
            </span>
            <span className="text-xs text-indigo-200/80">
              Roll No: {user?.rollNo || '22CS084'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            {getGreeting()}, {firstName} 👋
          </h1>
          <p className="mt-1 text-sm text-indigo-100/80">
            Here's your mess account overview and billing cycle ledger.
          </p>
        </div>

        {/* Action Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {hasDue ? (
            <Link to="/login/dashboard/payment">
              <Button
                variant="primary"
                size="lg"
                icon={CreditCard}
                className="bg-white text-indigo-950 hover:bg-slate-100 border-none font-semibold shadow-md shadow-black/10"
              >
                Pay Outstanding {formatCurrency(bill.totalPayable)}
              </Button>
            </Link>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-sm font-medium">
              <span>✓ All dues cleared</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
