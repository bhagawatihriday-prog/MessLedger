import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, CreditCard, BookOpen, User, Shield, Settings, Users } from 'lucide-react';
import { useAuth } from '../context';

export const MobileBottomNav = () => {
  const location = useLocation();
  const { user } = useAuth();

  const isAuthority = user?.role === 'ADMIN' || user?.role === 'SENIOR_WARDEN' || user?.role === 'WARDEN';

  const navItems =
    isAuthority
      ? [
          { label: 'Console', path: '/admin/dashboard', icon: Shield },
          { label: 'Boarders', path: '/admin/boarders', icon: Users },
          { label: 'Settings', path: '/login/dashboard/settings', icon: Settings },
        ]
      : [
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

  const gridColsClass =
    navItems.length === 3
      ? 'grid-cols-3'
      : navItems.length === 2
      ? 'grid-cols-2'
      : 'grid-cols-4';

  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 pb-safe">
      <div className={`grid ${gridColsClass} h-14`}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.isActive
            ? item.isActive(location)
            : location.pathname === item.path && !location.hash;

          return (
            <NavLink
              key={item.label}
              to={item.path}
              className={`flex flex-col items-center justify-center gap-1 transition-colors py-1 ${
                active
                  ? 'text-zinc-950 dark:text-zinc-50 font-semibold'
                  : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? 'stroke-[2.5]' : 'stroke-[1.5]'}`} />
              <span className="text-[10px] leading-none">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
};
