import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';

const JWT_SECRET = (process.env.JWT_SECRET || 'messledger_jwt_secret_key_2026').trim();

/**
 * Middleware to authenticate requests using JWT
 */
export const authenticate = async (req, res, next) => {
  try {
    // Extract token from HTTP-only cookie or Authorization header fallback
    let token = req.cookies?.token;

    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token is missing. Please sign in.',
      });
    }

    let decoded;

    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Session has expired or is invalid. Please sign in again.',
      });
    }

    // Fetch user from database
    const result = await query(
      'SELECT id, name, email, role, designation, hostel, room, roll_no, phone, department, avatar_url, created_at FROM users WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User account not found. Please log in again.',
      });
    }

    const dbUser = result.rows[0];

    // For student accounts, strictly verify against active boarders master list
    if (dbUser.role === 'STUDENT') {
      const boarderRes = await query(
        'SELECT hostel, room, roll_no, name FROM boarders WHERE LOWER(email) = $1 LIMIT 1',
        [dbUser.email.toLowerCase()]
      );

      if (boarderRes.rows.length === 0) {
        return res.status(403).json({
          success: false,
          isRosterRestricted: true,
          message: 'Access Restricted: Your hostel residency roster authorization has ended or was removed. Please contact your Hostel Warden.',
        });
      }

      const activeBoarder = boarderRes.rows[0];
      dbUser.hostel = activeBoarder.hostel;
      dbUser.room = activeBoarder.room;
      dbUser.roll_no = activeBoarder.roll_no;
    }
    req.user = {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role,
      designation: dbUser.designation || (dbUser.role === 'SENIOR_WARDEN' || dbUser.role === 'ADMIN' ? 'Senior Warden' : (dbUser.role === 'WARDEN' ? 'Warden' : 'Resident Student')),
      hostel: dbUser.hostel ? dbUser.hostel.toUpperCase() : 'CMH',
      room: dbUser.room,
      rollNo: dbUser.roll_no,
      phone: dbUser.phone || '',
      department: dbUser.department || '',
      avatarUrl: dbUser.avatar_url,
      joinedDate: dbUser.created_at ? dbUser.created_at.toISOString().split('T')[0] : '',
    };

    next();
  } catch (error) {
    console.error('[AUTH ERROR]', error.message);
    res.status(500).json({
      success: false,
      message: 'Authentication error occurred.',
    });
  }
};

/**
 * Middleware to require Senior Warden or Warden role
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'SENIOR_WARDEN' && req.user.role !== 'WARDEN')) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Senior Warden or Warden privileges required.',
    });
  }
  next();
};

export default {
  authenticate,
  requireAdmin,
};
