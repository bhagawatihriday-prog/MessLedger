import { query } from '../config/db.js';
import { appCache } from '../utils/cache.js';

/**
 * Format database boarder row to frontend model
 */
export const formatBoarder = (row) => ({
  id: row.id,
  rollNo: row.roll_no,
  name: row.name,
  room: row.room,
  email: row.email,
  hostel: (row.hostel || '').toUpperCase(),
  department: row.department || '',
  phone: row.phone || '',
  isRegistered: Boolean(row.is_registered),
  registeredAt: row.registered_at || null,
  createdAt: row.created_at,
});

/**
 * Synchronize the rooms array column in hostels table based on distinct active boarder rooms
 */
export const syncHostelRooms = async (hostelId) => {
  if (!hostelId) return;
  try {
    await query(
      `UPDATE hostels
       SET rooms = (
         SELECT COALESCE(array_agg(DISTINCT room ORDER BY room), '{}')
         FROM boarders
         WHERE LOWER(hostel) = LOWER($1) AND room IS NOT NULL AND TRIM(room) != ''
       )
       WHERE LOWER(id) = LOWER($1)`,
      [hostelId.trim()]
    );
  } catch (err) {
    console.error(`[SYNC HOSTEL ROOMS ERROR] Failed for ${hostelId}:`, err.message);
  }
};

/**
 * GET /api/boarders
 * Get all boarders (optionally filtered by ?hostel=LBBH)
 */
export const getBoarders = async (req, res) => {
  try {
    const { hostel } = req.query;
    let sql = `
      SELECT b.id, b.roll_no,
             COALESCE(u.name, b.name) AS name,
             COALESCE(u.room, b.room) AS room,
             b.email, b.hostel,
             COALESCE(u.department, b.department) AS department,
             COALESCE(u.phone, b.phone) AS phone,
             (u.id IS NOT NULL) AS is_registered,
             u.created_at AS registered_at,
             b.created_at
      FROM boarders b
      LEFT JOIN users u 
        ON (LOWER(u.email) = LOWER(b.email) OR (b.roll_no IS NOT NULL AND u.roll_no IS NOT NULL AND UPPER(u.roll_no) = UPPER(b.roll_no)))
        AND u.role = 'STUDENT'
    `;
    const params = [];

    if (hostel) {
      sql += ' WHERE UPPER(b.hostel) = $1';
      params.push(hostel.trim().toUpperCase());
    }

    sql += ' ORDER BY b.room ASC, b.name ASC';

    const result = await query(sql, params);
    return res.json(result.rows.map(formatBoarder));
  } catch (error) {
    console.error('[GET BOARDERS ERROR]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve boarders.',
      error: error.message,
    });
  }
};

/**
 * POST /api/boarders/verify
 * Verification check before student registration
 */
export const verifyBoarder = async (req, res) => {
  try {
    const { rollNo, email, hostel } = req.body;
    if (!rollNo || !email || !hostel) {
      return res.status(400).json({
        verified: false,
        message: 'Roll number, email, and hostel are required.',
      });
    }

    const cleanRoll = rollNo.trim().toUpperCase();
    const cleanEmail = email.trim().toLowerCase();
    const cleanHostel = hostel.trim().toUpperCase();

    const result = await query('SELECT * FROM boarders WHERE UPPER(roll_no) = $1', [cleanRoll]);
    if (result.rows.length === 0) {
      return res.status(400).json({
        verified: false,
        message: `Roll Number "${cleanRoll}" is not on the approved resident roster for ${hostel}.`,
      });
    }

    const boarder = result.rows[0];
    const rosterHostel = (boarder.hostel || '').toUpperCase();
    if (rosterHostel !== cleanHostel && !cleanHostel.includes(rosterHostel) && !rosterHostel.includes(cleanHostel)) {
      return res.status(400).json({
        verified: false,
        message: `Roll Number "${cleanRoll}" is assigned to "${boarder.hostel} Hostel", not "${hostel}".`,
      });
    }

    if ((boarder.email || '').toLowerCase() !== cleanEmail) {
      return res.status(400).json({
        verified: false,
        message: `Provided email does not match official institutional email (${boarder.email}) registered for Roll Number ${cleanRoll}.`,
      });
    }

    // Check if account already exists in users table
    const userCheck = await query(
      'SELECT id FROM users WHERE UPPER(roll_no) = $1 OR LOWER(email) = $2 LIMIT 1',
      [cleanRoll, cleanEmail]
    );

    if (userCheck.rows.length > 0) {
      return res.status(400).json({
        verified: false,
        message: `Roll Number "${cleanRoll}" has already registered an account. Please proceed to login.`,
      });
    }

    return res.json({
      verified: true,
      boarder: formatBoarder({ ...boarder, is_registered: false }),
    });
  } catch (error) {
    console.error('[VERIFY BOARDER ERROR]', error);
    return res.status(500).json({
      verified: false,
      message: 'Verification check failed.',
      error: error.message,
    });
  }
};

