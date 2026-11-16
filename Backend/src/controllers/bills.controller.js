import { query } from '../config/db.js';

/**
 * Format database bill row to frontend format
 */
export const formatBill = (b) => {
  const baseBill = parseFloat(b.base_bill || 0);
  const paidAmount = parseFloat(b.paid_amount || 0);
  const dueAmount = parseFloat(b.due_amount || 0);
  const lateFine = parseFloat(b.late_fine || 0);
  const previousDue = parseFloat(b.previous_due || 0);
  const totalPayable = parseFloat(b.total_payable || 0);

  return {
    id: b.id,
    userId: b.user_id,
    name: b.name || 'Resident Student',
    role: b.role || 'STUDENT',
    rollNo: b.roll_no || '',
    room: b.room || '',
    hostel: b.hostel || '',
    email: b.email || '',
    month: b.month,
    monthCode: b.month_code,
    baseBill,
    paidAmount,
    dueAmount,
    lateFine,
    previousDue,
    unpaidMonthsCount: previousDue > 0 ? 1 : 0,
    previousDuesBreakdown: previousDue > 0 ? [{ month: 'Previous Period', amount: previousDue, status: 'UNPAID' }] : [],
    totalBill: baseBill + lateFine,
    totalPayable: totalPayable || (baseBill + lateFine + previousDue),
    fineDays: parseInt(b.fine_days || 0, 10),
    finePerDay: parseFloat(b.fine_per_day || 20),
    paymentDeadline: b.payment_deadline ? new Date(b.payment_deadline).toISOString().split('T')[0] : '',
    status: b.status,
    billingCycle: b.billing_cycle || 'Current Billing Cycle',
    mealCounts: b.meal_counts || { breakfast: 28, lunch: 30, dinner: 29, specialFeasts: 1 },
    createdAt: b.created_at,
  };
};

/**
 * Automatically computes and synchronizes late fines for overdue bills
 */
export const syncLateFines = async (rows) => {
  if (!Array.isArray(rows) || rows.length === 0) return rows;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const b of rows) {
    if (!b.payment_deadline || b.status === 'PAID') continue;

    const deadline = new Date(b.payment_deadline);
    deadline.setHours(0, 0, 0, 0);

    const isOverdue = today > deadline;
    const diffTime = isOverdue ? today.getTime() - deadline.getTime() : 0;
    const rawDiffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
    // Cap at max 30 days penalty per month (30 days * ₹20/day = max ₹600)
    const diffDays = isOverdue ? Math.min(30, rawDiffDays) : 0;
    const finePerDay = parseFloat(b.fine_per_day || 20);
    const computedLateFine = isOverdue ? Math.min(600, diffDays * finePerDay) : 0;
    const currentLateFine = parseFloat(b.late_fine || 0);

    // If fine has changed or fine_days changed, or late_fine was above 600, update in DB
    if (computedLateFine !== currentLateFine || parseInt(b.fine_days || 0, 10) !== diffDays || currentLateFine > 600) {
      const baseBill = parseFloat(b.base_bill || 0);
      const previousDue = parseFloat(b.previous_due || 0);
      const paidAmount = parseFloat(b.paid_amount || 0);
      const monthCharge = baseBill + computedLateFine;
      const totalPayable = baseBill + previousDue + computedLateFine;
      const newDue = Math.max(0, monthCharge - paidAmount);

      try {
        await query(
          `UPDATE bills
           SET late_fine = $1, fine_days = $2, total_payable = $3, due_amount = $4
           WHERE id = $5`,
          [computedLateFine, diffDays, totalPayable, newDue, b.id]
        );
        b.late_fine = computedLateFine;
        b.fine_days = diffDays;
        b.total_payable = totalPayable;
        b.due_amount = newDue;
      } catch (err) {
        console.warn(`Failed to update late fine for bill ${b.id}:`, err.message);
      }
    }
  }
  return rows;
};

/**
 * GET /api/bills/current
 * Returns the latest / current active bill for the authenticated student,
 * aggregating all previous unpaid months' base dues and cumulative late fines.
 */
