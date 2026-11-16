import express from 'express';
import { authenticate, requireAdmin } from '../middlewares/auth.js';
import {
  getCurrentBill,
  getBills,
  createBill,
  generateHostelBills,
  notifyDefaulters,
} from '../controllers/bills.controller.js';

const router = express.Router();

/**
 * @route   GET /api/bills/current
 * @desc    Returns the latest / current active bill for the authenticated student
 * @access  Private (Authenticated)
 */
router.get('/current', authenticate, getCurrentBill);

/**
 * @route   GET /api/bills
 * @desc    Retrieve bill history for authenticated user (or all if admin)
 * @access  Private (Authenticated)
 */
router.get('/', authenticate, getBills);

/**
 * @route   POST /api/bills/generate
 * @desc    Generate hostel mess bills in bulk or single with automatic student notifications
 * @access  Private (Admin only)
 */
router.post('/generate', authenticate, requireAdmin, generateHostelBills);

/**
 * @route   POST /api/bills/notify-defaulters
 * @desc    Dispatch payment reminders to all students with outstanding dues in admin's hostel
 * @access  Private (Admin only)
 */
router.post('/notify-defaulters', authenticate, requireAdmin, notifyDefaulters);

/**
 * @route   POST /api/bills
 * @desc    Create a new bill
 * @access  Private (Admin only)
 */
router.post('/', authenticate, requireAdmin, createBill);

export default router;
