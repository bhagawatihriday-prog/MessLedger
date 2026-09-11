import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, Mail, Hash, Building2, DoorClosed, Phone, Camera, Check } from 'lucide-react';
import { profileUpdateSchema } from '../../utils/validators';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { PageContainer } from '../../components/layout/PageContainer';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';

export const EditProfile = () => {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [avatarUrl, setAvatarUrl] = useState(user?.profilePicture || '');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      name: user?.name || '',
      room: user?.room || '',
      phone: user?.phone || '',
      profilePicture: user?.profilePicture || '',
    },
  });

  const onSubmit = async (data) => {
    try {
      await updateUser({
        ...data,
        profilePicture: avatarUrl || null,
      });
      toast.success('Your profile has been updated successfully.');
    } catch (err) {
      toast.error(err.message || 'Unable to update profile.');
    }
  };

  const sampleAvatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
  ];

  return (
    <PageContainer>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Profile Settings
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage your student personal information and hostel room details
          </p>
        </div>

        <div className="card-base p-6 sm:p-8">
          {/* Profile Picture Header */}
          <div className="flex flex-col sm:flex-row items-center gap-5 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="relative">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={user?.name}
                  className="w-20 h-20 rounded-2xl object-cover ring-4 ring-indigo-50 dark:ring-indigo-950/60 shadow-sm"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-700 text-white font-bold text-xl flex items-center justify-center shadow-sm">
                  {user?.name ? user.name.slice(0, 2).toUpperCase() : 'ML'}
                </div>
              )}
            </div>

            <div className="text-center sm:text-left space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {user?.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {user?.hostel} Hostel • Room {user?.room}
              </p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 pt-1">
                <span className="text-[11px] text-slate-400 mr-1">Sample Photos:</span>
                {sampleAvatars.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setAvatarUrl(url)}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300"
                  >
                    Photo {i + 1}
                  </button>
                ))}
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={() => setAvatarUrl('')}
                    className="text-[10px] px-2 py-0.5 rounded bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-300"
                  >
                    Reset Initials
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            {/* Full Name */}
            <Input
              id="profile-name"
              label="Full Name"
              placeholder="Your full name"
              icon={User}
              error={errors.name?.message}
              required
              {...register('name')}
            />

            {/* Email Address (Read-only) */}
            <Input
              id="profile-email"
              label="Email Address (University ID - Read Only)"
              value={user?.email || ''}
              icon={Mail}
              disabled
              helperText="Institutional email is bound to university registrar records."
            />

            {/* Roll Number & Hostel (Read-only) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                id="profile-rollNo"
                label="Roll Number (Read Only)"
                value={user?.rollNo || ''}
                icon={Hash}
                disabled
              />

              <Input
                id="profile-hostel"
                label="Hostel"
                value={user?.hostel || ''}
                icon={Building2}
                disabled
              />
            </div>

            {/* Room Number & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                id="profile-room"
                label="Room Number"
                placeholder="e.g. 204"
                icon={DoorClosed}
                error={errors.room?.message}
                required
                {...register('room')}
              />

              <Input
                id="profile-phone"
                label="Phone Number"
                placeholder="+91 98765 43210"
                icon={Phone}
                error={errors.phone?.message}
                {...register('phone')}
              />
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={isSubmitting}
                className="px-6"
              >
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </div>
    </PageContainer>
  );
};
