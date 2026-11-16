import React, { useEffect, useState } from 'react';
import {
  Receipt,
  Clock,
} from 'lucide-react';
import { useAuth } from '../context';
import { billService } from '../services/billService';
import { transactionService } from '../services/transactionService';
import { formatCurrency } from '../utils/formatCurrency';
import { PageContainer } from '../components/PageContainer';
import { HostelHeader } from '../components/HostelHeader';
import { StatCard } from '../components/StatCard';
import { BillSummary } from '../components/BillSummary';
import { TransactionHistory } from '../components/TransactionHistory';
import { SkeletonCard, SkeletonTable } from '../components/Loader';
import { ErrorMessage } from '../components/ErrorMessage';

export const Dashboard = () => {
  const { user } = useAuth();

  const [bill, setBill] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [currentBill, txnList] = await Promise.all([
        billService.getCurrentBill(),
        transactionService.getTransactions(),
      ]);

      setBill(currentBill);
      setTransactions(txnList || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError(err.message || 'Unable to retrieve your mess ledger records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  return (
    <PageContainer showContactFooter={true}>
      <div className="space-y-6 sm:space-y-8">
        {/* Top Banner Greeting */}
        <HostelHeader user={user} bill={bill} />

        {/* Error State Banner if API failed */}
        {error && (
          <ErrorMessage
            title="Unable to load complete ledger"
            message={error}
            onRetry={loadDashboardData}
          />
        )}

        {/* Loading State: Skeletons */}
        {loading && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SkeletonCard />
              <SkeletonCard />
            </div>
            <SkeletonCard className="h-64" />
            <SkeletonTable rows={4} />
          </div>
        )}

        {/* Loaded Content */}
        {!loading && bill && (
          <>
            {/* Stat Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Total Base Bill */}
              <StatCard
                title="Current Bill"
                value={formatCurrency(bill.baseBill)}
                subtext={
                  bill.previousDue > 0
                    ? `+ ${formatCurrency(bill.previousDue)} prior dues (${bill.unpaidMonthsCount || 3} mos unpaid)`
                    : `Billing for ${bill.month}`
                }
                icon={Receipt}
                variant="primary"
              />

              {/* Late Fine */}
              <StatCard
                title="Late Fine"
                value={formatCurrency(bill.lateFine)}
                subtext={
                  bill.lateFine > 0
                    ? `${bill.fineDays || 0} overdue days @ ₹20/day (max ₹600/mo)`
                    : '✓ Zero penalty assessed'
                }
                icon={Clock}
                variant={bill.lateFine > 0 ? 'danger' : 'default'}
              />
            </div>

            {/* Current Month Bill Card */}
            <BillSummary bill={bill} />

            {/* Transaction Ledger Table */}
            <TransactionHistory transactions={transactions} />
          </>
        )}

        {/* Empty State: No Bill Published Yet */}
        {!loading && !bill && (
          <div className="space-y-6">
            <div className="card-base p-8 sm:p-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center mx-auto text-zinc-500 shadow-xs">
                <Receipt className="w-6 h-6 text-zinc-400" />
              </div>
              <h3 className="text-base font-bold text-zinc-950 dark:text-zinc-50">
                No Active Mess Bill Published
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
                Your hostel warden or senior warden has not published a billing cycle for this period yet. You will be automatically notified here as soon as your monthly mess bill is generated.
              </p>
            </div>

            {transactions && transactions.length > 0 && (
              <TransactionHistory transactions={transactions} />
            )}
          </div>
        )}
      </div>
    </PageContainer>
  );
};