/**
 * POST /api/boarders
 * Add a new boarder record
 * Strictly prevents cross-hostel duplicate assignment (one student, one hostel)
 */
export const addBoarder = async (req, res) => {
  try {
    const { rollNo, name, room, email, hostel, department, phone } = req.body;

    if (!rollNo || !name || !room || !email) {
      return res.status(400).json({
        success: false,
        message: 'Roll number, name, room, and email are required.',
      });
    }

    const cleanRoll = rollNo.trim().toUpperCase();
    const cleanEmail = email.trim().toLowerCase();

    // 1. Enforce Administrator Hostel Scoping
    const adminHostel = req.user?.hostel ? req.user.hostel.trim().toUpperCase() : null;
    const targetHostel = (adminHostel || hostel || '').trim().toUpperCase();

    if (adminHostel && hostel && hostel.trim().toUpperCase() !== adminHostel) {
      return res.status(403).json({
        success: false,
        message: `Access denied. As an administrator of ${adminHostel} Hostel, you can only add boarders to ${adminHostel}.`,
      });
    }

    // 2. Email Verification Check: Check if email exists in boarders across ANY hostel
    const checkBoarderEmail = await query(
      `SELECT roll_no, name, hostel, room, email 
       FROM boarders 
       WHERE LOWER(email) = $1 
       LIMIT 1`,
      [cleanEmail]
    );

    if (checkBoarderEmail.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'This email already exists',
      });
    }

    // Check if roll_no exists in boarders across ANY hostel
    const checkBoarderRoll = await query(
      `SELECT roll_no, name, hostel, room, email 
       FROM boarders 
       WHERE UPPER(roll_no) = $1 
       LIMIT 1`,
      [cleanRoll]
    );

    if (checkBoarderRoll.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'This email already exists',
      });
    }

    // 3. Check if email or roll_no already registered as an active user account in ANY hostel
    const checkUser = await query(
      `SELECT roll_no, name, hostel, room, email 
       FROM users 
       WHERE LOWER(email) = $1 OR (roll_no IS NOT NULL AND UPPER(roll_no) = $2)
       LIMIT 1`,
      [cleanEmail, cleanRoll]
    );

    if (checkUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'This email already exists',
      });
    }

    const id = `bdr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const result = await query(
      `INSERT INTO boarders (id, roll_no, name, room, email, hostel, department, phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        id,
        cleanRoll,
        name.trim(),
        room.trim(),
        cleanEmail,
        targetHostel,
        department ? department.trim() : null,
        phone ? phone.trim() : null,
      ]
    );

    // Sync room allocation in hostels table
    if (targetHostel) {
      await syncHostelRooms(targetHostel);
    }

    appCache.del('hostels:all');
    appCache.delPrefix('hostels:');

    return res.status(201).json(formatBoarder(result.rows[0]));
  } catch (error) {
    console.error('[ADD BOARDER ERROR]', error);
    return res.status(error.code === '23505' ? 400 : 500).json({
      success: false,
      message: error.code === '23505' ? 'This email already exists' : 'Failed to add boarder.',
      error: error.message,
    });
  }
};

/**
 * POST /api/boarders/bulk
 * Bulk import boarders from an array of records
 * Strictly filters out cross-hostel duplicates
 */
