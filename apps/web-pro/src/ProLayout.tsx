import React from 'react';
import { useLocation } from 'react-router-dom';
import ProHeader from './components/layout/ProHeader';
import ProFooter from './components/layout/ProFooter';
import ProRoutes from './routes';

// Dashboard routes manage their own full-screen layout (sidebar + content).
// These prefixes should NOT have the marketplace header/footer wrapping them.
const DASHBOARD_PREFIXES = ['/dashboard/', '/admin'];

const ProLayout: React.FC = () => {
  const { pathname } = useLocation();
  const isDashboard = DASHBOARD_PREFIXES.some(prefix => pathname.startsWith(prefix));

  if (isDashboard) {
    return <ProRoutes />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <ProHeader />
      <main className="flex-grow">
        <ProRoutes />
      </main>
      <ProFooter />
    </div>
  );
};

export default ProLayout;
