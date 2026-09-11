import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email address is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});

export const studentRegisterSchema = z.object({
  name: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(60, 'Full name cannot exceed 60 characters'),
  email: z
    .string()
    .min(1, 'Email address is required')
    .email('Please enter a valid university email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Za-z]/, 'Password must contain at least one letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  rollNo: z
    .string()
    .min(3, 'Roll number is required')
    .max(20, 'Invalid roll number format'),
  hostel: z
    .string()
    .min(1, 'Please select your hostel'),
  room: z
    .string()
    .min(1, 'Please select your room number'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const adminRegisterSchema = z.object({
  name: z
    .string()
    .min(2, 'Full name must be at least 2 characters'),
  email: z
    .string()
    .min(1, 'Email address is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Za-z]/, 'Password must contain at least one letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  designation: z
    .string()
    .min(2, 'Designation / role is required'),
  inviteToken: z
    .string()
    .min(6, 'Authorized admin invitation token is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const profileUpdateSchema = z.object({
  name: z
    .string()
    .min(2, 'Full name must be at least 2 characters'),
  room: z
    .string()
    .min(1, 'Room number is required'),
  phone: z
    .string()
    .regex(/^[0-9+ -]{10,15}$/, 'Please enter a valid phone number')
    .optional()
    .or(z.literal('')),
  profilePicture: z.string().optional(),
});
