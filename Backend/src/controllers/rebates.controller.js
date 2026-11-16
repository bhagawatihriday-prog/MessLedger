import { query } from '../config/db.js';

/**
 * Format rebate row for frontend
 */
export const formatRebate = (r) => ({
  id: r.id,
  userId: r.user_id,
  studentId: r.user_id,
  name: r.name,
  rollNo: r.roll_no,
  room: r.room,
  hostel: r.hostel,
  amount: parseFloat(r.amount || 0),
  days: parseInt(r.days || 0, 10),
  dailyRate: parseFloat(r.daily_rate || 115),
  calcMode: r.calc_mode || 'DAYS',
  appRef: r.app_ref || '',
  reasonCategory: r.reason_category || 'VACATION',
  fromDate: r.from_date ? new Date(r.from_date).toISOString().split('T')[0] : '',
  toDate: r.to_date ? new Date(r.to_date).toISOString().split('T')[0] : '',
  remarks: r.remarks || '',
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

/**
 * GET /api/rebates
 * Retrieve all active rebates for the admin's hostel (or authenticated student's rebate)
 */
export const getRebates = async (req, res) => {
  try {
    const user = req.user;

    if (user.role === 'ADMIN' || user.role === 'SENIOR_WARDEN' || user.role === 'WARDEN') {
      const adminRes = await query('SELECT hostel FROM users WHERE id = $1', [user.id]);
      const adminHostel = adminRes.rows[0]?.hostel;

      let sql = `
        SELECT r.*, u.name, u.roll_no, u.room, u.hostel, u.email
        FROM rebates r
        INNER JOIN users u ON r.user_id = u.id
      `;
      const params = [];
      if (adminHostel) {
        sql += ` WHERE (LOWER(u.hostel) = LOWER($1) OR UPPER(u.hostel) = UPPER($1))`;
        params.push(adminHostel.trim());
      }
      sql += ` ORDER BY r.updated_at DESC`;

      const result = await query(sql, params);
      return res.json(result.rows.map(formatRebate));
    } else {
      const result = await query(
        `SELECT r.*, u.name, u.roll_no, u.room, u.hostel, u.email
         FROM rebates r
         INNER JOIN users u ON r.user_id = u.id
         WHERE r.user_id = $1`,
        [user.id]
      );
      return res.json(result.rows.map(formatRebate));
    }
  } catch (error) {
    console.error('[GET REBATES ERROR]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve rebates.',
      error: error.message,
    });
  }
};

/**
 * POST /api/rebates
 * Create or update (upsert) a student diet rebate concession
 */
export const applyRebate = async (req, res) => {
  try {
    const adminUser = req.user;
    if (adminUser.role !== 'ADMIN' && adminUser.role !== 'SENIOR_WARDEN' && adminUser.role !== 'WARDEN') {
      return res.status(403).json({
        success: false,
        message: 'Only hostel senior wardens or wardens can grant mess rebates.',
      });
    }

    const adminHostel = (adminUser.hostel || '').trim().toUpperCase();
    if (!adminHostel) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have an assigned hostel to manage rebates for.',
      });
    }

    const {
      studentId,
      amount,
      days = 0,
      dailyRate = 115,
      calcMode = 'DAYS',
      appRef = '',
      reasonCategory = 'VACATION',
      fromDate = null,
      toDate = null,
      remarks = '',
    } = req.body;

    if (!studentId || parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Student ID and a positive rebate amount are required.',
      });
    }

    // Verify the student belongs strictly to the admin's hostel
    const studentRes = await query(
      `SELECT id, name, hostel FROM users WHERE id = $1 AND role = 'STUDENT' LIMIT 1`,
      [studentId]
    );

    if (studentRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student account not found.',
      });
    }

    const student = studentRes.rows[0];
    if (student.hostel && student.hostel.trim().toUpperCase() !== adminHostel) {
      return res.status(403).json({
        success: false,
        message: `Access denied. You can only grant diet rebates for residents of ${adminHostel} Hostel.`,
      });
    }

    const cleanAmount = parseFloat(amount);
    const cleanDays = parseInt(days, 10) || 0;
    const cleanRate = parseFloat(dailyRate) || 115;
    const rebateId = `rebate_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const upsertSql = `
      INSERT INTO rebates (
        id, user_id, amount, days, daily_rate, calc_mode,
        app_ref, reason_category, from_date, to_date, remarks, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP
      )
      ON CONFLICT (user_id) DO UPDATE SET
        amount = EXCLUDED.amount,
        days = EXCLUDED.days,
        daily_rate = EXCLUDED.daily_rate,
        calc_mode = EXCLUDED.calc_mode,
        app_ref = EXCLUDED.app_ref,
        reason_category = EXCLUDED.reason_category,
        from_date = EXCLUDED.from_date,
        to_date = EXCLUDED.to_date,
        remarks = EXCLUDED.remarks,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    const result = await query(upsertSql, [
      rebateId,
      studentId,
      cleanAmount,
      cleanDays,
      cleanRate,
      calcMode,
      appRef.trim(),
      reasonCategory,
      fromDate || null,
      toDate || null,
      remarks.trim(),
    ]);

    const savedRebate = result.rows[0];

    // Notify the resident student
    try {
      const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await query(
        `INSERT INTO notifications (id, user_id, title, message, type)
         VALUES ($1, $2, $3, $4, 'REBATE')`,
        [
          notifId,
          studentId,
          'Mess Diet Rebate Concession Granted',
          `A mess fee concession of ₹${cleanAmount.toLocaleString('en-IN')} (${cleanDays} days) has been credited to your mess ledger.${appRef ? ` Ref: ${appRef}.` : ''}`,
        ]
      );
    } catch (notifErr) {
      console.warn('Failed to insert rebate notification:', notifErr.message);
    }

    return res.status(200).json({
      success: true,
      message: `Diet rebate of ₹${cleanAmount} granted successfully.`,
      rebate: formatRebate(savedRebate),
    });
  } catch (error) {
    console.error('[APPLY REBATE ERROR]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to apply mess rebate.',
      error: error.message,
    });
  }
};

