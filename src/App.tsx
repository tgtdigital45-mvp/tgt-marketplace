import React from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { CompanyProvider } from './contexts/CompanyContext';
import { ToastProvider } from './contexts/ToastContext';
import { FavoritesProvider } from './contexts/FavoritesContext';
import ScrollToTop from './components/ScrollToTop';
import MainLayout from './components/layout/MainLayout';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30 segundos - muito mais seguro para dados dinâmicos
      gcTime: 1000 * 60 * 5, // 5 minutos de cache em memória
      refetchOnWindowFocus: true, // Importante para atualizar dados ao voltar para a aba
      retry: 1,
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
                  <FavoritesProvider>
                    <ScrollToTop />
                    <MainLayout />
                  </FavoritesProvider>
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
