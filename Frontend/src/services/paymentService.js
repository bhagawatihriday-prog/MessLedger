import api, { isMockMode, simulateDelay } from './api';
import { billService } from './billService';
import { transactionService } from './transactionService';

export const paymentService = {
  /**
   * Request backend to create a secure Razorpay order
   */
  async createOrder({ billId, amount, notes = {} }) {
    if (isMockMode) {
      await simulateDelay(400);
      const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      return {
        success: true,
        orderId,
        amount: Math.round(amount * 100), // Amount in paise
        currency: 'INR',
        keyId: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_messledger12345',
        billId,
      };
    }

    try {
      return await api.post('/payments/create-order', {
        billId,
        amount,
        notes,
      });
    } catch (error) {
      console.error('Backend payment create-order error:', error.message);
      throw new Error(
        error.response?.data?.message || error.message || 'Failed to initialize payment gateway order.'
      );
    }
  },

  /**
   * Send payment response back to backend for cryptographic signature verification
   */
  async verifyPayment({ razorpay_order_id, razorpay_payment_id, razorpay_signature, billId, amount, method = 'UPI' }) {
    if (isMockMode) {
      await simulateDelay(600);
      // Realistic simulated verification
      const transactionId = razorpay_payment_id || `pay_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // 1. Update bill state locally
      billService.updateLocalBillAfterPayment(amount);

      // 2. Append to transaction history
      transactionService.addTransaction({
        id: `txn_${Date.now()}`,
        date: new Date().toISOString(),
        month: 'September 2026',
        title: `Payment (${method.toUpperCase()})`,
        type: 'CREDIT',
        amount: amount,
        referenceId: transactionId,
        method: method.toUpperCase(),
        status: 'SUCCESS',
        notes: `Online settlement for mess dues - Order ${razorpay_order_id || 'Direct'}`,
      });

      return {
        success: true,
        verified: true,
        transactionId,
        amount,
        paidAt: new Date().toISOString(),
        message: 'Payment verified and credited to hostel ledger successfully.',
      };
    }

    try {
      return await api.post('/payments/verify', {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        billId,
        amount,
        method,
      });
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Payment signature verification failed.');
    }
  },

  /**
   * Cancel or mark pending payment as FAILED when user dismisses or payment fails
   */
  async cancelPayment({ orderId, reason = 'Payment cancelled by user' }) {
    if (isMockMode) {
      await simulateDelay(200);
      return { success: true, message: 'Simulated payment marked as cancelled.' };
    }

    try {
      return await api.post('/payments/cancel', {
        orderId,
        reason,
      });
    } catch (error) {
      console.warn('Backend payment cancel notification failed:', error.message);
      return { success: false, error: error.message };
    }
  },
};