/**
 * DELETE /api/rebates/:studentId
 * Remove an existing diet rebate concession
 */
export const removeRebate = async (req, res) => {
  try {
    const adminUser = req.user;
    if (adminUser.role !== 'ADMIN' && adminUser.role !== 'SENIOR_WARDEN' && adminUser.role !== 'WARDEN') {
      return res.status(403).json({
        success: false,
        message: 'Only hostel senior wardens or wardens can remove mess rebates.',
      });
    }

    const adminHostel = (adminUser.hostel || '').trim().toUpperCase();
    if (!adminHostel) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have an assigned hostel.',
      });
    }

    const { studentId } = req.params;
    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: 'Student ID is required.',
      });
    }

    // Verify student belongs to admin's hostel
    const studentRes = await query(
      `SELECT id, name, hostel FROM users WHERE id = $1 AND role = 'STUDENT' LIMIT 1`,
      [studentId]
    );

    if (studentRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student account not found.',
      });
    }

    const student = studentRes.rows[0];
    if (student.hostel && student.hostel.trim().toUpperCase() !== adminHostel) {
      return res.status(403).json({
        success: false,
        message: `Access denied. You can only remove rebates for residents of ${adminHostel} Hostel.`,
      });
    }

    await query(`DELETE FROM rebates WHERE user_id = $1`, [studentId]);

    // Notify student
    try {
      const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await query(
        `INSERT INTO notifications (id, user_id, title, message, type)
         VALUES ($1, $2, $3, $4, 'INFO')`,
        [
          notifId,
          studentId,
          'Mess Diet Rebate Concession Adjusted',
          'Your previously recorded diet rebate concession has been removed or adjusted by the hostel administration.',
        ]
      );
    } catch (err) {
      console.warn('Failed to notify student on rebate removal:', err.message);
    }

    return res.json({
      success: true,
      message: 'Diet rebate removed successfully.',
    });
  } catch (error) {
    console.error('[REMOVE REBATE ERROR]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to remove mess rebate.',
      error: error.message,
    });
  }
};
