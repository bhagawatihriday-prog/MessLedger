import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UtensilsCrossed, Mail, Lock, Sparkles, CheckCircle2 } from 'lucide-react';
import { loginSchema } from '../../utils/validators';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { GoogleButton } from '../../components/auth/GoogleButton';
import { DEMO_CREDENTIALS } from '../../mocks/user';

export const Login = () => {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  const { login, loginWithGoogle } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/login/dashboard';

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: true,
    },
  });

  const onSubmit = async (data) => {
    try {
      const response = await login(data);
      toast.success(`Welcome back, ${response.user.name}!`);
      if (response.user.role === 'ADMIN') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      toast.error(err.message || 'Login failed. Please check your credentials.');
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      toast.success('Successfully authenticated with Google!');
      navigate('/login/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.message || 'Google sign-in failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const fillDemoCredentials = (type = 'student') => {
    const creds = DEMO_CREDENTIALS[type];
    setValue('email', creds.email, { shouldValidate: true });
    setValue('password', creds.password, { shouldValidate: true });
    toast.info(`Populated ${type} demo credentials.`);
  };

  const handleForgotPasswordSubmit = (e) => {
    e.preventDefault();
    if (!forgotEmail) {
      toast.error('Please enter your university email.');
      return;
    }
    setForgotSubmitted(true);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900 transition-colors">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Logo */}
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
        </div>

        <h2 className="mt-4 text-center text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          Welcome to <span className="text-indigo-600 dark:text-indigo-400">MessLedger</span>
        </h2>
        <p className="mt-1 text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Sign in to view your monthly mess bills, dues, and ledger history
        </p>

        {/* Demo Fast-fill shortcuts for review */}
        <div className="mt-4 flex items-center justify-center gap-2">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            Quick Demo:
          </span>
          <button
            type="button"
            onClick={() => fillDemoCredentials('student')}
            className="text-[11px] font-semibold px-2 py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 dark:text-indigo-300 transition-colors"
          >
            Student Account
          </button>
          <button
            type="button"
            onClick={() => fillDemoCredentials('admin')}
            className="text-[11px] font-semibold px-2 py-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 transition-colors"
          >
            Admin Account
          </button>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="card-base p-6 sm:p-8 shadow-sm">
          {/* Google Sign In */}
          <div>
            <GoogleButton
              onClick={handleGoogleLogin}
              loading={googleLoading}
              text="Continue with Google"
            />
          </div>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-slate-900 px-3 text-slate-400 font-medium">
                Or continue with email
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

            <Input
              id="password"
              label="Password"
              type="password"
              placeholder="Enter your account password"
              icon={Lock}
              error={errors.password?.message}
              required
              {...register('password')}
            />

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800"
                  {...register('rememberMe')}
                />
                <span className="text-slate-600 dark:text-slate-400">Remember me</span>
              </label>

              <button
                type="button"
                onClick={() => {
                  setForgotSubmitted(false);
                  setForgotPasswordOpen(true);
                }}
                className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                fullWidth
                loading={isSubmitting}
                className="font-semibold shadow-sm"
              >
                Sign In
              </Button>
            </div>
          </form>

          {/* Create Account Link (Per Section 10) */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 hover:underline"
              >
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotPasswordOpen && (
        <Modal
          isOpen={forgotPasswordOpen}
          onClose={() => setForgotPasswordOpen(false)}
          title="Reset Account Password"
          subtitle="Instructions will be sent to your registered hostel email"
          footer={
            forgotSubmitted ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setForgotPasswordOpen(false)}
              >
                Close
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setForgotPasswordOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleForgotPasswordSubmit}
                >
                  Send Reset Link
                </Button>
              </>
            )
          }
        >
          {forgotSubmitted ? (
            <div className="text-center py-4 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Password Reset Email Sent
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                If an account exists for <strong>{forgotEmail}</strong>, check your inbox for password reset instructions.
              </p>
            </div>
          ) : (
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-3">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Enter your registered college or hostel email address. We'll send a secure password recovery link.
              </p>
              <Input
                id="forgot-email"
                type="email"
                label="Registered Email"
                placeholder="student@hostel.edu"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                required
              />
            </form>
          )}
        </Modal>
      )}
    </div>
  );
};
