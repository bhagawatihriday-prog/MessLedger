import React from 'react';
import { Navbar } from './Navbar';
import { MobileNavbar } from './MobileNavbar';
import { MobileBottomNav } from './MobileBottomNav';
import { Footer } from './Footer';
import { ScrollToTop } from './ScrollToTop';

export const PageContainer = ({
  children,
  showNav = true,
  showFooter = true,
  showBottomNav = true,
  showContactFooter,
  className = '',
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] dark:bg-zinc-950 transition-colors text-zinc-950 dark:text-zinc-50">
      {showNav && (
        <div className="sticky top-0 z-40 w-full">
          <div className="hidden md:block">
            <Navbar />
          </div>
          <div className="md:hidden">
            <MobileNavbar />
          </div>
        </div>
      )}

      <main
        className={`flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 ${
          showBottomNav ? 'pb-24 md:pb-8' : 'pb-8'
        } ${className}`}
      >
        {children}
      </main>

      {showFooter && <Footer showContactDetails={showContactFooter} />}
      {showBottomNav && <MobileBottomNav />}
      <ScrollToTop />
    </div>
  );
};
