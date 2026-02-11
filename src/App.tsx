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
      staleTime: 1000 * 60 * 60, // 1 hora - dados considerados "frescos" por 1h
      gcTime: 1000 * 60 * 60 * 24, // 24 horas - garbage collection após 24h
      refetchOnWindowFocus: false, // Não refetch ao focar janela
      retry: 1, // Apenas 1 retry em caso de erro
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
