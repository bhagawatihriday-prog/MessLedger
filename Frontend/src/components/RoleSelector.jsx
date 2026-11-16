import React from 'react';
import { GraduationCap, ShieldCheck } from 'lucide-react';
import { USER_ROLES } from '../utils/constants';

export const RoleSelector = ({ selectedRole, onRoleChange, className = '' }) => {
  return (
    <div className={`w-full ${className}`}>
      <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
        Account Type
      </label>
      <div className="grid grid-cols-2 gap-1 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
        <button
          type="button"
          onClick={() => onRoleChange(USER_ROLES.STUDENT)}
          className={`flex items-center justify-center gap-2 py-1.5 px-3 rounded-md text-xs font-medium transition-colors ${
            selectedRole === USER_ROLES.STUDENT
              ? 'bg-zinc-950 text-white dark:bg-zinc-50 dark:text-zinc-950'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Student</span>
        </button>

        <button
          type="button"
          onClick={() => onRoleChange(USER_ROLES.ADMIN)}
          className={`flex items-center justify-center gap-2 py-1.5 px-3 rounded-md text-xs font-medium transition-colors ${
            selectedRole === USER_ROLES.ADMIN
              ? 'bg-zinc-950 text-white dark:bg-zinc-50 dark:text-zinc-950'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Admin</span>
        </button>
      </div>
    </div>
  );
};
