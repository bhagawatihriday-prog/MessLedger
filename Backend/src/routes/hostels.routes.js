import express from 'express';
import {
  getAllHostels,
  getHostelByNameOrId,
} from '../controllers/hostels.controller.js';

const router = express.Router();

/**
 * @route   GET /api/hostels
 * @desc    Returns list of all available hostels
 * @access  Public
 */
router.get('/', getAllHostels);

/**
 * @route   GET /api/hostels/:nameOrId
 * @desc    Returns single hostel by id or short name (e.g. 'lbbh' or 'LBBH')
 * @access  Public
 */
router.get('/:nameOrId', getHostelByNameOrId);

export default router;
