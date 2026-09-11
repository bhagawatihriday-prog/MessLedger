import React, { useEffect, useState } from 'react';
import {
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  RotateCcw,
  Clock,
  Sparkles,
  LayoutGrid,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { billService } from '../../services/billService';
import { transactionService } from '../../services/transactionService';
import { formatCurrency } from '../../utils/formatCurrency';
import { PageContainer } from '../../components/layout/PageContainer';
import { HostelHeader } from '../../components/dashboard/HostelHeader';
import { StatCard } from '../../components/common/StatCard';
import { BillSummary } from '../../components/dashboard/BillSummary';
import { PaymentStatus } from '../../components/dashboard/PaymentStatus';
import { SpendChart } from '../../components/dashboard/SpendChart';
import { TransactionHistory } from '../../components/dashboard/TransactionHistory';
import { SkeletonCard, SkeletonTable } from '../../components/common/Loader';
import { ErrorMessage } from '../../components/common/ErrorMessage';

export const Dashboard = () => {
  const { user } = useAuth();
  const { gridView } = useTheme();

  const [bill, setBill] = useState(null);
  const [history, setHistory] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [currentBill, billHistory, txnList] = await Promise.all([
        billService.getCurrentBill(),
        billService.getBillHistory(),
        transactionService.getTransactions(),
      ]);

      setBill(currentBill);
      setHistory(billHistory || []);
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
    <PageContainer>
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
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SkeletonCard className="h-64" />
              <SkeletonCard className="h-64" />
            </div>
            <SkeletonTable rows={4} />
          </div>
        )}

        {/* Loaded Content */}
        {!loading && bill && (
          <>
            {/* 4 Stat Metric Cards (Per Section 40) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* Total Base Bill */}
              <StatCard
                title="Current Bill"
                value={formatCurrency(bill.baseBill)}
                subtext={`Billing for ${bill.month}`}
                icon={Receipt}
                variant="primary"
              />

              {/* Paid Amount */}
              <StatCard
                title="Total Paid"
                value={formatCurrency(bill.paidAmount)}
                subtext={bill.paidAmount > 0 ? 'Verified credits' : 'No payments yet'}
                icon={CheckCircle2}
                variant="success"
              />

              {/* Outstanding Due */}
              <StatCard
                title="Outstanding Due"
                value={formatCurrency(bill.dueAmount)}
                subtext={bill.dueAmount === 0 ? '✓ All base dues clear' : 'Pending settlement'}
                icon={AlertTriangle}
                variant={bill.dueAmount > 0 ? 'warning' : 'default'}
              />

              {/* Late Fine */}
              <StatCard
                title="Late Fine"
                value={formatCurrency(bill.lateFine)}
                subtext={
                  bill.lateFine > 0
                    ? `${bill.fineDays || 5} days @ ₹20/day`
                    : '✓ Zero penalty assessed'
                }
                icon={Clock}
                variant={bill.lateFine > 0 ? 'danger' : 'default'}
              />
            </div>

            {/* Main Cards: Bill Summary + Payment Status */}
            <div
              className={`grid gap-6 ${
                gridView
                  ? 'grid-cols-1 lg:grid-cols-2'
                  : 'grid-cols-1'
              }`}
            >
              {/* Current Month Bill Card */}
              <BillSummary bill={bill} />

              {/* Payment Status Card */}
              <PaymentStatus bill={bill} />
            </div>

            {/* Expenditure Trend Chart */}
            <SpendChart history={history} />

            {/* Transaction Ledger Table */}
            <TransactionHistory transactions={transactions} />
          </>
        )}
      </div>
    </PageContainer>
  );
};
