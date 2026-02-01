import React from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { CompanyProvider } from './contexts/CompanyContext';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import { ToastProvider } from './contexts/ToastContext';
import { FavoritesProvider } from './contexts/FavoritesContext';
import { MockProvider } from './contexts/MockContext';
import ScrollToTop from './components/ScrollToTop';
import MainRoutes from './routes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <AuthProvider>
            <ToastProvider>
              <NotificationProvider>
                <CompanyProvider>
                  <MockProvider>
                    <FavoritesProvider>
                      <ScrollToTop />
                      <div className="flex flex-col min-h-screen">
                        <Header />
                        <main className="flex-grow">
                          <MainRoutes />
                        </main>
                        <Footer />
                      </div>
                    </FavoritesProvider>
                  </MockProvider>
                </CompanyProvider>
              </NotificationProvider>
            </ToastProvider>
          </AuthProvider>
        </BrowserRouter>
      </HelmetProvider>
    </QueryClientProvider>
  );
};

export default App;

