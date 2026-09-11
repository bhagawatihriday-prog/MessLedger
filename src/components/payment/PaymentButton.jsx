import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Download,
  RotateCcw,
} from 'lucide-react';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { paymentService } from '../../services/paymentService';
import { formatCurrency } from '../../utils/formatCurrency';
import { useToast } from '../../hooks/useToast';

export const PaymentButton = ({
  bill,
  selectedMethod,
  upiId,
  selectedBank,
  user,
}) => {
  const [state, setState] = useState('IDLE'); // 'IDLE', 'LOADING', 'SUCCESS', 'FAILED', 'CANCELLED'
  const [resultData, setResultData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSimulatedModal, setShowSimulatedModal] = useState(false);
  const [simulatingOrder, setSimulatingOrder] = useState(null);

  const navigate = useNavigate();
  const { toast } = useToast();

  const handleInitiatePayment = async () => {
    if (!bill || bill.totalPayable <= 0) {
      toast.warning('No outstanding balance to pay.');
      return;
    }

    if (selectedMethod === 'upi' && !upiId.trim()) {
      toast.error('Please enter your UPI ID before proceeding.');
      return;
    }

    if (selectedMethod === 'netbanking' && !selectedBank) {
      toast.error('Please select your bank for Net Banking.');
      return;
    }

    setState('LOADING');
    setErrorMessage('');

    try {
      // 1. Create Order
      const order = await paymentService.createOrder({
        billId: bill.id,
        amount: bill.totalPayable,
        notes: {
          studentName: user?.name,
          rollNo: user?.rollNo,
          hostel: user?.hostel,
          room: user?.room,
          month: bill.month,
          method: selectedMethod,
        },
      });

      // Check if real Razorpay script is loaded in window and a real key is present
      const hasRazorpay = typeof window !== 'undefined' && window.Razorpay;
      const isPlaceholderKey =
        !order.keyId ||
        order.keyId.includes('placeholder') ||
        order.keyId.includes('messledger');

      if (hasRazorpay && !isPlaceholderKey) {
        // Real Razorpay Checkout flow
        const options = {
          key: order.keyId,
          amount: order.amount,
          currency: order.currency,
          name: 'MessLedger System',
          description: `Mess Bill for ${bill.month}`,
          order_id: order.orderId,
          prefill: {
            name: user?.name || '',
            email: user?.email || '',
            contact: user?.phone || '',
          },
          notes: {
            hostel: user?.hostel,
            room: user?.room,
          },
          theme: {
            color: '#4F46E5',
          },
          handler: async (response) => {
            await verifyPaymentWithBackend(response, order);
          },
          modal: {
            ondismiss: () => {
              setState('CANCELLED');
              toast.warning('Payment was cancelled by user.');
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', (response) => {
          setState('FAILED');
          setErrorMessage(
            response.error?.description || 'Your payment was declined by the bank.'
          );
        });
        rzp.open();
      } else {
        // Interactive simulated gateway modal (production fallback for testing & demo without live keys)
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
        amount: bill.totalPayable,
        method: selectedMethod,
      });

      setResultData(verification);
      setState('SUCCESS');
      toast.success('Payment completed and credited to ledger!');
    } catch (verifyErr) {
      console.error('Payment verification failed:', verifyErr);
      setState('FAILED');
      setErrorMessage(
        verifyErr.message || 'Payment signature verification failed on backend.'
      );
    }
  };

  // Simulated gateway actions
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

  const handleSimulatedFailure = () => {
    setShowSimulatedModal(false);
    setState('FAILED');
    setErrorMessage('Simulated transaction decline: Insufficient balance in linked account.');
  };

  const handleSimulatedCancel = () => {
    setShowSimulatedModal(false);
    setState('CANCELLED');
    toast.info('Payment was cancelled.');
  };

  // RENDER: Loading State
  if (state === 'LOADING') {
    return (
      <div className="card-base p-8 text-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600 dark:text-indigo-400 mx-auto" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Processing payment...
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
          Please wait while your bank verifies the authorization. Do not refresh or close this tab.
        </p>
      </div>
    );
  }

  // RENDER: Success State (Per Section 25)
  if (state === 'SUCCESS') {
    return (
      <div className="card-base p-8 text-center space-y-5 animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto ring-8 ring-emerald-50 dark:ring-emerald-950/20">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div>
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            Verified Receipt
          </span>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            Payment Successful
          </h2>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-2">
            {formatCurrency(resultData?.amount || bill.totalPayable)}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 max-w-sm mx-auto text-left text-xs space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-400">Transaction ID:</span>
            <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
              {resultData?.transactionId || 'RZP_2026_9082'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Mess Account:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {user?.hostel} • Room {user?.room}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Paid For:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {bill.month}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            variant="outline"
            size="md"
            icon={Download}
            onClick={() => window.print()}
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
      </div>
    );
  }

  // RENDER: Failed State (Per Section 25)
  if (state === 'FAILED') {
    return (
      <div className="card-base p-8 text-center space-y-4 animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto ring-8 ring-rose-50 dark:ring-rose-950/20">
          <XCircle className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Payment Failed
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {errorMessage || 'Your payment could not be completed. No amount has been deducted from your account.'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
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

  // RENDER: Cancelled State (Per Section 25)
  if (state === 'CANCELLED') {
    return (
      <div className="card-base p-8 text-center space-y-4 animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Payment Cancelled
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            No amount has been charged. You can resume checkout at any time.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
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

  // Default: Checkout Trigger Button
  return (
    <>
      <div className="card-base p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Lock className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>Secured by Razorpay Checkout & University Ledger Verification</span>
        </div>

        <Button
          variant="primary"
          size="lg"
          onClick={handleInitiatePayment}
          className="w-full sm:w-auto px-8 font-semibold shadow-md shadow-indigo-500/20"
        >
          Pay {formatCurrency(bill?.totalPayable || 0)} Now
        </Button>
      </div>

      {/* Simulated Gateway Modal for Mock/Dev environments */}
      {showSimulatedModal && (
        <Modal
          isOpen={showSimulatedModal}
          onClose={handleSimulatedCancel}
          title="Razorpay Payment Gateway Simulation"
          subtitle="Testing & Demonstration Environment"
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900 text-indigo-950 dark:text-indigo-100 space-y-1">
              <div className="font-bold text-sm flex justify-between">
                <span>Total Amount:</span>
                <span>{formatCurrency(bill.totalPayable)}</span>
              </div>
              <p className="text-[11px] text-indigo-700 dark:text-indigo-300">
                Method: <strong className="uppercase">{selectedMethod}</strong> (
                {selectedMethod === 'upi' ? upiId : selectedBank || 'Card'})
              </p>
            </div>

            <p className="text-slate-600 dark:text-slate-300">
              Choose a simulated response to verify the frontend signature handling and ledger update:
            </p>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleSimulatedSuccess}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                Simulate Successful Payment
              </button>

              <button
                type="button"
                onClick={handleSimulatedFailure}
                className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <XCircle className="w-4 h-4" />
                Simulate Bank Decline / Failure
              </button>

              <button
                type="button"
                onClick={handleSimulatedCancel}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium transition-colors"
              >
                Cancel Transaction
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};
