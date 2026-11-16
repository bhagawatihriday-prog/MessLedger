import express from 'express';
import { authenticate, requireAdmin } from '../middlewares/auth.js';
import {
  getProfile,
  updateProfile,
  deleteUser,
  deleteUsersBulk,
  getStudents,
  updateStudentRoom,
} from '../controllers/user.controller.js';

const router = express.Router();

/**
 * @route   GET /api/user/profile
 * @desc    Returns the profile of the currently authenticated user
 * @access  Private (Authenticated)
 */
router.get('/profile', authenticate, getProfile);

/**
 * @route   GET /api/user/students
 * @desc    Returns registered student accounts for the admin's hostel
 * @access  Private (Admin only)
 */
router.get('/students', authenticate, requireAdmin, getStudents);

/**
 * @route   PUT /api/user/profile
 * @desc    Updates profile fields (name, phone, department, avatarUrl)
 * @access  Private (Authenticated)
 */
router.put('/profile', authenticate, updateProfile);

/**
 * @route   PUT /api/user/:id/room
 * @desc    Updates a student's room assignment
 * @access  Private (Admin / Warden ONLY)
 */
router.put('/:id/room', authenticate, requireAdmin, updateStudentRoom);

/**
 * @route   POST /api/user/bulk-delete
 * @desc    Bulk deletes student user accounts by ID, roll number, or email
 * @access  Private (Admin / Warden ONLY)
 */
router.post('/bulk-delete', authenticate, requireAdmin, deleteUsersBulk);

/**
 * @route   DELETE /api/user/:id
 * @desc    Deletes a user account by ID, roll number, or email
 * @access  Private (Admin / Warden ONLY)
 */
router.delete('/:id', authenticate, requireAdmin, deleteUser);

/**
 * @route   DELETE /api/user
 * @desc    Deletes a user account (with target ID/rollNo in body)
 * @access  Private (Admin / Warden ONLY)
 */
router.delete('/', authenticate, requireAdmin, deleteUser);

export default router;
