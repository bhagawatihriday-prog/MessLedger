import crypto from 'crypto';
import { query, withTransaction } from '../config/db.js';
import { syncLateFines } from './bills.controller.js';
import {
  getRazorpayInstance,
  isRazorpayConfigured,
  RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET,
  RAZORPAY_WEBHOOK_SECRET,
} from '../config/razorpay.js';

/**
 * Shared FIFO payment settlement engine
 * Cascades payment from oldest unpaid month to newest unpaid month.
 * Supports transactional execution via optional `client` parameter.
 */
export const settleStudentDues = async (userId, numericAmount, client = null) => {
  const db = client || { query };

  // 1. Fetch all unpaid/partially paid bills for this user in chronological order
  // Use FOR UPDATE row-level lock when running in a transaction to prevent race conditions
  const lockClause = client ? ' FOR UPDATE' : '';
  const unpaidRes = await db.query(
    `SELECT * FROM bills 
     WHERE user_id = $1 AND status != 'PAID' 
     ORDER BY month_code ASC, created_at ASC${lockClause}`,
    [userId]
  );

  let unpaidBills = unpaidRes.rows;

  // Synchronize late fines on any unpaid bills before settling
  if (unpaidBills.length > 0) {
    unpaidBills = await syncLateFines(unpaidBills);
  }

  // 2. Fetch active diet rebate concession if any
  const rebateRes = await db.query(
    `SELECT * FROM rebates WHERE user_id = $1 LIMIT 1`,
    [userId]
  );
  const activeRebate = rebateRes.rows[0] || null;
  const rebateConcession = activeRebate ? parseFloat(activeRebate.amount || 0) : 0;

  let unallocated = numericAmount;
  const updatedBills = [];

  for (let i = 0; i < unpaidBills.length; i++) {
    const bill = unpaidBills[i];
    const isLastBill = (i === unpaidBills.length - 1);

    const baseBill = parseFloat(bill.base_bill || 0);
    const lateFine = parseFloat(bill.late_fine || 0);
    const currentPaid = parseFloat(bill.paid_amount || 0);
    const monthCharge = baseBill + lateFine;
    const billDue = Math.max(0, monthCharge - currentPaid);

    if (billDue <= 0) {
      if (bill.status !== 'PAID') {
        const upRes = await db.query(
          `UPDATE bills SET status = 'PAID', due_amount = 0, total_payable = 0 WHERE id = $1 RETURNING *`,
          [bill.id]
        );
        updatedBills.push(upRes.rows[0]);
      }
      continue;
    }

    if (unallocated <= 0) {
      continue;
    }

    // If this is the latest/last bill and user has an active diet rebate,
    // the effective remaining net due can be offset by the rebate concession
    let effectiveDue = billDue;
    if (isLastBill && rebateConcession > 0) {
      effectiveDue = Math.max(0, billDue - rebateConcession);
    }

    let allocation = 0;
    let newPaid = currentPaid;
    let newDue = billDue;
    let newStatus = bill.status;

    if (unallocated >= effectiveDue) {
      // Bill is fully cleared
      allocation = effectiveDue;
      unallocated -= allocation;
      newPaid = currentPaid + allocation;
      newDue = 0;
      newStatus = 'PAID';
    } else {
      // Partial allocation
      allocation = unallocated;
      unallocated = 0;
      newPaid = currentPaid + allocation;
      newDue = Math.max(0, billDue - allocation);
      newStatus = newDue <= 0 ? 'PAID' : 'PARTIAL';
    }

    const prevDue = parseFloat(bill.previous_due || 0);
    const newTotalPayable = newStatus === 'PAID' ? 0 : Math.max(0, baseBill + lateFine + prevDue - newPaid);

    const upRes = await db.query(
      `UPDATE bills
       SET paid_amount = $1,
           due_amount = $2,
           total_payable = $3,
           status = $4
       WHERE id = $5
       RETURNING *`,
      [newPaid, newDue, newTotalPayable, newStatus, bill.id]
    );
    updatedBills.push(upRes.rows[0]);
  }

  // If there were no unpaid bills or unallocated remaining, update latest bill if present
  let primaryBill = updatedBills[updatedBills.length - 1] || null;
  if (!primaryBill) {
    const latestRes = await db.query(
      `SELECT * FROM bills WHERE user_id = $1 ORDER BY month_code DESC, created_at DESC LIMIT 1`,
      [userId]
    );
    if (latestRes.rows.length > 0) {
      const b = latestRes.rows[0];
      const newPaid = parseFloat(b.paid_amount || 0) + numericAmount;
      const upRes = await db.query(
        `UPDATE bills SET paid_amount = $1, due_amount = 0, total_payable = 0, status = 'PAID' WHERE id = $2 RETURNING *`,
        [newPaid, b.id]
      );
      primaryBill = upRes.rows[0];
      updatedBills.push(primaryBill);
    }
  }

  return { updatedBills, primaryBill };
};

