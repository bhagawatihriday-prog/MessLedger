import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import { getTransactions } from '../controllers/transactions.controller.js';

const router = express.Router();

/**
 * @route   GET /api/transactions
 * @desc    Retrieve transaction history for authenticated student
 * @access  Private (Authenticated)
 */
router.get('/', authenticate, getTransactions);

export default router;
