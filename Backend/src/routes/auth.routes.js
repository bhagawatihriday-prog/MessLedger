import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import {
  register,
  adminRegister,
  verifyInviteToken,
  login,
  googleAuth,
  logout,
  getMe,
} from '../controllers/auth.controller.js';

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Student registration with institutional boarder roster verification
 * @access  Public
 */
router.post('/register', register);

/**
 * @route   POST /api/auth/admin-register
 * @desc    Administrator registration requiring valid admin invitation token
 * @access  Public (Protected by inviteToken)
 */
router.post('/admin-register', adminRegister);

/**
 * @route   POST /api/auth/verify-invite-token
 * @desc    Validate admin invitation token
 * @access  Public
 */
router.post('/verify-invite-token', verifyInviteToken);

/**
 * @route   POST /api/auth/login
 * @desc    User login with email and password
 * @access  Public
 */
router.post('/login', login);

/**
 * @route   POST /api/auth/google
 * @desc    Authenticate or register with Google OAuth
 * @access  Public
 */
router.post('/google', googleAuth);

/**
 * @route   POST /api/auth/logout
 * @desc    Clears authentication cookie and logs out
 * @access  Public
 */
router.post('/logout', logout);

/**
 * @route   GET /api/auth/me
 * @desc    Retrieves current authenticated user profile
 * @access  Private (Authenticated)
 */
router.get('/me', authenticate, getMe);

export default router;
