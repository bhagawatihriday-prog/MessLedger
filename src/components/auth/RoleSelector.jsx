import React from 'react';
import { GraduationCap, ShieldCheck } from 'lucide-react';
import { USER_ROLES } from '../../utils/constants';

export const RoleSelector = ({ selectedRole, onRoleChange, className = '' }) => {
  return (
    <div className={`w-full ${className}`}>
      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
        Register as
      </label>
      <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
        <button
          type="button"
          onClick={() => onRoleChange(USER_ROLES.STUDENT)}
          className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
            selectedRole === USER_ROLES.STUDENT
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/80 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Student</span>
        </button>

        <button
          type="button"
          onClick={() => onRoleChange(USER_ROLES.ADMIN)}
          className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
            selectedRole === USER_ROLES.ADMIN
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/80 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Admin</span>
        </button>
      </div>
    </div>
  );
};
