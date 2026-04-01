import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ProNavbar from './ProNavbar';
import ProFooter from './ProFooter';

interface ProPublicLayoutProps {
  children: React.ReactNode;
}

const ProPublicLayout: React.FC<ProPublicLayoutProps> = ({ children }) => {
  const { pathname } = useLocation();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="flex flex-col min-h-screen font-sans selection:bg-primary-100 selection:text-primary-900">
      <ProNavbar />
      <main className="flex-grow">
        {children}
      </main>
      <ProFooter />
    </div>
  );
};

export default ProPublicLayout;