export const getCurrentBill = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    // Administrators, Senior Wardens and Wardens do not have student mess bills
    if (userRole === 'ADMIN' || userRole === 'SENIOR_WARDEN' || userRole === 'WARDEN') {
      return res.json(null);
    }

    // Fetch ALL bills for this user to compute accurate multi-month financials & cumulative late fines
    const result = await query(
      `SELECT b.*, u.name, u.roll_no, u.room, u.hostel, u.email, u.role
       FROM bills b
       LEFT JOIN users u ON b.user_id = u.id
       WHERE b.user_id = $1 
       ORDER BY b.month_code DESC, b.created_at DESC`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.json(null);
    }

    // Synchronize late fines for ALL bills with 30-day (₹600) cap per month
    await syncLateFines(result.rows);

    const latestRow = result.rows[0];
    const latestBill = formatBill(latestRow);

    // Prior unpaid bills (strictly earlier month_code than latest bill)
    const priorUnpaidRows = result.rows
      .slice(1)
      .filter((r) => r.status !== 'PAID' && r.month_code < latestRow.month_code)
      .sort((a, b) => a.month_code.localeCompare(b.month_code));

    // For each prior unpaid bill, calculate remaining base due and remaining late fine after any payments
    let priorBaseDue = 0;
    let priorLateFine = 0;

    const previousDuesBreakdown = priorUnpaidRows.map((r) => {
      const base = parseFloat(r.base_bill || 0);
      const fine = parseFloat(r.late_fine || 0);
      const paid = parseFloat(r.paid_amount || 0);
      const totalMonthDue = Math.max(0, base + fine - paid);

      // Remaining portion of base bill vs late fine
      const remainingBase = Math.max(0, base - paid);
      const finePaid = Math.max(0, paid - base);
      const remainingFine = Math.max(0, fine - finePaid);

      priorBaseDue += remainingBase;
      priorLateFine += remainingFine;

      return {
        month: r.month,
        monthCode: r.month_code,
        amount: remainingBase,
        lateFine: remainingFine,
        originalBase: base,
        paidAmount: paid,
        totalDue: totalMonthDue,
        fineDays: parseInt(r.fine_days || 0, 10),
        status: r.status,
      };
    });

    const isCurrentPaid = latestRow.status === 'PAID' || parseFloat(latestRow.due_amount || 0) <= 0;
    const currentBaseBill = parseFloat(latestRow.base_bill || 0);
    const currentPaid = parseFloat(latestRow.paid_amount || 0);
    const currentLateFineRaw = parseFloat(latestRow.late_fine || 0);

    const currentDue = isCurrentPaid ? 0 : Math.max(0, currentBaseBill - currentPaid);
    const currentFinePaid = Math.max(0, currentPaid - currentBaseBill);
    const currentMonthLateFine = isCurrentPaid ? 0 : Math.max(0, currentLateFineRaw - currentFinePaid);
    const totalLateFine = priorLateFine + currentMonthLateFine;

    // Total fine days across all overdue unpaid bills
    const totalFineDays = result.rows
      .filter((r) => r.status !== 'PAID')
      .reduce((sum, r) => sum + parseInt(r.fine_days || 0, 10), 0);

    // Check if student has an active diet rebate concession
    const rebateRes = await query(
      `SELECT * FROM rebates WHERE user_id = $1 LIMIT 1`,
      [userId]
    );
    const activeRebate = rebateRes.rows[0] || null;
    const rebateAmt = activeRebate ? parseFloat(activeRebate.amount || 0) : 0;

    // Overall cumulative payable across current month + all prior unpaid months minus active rebate
    const totalPayable = Math.max(0, currentDue + priorBaseDue + totalLateFine - rebateAmt);

    return res.json({
      ...latestBill,
      dueAmount: currentDue,
      previousDue: priorBaseDue,
      previousDuesBreakdown,
      unpaidMonthsCount: priorUnpaidRows.length + (currentDue > 0 ? 1 : 0),
      lateFine: totalLateFine,
      fineDays: totalFineDays,
      dietRebate: rebateAmt > 0 ? -rebateAmt : 0,
      dietRebateDays: activeRebate ? activeRebate.days : 0,
      totalPayable,
      currentMonthLateFine,
    });
  } catch (error) {
    console.error('[CURRENT BILL ERROR]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve current bill.',
      error: error.message,
    });
  }
};

