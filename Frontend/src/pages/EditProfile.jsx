import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, Mail, Hash, Building2, DoorClosed, Phone, Lock, Briefcase, ShieldCheck, GraduationCap } from 'lucide-react';
import { profileUpdateSchema } from '../utils/validators';
import { useAuth, useToast } from '../context';
import { PageContainer } from '../components/PageContainer';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { Button } from '../components/Button';
import { DEPARTMENTS } from '../utils/constants';

export const EditProfile = () => {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [avatarUrl, setAvatarUrl] = useState(user?.profilePicture || '');

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SENIOR_WARDEN' || user?.role === 'WARDEN';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      name: user?.name || '',
      room: isAdmin ? '' : (user?.room || ''),
      phone: user?.phone || '',
      department: user?.department || '',
      profilePicture: user?.profilePicture || '',
    },
  });

  const onSubmit = async (data) => {
    try {
      await updateUser({
        name: data.name,
        phone: data.phone,
        department: isAdmin ? null : data.department,
        profilePicture: avatarUrl || null,
      });
      toast.success('Your profile has been updated successfully.');
    } catch (err) {
      toast.error(err.message || 'Unable to update profile.');
    }
  };


  return (
    <PageContainer>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-950 dark:text-zinc-50 tracking-tight">
            Profile Settings
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            {isAdmin
              ? 'Manage your administrator account information and official contact details'
              : 'Manage your student personal information and hostel room details'}
          </p>
        </div>

        <div className="card-base p-6 sm:p-8">
          {/* Profile Picture Header */}
          <div className="flex flex-col sm:flex-row items-center gap-5 pb-6 border-b border-zinc-200 dark:border-zinc-800">
            <div className="relative">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={user?.name}
                  className="w-20 h-20 rounded-xl object-cover ring-1 ring-zinc-300 dark:ring-zinc-700"
                />
              ) : (
                <div className="w-20 h-20 rounded-xl bg-zinc-950 dark:bg-zinc-50 text-white dark:text-zinc-950 font-bold text-xl flex items-center justify-center">
                  {user?.name ? user.name.slice(0, 2).toUpperCase() : 'ML'}
                </div>
              )}
            </div>

            <div className="text-center sm:text-left space-y-1">
              <h3 className="text-base font-bold text-zinc-950 dark:text-zinc-50">
                {user?.name}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {user?.hostel ? `${user.hostel.toUpperCase()} Hostel` : 'Hostel'} • {isAdmin ? (user?.designation || (user?.role === 'WARDEN' ? 'Warden' : 'Senior Warden')) : `Room ${user?.room || '—'}`}{!isAdmin && user?.department ? ` • ${user.department}` : ''}
              </p>
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
              helperText={isAdmin ? 'Official administrator email registered with university portal.' : 'Institutional email is bound to university registrar records.'}
            />

            {/* Admin Profile: Role & Administered Hostel */}
            {isAdmin ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    id="profile-designation"
                    label="Designation / Role (Read Only)"
                    value={user?.designation || (user?.role === 'WARDEN' ? 'Warden' : 'Senior Warden')}
                    icon={Briefcase}
                    disabled
                  />

                  <Input
                    id="profile-hostel"
                    label="Administered Hostel (Read Only)"
                    value={user?.hostel ? user.hostel.toUpperCase() : ''}
                    icon={Building2}
                    disabled
                  />
                </div>

                {/* Phone Number */}
                <Input
                  id="profile-phone"
                  label="Contact Phone Number"
                  placeholder="+91 94350 12345"
                  icon={Phone}
                  error={errors.phone?.message}
                  {...register('phone')}
                />
              </>
            ) : (
              <>
                {/* Student Profile: Roll Number & Hostel (Read-only) */}
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
                    value={user?.hostel ? user.hostel.toUpperCase() : ''}
                    icon={Building2}
                    disabled
                  />
                </div>

                {/* Student Profile: Room Number (Admin Managed - Read Only) & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    id="profile-room"
                    label="Hostel Room (Admin Managed - Read Only)"
                    value={user?.room ? `Room ${user.room}` : 'Unassigned'}
                    icon={DoorClosed}
                    disabled
                    helperText="Room allocation is administratively managed. Contact hostel warden or senior warden to reallocate."
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

                {/* Academic Department */}
                <Select
                  id="profile-department"
                  label="Academic Department"
                  icon={GraduationCap}
                  placeholder="Select Academic Department"
                  options={DEPARTMENTS.map((dept) => ({ value: dept, label: dept }))}
                  error={errors.department?.message}
                  {...register('department')}
                />
              </>
            )}

            {/* Actions */}
            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                {isAdmin ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Authorized hostel administrative credentials.</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span>Account closure is managed exclusively by the Hostel Senior Warden & Warden.</span>
                  </>
                )}
              </span>
              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={isSubmitting}
                className="px-6 w-full sm:w-auto"
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
