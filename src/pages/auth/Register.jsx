import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  UtensilsCrossed,
  User,
  Mail,
  Lock,
  Hash,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { studentRegisterSchema } from '../../utils/validators';
import { USER_ROLES } from '../../utils/constants';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { GoogleButton } from '../../components/auth/GoogleButton';
import { RoleSelector } from '../../components/auth/RoleSelector';
import { HostelSelector } from '../../components/auth/HostelSelector';
import { PasswordStrength } from '../../components/auth/PasswordStrength';

export const Register = () => {
  const [selectedRole, setSelectedRole] = useState(USER_ROLES.STUDENT);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [adminTokenInput, setAdminTokenInput] = useState('');

  const { register: registerUser, loginWithGoogle } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(studentRegisterSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      rollNo: '',
      hostel: '',
      room: '',
    },
  });

  const passwordValue = watch('password');
  const selectedHostel = watch('hostel');
  const selectedRoom = watch('room');

  const onStudentSubmit = async (data) => {
    try {
      await registerUser(data);
      toast.success('Registration successful! Welcome to MessLedger.');
      navigate('/login/dashboard');
    } catch (err) {
      toast.error(err.message || 'Registration failed. Please try again.');
    }
  };

  const handleGoogleRegister = async () => {
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      toast.success('Google registration successful!');
      navigate('/login/dashboard');
    } catch (err) {
      toast.error(err.message || 'Google registration failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleAdminNavigate = (e) => {
    e.preventDefault();
    if (adminTokenInput.trim()) {
      navigate(`/register/admin?token=${encodeURIComponent(adminTokenInput.trim())}`);
    } else {
      navigate('/register/admin');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900 transition-colors">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
        </div>

        <h2 className="mt-4 text-center text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          Create your account
        </h2>
        <p className="mt-1 text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Register with your university credentials to manage your hostel mess dues
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="card-base p-6 sm:p-8 shadow-sm">
          {/* Role Selection (Student vs Admin) */}
          <RoleSelector
            selectedRole={selectedRole}
            onRoleChange={setSelectedRole}
            className="mb-6"
          />

          {/* ADMIN FLOW: Protected Invitation Flow per Section 4 & 9 */}
          {selectedRole === USER_ROLES.ADMIN ? (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100">
                <div className="flex items-center gap-2 font-bold text-sm mb-1">
                  <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Admin Registration Requires Owner Authorization</span>
                </div>
                <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                  To safeguard hostel ledger records, administrator accounts can only be created via an authorized invitation token issued by the institution or system owner.
                </p>
              </div>

              <form onSubmit={handleAdminNavigate} className="space-y-4">
                <Input
                  id="admin-token"
                  label="Invitation / Access Token"
                  type="text"
                  placeholder="Enter your invite token (e.g. ADM_INV_2026_XYZ)"
                  value={adminTokenInput}
                  onChange={(e) => setAdminTokenInput(e.target.value)}
                  helperText="Provided by your hostel administration or system owner."
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  fullWidth
                  icon={ArrowRight}
                  iconPosition="right"
                >
                  Proceed to Admin Verification
                </Button>
              </form>
            </div>
          ) : (
            /* STUDENT FLOW: Registration Form */
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Google Button */}
              <GoogleButton
                onClick={handleGoogleRegister}
                loading={googleLoading}
                text="Sign up with Google"
              />

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-700" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-slate-900 px-3 text-slate-400 font-medium">
                    Or register with details
                  </span>
                </div>
              </div>

              <form onSubmit={handleSubmit(onStudentSubmit)} className="space-y-4">
                {/* Full Name & Roll Number */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    id="name"
                    label="Full Name"
                    placeholder="Bhargav Jyoti"
                    icon={User}
                    error={errors.name?.message}
                    required
                    {...register('name')}
                  />

                  <Input
                    id="rollNo"
                    label="Roll Number"
                    placeholder="22CS084"
                    icon={Hash}
                    error={errors.rollNo?.message}
                    required
                    {...register('rollNo')}
                  />
                </div>

                {/* Email Address */}
                <Input
                  id="email"
                  label="Email Address"
                  type="email"
                  placeholder="student@hostel.edu"
                  icon={Mail}
                  error={errors.email?.message}
                  required
                  {...register('email')}
                />

                {/* Dynamic Hostel & Room Cascading Dropdowns */}
                <HostelSelector
                  selectedHostel={selectedHostel}
                  selectedRoom={selectedRoom}
                  onHostelChange={(hostel) => setValue('hostel', hostel, { shouldValidate: true })}
                  onRoomChange={(room) => setValue('room', room, { shouldValidate: true })}
                  hostelError={errors.hostel?.message}
                  roomError={errors.room?.message}
                />

                {/* Password & Confirm Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Input
                      id="password"
                      label="Password"
                      type="password"
                      placeholder="Min 8 chars, letter & number"
                      icon={Lock}
                      error={errors.password?.message}
                      required
                      {...register('password')}
                    />
                    <PasswordStrength password={passwordValue} />
                  </div>

                  <Input
                    id="confirmPassword"
                    label="Confirm Password"
                    type="password"
                    placeholder="Re-enter password"
                    icon={Lock}
                    error={errors.confirmPassword?.message}
                    required
                    {...register('confirmPassword')}
                  />
                </div>

                {/* Submit Button */}
                <div className="pt-3">
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    fullWidth
                    loading={isSubmitting}
                    className="font-semibold shadow-sm"
                  >
                    Create Student Account
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Existing User Link */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 hover:underline"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
