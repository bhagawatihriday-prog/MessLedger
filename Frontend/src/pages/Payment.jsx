import React, { useState, useEffect } from 'react';
import { useAuth } from '../context';
import { billService } from '../services/billService';
import { PageContainer } from '../components/PageContainer';
import { PaymentSummary } from '../components/PaymentSummary';
import { PaymentButton } from '../components/PaymentButton';
import { SkeletonCard } from '../components/Loader';
import { ErrorMessage } from '../components/ErrorMessage';

export const Payment = () => {
  const { user } = useAuth();
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Partial / Full payment selection
  const [paymentType, setPaymentType] = useState('FULL'); // 'FULL' | 'PARTIAL'
  const [customAmount, setCustomAmount] = useState('');

  const loadBill = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await billService.getCurrentBill();
      setBill(data);
      if (data && !customAmount) {
        const total = parseFloat(data.totalPayable || 0);
        const currentDue = parseFloat(data.dueAmount || 0);
        // Default partial amount to current month due or half of total
        const suggested = (currentDue > 0 && currentDue < total)
          ? currentDue
          : Math.round(total / 2) || total;
        setCustomAmount(String(suggested));
      }
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

  // Compute effective payment amount
  const totalPayable = bill ? Math.max(0, parseFloat(bill.totalPayable || 0)) : 0;
  const parsedCustom = parseFloat(customAmount);
  const amountToPay = paymentType === 'FULL'
    ? totalPayable
    : (isNaN(parsedCustom) || parsedCustom <= 0 ? 0 : Math.min(totalPayable, parsedCustom));

  const handlePaymentTypeChange = (type) => {
    setPaymentType(type);
    if (type === 'PARTIAL' && (!customAmount || parseFloat(customAmount) <= 0)) {
      const currentDue = parseFloat(bill?.dueAmount || 0);
      const suggested = (currentDue > 0 && currentDue < totalPayable)
        ? currentDue
        : Math.round(totalPayable / 2) || totalPayable;
      setCustomAmount(String(suggested));
    }
  };

  return (
    <PageContainer>
      <div className="max-w-3xl mx-auto space-y-6">

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
            {/* Bill Summary & Payment Option Breakdown */}
            <PaymentSummary
              bill={bill}
              paymentType={paymentType}
              onPaymentTypeChange={handlePaymentTypeChange}
              customAmount={customAmount}
              onCustomAmountChange={setCustomAmount}
              amountToPay={amountToPay}
            />

            {/* Pay Button with Razorpay Gateway Integration */}
            <PaymentButton
              bill={bill}
              user={user}
              amountToPay={amountToPay}
              paymentType={paymentType}
            />
          </div>
        )}
      </div>
    </PageContainer>
  );
};
