import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { query } from '../config/db.js';
import { appCache } from '../utils/cache.js';

const JWT_SECRET = (process.env.JWT_SECRET || 'messledger_jwt_secret_key_2026').trim();
const ADMIN_INVITE_TOKEN = process.env.ADMIN_INVITE_TOKEN || 'MESS_ADMIN_2026';
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const ACCESS_TOKEN_EXPIRY = '15m';
export const REFRESH_TOKEN_EXPIRY = '7d';
export const REFRESH_TOKEN_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Cookie options for secure, HTTP-only JWT storage
 */
export const ACCESS_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 15 * 60 * 1000, // 15 minutes
};

export const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: REFRESH_TOKEN_MS, // 7 days
  path: '/',
};

export const COOKIE_OPTIONS = ACCESS_COOKIE_OPTIONS;

export const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Creates a persisted session in database and generates signed access & refresh tokens
 */
export const createSessionAndTokens = async (user, req) => {
  const sessionId = `sess_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
  const userAgent = req.headers['user-agent'] || 'Unknown Device';
  const ipAddress = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip || '127.0.0.1').split(',')[0].trim();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_MS);

  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role, sessionId },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );

  const refreshToken = jwt.sign(
    { id: user.id, sessionId },
    JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );

  const refreshTokenHash = hashToken(refreshToken);

  try {
    await query(
      `INSERT INTO user_sessions (
        id, user_id, refresh_token_hash, user_agent, ip_address, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [sessionId, user.id, refreshTokenHash, userAgent, ipAddress, expiresAt]
    );
  } catch (err) {
    console.warn('[SESSION INSERT WARNING]', err.message);
  }

  return { accessToken, refreshToken, sessionId };
};

/**
 * Format user database row to frontend model
 */
export const formatUserResponse = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  designation: user.designation || (user.role === 'SENIOR_WARDEN' || user.role === 'ADMIN' ? 'Senior Warden' : (user.role === 'WARDEN' ? 'Warden' : 'Resident Student')),
  hostel: user.hostel ? user.hostel.toUpperCase() : 'CMH',
  room: user.room,
  rollNo: user.roll_no,
  phone: user.phone || '',
  department: user.department || '',
  avatarUrl: user.avatar_url,
  joinedDate: user.created_at ? new Date(user.created_at).toISOString().split('T')[0] : '',
});

/**
 * POST /api/auth/register
 * Student registration with institutional boarder roster verification
 */