/**
 * GET /api/bills
 * Retrieve bill history for authenticated user (or all student bills for admin's hostel)
 */
export const getBills = async (req, res) => {
  try {
    let result;
    if (req.user.role === 'ADMIN' || req.user.role === 'SENIOR_WARDEN' || req.user.role === 'WARDEN') {
      const adminRes = await query('SELECT hostel FROM users WHERE id = $1', [req.user.id]);
      const adminHostel = adminRes.rows[0]?.hostel;

      if (!adminHostel) {
        return res.json([]);
      }

      let sql = `
        SELECT b.*, u.name, u.roll_no, u.room, u.hostel, u.email, u.role
        FROM bills b
        INNER JOIN users u ON b.user_id = u.id
        WHERE u.role = 'STUDENT'
          AND (LOWER(u.hostel) = LOWER($1) OR UPPER(u.hostel) = UPPER($1))
        ORDER BY b.created_at DESC LIMIT 200
      `;
      result = await query(sql, [adminHostel.trim()]);
    } else {
      result = await query(
        `SELECT b.*, u.name, u.roll_no, u.room, u.hostel, u.email, u.role
         FROM bills b
         LEFT JOIN users u ON b.user_id = u.id
         WHERE b.user_id = $1 
         ORDER BY b.created_at DESC`,
        [req.user.id]
      );
    }

    await syncLateFines(result.rows);
    return res.json(result.rows.map(formatBill));
  } catch (error) {
    console.error('[GET BILLS ERROR]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve bills.',
      error: error.message,
    });
  }
};

/**
 * Helper to check whether a monthCode represents an upcoming/future month
 */
export const isUpcomingBillingMonth = (monthCode) => {
  if (!monthCode) return false;
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthNum = now.getMonth() + 1; // 1 to 12
  const currentMonthCode = `${currentYear}-${String(currentMonthNum).padStart(2, '0')}`;

  const clean = String(monthCode).trim();
  const [yStr, mStr] = clean.split('-');
  const y = parseInt(yStr, 10);
  const m = parseInt(mStr, 10);

  if (!isNaN(y) && !isNaN(m)) {
    if (y > currentYear) return true;
    if (y === currentYear && m > currentMonthNum) return true;
    return false;
  }

  return clean > currentMonthCode;
};

/**
 * POST /api/bills/generate
 * Bulk generate monthly mess bills for all registered boarders of the admin's hostel
 * Automatically dispatches notification to each resident student
 */
