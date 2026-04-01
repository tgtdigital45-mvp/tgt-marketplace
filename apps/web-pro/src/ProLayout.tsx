import React from 'react';
import ProRoutes from './routes';

const ProLayout: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        <ProRoutes />
      </main>
    </div>
  );
};

export default ProLayout;