export const register = async (req, res) => {
  try {
    const { name, email, password, rollNo, hostel, room, phone, department } = req.body;

    if (!name || !email || !password || !rollNo || !hostel) {
      return res.status(400).json({
        success: false,
        message: 'Name, institutional email, password, roll number, and hostel are required.',
      });
    }

    const cleanRoll = rollNo.trim().toUpperCase();
    const cleanEmail = email.trim().toLowerCase();
    const cleanHostel = hostel.trim().toUpperCase();

    // 1. Verify against boarders master list
    const boarderRes = await query(
      'SELECT * FROM boarders WHERE UPPER(roll_no) = $1',
      [cleanRoll]
    );

    if (boarderRes.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: `Hostel Verification Failed: Roll Number "${cleanRoll}" is not on the approved resident roster for ${hostel}. Please contact your hostel superintendent to be added.`,
      });
    }

    const boarder = boarderRes.rows[0];

    // Check hostel match
    const rosterHostel = (boarder.hostel || '').toUpperCase();
    if (rosterHostel !== cleanHostel && !cleanHostel.includes(rosterHostel) && !rosterHostel.includes(cleanHostel)) {
      return res.status(400).json({
        success: false,
        message: `Hostel Allocation Mismatch: Roll Number "${cleanRoll}" is assigned to "${boarder.hostel} Hostel", not "${hostel}".`,
      });
    }

    // Verify institutional email
    if ((boarder.email || '').toLowerCase() !== cleanEmail) {
      return res.status(400).json({
        success: false,
        message: `Institution Email Mismatch: The email provided does not match the official email registered for Roll Number ${cleanRoll} (${boarder.email}).`,
      });
    }

    // Check if account already exists in users table by email or roll number
    const existingUserRes = await query(
      'SELECT id FROM users WHERE LOWER(email) = $1 OR (roll_no IS NOT NULL AND UPPER(roll_no) = $2) LIMIT 1',
      [cleanEmail, cleanRoll]
    );
    if (existingUserRes.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Account Already Exists: An account with Roll Number "${cleanRoll}" or email "${cleanEmail}" is already registered. Please proceed to the Sign In page.`,
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    const userId = `usr_${Date.now()}`;
    const assignedRoom = (room || boarder.room || '').trim();
    const assignedPhone = (phone || boarder.phone || '').trim() || null;
    const assignedDept = (department || boarder.department || '').trim() || null;

    // Resolve hostel foreign key id
    const hostelMatch = await query(
      'SELECT id FROM hostels WHERE LOWER(id) = LOWER($1) OR LOWER(name) = LOWER($1) LIMIT 1',
      [cleanHostel]
    );
    const resolvedHostelId = hostelMatch.rows.length > 0 ? hostelMatch.rows[0].id : null;

    // Insert new user
    const insertRes = await query(
      `INSERT INTO users (id, name, email, password_hash, role, hostel, room, roll_no, phone, department)
       VALUES ($1, $2, $3, $4, 'STUDENT', $5, $6, $7, $8, $9)
       RETURNING *`,
      [userId, name.trim(), cleanEmail, passwordHash, resolvedHostelId, assignedRoom, cleanRoll, assignedPhone, assignedDept]
    );

    // Create initial active bill for this student
    const billId = `bill_${Date.now()}`;
    const currentMonth = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date());
    const monthCode = new Date().toISOString().slice(0, 7);

    await query(
      `INSERT INTO bills (
        id, user_id, month, month_code, base_bill, paid_amount, due_amount,
        late_fine, previous_due, total_payable, fine_days, fine_per_day,
        payment_deadline, status, billing_cycle, meal_counts
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
      [
        billId,
        userId,
        currentMonth,
        monthCode,
        2450.00,
        0.00,
        2450.00,
        0.00,
        0.00,
        2450.00,
        0,
        20.00,
        new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        'DUE',
        `01 ${currentMonth.split(' ')[0]} - End of month`,
        JSON.stringify({ breakfast: 28, lunch: 30, dinner: 29, specialFeasts: 1 }),
      ]
    );

    // Create welcome notification
    await query(
      `INSERT INTO notifications (id, user_id, title, message, type)
       VALUES ($1, $2, $3, $4, 'SYSTEM')`,
      [
        `notif_${Date.now()}`,
        userId,
        'Welcome to MessLedger',
        `Welcome ${name}! Your account has been verified for ${boarder.hostel || hostel} hostel. You can view your monthly mess bills and pay dues online.`,
      ]
    );

    const newUser = insertRes.rows[0];
    const { accessToken, refreshToken } = await createSessionAndTokens(newUser, req);

    res.cookie('token', accessToken, ACCESS_COOKIE_OPTIONS);
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

    return res.status(201).json({
      success: true,
      message: 'Account registered and hostel residency verified successfully.',
      user: formatUserResponse(newUser),
      token: accessToken,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('[REGISTER ERROR]', error);
    return res.status(500).json({
      success: false,
      message: 'Registration failed due to a server error. Please try again.',
      error: error.message,
    });
  }
};

/**
 * POST /api/auth/admin-register
 * Administrator registration requiring valid admin invitation token
 */
export const adminRegister = async (req, res) => {
  try {
    const { name, email, password, designation, hostel, phone, inviteToken } = req.body;

    if (!name || !email || !password || !inviteToken) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password, and invitation token are required.',
      });
    }

    // Verify invitation token
    if (inviteToken.trim() !== ADMIN_INVITE_TOKEN) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired admin invitation token. Authorization restricted.',
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if email already registered
    const existing = await query('SELECT id FROM users WHERE LOWER(email) = $1', [cleanEmail]);
    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const adminId = `adm_${Date.now()}`;

    // Resolve hostel foreign key id
    const cleanHostel = (hostel || '').trim();
    let resolvedHostelId = null;
    if (cleanHostel) {
      const hostelMatch = await query(
        'SELECT id FROM hostels WHERE LOWER(id) = LOWER($1) OR LOWER(name) = LOWER($1) LIMIT 1',
        [cleanHostel]
      );
      resolvedHostelId = hostelMatch.rows.length > 0 ? hostelMatch.rows[0].id : cleanHostel.toLowerCase();
    }

    // Determine designation and role
    const cleanDesig = (designation || '').trim();
    const isWarden = cleanDesig.toLowerCase() === 'warden' || (cleanDesig.toLowerCase().includes('warden') && !cleanDesig.toLowerCase().includes('senior') && !cleanDesig.toLowerCase().includes('sr'));
    const assignedRole = isWarden ? 'WARDEN' : 'SENIOR_WARDEN';
    const officialDesignation = isWarden ? 'Warden' : 'Senior Warden';

    const insertRes = await query(
      `INSERT INTO users (id, name, email, password_hash, role, designation, hostel, phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [adminId, name.trim(), cleanEmail, passwordHash, assignedRole, officialDesignation, resolvedHostelId, phone ? phone.trim() : null]
    );

    const newAdmin = insertRes.rows[0];

    // Link hostel senior_warden_id or warden_id foreign key in hostels table
    if (resolvedHostelId) {
      if (isWarden) {
        await query(
          `UPDATE hostels 
           SET warden_id = $1 
           WHERE LOWER(id) = LOWER($2)`,
          [newAdmin.id, resolvedHostelId]
        );
      } else {
        await query(
          `UPDATE hostels 
           SET senior_warden_id = $1
           WHERE LOWER(id) = LOWER($2)`,
          [newAdmin.id, resolvedHostelId]
        );
      }
      appCache.del('hostels:all');
      appCache.delPrefix('hostels:');
    }
    const { accessToken, refreshToken } = await createSessionAndTokens(newAdmin, req);

    res.cookie('token', accessToken, ACCESS_COOKIE_OPTIONS);
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

    return res.status(201).json({
      success: true,
      message: `${officialDesignation} account created successfully.`,
      user: {
        ...formatUserResponse(newAdmin),
        designation: officialDesignation,
      },
      token: accessToken,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('[ADMIN REGISTER ERROR]', error);
    return res.status(500).json({
      success: false,
      message: 'Admin authorization failed due to a server error.',
      error: error.message,
    });
  }
};

/**
 * POST /api/auth/verify-invite-token
 * Validate admin invitation token before unlocking registration form
 */
export const verifyInviteToken = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token || typeof token !== 'string') {
      return res.status(400).json({
        valid: false,
        message: 'Invitation token is required.',
      });
    }

    if (token.trim() !== ADMIN_INVITE_TOKEN) {
      return res.status(403).json({
        valid: false,
        message: 'Invalid or expired admin invitation token. Authorization restricted.',
      });
    }

    return res.json({
      valid: true,
      message: 'Authorized invitation token verified successfully.',
    });
  } catch (error) {
    console.error('[VERIFY TOKEN ERROR]', error);
    return res.status(500).json({
      valid: false,
      message: 'Token verification failed due to server error.',
      error: error.message,
    });
  }
};

/**
 * POST /api/auth/login
 * User login with email and password
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Query user
    const result = await query(
      'SELECT * FROM users WHERE LOWER(email) = $1',
      [cleanEmail]
    );

    if (result.rows.length === 0) {
      // Check if student exists in the boarders roster
      const rosterCheck = await query(
        'SELECT * FROM boarders WHERE LOWER(email) = $1 LIMIT 1',
        [cleanEmail]
      );
      if (rosterCheck.rows.length > 0) {
        return res.status(400).json({
          success: false,
          isRosterStudent: true,
          message: 'You are listed on the hostel boarder roster! Please click "Continue with Google" to sign in directly without a password.',
        });
      }

      return res.status(401).json({
        success: false,
        message: 'Invalid email or password. If you are a hostel student, please sign in with your Google account.',
      });
    }

    const user = result.rows[0];

    // For student accounts, strictly verify against active boarders master list
    if (user.role === 'STUDENT') {
      const boarderRes = await query(
        'SELECT * FROM boarders WHERE LOWER(email) = $1 LIMIT 1',
        [cleanEmail]
      );

      if (boarderRes.rows.length === 0) {
        return res.status(403).json({
          success: false,
          isRosterRestricted: true,
          message: 'Access Restricted: You are not present on any approved hostel resident roster. Please contact your Hostel Warden / Administrator.',
        });
      }

      const activeBoarder = boarderRes.rows[0];
      const targetHostel = (activeBoarder.hostel || '').trim().toLowerCase();

      // Ensure user profile and assigned hostel match current boarder roster
      if (user.hostel !== targetHostel || user.room !== activeBoarder.room || user.roll_no !== activeBoarder.roll_no) {
        await query(
          `UPDATE users 
           SET hostel = $1, room = $2, roll_no = $3, name = COALESCE($4, name), updated_at = NOW() 
           WHERE id = $5`,
          [targetHostel, activeBoarder.room, activeBoarder.roll_no, activeBoarder.name, user.id]
        );
        user.hostel = targetHostel;
        user.room = activeBoarder.room;
        user.roll_no = activeBoarder.roll_no;
        if (activeBoarder.name) user.name = activeBoarder.name;
      }
    }

    // Verify password hash
    if (!user.password_hash) {
      return res.status(401).json({
        success: false,
        message: 'Invalid login credentials. If you signed in with Google, please use Google Sign In.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const { accessToken, refreshToken } = await createSessionAndTokens(user, req);

    res.cookie('token', accessToken, ACCESS_COOKIE_OPTIONS);
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

    return res.json({
      success: true,
      message: 'Logged in successfully.',
      user: formatUserResponse(user),
      token: accessToken,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('[LOGIN ERROR]', error);
    return res.status(500).json({
      success: false,
      message: 'An unexpected server error occurred during login.',
      error: error.message,
    });
  }
};

/**
 * POST /api/auth/google
 * Authenticate or register with Google OAuth via verified Google ID Token
 */
export const googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: 'Google credential ID token is required.',
      });
    }

    // Verify token with Google's public keys
    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID || undefined,
      });
      payload = ticket.getPayload();
    } catch (verifyErr) {
      console.error('[GOOGLE TOKEN VERIFICATION ERROR]', verifyErr.message);
      return res.status(401).json({
        success: false,
        message: 'Google authentication failed: Invalid or expired Google token.',
        error: verifyErr.message,
      });
    }

    if (!payload || !payload.email) {
      return res.status(400).json({
        success: false,
        message: 'Could not extract a verified email address from the Google account.',
      });
    }

    const email = payload.email.trim().toLowerCase();
    const name = payload.name || payload.given_name || email.split('@')[0];
    const avatarUrl = payload.picture || null;

    // 1. Check if user already exists in users table
    let userRes = await query('SELECT * FROM users WHERE LOWER(email) = $1', [email]);
    let user;

    if (userRes.rows.length > 0) {
      user = userRes.rows[0];

      // For student accounts, strictly verify against active boarders master list
      if (user.role === 'STUDENT') {
        const boarderRes = await query(
          'SELECT * FROM boarders WHERE LOWER(email) = $1 LIMIT 1',
          [email]
        );

        if (boarderRes.rows.length === 0) {
          console.warn(`[GOOGLE AUTH] Roster verification failed: ${email} is not in boarders table.`);
          return res.status(403).json({
            success: false,
            isRosterRestricted: true,
            email,
            message: `Access Restricted: The account "${email}" is not present in any approved hostel resident roster. Please contact your Hostel Warden / Caretaker to be admitted to the roster before logging in.`,
          });
        }

        const activeBoarder = boarderRes.rows[0];
        const targetHostel = (activeBoarder.hostel || '').trim().toLowerCase();

        // Ensure user profile and assigned hostel match current boarder roster
        if (user.hostel !== targetHostel || user.room !== activeBoarder.room || user.roll_no !== activeBoarder.roll_no) {
          await query(
            `UPDATE users 
             SET hostel = $1, room = $2, roll_no = $3, name = COALESCE($4, name), updated_at = NOW() 
             WHERE id = $5`,
            [targetHostel, activeBoarder.room, activeBoarder.roll_no, activeBoarder.name, user.id]
          );
          user.hostel = targetHostel;
          user.room = activeBoarder.room;
          user.roll_no = activeBoarder.roll_no;
          if (activeBoarder.name) user.name = activeBoarder.name;
        }


      }

      // Update avatar if not already set or changed
      if (avatarUrl && (!user.avatar_url || user.avatar_url !== avatarUrl)) {
        await query('UPDATE users SET avatar_url = $1, updated_at = NOW() WHERE id = $2', [
          avatarUrl,
          user.id,
        ]);
        user.avatar_url = avatarUrl;
      }
    } else {
      const newId = `usr_${Date.now()}`;


        // 2. New student user: check if student exists on the approved resident roster (boarders table)
        console.log(`[GOOGLE AUTH] Checking roster for email: ${email}`);
        const boarderRes = await query(
          'SELECT * FROM boarders WHERE LOWER(email) = $1 LIMIT 1',
          [email]
        );

        if (boarderRes.rows.length === 0) {
          console.warn(`[GOOGLE AUTH] Roster verification failed: ${email} is not in boarders table.`);
          return res.status(403).json({
            success: false,
            isRosterRestricted: true,
            email,
            message: `Access Restricted: The account "${email}" is not present in the approved hostel resident roster. Please contact your Hostel Warden / Caretaker to be admitted to the roster before logging in.`,
          });
        }

        // Pre-approved resident student from roster
        const boarder = boarderRes.rows[0];

        // Resolve foreign key hostel id for users table (e.g., 'CMH' -> 'cmh')
        const rawHostel = (boarder.hostel || '').trim();
        let resolvedHostelId = null;
        if (rawHostel) {
          const hostelMatch = await query(
            'SELECT id FROM hostels WHERE LOWER(id) = LOWER($1) OR LOWER(name) = LOWER($1) LIMIT 1',
            [rawHostel]
          );
          resolvedHostelId = hostelMatch.rows.length > 0 ? hostelMatch.rows[0].id : rawHostel.toLowerCase();
        }

        // Check if user with this email or roll_no already exists
        const checkExisting = await query(
          'SELECT * FROM users WHERE LOWER(email) = $1 OR (roll_no IS NOT NULL AND UPPER(roll_no) = UPPER($2)) LIMIT 1',
          [email, (boarder.roll_no || '').trim()]
        );

        if (checkExisting.rows.length > 0) {
          user = checkExisting.rows[0];
          await query(
            `UPDATE users 
             SET email = $1, name = COALESCE($2, name), hostel = COALESCE($3, hostel),
                 room = COALESCE($4, room), department = COALESCE($5, department),
                 phone = COALESCE($6, phone), avatar_url = COALESCE($7, avatar_url),
                 updated_at = NOW()
             WHERE id = $8`,
            [
              email,
              boarder.name || name,
              resolvedHostelId,
              boarder.room || '',
              boarder.department || null,
              boarder.phone || null,
              avatarUrl,
              user.id,
            ]
          );
        } else {
          const insertRes = await query(
            `INSERT INTO users (id, name, email, role, hostel, room, roll_no, department, phone, avatar_url)
             VALUES ($1, $2, $3, 'STUDENT', $4, $5, $6, $7, $8, $9)
             RETURNING *`,
            [
              newId,
              boarder.name || name,
              email,
              resolvedHostelId,
              boarder.room || '',
              boarder.roll_no,
              boarder.department || null,
              boarder.phone || null,
              avatarUrl,
            ]
          );
          user = insertRes.rows[0];
        }

    }

    // 3. Issue signed JWT session tokens and record session
    const { accessToken, refreshToken } = await createSessionAndTokens(user, req);

    res.cookie('token', accessToken, ACCESS_COOKIE_OPTIONS);
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

    return res.json({
      success: true,
      message: 'Authenticated with Google successfully.',
      user: formatUserResponse(user),
      token: accessToken,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('[GOOGLE AUTH ERROR]', error);
    return res.status(500).json({
      success: false,
      message: 'Google authentication encountered an unexpected error.',
      error: error.message,
    });
  }
};

/**
 * GET /api/auth/me
 * Retrieves current authenticated user profile
 */
export const getMe = (req, res) => {
  return res.json({
    success: true,
    user: req.user,
  });
};

/**
 * POST /api/auth/refresh
 * Rotates refresh token, validates session, and issues fresh access token
 */
export const refreshSession = async (req, res) => {
  try {
    let token = req.cookies?.refreshToken || req.body?.refreshToken || req.headers['x-refresh-token'];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token is missing. Please sign in.',
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (jwtErr) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token has expired or is invalid. Please sign in.',
      });
    }

    const { id: userId, sessionId } = decoded;
    if (!sessionId) {
      return res.status(401).json({
        success: false,
        message: 'Malformed session token.',
      });
    }

    // Look up active session in user_sessions table
    const sessionRes = await query(
      `SELECT * FROM user_sessions WHERE id = $1 AND user_id = $2 LIMIT 1`,
      [sessionId, userId]
    );

    if (sessionRes.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Session not found. Please log in again.',
      });
    }

    const session = sessionRes.rows[0];

    // Check if revoked or expired
    if (session.is_revoked || new Date(session.expires_at) < new Date()) {
      return res.status(401).json({
        success: false,
        message: 'Session has been revoked or expired. Please sign in again.',
      });
    }

    // Check token hash to protect against replay / stolen token attacks
    const providedHash = hashToken(token);
    if (session.refresh_token_hash !== providedHash) {
      // Suspected token reuse attack: revoke the entire session family
      await query('UPDATE user_sessions SET is_revoked = TRUE WHERE id = $1', [sessionId]);
      return res.status(401).json({
        success: false,
        message: 'Invalid session token. Session revoked for security.',
      });
    }

    // Fetch user profile
    const userRes = await query(
      'SELECT id, name, email, role, designation, hostel, room, roll_no, phone, department, avatar_url, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (userRes.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User account not found.',
      });
    }

    const user = userRes.rows[0];

    // Rotate tokens
    const newAccessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role, sessionId },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    const newRefreshToken = jwt.sign(
      { id: user.id, sessionId },
      JWT_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRY }
    );

    const newHash = hashToken(newRefreshToken);
    const newExpiresAt = new Date(Date.now() + REFRESH_TOKEN_MS);

    // Update DB session record
    await query(
      `UPDATE user_sessions 
       SET refresh_token_hash = $1, 
           last_active_at = CURRENT_TIMESTAMP, 
           expires_at = $2 
       WHERE id = $3`,
      [newHash, newExpiresAt, sessionId]
    );

    // Invalidate stale cached auth context
    appCache.del(`auth:${userId}:${sessionId}`);

    res.cookie('token', newAccessToken, ACCESS_COOKIE_OPTIONS);
    res.cookie('refreshToken', newRefreshToken, REFRESH_COOKIE_OPTIONS);

    return res.json({
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      token: newAccessToken,
      user: formatUserResponse(user),
    });
  } catch (error) {
    console.error('[REFRESH SESSION ERROR]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to refresh session.',
      error: error.message,
    });
  }
};

/**
 * POST /api/auth/logout
 * Clears authentication cookies and revokes active session in database
 */
export const logout = async (req, res) => {
  try {
    let sessionId = req.sessionId;
    let userId = req.user?.id;
    if (!sessionId) {
      const token = req.cookies?.refreshToken || req.body?.refreshToken;
      if (token) {
        try {
          const dec = jwt.verify(token, JWT_SECRET);
          sessionId = dec.sessionId;
          userId = userId || dec.id;
        } catch {}
      }
    }

    if (sessionId) {
      await query('UPDATE user_sessions SET is_revoked = TRUE WHERE id = $1', [sessionId]);
    }

    // Invalidate cached auth states for this user / session
    if (userId) {
      appCache.delPrefix(`auth:${userId}`);
    } else if (sessionId) {
      appCache.delPrefix('auth:');
    }

    res.clearCookie('token', ACCESS_COOKIE_OPTIONS);
    res.clearCookie('refreshToken', REFRESH_COOKIE_OPTIONS);

    return res.json({
      success: true,
      message: 'Logged out and session terminated successfully.',
    });
  } catch (err) {
    console.error('[LOGOUT ERROR]', err);
    return res.json({ success: true, message: 'Logged out.' });
  }
};

/**
 * GET /api/auth/sessions
 * Returns all active sessions for current user
 */
export const getActiveSessions = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await query(
      `SELECT id, user_agent, ip_address, is_revoked, created_at, expires_at, last_active_at
       FROM user_sessions
       WHERE user_id = $1 AND is_revoked = FALSE AND expires_at > CURRENT_TIMESTAMP
       ORDER BY last_active_at DESC
       LIMIT 20`,
      [userId]
    );

    const sessions = result.rows.map((s) => ({
      id: s.id,
      userAgent: s.user_agent,
      ipAddress: s.ip_address,
      createdAt: s.created_at,
      lastActiveAt: s.last_active_at,
      isCurrent: s.id === req.sessionId,
    }));

    return res.json({ success: true, sessions });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * DELETE /api/auth/sessions/:sessionId
 * Revokes a specific session or all other sessions
 */
export const revokeSession = async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.params;

    if (sessionId === 'all-others') {
      await query(
        'UPDATE user_sessions SET is_revoked = TRUE WHERE user_id = $1 AND id != $2',
        [userId, req.sessionId || '']
      );
      appCache.delPrefix(`auth:${userId}`);
      return res.json({ success: true, message: 'All other active sessions revoked.' });
    }

    await query(
      'UPDATE user_sessions SET is_revoked = TRUE WHERE id = $1 AND user_id = $2',
      [sessionId, userId]
    );
    appCache.delPrefix(`auth:${userId}`);
    return res.json({ success: true, message: 'Session revoked successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export default {
  register,
  adminRegister,
  login,
  googleAuth,
  refreshSession,
  logout,
  getMe,
  getActiveSessions,
  revokeSession,
  formatUserResponse,
};
