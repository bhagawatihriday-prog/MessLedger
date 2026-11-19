import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock,
  Loader2,
  Check,
  X,
  AlertCircle,
  ArrowLeft,
  Download,
  RotateCcw,
} from 'lucide-react';
import { Button } from './Button';
import { Modal } from './Modal';
import { PaymentReceiptModal } from './PaymentReceiptModal';
import { paymentService } from '../services/paymentService';
import { formatCurrency } from '../utils/formatCurrency';
import { useToast } from '../context';
import { loadRazorpayScript } from '../utils/loadRazorpay';

export const PaymentButton = ({
  bill,
  user,
  amountToPay,
  paymentType = 'FULL',
}) => {
  const [state, setState] = useState('IDLE'); // 'IDLE', 'LOADING', 'SUCCESS', 'FAILED', 'CANCELLED'
  const [resultData, setResultData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSimulatedModal, setShowSimulatedModal] = useState(false);
  const [simulatingOrder, setSimulatingOrder] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();

  const effectiveAmount = amountToPay !== undefined ? amountToPay : (bill?.totalPayable || 0);

  const handleInitiatePayment = async () => {
    if (!bill || bill.totalPayable <= 0) {
      toast.warning('No outstanding balance to pay.');
      return;
    }

    if (effectiveAmount <= 0) {
      toast.error('Please enter a valid payment amount greater than ₹0.');
      return;
    }

    if (effectiveAmount > bill.totalPayable) {
      toast.error(`Payment amount cannot exceed total payable balance of ${formatCurrency(bill.totalPayable)}.`);
      return;
    }

    setState('LOADING');
    setErrorMessage('');

    try {
      const order = await paymentService.createOrder({
        billId: bill.id,
        amount: effectiveAmount,
        notes: {
          studentName: user?.name,
          rollNo: user?.rollNo,
          hostel: user?.hostel,
          room: user?.room,
          month: bill.month,
          method: 'ONLINE',
          paymentType,
        },
      });

      // Ensure Razorpay SDK script is loaded in DOM
      await loadRazorpayScript();
      const hasRazorpay = typeof window !== 'undefined' && window.Razorpay;
      const isPlaceholderKey =
        !order.keyId ||
        order.keyId.includes('placeholder') ||
        order.keyId.includes('messledger');

      if (hasRazorpay && !isPlaceholderKey) {
        const options = {
          key: order.keyId,
          amount: order.amount,
          currency: order.currency,
          name: 'MessLedger System',
          description: paymentType === 'PARTIAL'
            ? `Partial Mess Bill Payment for ${bill.month}`
            : `Mess Bill for ${bill.month}`,
          order_id: order.orderId,
          prefill: {
            name: user?.name || '',
            email: user?.email || '',
            contact: user?.phone || '',
          },
          notes: {
            hostel: user?.hostel,
            room: user?.room,
            paymentType,
          },
          theme: {
            color: '#09090b',
          },
          handler: async (response) => {
            await verifyPaymentWithBackend(response, order);
          },
          modal: {
            ondismiss: async () => {
              setState('CANCELLED');
              toast.warning('Payment was cancelled.');
              if (order?.orderId) {
                await paymentService.cancelPayment({
                  orderId: order.orderId,
                  reason: 'User cancelled or dismissed payment without completing',
                }).catch(() => {});
              }
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', async (response) => {
          setState('FAILED');
          const reason = response.error?.description || 'Your payment was declined by the bank.';
          setErrorMessage(reason);
          if (order?.orderId) {
            await paymentService.cancelPayment({
              orderId: order.orderId,
              reason,
            }).catch(() => {});
          }
        });
        rzp.open();
      } else {
        setSimulatingOrder(order);
        setShowSimulatedModal(true);
      }
    } catch (err) {
      console.error('Payment initiation error:', err);
      setState('FAILED');
      setErrorMessage(
        err.message || 'Unable to connect to the payment service. Please try again.'
      );
    }
  };

  const verifyPaymentWithBackend = async (rzpResponse, order) => {
    try {
      setState('LOADING');
      const verification = await paymentService.verifyPayment({
        razorpay_order_id: rzpResponse.razorpay_order_id || order.orderId,
        razorpay_payment_id:
          rzpResponse.razorpay_payment_id ||
          `pay_sim_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        razorpay_signature: rzpResponse.razorpay_signature || 'mock_signature_valid',
        billId: bill.id,
        amount: effectiveAmount,
        method: rzpResponse.method || 'ONLINE',
      });

      setResultData(verification);
      setState('SUCCESS');
      toast.success(
        paymentType === 'PARTIAL'
          ? `Partial payment of ${formatCurrency(effectiveAmount)} recorded and credited!`
          : 'Full payment completed and credited to ledger!'
      );
    } catch (verifyErr) {
      console.error('Payment verification failed:', verifyErr);
      setState('FAILED');
      setErrorMessage(
        verifyErr.message || 'Payment signature verification failed on backend.'
      );
    }
  };

  const handleSimulatedSuccess = async () => {
    setShowSimulatedModal(false);
    if (!simulatingOrder) return;
    await verifyPaymentWithBackend(
      {
        razorpay_order_id: simulatingOrder.orderId,
        razorpay_payment_id: `rzp_pay_${Date.now()}`,
        razorpay_signature: 'simulated_signature_verified',
      },
      simulatingOrder
    );
  };

  const handleSimulatedFailure = async () => {
    setShowSimulatedModal(false);
    setState('FAILED');
    setErrorMessage('Simulated transaction decline: Insufficient balance in linked account.');
    if (simulatingOrder?.orderId) {
      await paymentService.cancelPayment({
        orderId: simulatingOrder.orderId,
        reason: 'Simulated decline: Insufficient balance in linked account.',
      }).catch(() => {});
    }
  };

  const handleSimulatedCancel = async () => {
    setShowSimulatedModal(false);
    setState('CANCELLED');
    toast.info('Payment was cancelled.');
    if (simulatingOrder?.orderId) {
      await paymentService.cancelPayment({
        orderId: simulatingOrder.orderId,
        reason: 'User cancelled simulated payment modal',
      }).catch(() => {});
    }
  };

  // LOADING STATE
  if (state === 'LOADING') {
    return (
      <div className="card-base p-8 text-center space-y-3">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-900 dark:text-zinc-100 mx-auto" />
        <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
          Processing payment...
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
          Please wait while your bank verifies the authorization. Do not refresh or close this tab.
        </p>
      </div>
    );
  }

  // SUCCESS STATE
  if (state === 'SUCCESS') {
    const finalPaid = resultData?.amount || effectiveAmount;
    const finalRemaining = Math.max(0, bill.totalPayable - finalPaid);
    const isPartial = paymentType === 'PARTIAL' || finalRemaining > 0;

    return (
      <div className="card-base p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-full border border-zinc-950 dark:border-zinc-100 bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 flex items-center justify-center mx-auto">
          <Check className="w-6 h-6 stroke-[3]" />
        </div>

        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            {isPartial ? 'Partial Settlement Confirmed' : 'Receipt Confirmed'}
          </span>
          <h2 className="text-xl font-bold text-zinc-950 dark:text-zinc-50 mt-1">
            {isPartial ? 'Partial Payment Credited' : 'Payment Successful'}
          </h2>
          <p className="text-3xl font-bold text-zinc-950 dark:text-zinc-50 mt-2">
            {formatCurrency(finalPaid)}
          </p>
        </div>

        <div className="p-3.5 rounded-md bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 max-w-sm mx-auto text-left text-xs space-y-1.5">
          <div className="flex justify-between">
            <span className="text-zinc-400">Transaction ID:</span>
            <span className="font-mono font-medium text-zinc-900 dark:text-zinc-100">
              {resultData?.transactionId || 'RZP_2026_9082'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Amount Paid:</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(finalPaid)}
            </span>
          </div>
          {isPartial && (
            <div className="flex justify-between">
              <span className="text-zinc-400">Remaining Balance:</span>
              <span className="font-semibold text-amber-600 dark:text-amber-400">
                {formatCurrency(finalRemaining)}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-zinc-400">Hostel:</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {(user?.hostel || '').toUpperCase()} • Room {user?.room}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Statement:</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {bill.month}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
          <Button
            variant="outline"
            size="md"
            icon={Download}
            onClick={() => setShowReceiptModal(true)}
          >
            Download Receipt
          </Button>
          <Button
            variant="primary"
            size="md"
            icon={ArrowLeft}
            onClick={() => navigate('/login/dashboard')}
          >
            Back to Dashboard
          </Button>
        </div>

        {/* Official Printable Payment Receipt Modal */}
        {showReceiptModal && (
          <PaymentReceiptModal
            isOpen={showReceiptModal}
            onClose={() => setShowReceiptModal(false)}
            receipt={{
              transactionId: resultData?.transactionId || 'RZP_2026_9082',
              amount: finalPaid,
              totalPayable: bill.totalPayable,
              remainingBalance: finalRemaining,
              paymentType,
              date: resultData?.paidAt || new Date().toISOString(),
              paymentMethod: resultData?.method || 'ONLINE',
              studentName: user?.name,
              rollNo: user?.rollNo,
              hostel: user?.hostel,
              room: user?.room,
              department: user?.department,
              billingMonth: bill?.month,
              status: 'SUCCESS',
            }}
          />
        )}
      </div>
    );
  }

  // FAILED STATE
  if (state === 'FAILED') {
    return (
      <div className="card-base p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-full border border-zinc-950 dark:border-zinc-200 flex items-center justify-center mx-auto text-zinc-950 dark:text-zinc-100">
          <X className="w-6 h-6 stroke-[2.5]" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-zinc-950 dark:text-zinc-50">
            Payment Failed
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
            {errorMessage || 'Your transaction could not be completed. No funds have been deducted.'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
          <Button
            variant="primary"
            size="md"
            icon={RotateCcw}
            onClick={() => setState('IDLE')}
          >
            Try Again
          </Button>
          <Button
            variant="outline"
            size="md"
            onClick={() => navigate('/login/dashboard')}
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // CANCELLED STATE
  if (state === 'CANCELLED') {
    return (
      <div className="card-base p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-full border border-zinc-300 dark:border-zinc-700 flex items-center justify-center mx-auto text-zinc-500">
          <AlertCircle className="w-6 h-6" />
        </div>

        <div>
          <h2 className="text-lg font-bold text-zinc-950 dark:text-zinc-50">
            Payment Cancelled
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            No amount has been charged. You can resume at any time.
          </p>
        </div>

        <div className="flex items-center justify-center gap-2.5 pt-2">
          <Button variant="primary" size="md" onClick={() => setState('IDLE')}>
            Resume Payment
          </Button>
          <Button
            variant="outline"
            size="md"
            onClick={() => navigate('/login/dashboard')}
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // DEFAULT
  return (
    <>
      <div className="card-base p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <Lock className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300 shrink-0" />
          <span>Secured by Razorpay Checkout & Ledger Cryptographic Signature</span>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={handleInitiatePayment}
          disabled={effectiveAmount <= 0}
          className="w-full sm:w-auto px-6 font-medium"
        >
          {paymentType === 'PARTIAL'
            ? `Pay  ${formatCurrency(effectiveAmount)} Now`
            : `Pay ${formatCurrency(effectiveAmount)} Now`}
        </Button>
      </div>

      {showSimulatedModal && (
        <Modal
          isOpen={showSimulatedModal}
          onClose={handleSimulatedCancel}
          title="Payment Gateway Simulation"
          subtitle="Testing & Verification Mode"
          maxWidth="max-w-sm"
        >
          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-md bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-950 dark:text-zinc-50 space-y-0.5">
              <div className="font-semibold text-xs flex justify-between">
                <span>Amount to Pay Now:</span>
                <span className="font-bold">{formatCurrency(effectiveAmount)}</span>
              </div>
              {paymentType === 'PARTIAL' && (
                <div className="flex justify-between text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                  <span>Remaining Ledger Due:</span>
                  <span>{formatCurrency(Math.max(0, bill.totalPayable - effectiveAmount))}</span>
                </div>
              )}
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 pt-1">
                Gateway: <strong>Razorpay Unified Checkout</strong> (UPI Apps, QR Code, Cards, NetBanking)
              </p>
            </div>

            <p className="text-zinc-600 dark:text-zinc-400">
              Choose a simulated response to verify the frontend signature handling:
            </p>

            <div className="space-y-1.5 pt-1">
              <button
                type="button"
                onClick={handleSimulatedSuccess}
                className="w-full py-2 px-3 rounded-md bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200 font-medium text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                Simulate Successful Payment
              </button>

              <button
                type="button"
                onClick={handleSimulatedFailure}
                className="w-full py-2 px-3 rounded-md border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Simulate Bank Decline
              </button>

              <button
                type="button"
                onClick={handleSimulatedCancel}
                className="w-full py-1.5 px-3 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 text-xs transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};
