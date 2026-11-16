import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * Deprecated: Student self-registration has been retired.
 * Students are authenticated exclusively via Google OAuth and validated
 * against the official Hostel Boarders Roster.
 */
export const Register = () => <Navigate to="/login" replace />;
export default Register;
