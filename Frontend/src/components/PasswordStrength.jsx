import React from 'react';

export const PasswordStrength = ({ password = '' }) => {
  if (!password) return null;

  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  const strengthLabels = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'];

  return (
    <div className="mt-1.5 space-y-1">
      <div className="flex gap-1 h-1 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={`h-full flex-1 transition-all duration-200 ${
              score >= step
                ? 'bg-zinc-900 dark:bg-zinc-100'
                : 'bg-transparent'
            }`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
        <span>Strength</span>
        <span className="font-medium text-zinc-900 dark:text-zinc-100">
          {strengthLabels[score]}
        </span>
      </div>
    </div>
  );
};
