import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CreditCard, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { billService } from '../../services/billService';
import { PAYMENT_METHODS } from '../../utils/constants';
import { PageContainer } from '../../components/layout/PageContainer';
import { PaymentSummary } from '../../components/payment/PaymentSummary';
import { PaymentMethods } from '../../components/payment/PaymentMethods';
import { PaymentButton } from '../../components/payment/PaymentButton';
import { SkeletonCard } from '../../components/common/Loader';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Button } from '../../components/common/Button';

export const Payment = () => {
  const { user } = useAuth();
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Payment form state
  const [selectedMethod, setSelectedMethod] = useState(PAYMENT_METHODS.UPI);
  const [upiId, setUpiId] = useState('bhargav@okhdfcbank');
  const [selectedBank, setSelectedBank] = useState('State Bank of India');

  const loadBill = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await billService.getCurrentBill();
      setBill(data);
    } catch (err) {
      console.error('Failed to load bill for payment:', err);
      setError(err.message || 'Unable to fetch billing details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBill();
  }, []);

  return (
    <PageContainer>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Navigation Breadcrumb / Return */}
        <div className="flex items-center justify-between">
          <Link
            to="/login/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </Link>
          <span className="text-xs text-slate-400">
            Hostel: <strong className="text-slate-700 dark:text-slate-300">{user?.hostel}</strong>
          </span>
        </div>

        {/* Error State */}
        {error && (
          <ErrorMessage
            title="Failed to load checkout details"
            message={error}
            onRetry={loadBill}
          />
        )}

        {/* Loading State */}
        {loading && (
          <div className="space-y-6">
            <SkeletonCard className="h-64" />
            <SkeletonCard className="h-48" />
          </div>
        )}

        {/* Loaded Checkout View */}
        {!loading && bill && (
          <div className="space-y-6">
            {/* Bill Summary Breakdown */}
            <PaymentSummary bill={bill} />

            {/* Payment Method Selector */}
            <PaymentMethods
              selectedMethod={selectedMethod}
              onMethodChange={setSelectedMethod}
              upiId={upiId}
              onUpiIdChange={setUpiId}
              selectedBank={selectedBank}
              onBankChange={setSelectedBank}
            />

            {/* Pay Button with Razorpay Gateway Integration */}
            <PaymentButton
              bill={bill}
              selectedMethod={selectedMethod}
              upiId={upiId}
              selectedBank={selectedBank}
              user={user}
            />
          </div>
        )}
      </div>
    </PageContainer>
  );
};
