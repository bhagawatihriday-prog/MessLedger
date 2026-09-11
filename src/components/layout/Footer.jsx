import React, { useEffect, useState } from 'react';
import { Mail, Phone, ShieldCheck, UserCheck, Heart } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { hostelService } from '../../services/hostelService';

export const Footer = () => {
  const { user } = useAuth();
  const [hostelData, setHostelData] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const loadHostelContact = async () => {
      try {
        const data = await hostelService.getHostelByName(user?.hostel || 'LBBH');
        if (isMounted) setHostelData(data);
      } catch (err) {
        console.error('Failed to load hostel footer info:', err);
      }
    };

    loadHostelContact();
    return () => {
      isMounted = false;
    };
  }, [user?.hostel]);

  const admin = hostelData?.admin || {
    name: 'Mr. Rajeshwar Das',
    phone: '+91 94350 12345',
    email: 'admin.lbbh@hostel.edu',
  };

  const warden = hostelData?.warden || {
    name: 'Prof. Anjan K. Sarma',
    phone: '+91 98640 67890',
    email: 'warden.lbbh@hostel.edu',
  };

  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 mt-12 mb-16 md:mb-0 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Hostel Admin Card */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-2">
              <ShieldCheck className="w-4 h-4" />
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Hostel Administration ({user?.hostel || 'LBBH'})
              </h5>
            </div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {admin.name}
            </p>
            <div className="mt-2 space-y-1 text-xs text-slate-600 dark:text-slate-400">
              <a
                href={`tel:${admin.phone}`}
                className="flex items-center gap-2 hover:text-indigo-600 transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{admin.phone}</span>
              </a>
              <a
                href={`mailto:${admin.email}`}
                className="flex items-center gap-2 hover:text-indigo-600 transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>{admin.email}</span>
              </a>
            </div>
          </div>

          {/* Hostel Warden Card */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-2">
              <UserCheck className="w-4 h-4" />
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Warden ({user?.hostel || 'LBBH'})
              </h5>
            </div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {warden.name}
            </p>
            <div className="mt-2 space-y-1 text-xs text-slate-600 dark:text-slate-400">
              <a
                href={`tel:${warden.phone}`}
                className="flex items-center gap-2 hover:text-indigo-600 transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{warden.phone}</span>
              </a>
              <a
                href={`mailto:${warden.email}`}
                className="flex items-center gap-2 hover:text-indigo-600 transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>{warden.email}</span>
              </a>
            </div>
          </div>

          {/* System Info / Support */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-2">
                Help & Helpdesk
              </h5>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                For mess rebate applications, guest meal coupon inquiries, or ledger discrepancies, contact your hostel committee.
              </p>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
              <span>Billing Cycle: 1st – 30th</span>
              <span className="text-amber-600 dark:text-amber-400 font-medium">
                Fine: ₹20/day after due
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <p>© 2026 MessLedger. All rights reserved.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Production v1.0</span>
            <span>•</span>
            <span>University Hostel Management System</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
