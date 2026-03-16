import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, Navigate, useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import StoreStatusToggle from '@/components/dashboard/StoreStatusToggle';

const DashboardLayout: React.FC = () => {
  const { user, loading, logout } = useAuth();
  const { company, isLoading: companyLoading } = useCompany();
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      if (window.confirm('Deseja realmente sair da sua conta?')) {
        await logout();
      }
    } catch (error) {
      console.error('Erro ao deslogar:', error);
    }
  };

  // Redirect if slug mismatch
  useEffect(() => {
    if (!loading && !companyLoading && user && company && slug && slug !== company.slug) {
      navigate(`/dashboard/empresa/${company.slug}`, { replace: true });
    }
  }, [user, company, slug, loading, companyLoading, navigate]);

  // Close mobile sidebar on navigation
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  if (loading || companyLoading) {
    return <div className="flex justify-center items-center h-screen text-brand-primary font-bold text-sm">Carregando Dashboard...</div>;
  }

  if (!user || user.type !== 'company') {
    return <Navigate to="/login" replace />;
  }

  if (!company) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 font-medium text-sm">
            Perfil de empresa não encontrado ou ainda sincronizando.
          </div>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-brand-primary text-white py-2.5 px-4 rounded-lg font-bold hover:bg-brand-primary/90 transition-colors text-sm"
          >
            Tentar Atualizar
          </button>
        </div>
      </div>
    );
  }

  const base = `/dashboard/empresa/${company.slug}`;

  const navigation = [
    { name: 'Geral', href: base, icon: <HomeIcon /> },
    { name: 'Funil de Vendas', href: `${base}/crm/funil`, icon: <KanbanIcon /> },
    { name: 'Prospecção (Leads)', href: `${base}/crm/prospeccao`, icon: <TrendingUpIcon /> },
    { name: 'Insights & BI', href: `${base}/crm/analytics`, icon: <BarChartIcon /> },
    { name: 'Vagas', href: `${base}/vagas`, icon: <ShoppingBagIcon /> },
    { name: 'Propostas', href: `${base}/orcamentos`, icon: <QuoteIcon /> },
    { name: 'Serviços', href: `${base}/servicos`, icon: <WrenchIcon /> },
    { name: 'Agenda', href: `${base}/agenda`, icon: <CalendarIcon /> },
    { name: 'Mensagens', href: `${base}/mensagens`, icon: <ChatBubbleIcon /> },
    { name: 'Portfólio', href: `${base}/portfolio`, icon: <PhotoIcon /> },
    { name: 'Avaliações', href: `${base}/avaliacoes`, icon: <StarIcon /> },
    { name: 'Financeiro', href: `${base}/faturamento`, icon: <WalletIcon /> },
    { name: 'Assinatura', href: `${base}/assinatura`, icon: <StarIcon /> },
  ];

  const accountPages = [
    { name: 'Perfil Público', href: `${base}/perfil`, icon: <PersonIcon /> },
    { name: 'Equipe', href: `${base}/equipe`, icon: <UsersIcon /> },
    { name: 'Verificação', href: `${base}/verificacao`, icon: <BadgeCheckIcon /> },
    { name: 'Configurações', href: `${base}/configuracoes`, icon: <SettingsIcon /> },
    { name: 'Suporte', href: `${base}/suporte`, icon: <LifeBuoyIcon /> },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300 p-4">
      <div className="mb-8 flex items-center gap-3 px-2">
        <img
          src="/logo-contratto.png"
          alt="CONTRATTO"
          className="h-7 w-auto brightness-0 invert opacity-90 flex-shrink-0"
        />
        <div className="overflow-hidden border-l border-slate-700 pl-3">
          <p className="text-white font-bold text-sm truncate">{company.company_name}</p>
          <p className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold">Painel Parceiro</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto pr-1 custom-scrollbar">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            end={item.href === base}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-indigo-600/20 text-indigo-400 shadow-sm' : 'hover:bg-slate-800 text-slate-400'
              }`
            }
          >
            <span className="shrink-0">{item.icon}</span>
            {item.name}
          </NavLink>
        ))}

        <div className="pt-6 pb-2 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ajustes</div>

        {accountPages.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-indigo-600/20 text-indigo-400 shadow-sm' : 'hover:bg-slate-800 text-slate-400'
              }`
            }
          >
            <span className="shrink-0">{item.icon}</span>
            {item.name}
          </NavLink>
        ))}

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-red-500/10 text-slate-400 hover:text-red-400 mt-2"
        >
          <span className="shrink-0 text-red-500/70"><LogOutIcon /></span>
          Sair da Conta
        </button>
      </nav>

      <div className="mt-auto pt-4 border-t border-slate-800">
        <StoreStatusToggle />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-slate-200 sticky top-0 h-screen shrink-0">
        <SidebarContent />
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar Mobile */}
        <header className="lg:hidden flex items-center justify-between h-14 bg-slate-900 px-4 shrink-0">
          <div className="flex items-center gap-2">
            <img src="/logo-contratto.png" alt="CONTRATTO" className="h-6 w-auto brightness-0 invert" />
            <span className="text-white font-bold text-sm">Portal</span>
          </div>
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
            <MenuIcon />
          </button>
        </header>

        {/* Main Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
          <div className="max-w-[1440px] mx-auto p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setMobileSidebarOpen(false)} />
          <div className="relative w-72 max-w-[80vw] h-full bg-slate-900 shadow-xl transition-transform duration-300">
             <button
              onClick={() => setMobileSidebarOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white"
            >
              <XIcon />
            </button>
            <SidebarContent />
          </div>
        </div>
      )}
    </div>
  );
};

// Simplified Icons
function HomeIcon() { return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>; }
function ShoppingBagIcon() { return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>; }
function QuoteIcon() { return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>; }
function CalendarIcon() { return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>; }
function ChatBubbleIcon() { return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>; }
function WalletIcon() { return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>; }
function PersonIcon() { return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>; }
function SettingsIcon() { return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>; }
function LifeBuoyIcon() { return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>; }
function MenuIcon() { return <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>; }
function XIcon() { return <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>; }
function WrenchIcon() { return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" /></svg>; }
function PhotoIcon() { return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>; }
function StarIcon() { return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>; }
function UsersIcon() { return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>; }
function BadgeCheckIcon() { return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>; }
function KanbanIcon() { return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2m0 10V7a2 2 0 012-2h2a2 2 0 012 2v10a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>; }
function TrendingUpIcon() { return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>; }
function BarChartIcon() { return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2" /></svg>; }
function LogOutIcon() { return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>; }

export default DashboardLayout;
