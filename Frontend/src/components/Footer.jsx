import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Mail, Phone, Shield, User } from 'lucide-react';
import { useAuth } from '../context';
import { hostelService } from '../services/hostelService';

export const Footer = ({ showContactDetails }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [hostelData, setHostelData] = useState(null);

  // Show contact details cards only on the student dashboard page (/login/dashboard)
  const isDashboard = showContactDetails ?? (location.pathname === '/login/dashboard');

  useEffect(() => {
    if (!isDashboard) return;
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
  }, [isDashboard, user?.hostel]);

  const seniorWarden = hostelData?.seniorWarden || {
    name: 'Mr. Rajeshwar Das',
    phone: '+91 94350 12345',
    email: 'seniorwarden.lbbh@hostel.edu',
  };

  const warden = hostelData?.warden || {
    name: 'Prof. Anjan K. Sarma',
    phone: '+91 98640 67890',
    email: 'warden.lbbh@hostel.edu',
  };

  return (
    <footer className="bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 mt-12 mb-14 md:mb-0 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
        {/* Contact details cards: only rendered on the dashboard page */}
        {isDashboard && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6 pb-6 border-b border-zinc-200 dark:border-zinc-800">
            {/* Senior Warden Card */}
            <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400 mb-2">
                <Shield className="w-3.5 h-3.5" />
                <h5 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                  Senior Warden ({(user?.hostel || 'LBBH').toUpperCase()})
                </h5>
              </div>
              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                {seniorWarden.name}
              </p>
              <div className="mt-2 space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
                <a
                  href={`tel:${seniorWarden.phone}`}
                  className="flex items-center gap-2 hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors"
                >
                  <Phone className="w-3 h-3 text-zinc-400" />
                  <span>{seniorWarden.phone}</span>
                </a>
                <a
                  href={`mailto:${seniorWarden.email}`}
                  className="flex items-center gap-2 hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors"
                >
                  <Mail className="w-3 h-3 text-zinc-400" />
                  <span>{seniorWarden.email}</span>
                </a>
              </div>
            </div>

            {/* Warden Card */}
            <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400 mb-2">
                <User className="w-3.5 h-3.5" />
                <h5 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                  Warden ({(user?.hostel || 'LBBH').toUpperCase()})
                </h5>
              </div>
              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                {warden.name}
              </p>
              <div className="mt-2 space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
                <a
                  href={`tel:${warden.phone}`}
                  className="flex items-center gap-2 hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors"
                >
                  <Phone className="w-3 h-3 text-zinc-400" />
                  <span>{warden.phone}</span>
                </a>
                <a
                  href={`mailto:${warden.email}`}
                  className="flex items-center gap-2 hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors"
                >
                  <Mail className="w-3 h-3 text-zinc-400" />
                  <span>{warden.email}</span>
                </a>
              </div>
            </div>

            {/* Helpdesk */}
            <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between">
              <div>
                <h5 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100 mb-1.5">
                  Hostel Mess Helpdesk
                </h5>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  For diet rebate adjustments, guest coupons, or billing inquiries, visit the hostel office.
                </p>
              </div>
              <div className="mt-2 pt-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400">
                <span>Billing Cycle: 1st – 30th</span>
                <span>Fine: ₹20/day</span>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Bar: Kept on EVERY page */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <p>© 2026 MessLedger. All rights reserved.</p>
          <div className="flex items-center gap-3 text-zinc-400">
            <span>University Hostel Management System</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
