import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, CreditCard, BookOpen, User } from 'lucide-react';

export const MobileBottomNav = () => {
  const location = useLocation();

  const navItems = [
    { label: 'Home', path: '/login/dashboard', icon: Home },
    { label: 'Pay', path: '/login/dashboard/payment', icon: CreditCard },
    {
      label: 'Ledger',
      path: '/login/dashboard#ledger',
      icon: BookOpen,
      isActive: (loc) => loc.pathname === '/login/dashboard' && loc.hash === '#ledger',
    },
    { label: 'Me', path: '/login/dashboard/profile', icon: User },
  ];

  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 pb-safe">
      <div className="grid grid-cols-4 h-15">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.isActive
            ? item.isActive(location)
            : location.pathname === item.path && !location.hash;

          return (
            <NavLink
              key={item.label}
              to={item.path}
              className={`flex flex-col items-center justify-center gap-1 transition-colors py-1.5 ${
                active
                  ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
              <span className="text-[11px] leading-none">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
};
