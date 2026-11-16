import { query } from '../config/db.js';

/**
 * Format notification row to frontend model
 */
export const formatNotification = (row) => ({
  id: row.id,
  userId: row.user_id,
  title: row.title,
  message: row.message,
  type: row.type || 'INFO',
  isRead: !!row.is_read,
  createdAt: row.created_at,
});

/**
 * GET /api/notifications
 * Get notifications for the authenticated user
 */
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await query(
      `SELECT * FROM notifications 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [userId]
    );

    return res.json(result.rows.map(formatNotification));
  } catch (error) {
    console.error('[GET NOTIFICATIONS ERROR]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve notifications.',
      error: error.message,
    });
  }
};

/**
 * PUT /api/notifications/:id/read
 * Mark a single notification as read
 */
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await query(
      'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    // Return the updated list
    const result = await query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [userId]
    );

    return res.json(result.rows.map(formatNotification));
  } catch (error) {
    console.error('[MARK READ ERROR]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update notification status.',
      error: error.message,
    });
  }
};

/**
 * PUT /api/notifications/mark-all-read
 * Mark all notifications for user as read
 */
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = $1',
      [userId]
    );

    const result = await query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [userId]
    );

    return res.json(result.rows.map(formatNotification));
  } catch (error) {
    console.error('[MARK ALL READ ERROR]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read.',
      error: error.message,
    });
  }
};

export default {
  formatNotification,
  getNotifications,
  markAsRead,
  markAllAsRead,
};
