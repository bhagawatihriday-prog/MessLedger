import React from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, Building2 } from 'lucide-react';
import { Button } from './Button';
import { formatCurrency } from '../utils/formatCurrency';

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
    <div className="card-base p-6 sm:p-7">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200">
              <Building2 className="w-3 h-3 text-zinc-500" />
              <span>
                {user?.hostel ? `${user.hostel.toUpperCase()} Hostel` : 'Hostel Mess'}
                {user?.role === 'WARDEN'
                  ? ' • Warden'
                  : (user?.role === 'ADMIN' || user?.role === 'SENIOR_WARDEN'
                    ? ' • Senior Warden'
                    : (user?.room ? ` • Room ${user?.room}` : ''))}
              </span>
            </span>
            {user?.role !== 'ADMIN' && user?.role !== 'SENIOR_WARDEN' && user?.role !== 'WARDEN' && user?.rollNo && (
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                Roll No: {user.rollNo}
              </span>
            )}
          </div>

          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
            {getGreeting()}, {firstName}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            Monthly mess ledger balance and billing cycle overview.
          </p>
        </div>

        {/* Action Button */}
        <div className="w-full sm:w-auto">
          {hasDue ? (
            <Link to="/login/dashboard/payment" className="block w-full sm:w-auto">
              <Button
                variant="primary"
                size="md"
                fullWidth
                icon={CreditCard}
                className="w-full sm:w-auto"
              >
                Pay Outstanding {formatCurrency(bill.totalPayable)}
              </Button>
            </Link>
          ) : (
            <div className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 text-xs font-medium">
              <span>All mess dues settled</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