export const bulkImportBoarders = async (req, res) => {
  try {
    const { records = [], defaultHostel = '' } = req.body;
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No records provided for bulk import.',
      });
    }

    const adminHostel = req.user?.hostel ? req.user.hostel.trim().toUpperCase() : null;
    const added = [];
    const skipped = [];

    for (let i = 0; i < records.length; i++) {
      const rec = records[i];
      const cleanRoll = (rec.rollNo || '').trim().toUpperCase();
      const cleanEmail = (rec.email || '').trim().toLowerCase();
      const cleanName = (rec.name || '').trim();
      const cleanRoom = (rec.room || '').trim();
      const hostel = adminHostel || (rec.hostel || defaultHostel).trim().toUpperCase();

      if (!cleanRoll || !cleanEmail || !cleanName || !cleanRoom) {
        skipped.push({ row: i + 1, reason: 'Missing required fields' });
        continue;
      }

      // Check cross-hostel duplicate in boarders table
      const dupBoarder = await query(
        `SELECT roll_no, name, hostel, room, email 
         FROM boarders 
         WHERE UPPER(roll_no) = $1 OR LOWER(email) = $2 
         LIMIT 1`,
        [cleanRoll, cleanEmail]
      );

      if (dupBoarder.rows.length > 0) {
        skipped.push({
          row: i + 1,
          rollNo: cleanRoll,
          name: cleanName,
          reason: 'This email already exists',
        });
        continue;
      }

      // Check cross-hostel duplicate in users table
      const dupUser = await query(
        `SELECT roll_no, name, hostel, room, email 
         FROM users 
         WHERE (roll_no IS NOT NULL AND UPPER(roll_no) = $1) OR LOWER(email) = $2 
         LIMIT 1`,
        [cleanRoll, cleanEmail]
      );

      if (dupUser.rows.length > 0) {
        skipped.push({
          row: i + 1,
          rollNo: cleanRoll,
          name: cleanName,
          reason: 'This email already exists',
        });
        continue;
      }

      const cleanDept = rec.department ? rec.department.trim() : null;
      const cleanPhone = rec.phone ? rec.phone.trim() : null;

      const id = `bdr_${Date.now()}_${i}`;
      const insert = await query(
        `INSERT INTO boarders (id, roll_no, name, room, email, hostel, department, phone)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [id, cleanRoll, cleanName, cleanRoom, cleanEmail, hostel, cleanDept, cleanPhone]
      );

      added.push(formatBoarder(insert.rows[0]));
    }

    // Synchronize room allocations for all affected hostels
    const affectedHostels = new Set(added.map((b) => b.hostel).filter(Boolean));
    for (const h of affectedHostels) {
      await syncHostelRooms(h);
    }

    if (added.length > 0) {
      appCache.del('hostels:all');
      appCache.delPrefix('hostels:');
    }

    return res.json({
      success: true,
      message: `Imported ${added.length} boarders successfully (${skipped.length} skipped).`,
      added,
      skipped,
    });
  } catch (error) {
    console.error('[BULK IMPORT BOARDERS ERROR]', error);
    return res.status(500).json({
      success: false,
      message: 'Bulk import failed.',
      error: error.message,
    });
  }
};

/**
 * PUT /api/boarders/:id
 * Update an existing boarder
 * Enforces cross-hostel uniqueness on Roll Number and Email
 */
export const updateBoarder = async (req, res) => {
  try {
    const { id } = req.params;
    const { rollNo, name, room, email, hostel, department, phone } = req.body;

    // 1. Verify existence and admin authority
    const currentRes = await query('SELECT * FROM boarders WHERE id = $1', [id]);
    if (currentRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Boarder record not found.',
      });
    }

    const currentBoarder = currentRes.rows[0];
    const adminHostel = req.user?.hostel ? req.user.hostel.trim().toUpperCase() : null;

    if (adminHostel && currentBoarder.hostel && currentBoarder.hostel.toUpperCase() !== adminHostel) {
      return res.status(403).json({
        success: false,
        message: `Access denied. You can only update boarders belonging to ${adminHostel} Hostel.`,
      });
    }

    const cleanRoll = rollNo ? rollNo.trim().toUpperCase() : currentBoarder.roll_no;
    const cleanEmail = email ? email.trim().toLowerCase() : currentBoarder.email;

    // 2. Check conflict with other boarders across ANY hostel
    const checkConflict = await query(
      `SELECT roll_no, name, hostel, room, email 
       FROM boarders 
       WHERE (UPPER(roll_no) = $1 OR LOWER(email) = $2) AND id != $3 
       LIMIT 1`,
      [cleanRoll, cleanEmail, id]
    );

    if (checkConflict.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'This email already exists',
      });
    }

    // 3. Check conflict with active users registered under other hostels
    const checkUserConflict = await query(
      `SELECT roll_no, name, hostel, email 
       FROM users 
       WHERE ((roll_no IS NOT NULL AND UPPER(roll_no) = $1) OR LOWER(email) = $2)
         AND UPPER(COALESCE(roll_no, '')) != UPPER($3)
       LIMIT 1`,
      [cleanRoll, cleanEmail, currentBoarder.roll_no || '']
    );

    if (checkUserConflict.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'This email already exists',
      });
    }

    const targetHostel = adminHostel || (hostel ? hostel.trim().toUpperCase() : currentBoarder.hostel);

    const result = await query(
      `UPDATE boarders
       SET roll_no = COALESCE($1, roll_no),
           name = COALESCE($2, name),
           room = COALESCE($3, room),
           email = COALESCE($4, email),
           hostel = COALESCE($5, hostel),
           department = COALESCE($6, department),
           phone = COALESCE($7, phone)
       WHERE id = $8
       RETURNING *`,
      [
        cleanRoll,
        name ? name.trim() : null,
        room ? room.trim() : null,
        cleanEmail,
        targetHostel,
        department !== undefined ? (department ? department.trim() : null) : null,
        phone !== undefined ? (phone ? phone.trim() : null) : null,
        id,
      ]
    );

    const updatedBoarder = result.rows[0];

    // If boarder has already created an active user account, sync profile changes to users table
    const activeUserRes = await query(
      'SELECT id FROM users WHERE UPPER(roll_no) = UPPER($1) OR LOWER(email) = LOWER($2) LIMIT 1',
      [updatedBoarder.roll_no, updatedBoarder.email]
    );

    if (activeUserRes.rows.length > 0) {
      await query(
        `UPDATE users
         SET name = COALESCE($1, name),
             room = COALESCE($2, room),
             email = COALESCE($3, email),
             department = COALESCE($4, department),
             phone = COALESCE($5, phone),
             updated_at = NOW()
         WHERE id = $6`,
        [
          name ? name.trim() : null,
          room ? room.trim() : null,
          cleanEmail,
          department ? department.trim() : null,
          phone ? phone.trim() : null,
          activeUserRes.rows[0].id,
        ]
      );
      updatedBoarder.is_registered = true;
      appCache.delPrefix(`auth:${activeUserRes.rows[0].id}`);
    } else {
      updatedBoarder.is_registered = false;
    }

    // Sync room allocations for the updated boarder's hostel
    if (updatedBoarder.hostel) {
      await syncHostelRooms(updatedBoarder.hostel);
    }

    appCache.del('hostels:all');
    appCache.delPrefix('hostels:');

    return res.json(formatBoarder(updatedBoarder));
  } catch (error) {
    console.error('[UPDATE BOARDER ERROR]', error);
    return res.status(500).json({
      success: false,
      message: error.code === '23505'
        ? 'Duplicate Roll Number or Email conflict. A student can belong to only one hostel.'
        : 'Failed to update boarder record.',
      error: error.message,
    });
  }
};

/**
 * DELETE /api/boarders/:id
 * Delete a boarder record (Scoped to Admin's assigned hostel)
 */
export const deleteBoarder = async (req, res) => {
  try {
    const { id } = req.params;

    const checkRes = await query('SELECT id, hostel, name, roll_no FROM boarders WHERE id = $1', [id]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Boarder record not found.',
      });
    }

    const targetBoarder = checkRes.rows[0];
    const adminHostel = req.user?.hostel ? req.user.hostel.trim().toUpperCase() : null;

    if (adminHostel && targetBoarder.hostel && targetBoarder.hostel.toUpperCase() !== adminHostel) {
      return res.status(403).json({
        success: false,
        message: `Access denied. You can only delete boarders belonging to ${adminHostel} Hostel.`,
      });
    }

    const result = await query('DELETE FROM boarders WHERE id = $1 RETURNING id, hostel', [id]);
    const deletedHostel = result.rows[0]?.hostel;
    if (deletedHostel) {
      await syncHostelRooms(deletedHostel);
    }

    // Automatically remove the resident student's user account if registered
    if (targetBoarder.email || targetBoarder.roll_no) {
      await query(
        `DELETE FROM users 
         WHERE role = 'STUDENT' 
           AND (LOWER(email) = LOWER($1) OR (roll_no IS NOT NULL AND UPPER(roll_no) = UPPER($2)))`,
        [targetBoarder.email, targetBoarder.roll_no]
      );
    }

    // Invalidate cached auth & hostel directory
    appCache.delPrefix('auth:');
    appCache.del('hostels:all');
    appCache.delPrefix('hostels:');

    return res.json({
      success: true,
      message: `Boarder "${targetBoarder.name}" (${targetBoarder.roll_no}) deleted successfully.`,
    });
  } catch (error) {
    console.error('[DELETE BOARDER ERROR]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete boarder record.',
      error: error.message,
    });
  }
};

/**
 * POST /api/boarders/bulk-delete
 * Bulk delete boarders from roster (Scoped to Admin's assigned hostel)
 */
export const deleteBoardersBulk = async (req, res) => {
  try {
    const { ids = [] } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No boarder IDs provided for removal.',
      });
    }

    const adminHostel = req.user?.hostel ? req.user.hostel.trim().toUpperCase() : null;

    // Query matching boarders to check permission and gather emails/roll numbers for user cascade
    let selectSql = 'SELECT id, hostel, name, roll_no, email FROM boarders WHERE id = ANY($1::text[])';
    const selectParams = [ids.map(String)];
    if (adminHostel) {
      selectSql += ' AND UPPER(hostel) = $2';
      selectParams.push(adminHostel);
    }

    const matchingRes = await query(selectSql, selectParams);
    const targetBoarders = matchingRes.rows;

    if (targetBoarders.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No authorized boarders found matching the provided IDs.',
      });
    }

    const validIds = targetBoarders.map((b) => b.id);
    const emails = targetBoarders.map((b) => b.email).filter(Boolean).map((e) => e.trim().toLowerCase());
    const rollNos = targetBoarders.map((b) => b.roll_no).filter(Boolean).map((r) => r.trim().toUpperCase());
    const affectedHostels = new Set(targetBoarders.map((b) => b.hostel).filter(Boolean));

    // Delete boarders from database
    await query('DELETE FROM boarders WHERE id = ANY($1::text[])', [validIds]);

    // Sync hostel rooms for all affected hostels
    for (const h of affectedHostels) {
      await syncHostelRooms(h);
    }

    // Delete corresponding student user accounts if registered
    if (emails.length > 0 || rollNos.length > 0) {
      await query(
        `DELETE FROM users
         WHERE role = 'STUDENT'
           AND (
             LOWER(email) = ANY($1::text[])
             OR UPPER(roll_no) = ANY($2::text[])
           )`,
        [emails, rollNos]
      );
    }

    // Invalidate cached auth & hostel directory
    appCache.delPrefix('auth:');
    appCache.del('hostels:all');
    appCache.delPrefix('hostels:');

    return res.json({
      success: true,
      message: `Successfully removed ${validIds.length} boarder(s) from the hostel roster.`,
      count: validIds.length,
    });
  } catch (error) {
    console.error('[BULK DELETE BOARDERS ERROR]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to bulk remove boarders.',
      error: error.message,
    });
  }
};

export default {
  formatBoarder,
  getBoarders,
  verifyBoarder,
  addBoarder,
  bulkImportBoarders,
  updateBoarder,
  deleteBoarder,
  deleteBoardersBulk,
};
