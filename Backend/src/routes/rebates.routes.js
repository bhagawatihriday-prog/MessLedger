import express from 'express';
import { authenticate, requireAdmin } from '../middlewares/auth.js';
import {
  getRebates,
  applyRebate,
  removeRebate,
} from '../controllers/rebates.controller.js';

const router = express.Router();

/**
 * @route   GET /api/rebates
 * @desc    Get all rebates for hostel (admin) or student's rebate
 * @access  Private
 */
router.get('/', authenticate, getRebates);

/**
 * @route   POST /api/rebates
 * @desc    Create or update a student rebate concession
 * @access  Private (Admin only)
 */
router.post('/', authenticate, requireAdmin, applyRebate);

/**
 * @route   DELETE /api/rebates/:studentId
 * @desc    Remove an existing student rebate concession
 * @access  Private (Admin only)
 */
router.delete('/:studentId', authenticate, requireAdmin, removeRebate);

export default router;
