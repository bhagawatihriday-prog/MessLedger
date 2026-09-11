import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ShieldAlert,
  ShieldCheck,
  ArrowLeft,
  Mail,
  Lock,
  User,
  Briefcase,
  KeyRound,
} from 'lucide-react';
import { adminRegisterSchema } from '../../utils/validators';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';

export const AdminRegister = () => {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';
  const [activeToken, setActiveToken] = useState(tokenFromUrl);

  const { registerAdmin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(adminRegisterSchema),
    defaultValues: {
      name: '',
      email: '',
      designation: '',
      password: '',
      confirmPassword: '',
      inviteToken: tokenFromUrl,
    },
  });

  useEffect(() => {
    if (tokenFromUrl) {
      setActiveToken(tokenFromUrl);
      setValue('inviteToken', tokenFromUrl);
    }
  }, [tokenFromUrl, setValue]);

  const onSubmit = async (data) => {
    try {
      await registerAdmin(data);
      toast.success('Admin authorization verified! Welcome to MessLedger Admin.');
      navigate('/admin/dashboard');
    } catch (err) {
      toast.error(err.message || 'Admin authorization failed. Token may be invalid or expired.');
    }
  };

  // RESTRICTED STATE: If no access token exists (Per Section 4)
  if (!activeToken) {
    return (
      <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900 transition-colors">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="card-base p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto border border-rose-200 dark:border-rose-900">
              <ShieldAlert className="w-7 h-7" />
            </div>

            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Admin Registration Restricted
            </h2>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
              Admin accounts can only be created through an authorized owner invitation.
            </p>

            {/* Manual Token Entry Form */}
            <div className="pt-2 pb-2 text-left">
              <label className="block text-[11px] font-semibold uppercase text-slate-600 dark:text-slate-400 mb-1">
                Have an invitation token?
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Paste invitation token"
                  className="form-input-base text-xs"
                  onChange={(e) => setActiveToken(e.target.value)}
                />
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    if (activeToken) setValue('inviteToken', activeToken);
                  }}
                >
                  Verify
                </Button>
              </div>
            </div>

            <div className="pt-2">
              <Link to="/register">
                <Button variant="outline" size="md" fullWidth icon={ArrowLeft}>
                  Return to Registration
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // AUTHORIZED ACCESS STATE: Admin Registration Form
  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900 transition-colors">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        <h2 className="mt-4 text-center text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          Admin Account Registration
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500 dark:text-slate-400">
          Authorized Invitation Token Detected • Complete your profile
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="card-base p-6 sm:p-8 shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              id="name"
              label="Full Name & Title"
              placeholder="e.g. Dr. R. K. Sharma"
              icon={User}
              error={errors.name?.message}
              required
              {...register('name')}
            />

            <Input
              id="email"
              label="Institutional Email"
              type="email"
              placeholder="admin.sharma@hostel.edu"
              icon={Mail}
              error={errors.email?.message}
              required
              {...register('email')}
            />

            <Input
              id="designation"
              label="Designation / Role"
              placeholder="e.g. Hostel Superintendent / Warden"
              icon={Briefcase}
              error={errors.designation?.message}
              required
              {...register('designation')}
            />

            <Input
              id="inviteToken"
              label="Authorized Invitation Token"
              placeholder="Token from owner"
              icon={KeyRound}
              error={errors.inviteToken?.message}
              required
              {...register('inviteToken')}
            />

            <Input
              id="password"
              label="Set Password"
              type="password"
              placeholder="Min 8 chars"
              icon={Lock}
              error={errors.password?.message}
              required
              {...register('password')}
            />

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

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                fullWidth
                loading={isSubmitting}
                className="font-semibold shadow-sm"
              >
                Register as Administrator
              </Button>
            </div>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center">
            <Link
              to="/register"
              className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              ← Cancel and return to Student Registration
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