export const generateHostelBills = async (req, res) => {
  try {
    const adminUser = req.user;
    if (adminUser.role !== 'ADMIN' && adminUser.role !== 'SENIOR_WARDEN' && adminUser.role !== 'WARDEN') {
      return res.status(403).json({
        success: false,
        message: 'Only hostel senior wardens or wardens can generate mess bills.',
      });
    }

    const {
      month,
      monthCode,
      baseBill = 2450,
      paymentDeadline,
      billingCycle,
      target = 'ALL', // 'ALL' | 'SINGLE'
      targetUserId,
    } = req.body;

    if (!month || !monthCode) {
      return res.status(400).json({
        success: false,
        message: 'Billing month (e.g. "October 2026") and monthCode (e.g. "2026-10") are required.',
      });
    }

    // Restrict generation for upcoming / future months
    if (isUpcomingBillingMonth(monthCode)) {
      return res.status(400).json({
        success: false,
        message: `Cannot generate mess bills for upcoming months (${month || monthCode}). Bills can only be generated for the current or previous months.`,
      });
    }

    const cleanBaseBill = parseFloat(baseBill) || 0;
    const deadline = paymentDeadline || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const cycle = billingCycle || `${month} Mess Cycle`;

    const adminHostel = (adminUser.hostel || '').trim().toUpperCase();
    if (!adminHostel) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have an assigned hostel to generate mess bills for.',
      });
    }

    // 1. Fetch eligible registered students for the admin's hostel strictly
    let studentQuery = `
      SELECT id, name, email, roll_no, room, hostel 
      FROM users 
      WHERE role = 'STUDENT'
        AND (LOWER(hostel) = LOWER($1) OR UPPER(hostel) = UPPER($1))
    `;
    const params = [adminHostel];

    if (target === 'SINGLE' && targetUserId) {
      studentQuery += ` AND id = $2`;
      params.push(targetUserId);
    }

    const studentsRes = await query(studentQuery, params);
    const students = studentsRes.rows;

    if (students.length === 0) {
      return res.status(400).json({
        success: false,
        message: target === 'SINGLE'
          ? `Selected student account was not found in ${adminHostel} Hostel.`
          : `No registered student accounts found in ${adminHostel} Hostel. Students must first sign in with their university Google account.`,
      });
    }

    const generatedBills = [];

    for (const student of students) {
      // 1. Sync any existing overdue bills for this student first so prior dues include late fines
      const existingStudentBills = await query(
        `SELECT * FROM bills WHERE user_id = $1 AND status != 'PAID'`,
        [student.id]
      );
      if (existingStudentBills.rows.length > 0) {
        await syncLateFines(existingStudentBills.rows);
      }

      // 2. Calculate prior unpaid dues strictly for months prior to this billing month
      const priorRes = await query(
        `SELECT COALESCE(SUM(due_amount), 0) AS prior_due 
         FROM bills 
         WHERE user_id = $1 AND status != 'PAID' AND month_code < $2`,
        [student.id, monthCode]
      );
      const previousDue = parseFloat(priorRes.rows[0]?.prior_due || 0);

      // Check if deadline is in the past (e.g. backdated bill generation)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const deadlineDate = new Date(deadline);
      deadlineDate.setHours(0, 0, 0, 0);

      let initialFineDays = 0;
      let initialLateFine = 0;
      if (today > deadlineDate) {
        const rawDays = Math.max(0, Math.floor((today - deadlineDate) / (1000 * 60 * 60 * 24)));
        initialFineDays = Math.min(30, rawDays);
        initialLateFine = Math.min(600, initialFineDays * 20);
      }

      const totalPayable = cleanBaseBill + previousDue + initialLateFine;
      const initialDue = cleanBaseBill + initialLateFine;

      // 3. Upsert bill record
      const existingBill = await query(
        `SELECT id, paid_amount FROM bills WHERE user_id = $1 AND month_code = $2 LIMIT 1`,
        [student.id, monthCode]
      );

      let billId;
      if (existingBill.rows.length > 0) {
        billId = existingBill.rows[0].id;
        const currentPaid = parseFloat(existingBill.rows[0].paid_amount || 0);
        const monthCharge = cleanBaseBill + initialLateFine;
        const newDue = Math.max(0, monthCharge - currentPaid);
        const newTotalPayable = Math.max(0, cleanBaseBill + previousDue + initialLateFine - currentPaid);
        const billStatus = newDue <= 0 && newTotalPayable <= 0 ? 'PAID' : (currentPaid > 0 ? 'PARTIAL' : 'DUE');
        await query(
          `UPDATE bills
           SET month = $1, base_bill = $2, due_amount = $3, previous_due = $4,
               total_payable = $5, payment_deadline = $6, billing_cycle = $7,
               late_fine = $8, fine_days = $9, status = $10
           WHERE id = $11`,
          [month, cleanBaseBill, newDue, previousDue, newTotalPayable, deadline, cycle, initialLateFine, initialFineDays, billStatus, billId]
        );
      } else {
        billId = `bill_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        await query(
          `INSERT INTO bills (
            id, user_id, month, month_code, base_bill, paid_amount, due_amount,
            late_fine, previous_due, total_payable, fine_days, fine_per_day,
            payment_deadline, status, billing_cycle, meal_counts
          ) VALUES ($1, $2, $3, $4, $5, 0, $6, $7, $8, $9, $10, 20, $11, 'DUE', $12, $13)`,
          [
            billId,
            student.id,
            month,
            monthCode,
            cleanBaseBill,
            initialDue,
            initialLateFine,
            previousDue,
            totalPayable,
            initialFineDays,
            deadline,
            cycle,
            JSON.stringify({ breakfast: 30, lunch: 30, dinner: 30, specialFeasts: 0 }),
          ]
        );
      }

      generatedBills.push({ billId, studentId: student.id, studentName: student.name });

      // 4. Automatically generate notification alert for the student
      const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const notifTitle = `Mess Bill Published: ${month}`;
      const notifMsg = `Your hostel mess bill for ${month} of ₹${totalPayable.toFixed(2)} has been published. Due deadline is ${new Date(deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}.`;

      await query(
        `INSERT INTO notifications (id, user_id, title, message, type, is_read)
         VALUES ($1, $2, $3, $4, 'BILL', FALSE)`,
        [notifId, student.id, notifTitle, notifMsg]
      );
    }

    return res.status(201).json({
      success: true,
      count: generatedBills.length,
      message: `Successfully generated ${generatedBills.length} mess ${generatedBills.length === 1 ? 'bill' : 'bills'} for ${month}. Notification alerts delivered to student dashboards.`,
      bills: generatedBills,
    });
  } catch (error) {
    console.error('[GENERATE HOSTEL BILLS ERROR]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate hostel mess bills.',
      error: error.message,
    });
  }
};

/**
 * POST /api/bills
 * Create a new single bill (Admin only) and notify student
 */
export const createBill = async (req, res) => {
  try {
    const adminHostel = (req.user?.hostel || '').trim().toUpperCase();
    if (!adminHostel) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have an assigned hostel to create bills for.',
      });
    }

    const {
      userId,
      month,
      monthCode,
      baseBill = 2450,
      lateFine = 0,
      previousDue = 0,
      paymentDeadline,
      billingCycle,
      mealCounts,
    } = req.body;

    if (!userId || !month || !monthCode) {
      return res.status(400).json({
        success: false,
        message: 'userId, month, and monthCode are required.',
      });
    }

    // Verify the target student belongs strictly to the admin's assigned hostel
    const studentRes = await query(
      `SELECT id, name, hostel FROM users WHERE id = $1 AND role = 'STUDENT' LIMIT 1`,
      [userId]
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
        message: `Access denied. As an administrator of ${adminHostel} Hostel, you can only create bills for residents of ${adminHostel}.`,
      });
    }

    // Restrict generation for upcoming / future months
    if (isUpcomingBillingMonth(monthCode)) {
      return res.status(400).json({
        success: false,
        message: `Cannot generate mess bills for upcoming months (${month || monthCode}). Bills can only be generated for the current or previous months.`,
      });
    }

    const billId = `bill_${Date.now()}`;
    const cleanBaseBill = parseFloat(baseBill);
    const cleanLateFine = parseFloat(lateFine || 0);
    const cleanPrevDue = parseFloat(previousDue || 0);
    const dueAmount = cleanBaseBill + cleanLateFine;
    const totalPayable = cleanBaseBill + cleanLateFine + cleanPrevDue;
    const deadline = paymentDeadline || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const cycle = billingCycle || `${month} Mess Cycle`;

    const result = await query(
      `INSERT INTO bills (
        id, user_id, month, month_code, base_bill, paid_amount, due_amount,
        late_fine, previous_due, total_payable, fine_days, fine_per_day,
        payment_deadline, status, billing_cycle, meal_counts
      ) VALUES ($1, $2, $3, $4, $5, 0, $6, $7, $8, $9, 0, 20, $10, 'DUE', $11, $12)
      RETURNING *`,
      [
        billId,
        userId,
        month,
        monthCode,
        cleanBaseBill,
        dueAmount,
        cleanLateFine,
        cleanPrevDue,
        totalPayable,
        deadline,
        cycle,
        JSON.stringify(mealCounts || { breakfast: 30, lunch: 30, dinner: 30, specialFeasts: 0 }),
      ]
    );

    // Send notification to user account
    const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    await query(
      `INSERT INTO notifications (id, user_id, title, message, type, is_read)
       VALUES ($1, $2, $3, $4, 'BILL', FALSE)`,
      [
        notifId,
        userId,
        `Mess Bill Published: ${month}`,
        `Your hostel mess bill for ${month} of ₹${totalPayable.toFixed(2)} has been generated. Payment due by ${new Date(deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}.`,
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Bill generated and student notified successfully.',
      bill: formatBill(result.rows[0]),
    });
  } catch (error) {
    console.error('[CREATE BILL ERROR]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate bill.',
      error: error.message,
    });
  }
};

/**
 * POST /api/bills/notify-defaulters
 * Dispatches automated payment reminders to all resident students with outstanding dues in admin's hostel
 */
export const notifyDefaulters = async (req, res) => {
  try {
    const adminId = req.user.id;

    // 1. Get administrator's hostel
    const adminRes = await query('SELECT hostel, name FROM users WHERE id = $1', [adminId]);
    const adminHostel = adminRes.rows[0]?.hostel;

    if (!adminHostel) {
      return res.status(400).json({
        success: false,
        message: 'Administrator does not have an assigned hostel.',
      });
    }

    // 2. Fetch all resident students in this hostel who have unpaid/partially paid bills
    const defaultersRes = await query(
      `SELECT u.id, u.name, u.email, u.roll_no, u.room,
              SUM(b.due_amount) AS total_due,
              COUNT(b.id) AS unpaid_bills_count,
              MIN(b.payment_deadline) AS earliest_deadline
       FROM users u
       JOIN bills b ON u.id = b.user_id
       WHERE (LOWER(u.hostel) = LOWER($1) OR UPPER(u.hostel) = UPPER($1))
         AND b.status IN ('DUE', 'OVERDUE', 'PARTIAL')
         AND b.due_amount > 0
       GROUP BY u.id, u.name, u.email, u.roll_no, u.room
       HAVING SUM(b.due_amount) > 0`,
      [adminHostel.trim()]
    );

    const defaulters = defaultersRes.rows;

    if (defaulters.length === 0) {
      return res.json({
        success: true,
        count: 0,
        message: `All residents in ${adminHostel.toUpperCase()} are fully paid. No reminders needed!`,
      });
    }

    // 3. Insert in-app reminder notification for each defaulter
    const now = Date.now();
    for (let i = 0; i < defaulters.length; i++) {
      const student = defaulters[i];
      const dueAmt = parseFloat(student.total_due || 0);
      const notifId = `notif_${now}_rem_${student.id.substring(0, 6)}_${i}`;
      const notifTitle = 'Outstanding Mess Dues Reminder';
      const deadlineText = student.earliest_deadline 
        ? ` by ${new Date(student.earliest_deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` 
        : '';
      const notifMsg = `Hostel Administration Notice: You have an outstanding mess dues balance of ₹${dueAmt.toLocaleString('en-IN')}. Please settle your balance${deadlineText} to avoid late fines.`;

      await query(
        `INSERT INTO notifications (id, user_id, title, message, type, is_read)
         VALUES ($1, $2, $3, $4, 'BILL', FALSE)`,
        [notifId, student.id, notifTitle, notifMsg]
      );
    }

    return res.json({
      success: true,
      count: defaulters.length,
      message: `Dispatched automated due notifications to ${defaulters.length} students with outstanding balances in ${adminHostel.toUpperCase()}.`,
      defaulters: defaulters.map(d => ({
        name: d.name,
        rollNo: d.roll_no,
        totalDue: parseFloat(d.total_due),
      })),
    });
  } catch (error) {
    console.error('[NOTIFY DEFAULTERS ERROR]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to dispatch reminders to defaulters.',
      error: error.message,
    });
  }
};

export default {
  formatBill,
  getCurrentBill,
  getBills,
  generateHostelBills,
  createBill,
  notifyDefaulters,
};
