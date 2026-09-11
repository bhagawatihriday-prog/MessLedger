import React from 'react';
import { Navbar } from './Navbar';
import { MobileNavbar } from './MobileNavbar';
import { MobileBottomNav } from './MobileBottomNav';
import { Footer } from './Footer';

export const PageContainer = ({
  children,
  showNav = true,
  showFooter = true,
  showBottomNav = true,
  className = '',
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 transition-colors text-slate-900 dark:text-slate-100">
      {showNav && (
        <>
          <div className="hidden md:block">
            <Navbar />
          </div>
          <div className="md:hidden">
            <MobileNavbar />
          </div>
        </>
      )}

      <main className={`flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 ${className}`}>
        {children}
      </main>

      {showFooter && <Footer />}
      {showBottomNav && <MobileBottomNav />}
    </div>
  );
};
