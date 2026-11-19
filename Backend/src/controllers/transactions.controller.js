import { query } from '../config/db.js';

/**
 * Format payment row to frontend transaction model
 */
export const formatTransaction = (row) => ({
  id: row.id,
  date: row.paid_at || new Date().toISOString(),
  month: row.month || new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date(row.paid_at || Date.now())),
  title: `Payment (${row.payment_method || 'ONLINE'})`,
  type: 'CREDIT',
  amount: parseFloat(row.amount || 0),
  referenceId: row.razorpay_payment_id || row.transaction_id || row.id,
  orderId: row.razorpay_order_id || null,
  paymentId: row.razorpay_payment_id || null,
  method: row.payment_method || 'ONLINE',
  status: row.status === 'PENDING' ? 'FAILED' : (row.status || 'SUCCESS'),
  studentName: row.user_name || null,
  rollNo: row.roll_no || null,
  hostel: row.hostel || null,
  room: row.room || null,
  notes: `Settlement for hostel mess dues - Ref: ${row.razorpay_payment_id || row.transaction_id || row.id}`,
});

/**
 * GET /api/transactions
 * Retrieve transaction history for authenticated student (or all transactions in hostel for admin)
 */
export const getTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    // Auto-fail all uncompleted PENDING transactions (they are abandoned checkout attempts)
    try {
      await query(
        `UPDATE payments
         SET status = 'FAILED',
             failure_reason = 'Payment dismissed or abandoned without completion'
         WHERE status = 'PENDING'`
      );
    } catch (cleanupErr) {
      console.warn('[TRANSACTION CLEANUP WARNING]', cleanupErr.message);
    }

    let result;

    if (userRole === 'ADMIN' || userRole === 'SENIOR_WARDEN' || userRole === 'WARDEN') {
      const adminRes = await query('SELECT hostel FROM users WHERE id = $1', [userId]);
      const adminHostel = adminRes.rows[0]?.hostel;

      let sql = `
        SELECT p.*, b.month, u.name AS user_name, u.roll_no, u.hostel, u.room
        FROM payments p
        LEFT JOIN bills b ON p.bill_id = b.id
        LEFT JOIN users u ON p.user_id = u.id
      `;
      const params = [];
      if (adminHostel) {
        sql += ` WHERE (LOWER(u.hostel) = LOWER($1) OR UPPER(u.hostel) = UPPER($1))`;
        params.push(adminHostel.trim());
      }
      sql += ` ORDER BY p.paid_at DESC LIMIT 200`;
      result = await query(sql, params);
    } else {
      result = await query(
        `SELECT p.*, b.month, u.name AS user_name, u.roll_no, u.hostel, u.room
         FROM payments p
         LEFT JOIN bills b ON p.bill_id = b.id
         LEFT JOIN users u ON p.user_id = u.id
         WHERE p.user_id = $1
         ORDER BY p.paid_at DESC`,
        [userId]
      );
    }

    return res.json(result.rows.map(formatTransaction));
  } catch (error) {
    console.error('[GET TRANSACTIONS ERROR]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve transactions.',
      error: error.message,
    });
  }
};

export default {
  formatTransaction,
  getTransactions,
};

