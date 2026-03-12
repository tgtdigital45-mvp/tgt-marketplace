import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import {
  LayoutDashboard,
  LogOut,
  ChevronDown,
  Menu,
  X,
  BookOpen,
  HeadphonesIcon,
  CreditCard,
  Building2,
} from 'lucide-react';

const NAV_LINKS = [
  { label: 'Recursos', href: '/como-funciona', icon: BookOpen },
  { label: 'Planos', href: '/assinatura', icon: CreditCard },
  { label: 'Suporte', href: '/ajuda', icon: HeadphonesIcon },
];

const ProHeader: React.FC = () => {
  const { user, logout } = useAuth();
  const { company } = useCompany();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const dashboardUrl = company?.slug
    ? `/dashboard/empresa/${company.slug}`
    : user?.companySlug
    ? `/dashboard/empresa/${user.companySlug}`
    : '/dashboard';

  const displayName = company?.company_name || user?.name || 'Empresa';
  const avatarLetter = displayName.charAt(0).toUpperCase();

  return (
    <>
      <header
        className={`sticky top-0 left-0 w-full z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/90 backdrop-blur-xl border-b border-gray-200/60 shadow-sm'
            : 'bg-white/95 backdrop-blur-sm border-b border-transparent'
        }`}
      >
        <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group flex-shrink-0">
              <img
                src="/logo-contratto.png"
                alt="CONTRATTO"
                className="h-9 sm:h-11 w-auto object-contain transition-opacity group-hover:opacity-80"
              />
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary text-[11px] font-semibold tracking-wide uppercase">
                Parceiros
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {NAV_LINKS.map(({ label, href }) => (
                <Link
                  key={href}
                  to={href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === href
                      ? 'text-brand-primary bg-brand-primary/8'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {label}
                </Link>
              ))}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-2 sm:gap-3">
              {user && user.type === 'company' ? (
                <>
                  {/* Go to Dashboard — desktop shortcut */}
                  <Link
                    to={dashboardUrl}
                    className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-primary text-white text-sm font-medium hover:bg-brand-primary/90 transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Link>

                  {/* User menu */}
                  <div className="relative" ref={userMenuRef}>
                    <button
                      onClick={() => setUserMenuOpen(v => !v)}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-full bg-brand-primary/15 text-brand-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {company?.logo_url ? (
                          <img src={company.logo_url} alt={displayName} className="w-7 h-7 rounded-full object-cover" />
                        ) : (
                          avatarLetter
                        )}
                      </div>
                      <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[120px] truncate">
                        {displayName}
                      </span>
                      <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {userMenuOpen && (
                      <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50">
                        <div className="px-3 py-2 border-b border-gray-100">
                          <p className="text-xs font-semibold text-gray-900 truncate">{displayName}</p>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                        <Link
                          to={dashboardUrl}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4 text-gray-400" />
                          Ir ao Dashboard
                        </Link>
                        <Link
                          to={`${dashboardUrl}/perfil`}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Building2 className="w-4 h-4 text-gray-400" />
                          Perfil da Empresa
                        </Link>
                        <hr className="my-1 border-gray-100" />
                        <button
                          onClick={() => logout()}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Sair
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Link
                    to="/login/empresa"
                    className="hidden sm:inline-flex px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Entrar
                  </Link>
                  <Link
                    to="/empresa/cadastro"
                    className="inline-flex px-3 py-1.5 rounded-lg bg-brand-primary text-white text-sm font-medium hover:bg-brand-primary/90 transition-colors"
                  >
                    Cadastrar empresa
                  </Link>
                </>
              )}

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileOpen(v => !v)}
                className="lg:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
                aria-label="Menu"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/30" onClick={() => setMobileOpen(false)}>
          <div
            className="absolute top-[56px] sm:top-[64px] left-0 right-0 bg-white border-b border-gray-200 shadow-lg p-4 space-y-1"
            onClick={e => e.stopPropagation()}
          >
            {NAV_LINKS.map(({ label, href, icon: Icon }) => (
              <Link
                key={href}
                to={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Icon className="w-4 h-4 text-gray-400" />
                {label}
              </Link>
            ))}

            {user && user.type === 'company' && (
              <>
                <hr className="border-gray-100 my-2" />
                <Link
                  to={dashboardUrl}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-brand-primary bg-brand-primary/8 hover:bg-brand-primary/12 transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Ir ao Dashboard
                </Link>
                <button
                  onClick={() => logout()}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sair
                </button>
              </>
            )}

            {!user && (
              <>
                <hr className="border-gray-100 my-2" />
                <Link
                  to="/login/empresa"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Entrar
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ProHeader;
