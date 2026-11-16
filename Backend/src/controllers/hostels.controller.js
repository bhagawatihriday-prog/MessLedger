import { query } from '../config/db.js';

/**
 * Format hostel row to match Frontend format
 */
export const formatHostel = (row) => {
  const swName = row.sw_name || row.senior_warden_name || '';
  const swPhone = row.sw_phone || row.senior_warden_phone || '';
  const swEmail = row.sw_email || row.senior_warden_email || '';
  const wName = row.w_name || row.warden_name || '';
  const wPhone = row.w_phone || row.warden_phone || '';
  const wEmail = row.w_email || row.warden_email || '';

  return {
    id: row.id,
    name: row.name,
    fullName: row.full_name,
    type: row.type || 'MEN',
    rooms: row.rooms || [],
    seniorWardenId: row.senior_warden_id || null,
    wardenId: row.warden_id || null,
    seniorWarden: {
      name: swName,
      phone: swPhone,
      email: swEmail,
    },
    admin: {
      name: swName,
      phone: swPhone,
      email: swEmail,
    },
    warden: {
      name: wName,
      phone: wPhone,
      email: wEmail,
    },
  };
};

const HOSTEL_SELECT_SQL = `
  SELECT h.id, h.name, h.full_name, h.type, h.rooms, h.senior_warden_id, h.warden_id, h.created_at,
         sw.name AS sw_name, sw.phone AS sw_phone, sw.email AS sw_email,
         w.name AS w_name, w.phone AS w_phone, w.email AS w_email
  FROM hostels h
  LEFT JOIN users sw ON h.senior_warden_id = sw.id
  LEFT JOIN users w ON h.warden_id = w.id
`;

/**
 * GET /api/hostels
 * Returns list of all available hostels
 */
export const getAllHostels = async (req, res) => {
  try {
    const result = await query(`${HOSTEL_SELECT_SQL} ORDER BY h.name ASC`);
    const hostels = result.rows.map(formatHostel);
    return res.json(hostels);
  } catch (error) {
    console.error('[HOSTELS ERROR]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load hostels list.',
      error: error.message,
    });
  }
};

/**
 * GET /api/hostels/:nameOrId
 * Returns single hostel by id or short name (e.g. 'lbbh' or 'LBBH')
 */
export const getHostelByNameOrId = async (req, res) => {
  try {
    const param = req.params.nameOrId.trim().toLowerCase();
    const result = await query(
      `${HOSTEL_SELECT_SQL} WHERE LOWER(h.id) = $1 OR LOWER(h.name) = $1 LIMIT 1`,
      [param]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Hostel "${req.params.nameOrId}" not found.`,
      });
    }

    return res.json(formatHostel(result.rows[0]));
  } catch (error) {
    console.error('[HOSTEL BY NAME ERROR]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve hostel details.',
      error: error.message,
    });
  }
};

export default {
  formatHostel,
  getAllHostels,
  getHostelByNameOrId,
};
