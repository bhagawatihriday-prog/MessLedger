import { query } from '../config/db.js';
import { appCache } from '../utils/cache.js';

/**
 * GET /api/user/profile
 * Returns the profile of the currently authenticated user
 */
export const getProfile = async (req, res) => {
  return res.json({
    success: true,
    user: req.user,
  });
};

/**
 * PUT /api/user/profile
 * Updates profile fields (name, room, phone, avatarUrl)
 */
export const updateProfile = async (req, res) => {
  try {
    const { name, phone, department, avatarUrl } = req.body;
    const userId = req.user.id;
    const isSpecialRole = req.user.role === 'ADMIN' || req.user.role === 'SENIOR_WARDEN' || req.user.role === 'WARDEN';

    // Room allocation is strictly managed by hostel administrators; boarders cannot self-modify room
    const result = await query(
      `UPDATE users
       SET name = COALESCE($1, name),
           phone = COALESCE($2, phone),
           department = COALESCE($3, department),
           avatar_url = COALESCE($4, avatar_url),
           updated_at = NOW()
       WHERE id = $5
       RETURNING id, name, email, role, designation, hostel, room, roll_no, phone, department, avatar_url, created_at`,
      [
        name ? name.trim() : null,
        phone ? phone.trim() : null,
        department ? department.trim() : null,
        avatarUrl,
        userId,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.',
      });
    }

    const row = result.rows[0];



    const updatedUser = {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      designation: row.designation || (row.role === 'SENIOR_WARDEN' || row.role === 'ADMIN' ? 'Senior Warden' : (row.role === 'WARDEN' ? 'Warden' : 'Resident Student')),
      hostel: row.hostel ? row.hostel.toUpperCase() : null,
      room: row.room,
      rollNo: row.roll_no,
      phone: row.phone || '',
      department: row.department || '',
      avatarUrl: row.avatar_url,
      joinedDate: row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : '',
    };

    // Invalidate cached auth profile for this user
    appCache.delPrefix(`auth:${userId}`);

    return res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: updatedUser,
    });
  } catch (error) {
    console.error('[PROFILE UPDATE ERROR]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update profile.',
      error: error.message,
    });
  }
};

/**
 * DELETE /api/user/:id or DELETE /api/user
 * Deletes a user account.
 * - STRICT ACCESS CONTROL: Only Administrators or Wardens can delete user accounts.
 * - Regular students cannot delete their accounts.
 */
export const deleteUser = async (req, res) => {
  try {
    // Strict Admin check: Only ADMIN, SENIOR_WARDEN, or WARDEN
    if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'SENIOR_WARDEN' && req.user.role !== 'WARDEN')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only senior wardens and wardens are permitted to delete user accounts.',
      });
    }

    const adminHostel = (req.user.hostel || '').trim().toUpperCase();
    if (!adminHostel) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have an assigned hostel to manage user accounts.',
      });
    }

    const paramId = req.params.id;
    const targetIdentifier = paramId && paramId !== 'profile' && paramId !== 'account'
      ? paramId
      : req.body?.userId || req.body?.rollNo || req.body?.email;

    if (!targetIdentifier) {
      return res.status(400).json({
        success: false,
        message: 'Please provide the user ID, roll number, or email of the account to delete.',
      });
    }

    // Verify user existence by ID, roll_no, or email
    const userRes = await query(
      `SELECT id, name, email, roll_no, role, hostel 
       FROM users 
       WHERE id = $1 OR UPPER(roll_no) = UPPER($1) OR LOWER(email) = LOWER($1)
       LIMIT 1`,
      [targetIdentifier]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `User account with identifier "${targetIdentifier}" not found.`,
      });
    }

    const targetUser = userRes.rows[0];

    // Enforce that administrators can only delete users belonging to their own assigned hostel
    if (targetUser.hostel && targetUser.hostel.trim().toUpperCase() !== adminHostel) {
      return res.status(403).json({
        success: false,
        message: `Access denied. As an administrator of ${adminHostel} Hostel, you can only delete accounts belonging to ${adminHostel}.`,
      });
    }

    // Delete user from users table.
    // Relational cascades automatically handle dependents:
    // - hostels.senior_warden_id / warden_id are set to NULL via ON DELETE SET NULL
    // - bills, payments, and notifications cascade via ON DELETE CASCADE / SET NULL
    // - Boarder registration status is derived dynamically (LEFT JOIN users) without data drift

    // Delete user (associated bills, payments, and notifications cascade via ON DELETE CASCADE)
    await query('DELETE FROM users WHERE id = $1', [targetUser.id]);

    // Invalidate cached auth & hostel state
    appCache.delPrefix(`auth:${targetUser.id}`);
    appCache.del('hostels:all');
    appCache.delPrefix('hostels:');

    // If admin is somehow deleting their own logged-in admin account, clear the cookie
    if (req.user.id === targetUser.id) {
      res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 0,
      });
    }

    return res.json({
      success: true,
      message: `User account "${targetUser.name}" (${targetUser.email}, Roll: ${targetUser.roll_no || 'N/A'}) has been permanently deleted.`,
      deletedUser: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        rollNo: targetUser.roll_no,
        role: targetUser.role,
      },
    });
  } catch (error) {
    console.error('[DELETE USER ERROR]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete user account.',
      error: error.message,
    });
  }
};

/**
 * GET /api/user/students
 * Retrieve all registered student accounts for the admin's hostel
 */
