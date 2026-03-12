import React from 'react';
import { useLocation } from 'react-router-dom';
import ProHeader from './components/layout/ProHeader';
import ProFooter from './components/layout/ProFooter';
import ProRoutes from './routes';

const ProLayout: React.FC = () => {
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
