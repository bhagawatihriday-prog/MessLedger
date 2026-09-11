import React from 'react';

export const PasswordStrength = ({ password = '' }) => {
  if (!password) return null;

  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  const strengthLabels = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = [
    'bg-rose-500',
    'bg-rose-500',
    'bg-amber-500',
    'bg-indigo-500',
    'bg-emerald-500',
  ];

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1 h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={`h-full flex-1 transition-all duration-300 ${
              score >= step ? colors[score] : 'bg-transparent'
            }`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
        <span>Password strength:</span>
        <span className="font-semibold text-slate-700 dark:text-slate-200">
          {strengthLabels[score]}
        </span>
      </div>
    </div>
  );
};
