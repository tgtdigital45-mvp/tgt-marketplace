import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, Navigate, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import StoreStatusToggle from '@/components/dashboard/StoreStatusToggle';

const DashboardLayout: React.FC = () => {
  const { user, loading } = useAuth();
  const { company, loading: companyLoading } = useCompany();
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Redirect if slug mismatch
  useEffect(() => {
    if (!loading && !companyLoading && user && company && slug !== company.slug) {
      navigate(`/dashboard/empresa/${company.slug}`, { replace: true });
    }
  }, [user, company, slug, loading, companyLoading, navigate]);

  // Close mobile sidebar on navigation
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [slug]);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileSidebarOpen]);

  if (loading || companyLoading) {
    return <div className="flex justify-center items-center h-screen text-brand-primary font-bold text-sm sm:text-base">Carregando CONTRATTO...</div>;
  }

  if (!user || user.type !== 'company') {
    return <Navigate to="/login/empresa" replace />;
  }

  if (!company) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 font-medium text-sm">
            Perfil de empresa nao encontrado ou ainda sincronizando.
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-brand-primary text-white py-2.5 px-4 rounded-lg font-bold hover:bg-brand-primary/90 transition-colors text-sm"
            >
              Tentar Atualizar
            </button>
            <button
              onClick={() => navigate('/empresa/cadastro')}
              className="w-full text-gray-500 py-2 px-4 text-sm hover:underline"
            >
              Nao possui cadastro? Criar Perfil
            </button>
          </div>
        </div>
      </div>
    );
  }

  const navigation = [
    { name: 'Dashboard', href: `/dashboard/empresa/${company.slug}`, icon: <HomeIcon /> },
    { name: 'Mensagens', href: `/dashboard/empresa/${company.slug}/mensagens`, icon: <ChatBubbleIcon /> },
    { name: 'Orcamentos', href: `/dashboard/empresa/${company.slug}/orcamentos`, icon: <QuoteIcon /> },
    { name: 'Agenda', href: `/dashboard/empresa/${company.slug}/agenda`, icon: <CalendarIcon /> },
    { name: 'Servicos', href: `/dashboard/empresa/${company.slug}/servicos`, icon: <SupportIcon /> },
    { name: 'Faturamento', href: `/dashboard/empresa/${company.slug}/faturamento`, icon: <WalletIcon /> },
    { name: 'Portfolio', href: `/dashboard/empresa/${company.slug}/portfolio`, icon: <PhotoIcon /> },
    { name: 'Equipe', href: `/dashboard/empresa/${company.slug}/equipe`, icon: <PersonIcon /> },
  ];

  const accountPages = [
    { name: 'Perfil', href: `/dashboard/empresa/${company.slug}/perfil`, icon: <PersonIcon /> },
    { name: 'Assinatura', href: `/dashboard/empresa/${company.slug}/assinatura`, icon: <StarIcon /> },
    { name: 'Configuracoes', href: `/dashboard/empresa/${company.slug}/configuracoes`, icon: <SettingsIcon /> },
    { name: 'Suporte', href: `/dashboard/empresa/${company.slug}/suporte`, icon: <LifeBuoyIcon /> },
  ];

  const SidebarContent = () => (
    <>
      <div className="mb-4 sm:mb-6 px-3 sm:px-4 flex items-center gap-3">
        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-brand-primary rounded-lg flex items-center justify-center text-white flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5"><path d="M11.7 2.805a.75.75 0 01.6 0A60.65 60.65 0 0122.83 8.72a.75.75 0 01-.231 1.337 49.949 49.949 0 00-9.902 3.912l-.003.002-.34.18a.75.75 0 01-.707 0A50.009 50.009 0 002.1 9.763.75.75 0 011.7 8.72c2.787-1.31 5.952-2.3 9.38-2.922 1.341-2.43 3.65-4.436 6.366-5.466z" fillRule="evenodd" clipRule="evenodd" /></svg>
        </div>
        <span className="font-display text-gray-900 font-bold text-[10px] sm:text-xs tracking-wide uppercase truncate">CONTRATTO DASHBOARD</span>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent mb-4 sm:mb-6"></div>

      <nav className="space-y-0.5 sm:space-y-1">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            end={item.name === 'Dashboard'}
            onClick={() => setMobileSidebarOpen(false)}
            className={({ isActive }) =>
              `group flex items-center px-3 sm:px-4 py-2.5 sm:py-3 text-[11px] sm:text-xs font-bold rounded-lg sm:rounded-xl transition-all ${isActive
                ? 'bg-white text-gray-800 shadow-md'
                : 'text-gray-500 hover:text-gray-800'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-1.5 sm:p-2 rounded-lg mr-2 sm:mr-3 transition-colors flex-shrink-0 ${isActive ? 'bg-brand-primary text-white shadow-sm' : 'bg-white text-brand-primary shadow-xs'}`}>
                  {item.icon}
                </div>
                <span className="truncate">{item.name}</span>
              </>
            )}
          </NavLink>
        ))}

        <div className="mt-4 sm:mt-6 mb-1.5 sm:mb-2 px-3 sm:px-4 text-[10px] sm:text-xs font-display font-bold text-gray-900 uppercase">Paginas da Conta</div>

        {accountPages.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            onClick={() => setMobileSidebarOpen(false)}
            className={({ isActive }) =>
              `group flex items-center px-3 sm:px-4 py-2.5 sm:py-3 text-[11px] sm:text-xs font-bold rounded-lg sm:rounded-xl transition-all ${isActive
                ? 'bg-white text-gray-800 shadow-md'
                : 'text-gray-500 hover:text-gray-800'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-1.5 sm:p-2 rounded-lg mr-2 sm:mr-3 transition-colors flex-shrink-0 ${isActive ? 'bg-brand-primary text-white shadow-sm' : 'bg-white text-brand-primary shadow-xs'}`}>
                  {item.icon}
                </div>
                <span className="truncate">{item.name}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-6 sm:mt-8 px-3 sm:px-4">
        <StoreStatusToggle />
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Top Bar */}
      <div className="lg:hidden sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-brand-primary rounded-lg flex items-center justify-center text-white">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M11.7 2.805a.75.75 0 01.6 0A60.65 60.65 0 0122.83 8.72a.75.75 0 01-.231 1.337 49.949 49.949 0 00-9.902 3.912l-.003.002-.34.18a.75.75 0 01-.707 0A50.009 50.009 0 002.1 9.763.75.75 0 011.7 8.72c2.787-1.31 5.952-2.3 9.38-2.922 1.341-2.43 3.65-4.436 6.366-5.466z" fillRule="evenodd" clipRule="evenodd" /></svg>
          </div>
          <span className="font-display text-gray-900 font-bold text-xs tracking-wide uppercase">Dashboard</span>
        </div>
        <button
          onClick={() => setMobileSidebarOpen(true)}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          aria-label="Abrir menu"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-[280px] max-w-[85vw] bg-gray-50 p-4 overflow-y-auto shadow-2xl">
            <div className="flex justify-end mb-2">
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                aria-label="Fechar menu"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <SidebarContent />
          </div>
        </div>
      )}

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 xl:w-72 bg-gray-50 p-4 fixed h-full overflow-y-auto">
          <SidebarContent />
        </aside>

        {/* Main Content */}
        <div className="flex-1 lg:ml-64 xl:ml-72 p-3 sm:p-4 lg:p-8 relative z-0 min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

