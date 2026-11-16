import React, { useState, useEffect, useMemo } from 'react';
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
  Building2,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { adminRegisterSchema } from '../utils/validators';
import { useAuth, useToast } from '../context';
import { authService } from '../services/authService';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { Button } from '../components/Button';
import { hostelService } from '../services/hostelService';
import { HOSTEL_FULL_NAMES } from '../utils/constants';

export const AdminRegister = () => {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';

  // Verification state machine
  const [tokenInput, setTokenInput] = useState(tokenFromUrl);
  const [isTokenVerified, setIsTokenVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [tokenError, setTokenError] = useState('');
  const [verifiedToken, setVerifiedToken] = useState('');

  const [hostels, setHostels] = useState([]);
  const [loadingHostels, setLoadingHostels] = useState(true);

  const { registerAdmin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(adminRegisterSchema),
    defaultValues: {
      name: '',
      email: '',
      hostel: '',
      designation: '',
      password: '',
      confirmPassword: '',
      inviteToken: '',
    },
  });

  const selectedHostel = watch('hostel');

  // Verify invitation token
  const handleVerifyToken = async (candidateToken) => {
    const token = (candidateToken !== undefined ? candidateToken : tokenInput).trim();
    if (!token) {
      setTokenError('Please enter an authorized invitation token.');
      return;
    }

    setIsVerifying(true);
    setTokenError('');

    try {
      await authService.verifyInviteToken(token);
      setIsTokenVerified(true);
      setVerifiedToken(token);
      setValue('inviteToken', token, { shouldValidate: true });
      toast.success('Authorized invitation verified! Please complete registration.');
    } catch (err) {
      const errMsg = err.message || 'Invalid or expired admin invitation token.';
      setTokenError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsVerifying(false);
    }
  };

  // Auto-verify if token is present in URL parameters
  useEffect(() => {
    if (tokenFromUrl) {
      setTokenInput(tokenFromUrl);
      handleVerifyToken(tokenFromUrl);
    }
  }, [tokenFromUrl]);

  // Load hostels dynamically from API
  useEffect(() => {
    let isMounted = true;
    const loadHostels = async () => {
      try {
        const data = await hostelService.getHostels();
        if (isMounted) setHostels(data);
      } catch (err) {
        console.error('Failed to load hostels:', err);
      } finally {
        if (isMounted) setLoadingHostels(false);
      }
    };
    loadHostels();
    return () => {
      isMounted = false;
    };
  }, []);

  // Categorize hostels into Men's and Women's optgroups
  const hostelOptions = useMemo(() => {
    const menHostels = hostels
      .filter((h) => (h.type || '').toUpperCase() === 'MEN')
      .map((h) => ({
        value: h.name,
        label: `${h.name} — ${HOSTEL_FULL_NAMES[h.name] || h.fullName || h.name}`,
      }));

    const womenHostels = hostels
      .filter((h) => (h.type || '').toUpperCase() === 'WOMEN')
      .map((h) => ({
        value: h.name,
        label: `${h.name} — ${HOSTEL_FULL_NAMES[h.name] || h.fullName || h.name}`,
      }));

    return [
      { group: "Men's Hostels (Boys)", items: menHostels },
      { group: "Women's Hostels (Girls)", items: womenHostels },
    ];
  }, [hostels]);

  const onSubmit = async (data) => {
    try {
      await registerAdmin(data);
      toast.success('Admin account created! Welcome to MessLedger Admin.');
      navigate('/admin/dashboard');
    } catch (err) {
      toast.error(err.message || 'Admin registration failed. Please check your credentials.');
    }
  };

  // RESTRICTED STATE: Gated behind token verification
  if (!isTokenVerified) {
    return (
      <div className="min-h-screen flex flex-col justify-center py-4 px-4 sm:px-6 lg:px-8 bg-white dark:bg-zinc-950 transition-colors">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="card-base p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 flex items-center justify-center mx-auto border border-zinc-200 dark:border-zinc-800">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <h2 className="text-xl font-bold text-zinc-950 dark:text-zinc-50">
              Admin Registration Restricted
            </h2>

            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-sm mx-auto">
              Admin accounts can only be created through an authorized invitation passcode.
            </p>

            {/* Token Entry Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleVerifyToken();
              }}
              className="pt-2 pb-2 text-left space-y-2"
            >
              <label
                htmlFor="admin-invite-input"
                className="block text-[11px] font-semibold uppercase text-zinc-600 dark:text-zinc-400 mb-1"
              >
                Have an invitation token?
              </label>
              <div className="flex gap-2">
                <input
                  id="admin-invite-input"
                  type="text"
                  value={tokenInput}
                  className="form-input-base text-xs font-mono"
                  onChange={(e) => {
                    setTokenInput(e.target.value);
                    if (tokenError) setTokenError('');
                  }}
                  autoFocus
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={isVerifying}
                  disabled={isVerifying || !tokenInput.trim()}
                >
                  Verify
                </Button>
              </div>

              {tokenError && (
                <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600 dark:text-rose-400" />
                  <span>{tokenError}</span>
                </div>
              )}
            </form>

            <div className="pt-2">
              <Link to="/login">
                <Button variant="outline" size="md" fullWidth icon={ArrowLeft}>
                  Return to Sign In
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
    <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-white dark:bg-zinc-950 transition-colors">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-10 h-10 rounded-lg bg-emerald-600 dark:bg-emerald-500 flex items-center justify-center text-white">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <h2 className="mt-4 text-center text-2xl font-bold text-zinc-950 dark:text-zinc-50 tracking-tight">
          Senior Warden & Warden Registration
        </h2>
        <div className="mt-1 flex items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <ShieldCheck className="w-3 h-3" />
            Invitation Token Verified ({verifiedToken})
          </span>
          <button
            type="button"
            onClick={() => {
              setIsTokenVerified(false);
              setValue('inviteToken', '');
            }}
            className="text-[11px] text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 underline inline-flex items-center gap-1"
          >
            <RotateCcw className="w-2.5 h-2.5" />
            Change
          </button>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="card-base p-6 sm:p-8 shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              id="name"
              label="Full Name & Title"
              // placeholder="e.g. Dr. Gautam Borah"
              icon={User}
              error={errors.name?.message}
              required
              {...register('name')}
            />

            <Input
              id="email"
              label="Institutional Email"
              type="email"
              // placeholder="admin.cmh@tezu.ac.in"
              icon={Mail}
              error={errors.email?.message}
              required
              {...register('email')}
            />

            <Select
              id="hostel"
              label="Administered Hostel"
              placeholder={loadingHostels ? 'Loading hostels...' : 'Select your hostel'}
              icon={Building2}
              options={hostelOptions}
              value={selectedHostel}
              onChange={(e) => setValue('hostel', e.target.value, { shouldValidate: true })}
              error={errors.hostel?.message}
              required
            />

            <Select
              id="designation"
              label="Official Designation"
              placeholder="Select your designation"
              icon={Briefcase}
              options={[
                { value: 'Senior Warden', label: 'Senior Warden (Hostel Chief Administrator)' },
                { value: 'Warden', label: 'Warden (Hostel Resident Warden)' },
              ]}
              value={watch('designation')}
              onChange={(e) => setValue('designation', e.target.value, { shouldValidate: true })}
              error={errors.designation?.message}
              required
            />

            <Input
              id="inviteToken"
              label="Authorized Invitation Token"
              placeholder="MESS_ADMIN_2026"
              icon={KeyRound}
              error={errors.inviteToken?.message}
              required
              readOnly
              className="bg-zinc-50 dark:bg-zinc-900/50 cursor-not-allowed font-mono text-xs"
              {...register('inviteToken')}
            />

            <Input
              id="password"
              label="Set Password"
              type="password"
              placeholder="Min 8 characters (with letters & numbers)"
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
                Complete Registration
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
