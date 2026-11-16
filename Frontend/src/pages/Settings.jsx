import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Trash2,
  Lock,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  LogOut,
} from 'lucide-react';
import { useAuth, useToast } from '../context';
import { PageContainer } from '../components/PageContainer';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { userService } from '../services/userService';

export const Settings = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const [billAlerts, setBillAlerts] = useState(true);
  const [fineReminders, setFineReminders] = useState(true);
  const [feastNotices, setFeastNotices] = useState(false);

  // Admin Account Deletion States
  const [targetIdentifier, setTargetIdentifier] = useState('');
  const [isAdminDeleteModalOpen, setIsAdminDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleAdminDeleteUser = async () => {
    if (!targetIdentifier.trim()) return;
    setIsDeleting(true);
    try {
      await userService.deleteUser(targetIdentifier.trim());
      toast.success(`User account "${targetIdentifier}" has been deleted.`);
      setTargetIdentifier('');
      setIsAdminDeleteModalOpen(false);
    } catch (err) {
      toast.error(err.message || 'Failed to delete user account.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <PageContainer>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-950 dark:text-zinc-50 tracking-tight">
            Settings & Preferences
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Manage billing alerts, notifications, and account administrative controls
          </p>
        </div>

        {/* 2. Notification Preferences */}
        <div className="card-base p-6 sm:p-7 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Bell className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              Notification Preferences
            </h3>
          </div>

          <div className="divide-y divide-zinc-200 dark:divide-zinc-800 text-xs">
            <div className="py-3 flex items-center justify-between">
              <div>
                <p className="font-semibold text-zinc-950 dark:text-zinc-100">
                  Monthly Bill Generation Alert
                </p>
                <p className="text-zinc-500 dark:text-zinc-400">
                  Receive in-app reminder as soon as the hostel superintendent publishes bills
                </p>
              </div>
              <input
                type="checkbox"
                checked={billAlerts}
                onChange={(e) => setBillAlerts(e.target.checked)}
                className="rounded border-zinc-300 dark:border-zinc-700 accent-zinc-950 dark:accent-zinc-100"
              />
            </div>

            <div className="py-3 flex items-center justify-between">
              <div>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                  Late Fine Warning Alerts
                </p>
                <p className="text-zinc-500 dark:text-zinc-400">
                  Receive advance warning 48 hours prior to the ₹20/day penalty levy
                </p>
              </div>
              <input
                type="checkbox"
                checked={fineReminders}
                onChange={(e) => setFineReminders(e.target.checked)}
                className="rounded border-zinc-300 dark:border-zinc-700 accent-zinc-950 dark:accent-zinc-100"
              />
            </div>

            <div className="py-3 flex items-center justify-between">
              <div>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                  Special Feast & Mess Committee Notices
                </p>
                <p className="text-zinc-500 dark:text-zinc-400">
                  Weekly menu updates and celebratory holiday feasts
                </p>
              </div>
              <input
                type="checkbox"
                checked={feastNotices}
                onChange={(e) => setFeastNotices(e.target.checked)}
                className="rounded border-zinc-300 dark:border-zinc-700 accent-zinc-950 dark:accent-zinc-100"
              />
            </div>
          </div>
        </div>

        {/* 3. Account Management & Danger Zone */}
        <div className="card-base p-6 sm:p-7 border-rose-200 dark:border-rose-950/60">
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
              Account Management & Danger Zone
            </h3>
          </div>

          {user?.role === 'ADMIN' || user?.role === 'SENIOR_WARDEN' || user?.role === 'WARDEN' ? (
            <div className="space-y-4">
              <div className="p-3.5 rounded-lg bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-xs text-rose-800 dark:text-rose-300">
                <div className="flex items-center gap-2 font-semibold">
                  <ShieldCheck className="w-4 h-4 text-rose-600" />
                  <span>Authority Account Control</span>
                </div>
                <p className="mt-1 text-[11px] text-rose-700/90 dark:text-rose-400 leading-relaxed">
                  Only hostel senior wardens and wardens can permanently delete student accounts. Deleting an account will wipe all associated user credentials, cancel billing records, and release their roster roll number for re-registration.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block">
                  Delete Student User Account (by Roll Number, Email, or User ID)
                </label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <input
                    type="text"
                    value={targetIdentifier}
                    onChange={(e) => setTargetIdentifier(e.target.value)}
                    placeholder="e.g. 2024CS01 or rahul.cs24@tezu.ac.in"
                    className="flex-1 px-3 py-2 text-xs font-mono rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                  <Button
                    variant="danger"
                    size="sm"
                    icon={Trash2}
                    disabled={!targetIdentifier.trim()}
                    onClick={() => setIsAdminDeleteModalOpen(true)}
                  >
                    Delete Account
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <div className="p-2 rounded-lg bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    Account Deletion Restricted
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-medium">
                    Authority Only
                  </span>
                </div>
                <p className="text-zinc-500 dark:text-zinc-400 text-[11px] leading-relaxed">
                  In accordance with university residency policies, students cannot self-delete their MessLedger account. Account termination, mess bill settlements, and roster clearance must be performed directly by your Hostel Senior Warden or Warden.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 4. Session & Sign Out */}
        <div className="card-base p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <LogOut className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                Session & Sign Out
              </h3>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Signed in as <span className="font-semibold text-zinc-900 dark:text-zinc-100">{user?.name}</span> ({user?.email})
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={LogOut}
            onClick={handleLogout}
            className="text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/30 w-full sm:w-auto justify-center"
          >
            Sign Out
          </Button>
        </div>
      </div>

      {/* Delete User Account Confirmation Modal (Admin Only) */}
      {isAdminDeleteModalOpen && (
        <Modal
          isOpen={isAdminDeleteModalOpen}
          onClose={() => setIsAdminDeleteModalOpen(false)}
          title="Confirm User Account Deletion"
          subtitle={`Are you sure you want to delete the account for "${targetIdentifier}"?`}
          maxWidth="max-w-md"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAdminDeleteModalOpen(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                icon={Trash2}
                loading={isDeleting}
                onClick={handleAdminDeleteUser}
              >
                Delete User
              </Button>
            </div>
          }
        >
          <div className="space-y-3 text-xs text-zinc-600 dark:text-zinc-400">
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-800 dark:text-rose-300">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">Irreversible Action</p>
                <p className="text-[11px]">
                  This action cannot be undone. All login credentials, itemized bills, and payment records associated with this resident will be purged.
                </p>
              </div>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              If this student has an entry in the approved boarders master list, their registration status will be reset to allow re-registration in the future if needed.
            </p>
          </div>
        </Modal>
      )}
    </PageContainer>
  );
};