/**
 * Proactively notifies hostel administrators and wardens when a resident completes a mess dues payment
 */
export const notifyHostelAdmins = async (client, { userId, numericAmount, transactionId, source = '' }) => {
  try {
    const studentRes = await client.query(
      'SELECT name, roll_no, room, hostel FROM users WHERE id = $1',
      [userId]
    );
    const student = studentRes.rows[0];
    if (!student || !student.hostel) return;

    const studentIdentifier = student.roll_no ? `${student.name} (${student.roll_no})` : `${student.name} (Room ${student.room || '—'})`;

    // Find all administrators and wardens assigned to this hostel
    const adminsRes = await client.query(
      `SELECT id, name FROM users 
       WHERE role IN ('ADMIN', 'SENIOR_WARDEN', 'WARDEN') 
         AND (LOWER(hostel) = LOWER($1) OR UPPER(hostel) = UPPER($1))`,
      [student.hostel.trim()]
    );

    const now = Date.now();
    for (let i = 0; i < adminsRes.rows.length; i++) {
      const admin = adminsRes.rows[i];
      await client.query(
        `INSERT INTO notifications (id, user_id, title, message, type)
         VALUES ($1, $2, $3, $4, 'PAYMENT')`,
        [
          `notif_${now}_adm_${admin.id.substring(0, 8)}_${i}`,
          admin.id,
          'Mess Dues Payment Received',
          `Payment of ₹${numericAmount.toLocaleString('en-IN')} received from ${studentIdentifier}${source ? ` via ${source}` : ''}. Reference: ${transactionId}.`,
        ]
      );
    }
  } catch (err) {
    console.warn('[NOTIFY HOSTEL ADMINS WARNING]', err.message);
  }
};

/**
 * POST /api/payments/create-order
 * Initiates an official Razorpay payment order (or simulation order in demo mode)
 */
