import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import {
  createOrder,
  verifyPayment,
  handleWebhook,
} from '../controllers/payments.controller.js';

const router = express.Router();

/**
 * @route   POST /api/payments/create-order
 * @desc    Initiates an official Razorpay payment order for mess bill
 * @access  Private (Authenticated)
 */
router.post('/create-order', authenticate, createOrder);

/**
 * @route   POST /api/payments/verify
 * @desc    Verifies Razorpay payment signature and settles dues in the database
 * @access  Private (Authenticated)
 */
router.post('/verify', authenticate, verifyPayment);

/**
 * @route   POST /api/payments/webhook
 * @desc    Asynchronous server-to-server webhook events from Razorpay
 * @access  Public (Cryptographically verified with X-Razorpay-Signature)
 */
router.post('/webhook', handleWebhook);

export default router;

