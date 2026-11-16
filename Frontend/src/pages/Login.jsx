import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  AlertTriangle,
  X,
  GraduationCap,
  ShieldCheck,
} from 'lucide-react';
import { useAuth, useToast } from '../context';
import { GoogleButton } from '../components/GoogleButton';
import { Logo } from '../components/Logo';

export const Login = () => {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [rosterWarning, setRosterWarning] = useState(null);

  const { loginWithGoogle } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/login/dashboard';

  const handleGoogleSuccess = async (credential) => {
    setGoogleLoading(true);
    setRosterWarning(null);

    // Extract user email from Google ID token payload for reliable fallback display
    let googleEmail = '';
    try {
      const base64Url = credential.split('.')[1];
      if (base64Url) {
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        googleEmail = JSON.parse(jsonPayload).email || '';
      }
    } catch {
      // ignore token decode fallback
    }

    try {
      const response = await loginWithGoogle(credential);
      toast.success(`Welcome back, ${response.user?.name || 'User'}`);
      if (response.user?.role === 'ADMIN' || response.user?.role === 'SENIOR_WARDEN' || response.user?.role === 'WARDEN') {
        const target = from && from.startsWith('/admin') ? from : '/admin/dashboard';
        navigate(target, { replace: true });
      } else {
        const target = from && from.startsWith('/login/dashboard') ? from : '/login/dashboard';
        navigate(target, { replace: true });
      }
    } catch (err) {
      const isRestricted =
        err.isRosterRestricted ||
        err.status === 403 ||
        err.response?.status === 403 ||
        err.message?.toLowerCase().includes('roster') ||
        err.message?.toLowerCase().includes('restricted') ||
        err.message?.toLowerCase().includes('resident');

      if (isRestricted) {
        const displayEmail = err.email || googleEmail;
        setRosterWarning({
          email: displayEmail,
          message:
            err.message ||
            `Access Restricted: The account "${displayEmail}" is not present in the approved hostel resident roster. Please contact your Hostel Warden / Caretaker to be admitted to the roster before logging in.`,
        });
      } else {
        toast.error(err.message || 'Google authentication failed');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center px-4 sm:px-6 lg:px-8 bg-zinc-50 dark:bg-zinc-950 transition-colors">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex justify-center">
          <Logo size="lg" showText={false} />
        </div>

        <h2 className="mt-3 text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
          Sign In to MessLedger
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
          Hostel Mess Ledger & Resident Management System
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="card-base p-6 sm:p-8 space-y-6">
          {/* Warning Banner for Non-Roster Google Login */}
          {rosterWarning && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800/80 shadow-sm animate-in fade-in duration-200">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 shrink-0 mt-0.5">
                  <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200">
                      Hostel Roster Verification Notice
                    </h4>
                    <button
                      type="button"
                      onClick={() => setRosterWarning(null)}
                      className="text-amber-500 hover:text-amber-800 dark:hover:text-amber-200 p-0.5 rounded"
                      aria-label="Dismiss notice"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="mt-1.5 text-xs text-amber-900 dark:text-amber-300 leading-relaxed font-normal">
                    {rosterWarning.message}
                  </p>
                  <div className="mt-3 pt-2.5 border-t border-amber-200/80 dark:border-amber-800/60 text-[11px] text-amber-800 dark:text-amber-400">
                    Hostel boarders: Contact your <strong>Hostel Warden / Caretaker</strong> with your Roll No. and Department to be added to the official resident roster.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Unified Google Sign In Section */}
          <div className="space-y-4">
            <div className="text-center space-y-1">
              <p className="text-xs text-zinc-500 dark:text-zinc-400 pt-1">
                Sign in with your institutional or registered Google account
              </p>
            </div>

            <GoogleButton
              onSuccess={handleGoogleSuccess}
              onError={(err) => toast.error(err.message || 'Google authentication failed')}
              loading={googleLoading}
              text="Continue with Google"
            />
          </div>

          {/* Role Access Information Cards */}
          <div className="pt-2 border-t border-zinc-200/80 dark:border-zinc-800/80 space-y-2.5 text-xs">
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/50">
              <GraduationCap className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-emerald-950 dark:text-emerald-200 block">
                  Hostel Boarders & Students
                </span>
                <span className="text-emerald-800/90 dark:text-emerald-300/80 text-[11px] leading-relaxed block mt-0.5">
                  Verified automatically against the warden&apos;s boarder roster. View monthly mess bills and pay dues online.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/50">
              <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-blue-950 dark:text-blue-200 block">
                  Senior Wardens & Wardens
                </span>
                <span className="text-blue-800/90 dark:text-blue-300/80 text-[11px] leading-relaxed block mt-0.5">
                  Sign in with your registered admin Google account to manage boarders, billing cycles, and payments.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