export const getStudents = async (req, res) => {
  try {
    const adminHostel = req.user.hostel;
    let sql = `SELECT id, name, email, roll_no, room, hostel, department, phone, avatar_url, created_at FROM users WHERE role = 'STUDENT'`;
    const params = [];
    if (adminHostel) {
      sql += ` AND (LOWER(hostel) = LOWER($1) OR UPPER(hostel) = UPPER($1))`;
      params.push(adminHostel.trim());
    }
    sql += ` ORDER BY room ASC, name ASC`;
    const result = await query(sql, params);
    return res.json(result.rows);
  } catch (error) {
    console.error('[GET STUDENTS ERROR]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve registered students.',
      error: error.message,
    });
  }
};

/**
 * PUT /api/user/:id/room
 * Update a student's room assignment (Strictly Admin / Warden only)
 */
export const updateStudentRoom = async (req, res) => {
  try {
    if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'SENIOR_WARDEN' && req.user.role !== 'WARDEN')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only senior wardens and wardens can reallocate student rooms.',
      });
    }

    const adminHostel = (req.user.hostel || '').trim().toUpperCase();
    if (!adminHostel) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have an assigned hostel to manage rooms.',
      });
    }

    const { id } = req.params;
    const { room } = req.body;

    if (!room || !String(room).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid room number.',
      });
    }

    const cleanRoom = String(room).trim();

    // 1. Update users table (target must be a STUDENT belonging strictly to the admin's hostel)
    const userRes = await query(
      `UPDATE users
       SET room = $1, updated_at = NOW()
       WHERE id = $2 AND role = 'STUDENT' AND (LOWER(hostel) = LOWER($3) OR UPPER(hostel) = UPPER($3))
       RETURNING id, name, roll_no, room, hostel`,
      [cleanRoom, id, adminHostel]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Student account not found in ${adminHostel} Hostel.`,
      });
    }

    const updatedStudent = userRes.rows[0];

    // 2. Keep master boarders table in sync
    if (updatedStudent.roll_no) {
      await query(
        `UPDATE boarders SET room = $1 WHERE UPPER(roll_no) = UPPER($2)`,
        [cleanRoom, updatedStudent.roll_no]
      );
    }

    // 3. Dispatch in-app notification to the student
    const notifId = `notif_${Date.now()}_room`;
    await query(
      `INSERT INTO notifications (id, user_id, title, message, type, is_read)
       VALUES ($1, $2, $3, $4, 'INFO', FALSE)`,
      [
        notifId,
        updatedStudent.id,
        'Hostel Room Reallocated',
        `Your hostel room has been updated to Room ${cleanRoom} by the Hostel Administration.`,
      ]
    );

    // Invalidate cached auth & hostel directory
    appCache.delPrefix(`auth:${id}`);
    appCache.del('hostels:all');
    appCache.delPrefix('hostels:');

    return res.json({
      success: true,
      message: `Successfully reallocated ${updatedStudent.name} (${updatedStudent.roll_no || 'Student'}) to Room ${cleanRoom}.`,
      student: updatedStudent,
    });
  } catch (error) {
    console.error('[UPDATE STUDENT ROOM ERROR]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update student room.',
      error: error.message,
    });
  }
};

/**
 * POST /api/user/bulk-delete
 * Bulk delete registered student user accounts (Scoped to Admin's assigned hostel)
 */
export const deleteUsersBulk = async (req, res) => {
  try {
    const adminHostel = req.user?.hostel ? req.user.hostel.trim().toUpperCase() : null;
    const { rollNos = [], ids = [], emails = [] } = req.body;

    if (
      (!Array.isArray(rollNos) || rollNos.length === 0) &&
      (!Array.isArray(ids) || ids.length === 0) &&
      (!Array.isArray(emails) || emails.length === 0)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one student identifier (ID, roll number, or email).',
      });
    }

    const cleanIds = (Array.isArray(ids) ? ids : []).map(String);
    const cleanRolls = (Array.isArray(rollNos) ? rollNos : []).map((r) => String(r).trim().toUpperCase());
    const cleanEmails = (Array.isArray(emails) ? emails : []).map((e) => String(e).trim().toLowerCase());

    let sql = `
      DELETE FROM users
      WHERE role = 'STUDENT'
        AND (
          id = ANY($1::text[])
          OR UPPER(roll_no) = ANY($2::text[])
          OR LOWER(email) = ANY($3::text[])
        )
    `;
    const params = [cleanIds, cleanRolls, cleanEmails];

    if (adminHostel) {
      sql += ` AND (UPPER(hostel) = $4 OR LOWER(hostel) = LOWER($4))`;
      params.push(adminHostel);
    }

    sql += ` RETURNING id, name, roll_no, email, hostel`;

    const result = await query(sql, params);

    // Invalidate cached auth & hostel directory
    appCache.delPrefix('auth:');
    appCache.del('hostels:all');
    appCache.delPrefix('hostels:');

    return res.json({
      success: true,
      message: `Successfully deleted ${result.rowCount} user account(s).`,
      count: result.rowCount,
      deletedUsers: result.rows,
    });
  } catch (error) {
    console.error('[BULK DELETE USERS ERROR]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to bulk delete user accounts.',
      error: error.message,
    });
  }
};

export default {
  getProfile,
  updateProfile,
  deleteUser,
  deleteUsersBulk,
  getStudents,
  updateStudentRoom,
};
