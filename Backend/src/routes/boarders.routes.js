import express from 'express';
import { authenticate, requireAdmin } from '../middlewares/auth.js';
import {
  getBoarders,
  verifyBoarder,
  addBoarder,
  bulkImportBoarders,
  updateBoarder,
  deleteBoarder,
  deleteBoardersBulk,
} from '../controllers/boarders.controller.js';

const router = express.Router();

/**
 * @route   GET /api/boarders
 * @desc    Get all boarders (optionally filtered by ?hostel=LBBH)
 * @access  Public
 */
router.get('/', getBoarders);

/**
 * @route   POST /api/boarders/verify
 * @desc    Verification check before student registration
 * @access  Public
 */
router.post('/verify', verifyBoarder);

/**
 * @route   POST /api/boarders
 * @desc    Add a new boarder record
 * @access  Private (Admin only)
 */
router.post('/', authenticate, requireAdmin, addBoarder);

/**
 * @route   POST /api/boarders/bulk
 * @desc    Bulk import boarders from an array of records
 * @access  Private (Admin only)
 */
router.post('/bulk', authenticate, requireAdmin, bulkImportBoarders);

/**
 * @route   POST /api/boarders/bulk-delete
 * @desc    Bulk delete boarders from roster
 * @access  Private (Admin only)
 */
router.post('/bulk-delete', authenticate, requireAdmin, deleteBoardersBulk);

/**
 * @route   PUT /api/boarders/:id
 * @desc    Update an existing boarder
 * @access  Private (Admin only)
 */
router.put('/:id', authenticate, requireAdmin, updateBoarder);

/**
 * @route   DELETE /api/boarders/:id
 * @desc    Delete a boarder record
 * @access  Private (Admin only)
 */
router.delete('/:id', authenticate, requireAdmin, deleteBoarder);

export default router;
