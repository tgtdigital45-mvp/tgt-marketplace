import React from 'react';
import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import StoreStatusToggle from '../dashboard/StoreStatusToggle';

const DashboardLayout: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><p>Carregando...</p></div>;
  }

  if (!user || user.type !== 'company') {
    return <Navigate to="/auth/login" replace />;
  }

  const navigation = [
    { name: 'Visão Geral', href: '/dashboard/empresa', end: true },
    { name: 'Agendamentos', href: '/dashboard/empresa/agendamentos' }, // Kanban
    { name: 'Agenda', href: '/dashboard/empresa/agenda' }, // Configs
    { name: 'Serviços', href: '/dashboard/empresa/servicos' },
    { name: 'Avaliações', href: '/dashboard/empresa/avaliacoes' },
    { name: 'Mensagens', href: '/dashboard/empresa/mensagens' },
    { name: 'Perfil', href: '/dashboard/empresa/perfil' },
    { name: 'Administradores', href: '/dashboard/empresa/administradores' },
    { name: 'Portfólio', href: '/dashboard/empresa/portfolio' },
    { name: 'Configurações', href: '/dashboard/empresa/configuracoes' },
  ];

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 h-full flex flex-col lg:flex-row gap-8">
      <aside className="lg:w-64 xl:w-72 shrink-0 mb-8 lg:mb-0">
        <div className="sticky top-24 space-y-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900 px-1">Painel TGT</h3>
            <p className="text-sm text-gray-500 mb-4 px-1">Gestão Profissional</p>
          </div>

          <StoreStatusToggle />

          <nav className="space-y-1">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                end={item.end}
                className={({ isActive }) =>
                  `group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all ${isActive
                    ? 'bg-brand-primary text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`
                }
              >
                <span className="truncate">{item.name}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </aside>
      <div className="flex-1 bg-white rounded-lg shadow flex flex-col min-h-0">
        <Outlet />
      </div>
    </div>
  );
};

export default DashboardLayout;