// Simple Icons
const HomeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M11.47 3.84a.75.75 0 011.06 0l8.632 8.632a.75.75 0 01-1.06 1.06l-.353-.353V21.75A.75.75 0 0119 22.5H5a.75.75 0 01-.75-.75V13.18l-.353.353a.75.75 0 01-1.06-1.06l8.632-8.632z" /></svg>;
const CreditCardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M2.25 8.25a.75.75 0 01.75-.75h18a.75.75 0 01.75.75v10.5a.75.75 0 01-.75.75H3a.75.75 0 01-.75-.75V8.25z" /><path d="M2.25 5.25a.75.75 0 01.75-.75h18a.75.75 0 01.75.75v5.25H2.25V5.25z" /></svg>;
const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M12.75 12.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM7.5 15.75a.75.75 0 100-1.5 .75.75 0 000 1.5zM8.25 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM9.75 15.75a.75.75 0 100-1.5 .75.75 0 000 1.5zM10.5 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12 15.75a.75.75 0 100-1.5 .75.75 0 000 1.5zM12.75 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM14.25 15.75a.75.75 0 100-1.5 .75.75 0 000 1.5zM15 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM16.5 15.75a.75.75 0 100-1.5 .75.75 0 000 1.5zM15 12.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM16.5 13.5a.75.75 0 100-1.5 .75.75 0 000 1.5z" /><path fillRule="evenodd" d="M6.75 2.25A.75.75 0 017.5 3v1.5h9V3A.75.75 0 0118 3v1.5h.75a3 3 0 013 3v11.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V7.5a3 3 0 013-3H6V3a.75.75 0 01.75-.75zm13.5 9a1.5 1.5 0 00-1.5-1.5H5.25a1.5 1.5 0 00-1.5 1.5v7.5a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5v-7.5z" clipRule="evenodd" /></svg>;
const DocumentIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0016.5 9h-1.875a1.875 1.875 0 01-1.875-1.875V5.25A3.75 3.75 0 009 1.5H5.625zM7.5 15a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5A.75.75 0 017.5 15zm.75 2.25a.75.75 0 000 1.5H12a.75.75 0 000-1.5H8.25z" clipRule="evenodd" /><path d="M12.971 1.816A5.23 5.23 0 0114.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 013.434 1.279 9.768 9.768 0 00-6.963-6.963z" /></svg>;
const SupportIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm11.378-3.917c-.89-.777-2.366-.777-3.255 0a.75.75 0 01-.988-1.129c1.454-1.272 3.765-1.272 5.219 0a.75.75 0 01-.976 1.129zM15 12a3 3 0 11-6 0 3 3 0 016 0z" clipRule="evenodd" /></svg>;
const WalletIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" /></svg>;
const PersonIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" /></svg>;
const StarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" /></svg>;
const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 00-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 00-2.282.819l-.922 1.597a1.875 1.875 0 00.432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 000 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 00-.432 2.385l.922 1.597a1.875 1.875 0 002.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.985.57.182.088.277.228.297.35l.178 1.071c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 002.28-.819l.922-1.597a1.875 1.875 0 00-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 000-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 00-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 00-.985-.57c-.183-.087-.277-.227-.297-.348l-.179-1.072a1.875 1.875 0 00-1.85-1.567h-1.843zM12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" clipRule="evenodd" /></svg>;
const LifeBuoyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 01.75.75v.008c0 .414-.336.75-.75.75h-.008a.75.75 0 01-.75-.75V9.75c0-.414.336-.75.75-.75h.008zM14.5 9a.75.75 0 000 1.5h.008a.75.75 0 000-1.5H14.5zm-5 0a.75.75 0 000 1.5h.008a.75.75 0 000-1.5H9.5z" clipRule="evenodd" /></svg>;
const PhotoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0021 18v-1.94l-2.69-2.689a1.5 1.5 0 00-2.12 0l-.88.879.97.97a.75.75 0 11-1.06 1.06l-5.16-5.159a1.5 1.5 0 00-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z" clipRule="evenodd" /></svg>;
const ChatBubbleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M4.804 21.644A6.707 6.707 0 006 21.75a6.721 6.721 0 003.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 01-.814 1.686.75.75 0 00.44 1.223zM8.25 10.875a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25zM10.875 12a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875-1.125a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25z" clipRule="evenodd" /></svg>;
const QuoteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0016.5 9h-1.875a1.875 1.875 0 01-1.875-1.875V5.25A3.75 3.75 0 009 1.5H5.625zM7.5 15a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5A.75.75 0 017.5 15zm.75-6.75a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5h-4.5z" clipRule="evenodd" /><path d="M12.971 1.816A5.23 5.23 0 0114.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 013.434 1.279 9.768 9.768 0 00-6.963-6.963z" /></svg>;

export default DashboardLayout;