export const createOrder = async (req, res) => {
  try {
    const { billId, amount, paymentType = 'FULL', notes = {} } = req.body;
    const numericAmount = parseFloat(amount || 0);
    const userId = req.user.id;

    if (!numericAmount || numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'A valid payment amount greater than ₹0 is required.',
      });
    }

    const amountInPaise = Math.round(numericAmount * 100);
    let orderId;
    let rzpKey = RAZORPAY_KEY_ID;

    // 1. If Razorpay API credentials are configured, create real server order
    if (isRazorpayConfigured) {
      try {
        const rzp = getRazorpayInstance();
        const receipt = `rcpt_${Date.now().toString().slice(-8)}_${Math.random().toString(36).substring(2, 6)}`;

        const order = await rzp.orders.create({
          amount: amountInPaise,
          currency: 'INR',
          receipt,
          notes: {
            userId,
            billId: billId || 'mess_dues',
            paymentType,
            studentName: notes.studentName || req.user.name,
            rollNo: notes.rollNo || req.user.roll_no,
            hostel: notes.hostel || req.user.hostel,
            room: notes.room || req.user.room,
          },
        });

        orderId = order.id;
        console.log(`✅ [RAZORPAY ORDER CREATED] Order ID: ${orderId} | Amount: ₹${numericAmount} (${amountInPaise} paise)`);
      } catch (rzpErr) {
        console.error('❌ [RAZORPAY ORDER API ERROR]', rzpErr);
        return res.status(502).json({
          success: false,
          message: 'Razorpay gateway rejected order creation: ' + (rzpErr.error?.description || rzpErr.message),
        });
      }
    } else {
      // Development / Testing simulation fallback
      orderId = `order_sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      console.log(`ℹ️ [SIMULATED ORDER] Order ID: ${orderId} | Amount: ₹${numericAmount}`);
    }

    // 2. Pre-record pending payment in database for audit and idempotency
    const paymentId = `pmt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    try {
      await query(
        `INSERT INTO payments (
          id, bill_id, user_id, amount, payment_method, razorpay_order_id, status, idempotency_key, paid_at
        ) VALUES ($1, $2, $3, $4, $5, $6, 'PENDING', $7, CURRENT_TIMESTAMP)
        ON CONFLICT (idempotency_key) DO UPDATE SET amount = EXCLUDED.amount`,
        [paymentId, billId || null, userId, numericAmount, (notes.method || 'ONLINE').toUpperCase(), orderId, orderId]
      );
    } catch (dbErr) {
      console.warn('[PENDING PAYMENT INSERT WARNING]', dbErr.message);
    }

    return res.json({
      success: true,
      orderId,
      amount: amountInPaise,
      currency: 'INR',
      keyId: rzpKey,
      billId: billId || 'current_bill',
      notes,
    });
  } catch (error) {
    console.error('[CREATE ORDER ERROR]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create payment order.',
      error: error.message,
    });
  }
};

/**
 * POST /api/payments/cancel
 * Marks a pending payment order as FAILED when student dismisses or backs out from gateway
 */
export const cancelPayment = async (req, res) => {
  try {
    const { orderId, reason = 'Payment dismissed by user' } = req.body;
    const userId = req.user.id;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required to cancel payment.',
      });
    }

    // Only update if currently PENDING so verified/successful payments are never overwritten
    const result = await query(
      `UPDATE payments
       SET status = 'FAILED',
           failure_reason = $1
       WHERE razorpay_order_id = $2
         AND user_id = $3
         AND status = 'PENDING'
       RETURNING id, razorpay_order_id, status`,
      [reason, orderId, userId]
    );

    return res.json({
      success: true,
      message: 'Payment status marked as FAILED.',
      updated: result.rows.length > 0,
    });
  } catch (error) {
    console.error('[CANCEL PAYMENT ERROR]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update payment status.',
      error: error.message,
    });
  }
};

/**
 * POST /api/payments/verify
 * Verifies Razorpay payment signature and settles dues in the database atomically
 */
