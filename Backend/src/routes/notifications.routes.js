import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from '../controllers/notifications.controller.js';

const router = express.Router();

/**
 * @route   GET /api/notifications
 * @desc    Get notifications for the authenticated user
 * @access  Private (Authenticated)
 */
router.get('/', authenticate, getNotifications);

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    Mark a single notification as read
 * @access  Private (Authenticated)
 */
router.put('/:id/read', authenticate, markAsRead);

/**
 * @route   PUT /api/notifications/mark-all-read
 * @desc    Mark all notifications for user as read
 * @access  Private (Authenticated)
 */
router.put('/mark-all-read', authenticate, markAllAsRead);

export default router;
