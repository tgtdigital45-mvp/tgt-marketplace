import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Menu,
  X,
  BookOpen,
  HeadphonesIcon,
  CreditCard,
} from 'lucide-react';

const NAV_LINKS = [
  { label: 'Recursos', href: '/como-funciona', icon: BookOpen },
  { label: 'Planos', href: '/assinatura', icon: CreditCard },
  { label: 'Suporte', href: '/ajuda', icon: HeadphonesIcon },
];

const PORTAL_URL = import.meta.env.VITE_PORTAL_URL || 'https://portal.ex.com';

const ProHeader: React.FC = () => {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

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
              <a
                href={`${PORTAL_URL}/login`}
                className="hidden sm:inline-flex px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Entrar
              </a>
              <a
                href={`${PORTAL_URL}/cadastro`}
                className="inline-flex px-3 py-1.5 rounded-lg bg-brand-primary text-white text-sm font-medium hover:bg-brand-primary/90 transition-colors"
              >
                Cadastrar empresa
              </a>

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

            <hr className="border-gray-100 my-2" />
            <a
              href={`${PORTAL_URL}/login`}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Entrar
            </a>
            <a
              href={`${PORTAL_URL}/cadastro`}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-brand-primary bg-brand-primary/8 hover:bg-brand-primary/12 transition-colors"
            >
              Cadastrar empresa
            </a>
          </div>
        </div>
      )}
    </>
  );
};

export default ProHeader;