export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      billId,
      amount,
      method = 'ONLINE',
    } = req.body;

    const numericAmount = parseFloat(amount || 0);
    const userId = req.user.id;

    if (numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment amount.',
      });
    }

    // 1. Verify cryptographic signature if secret is provided
    if (RAZORPAY_KEY_SECRET && razorpay_signature && razorpay_order_id && razorpay_payment_id) {
      const body = `${razorpay_order_id}|${razorpay_payment_id}`;
      const expectedSignature = crypto
        .createHmac('sha256', RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

      let isAuthentic = false;
      try {
        isAuthentic = crypto.timingSafeEqual(
          Buffer.from(expectedSignature, 'utf-8'),
          Buffer.from(razorpay_signature, 'utf-8')
        );
      } catch {
        isAuthentic = false;
      }

      if (!isAuthentic) {
        return res.status(400).json({
          success: false,
          message: 'Payment signature verification failed. Untrusted or tampered transaction.',
        });
      }
    }

    const transactionId = razorpay_payment_id || `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // 2. Check Idempotency: Has this payment already been completed (e.g. by webhook)?
    const existingPayment = await query(
      `SELECT * FROM payments 
       WHERE (razorpay_payment_id = $1 OR transaction_id = $1 OR razorpay_order_id = $2) 
         AND status = 'SUCCESS' 
       LIMIT 1`,
      [razorpay_payment_id, razorpay_order_id]
    );

    if (existingPayment.rows.length > 0) {
      const p = existingPayment.rows[0];
      return res.json({
        success: true,
        verified: true,
        alreadyProcessed: true,
        transactionId: p.transaction_id || p.razorpay_payment_id,
        amount: parseFloat(p.amount),
        paidAt: p.paid_at,
        message: 'Payment already verified and credited to hostel ledger.',
      });
    }

    // 3. Execute FIFO Multi-Month Settlement & Payment record in an Atomic Transaction
    const settlementResult = await withTransaction(async (client) => {
      // 3A. Settle student dues
      const { updatedBills, primaryBill } = await settleStudentDues(userId, numericAmount, client);

      // 3B. Update pending payment or insert success payment row
      const paymentId = `pmt_${Date.now()}`;
      const updateRes = await client.query(
        `UPDATE payments
         SET status = 'SUCCESS',
             transaction_id = $1,
             razorpay_payment_id = $2,
             razorpay_signature = $3,
             bill_id = COALESCE(bill_id, $4),
             payment_method = $5,
             amount = $6,
             paid_at = CURRENT_TIMESTAMP
         WHERE razorpay_order_id = $7
         RETURNING *`,
        [transactionId, razorpay_payment_id, razorpay_signature, primaryBill ? primaryBill.id : null, method.toUpperCase(), numericAmount, razorpay_order_id]
      );

      let finalPayment = updateRes.rows[0] || null;

      if (!finalPayment) {
        const insRes = await client.query(
          `INSERT INTO payments (
            id, bill_id, user_id, amount, payment_method, transaction_id, status,
            razorpay_order_id, razorpay_payment_id, razorpay_signature
          ) VALUES ($1, $2, $3, $4, $5, $6, 'SUCCESS', $7, $8, $9)
          RETURNING *`,
          [paymentId, primaryBill ? primaryBill.id : null, userId, numericAmount, method.toUpperCase(), transactionId, razorpay_order_id, razorpay_payment_id, razorpay_signature]
        );
        finalPayment = insRes.rows[0];
      }

      // 3C. Create confirmation notification for student
      await client.query(
        `INSERT INTO notifications (id, user_id, title, message, type)
         VALUES ($1, $2, $3, $4, 'PAYMENT')`,
        [
          `notif_${Date.now()}_std`,
          userId,
          'Payment Successful',
          `Mess dues payment of ₹${numericAmount.toLocaleString('en-IN')} has been verified and credited. Transaction ID: ${transactionId}.`,
        ]
      );

      // 3D. Notify respective hostel admin(s) / warden(s)
      await notifyHostelAdmins(client, { userId, numericAmount, transactionId });

      return { updatedBills, primaryBill, finalPayment };
    });

    return res.json({
      success: true,
      verified: true,
      transactionId,
      amount: numericAmount,
      paidAt: settlementResult.finalPayment?.paid_at || new Date().toISOString(),
      updatedBill: settlementResult.primaryBill,
      updatedBills: settlementResult.updatedBills,
      message: 'Payment verified and credited to hostel ledger successfully.',
    });
  } catch (error) {
    console.error('[VERIFY PAYMENT ERROR]', error);
    return res.status(500).json({
      success: false,
      message: 'Payment verification failed due to a server error.',
      error: error.message,
    });
  }
};

/**
 * POST /api/payments/webhook
 * Handles asynchronous server-to-server webhook events from Razorpay
 * Acts as resilient fallback if user disconnects or closes window before frontend redirect
 */
export const handleWebhook = async (req, res) => {
  try {
    const webhookSignature = req.headers['x-razorpay-signature'];

    // 1. Validate signature if webhook secret is configured
    if (RAZORPAY_WEBHOOK_SECRET) {
      if (!webhookSignature) {
        return res.status(400).json({ error: 'Missing webhook signature header' });
      }

      const rawPayload = req.rawBody ? req.rawBody.toString() : JSON.stringify(req.body);
      const expectedSignature = crypto
        .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
        .update(rawPayload)
        .digest('hex');

      let isValid = false;
      try {
        isValid = crypto.timingSafeEqual(
          Buffer.from(expectedSignature, 'utf-8'),
          Buffer.from(webhookSignature, 'utf-8')
        );
      } catch {
        isValid = false;
      }

      if (!isValid) {
        console.warn('⚠️ [WEBHOOK SIGNATURE MISMATCH] Untrusted webhook event discarded.');
        return res.status(400).json({ error: 'Invalid webhook signature' });
      }
    }

    const event = req.body.event;
    const payload = req.body.payload;

    console.log(`🔔 [RAZORPAY WEBHOOK RECEIVED] Event: ${event}`);

    // 2. Handle Payment Captured / Order Paid Event
    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = payload.payment?.entity || {};
      const orderId = paymentEntity.order_id || payload.order?.entity?.id;
      const paymentId = paymentEntity.id;
      const amountInPaise = paymentEntity.amount;
      const numericAmount = amountInPaise ? amountInPaise / 100 : 0;
      const userId = paymentEntity.notes?.userId;

      if (!userId || numericAmount <= 0) {
        return res.status(200).json({ status: 'ignored_missing_data' });
      }

      // Check if already settled
      const existing = await query(
        `SELECT id, status FROM payments WHERE (razorpay_payment_id = $1 OR razorpay_order_id = $2) AND status = 'SUCCESS' LIMIT 1`,
        [paymentId, orderId]
      );

      if (existing.rows.length === 0) {
        await withTransaction(async (client) => {
          await settleStudentDues(userId, numericAmount, client);

          await client.query(
            `UPDATE payments
             SET status = 'SUCCESS',
                 transaction_id = $1,
                 razorpay_payment_id = $2,
                 amount = $3,
                 paid_at = CURRENT_TIMESTAMP,
                 raw_response = $4
             WHERE razorpay_order_id = $5`,
            [paymentId, paymentId, numericAmount, JSON.stringify(paymentEntity), orderId]
          );

          await client.query(
            `INSERT INTO notifications (id, user_id, title, message, type)
             VALUES ($1, $2, $3, $4, 'PAYMENT')`,
            [
              `notif_${Date.now()}_std`,
              userId,
              'Payment Confirmed (Webhook)',
              `Mess dues payment of ₹${numericAmount.toLocaleString('en-IN')} confirmed via payment gateway webhook. Reference: ${paymentId}.`,
            ]
          );

          // Proactively notify respective hostel admin(s) / warden(s)
          await notifyHostelAdmins(client, {
            userId,
            numericAmount,
            transactionId: paymentId,
            source: 'Webhook',
          });
        });
        console.log(`✅ [WEBHOOK PROCESSED] Dues settled for user: ${userId} | Amount: ₹${numericAmount}`);
      }
    }

    // 3. Handle Payment Failed Event
    if (event === 'payment.failed') {
      const paymentEntity = payload.payment?.entity || {};
      const orderId = paymentEntity.order_id;
      const paymentId = paymentEntity.id;
      const failureReason = paymentEntity.error_description || 'Bank payment declined';
      const userId = paymentEntity.notes?.userId;

      await query(
        `UPDATE payments
         SET status = 'FAILED',
             razorpay_payment_id = $1,
             failure_reason = $2,
             raw_response = $3
         WHERE razorpay_order_id = $4`,
        [paymentId, failureReason, JSON.stringify(paymentEntity), orderId]
      );

      if (userId) {
        await query(
          `INSERT INTO notifications (id, user_id, title, message, type)
           VALUES ($1, $2, $3, $4, 'PAYMENT')`,
          [
            `notif_${Date.now()}`,
            userId,
            'Payment Attempt Failed',
            `Your payment attempt was declined: ${failureReason}. No funds have been deducted from your account.`,
          ]
        );
      }
    }

    return res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('[WEBHOOK ERROR]', error);
    return res.status(500).json({ error: error.message });
  }
};

export default {
  createOrder,
  verifyPayment,
  cancelPayment,
  handleWebhook,
  settleStudentDues,
};
