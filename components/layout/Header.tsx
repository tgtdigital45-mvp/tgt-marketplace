import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import OptimizedImage from '../ui/OptimizedImage';
import { useOnClickOutside } from '../../hooks/useOnClickOutside';
import { AnimatePresence, motion } from 'framer-motion';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useOnClickOutside(dropdownRef, () => setIsDropdownOpen(false));

  // Close menus on route change
  React.useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsDropdownOpen(false);
  }, [navigate]);

  return (
    <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-40 border-b border-gray-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center gap-2">
            <Link to="/" className="text-2xl font-black text-brand-primary tracking-tighter hover:opacity-80 transition-opacity">
              TGT
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/empresas" className="text-gray-600 hover:text-brand-primary font-medium transition-colors text-sm">
              Buscar Empresas
            </Link>
            <Link to="/para-empresas" className="text-gray-600 hover:text-brand-primary font-medium transition-colors text-sm">
              Para Empresas
            </Link>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            {/* "Publicar" button moved to main nav or kept here based on pref, keeping here for now but cleaner */}
            {!user && (
              <Link to="/empresa/cadastro" className="text-sm font-medium text-brand-primary hover:text-brand-primary/80 transition-colors">
                Publicar Grátis
              </Link>
            )}

            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 focus:outline-none group"
                >
                  <OptimizedImage
                    className="h-9 w-9 rounded-full object-cover ring-2 ring-transparent group-hover:ring-brand-primary/20 transition-all"
                    src={user.avatar || `https://i.pravatar.cc/150?u=${user.id}`}
                    alt={user.name}
                  />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors max-w-[100px] truncate">
                    {user.name.split(' ')[0]}
                  </span>
                  <svg className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.1 }}
                      className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl ring-1 ring-black/5 py-2 z-50 overflow-hidden"
                    >
                      <div className="px-4 py-2 border-b border-gray-50">
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Minha Conta</p>
                      </div>

                      {user.type === 'client' && (
                        <>
                          <Link to="/perfil/cliente" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">Meu Perfil</Link>
                          <Link to="/favoritos" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">Favoritos</Link>
                          <Link to="/perfil/cliente" state={{ activeTab: 'messages' }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">Mensagens</Link>
                        </>
                      )}
                      {user.type === 'company' && (
                        <>
                          <Link to="/dashboard/empresa" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">Dashboard</Link>
                          <Link to="/empresa/meu-negocio" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">Ver Página Pública</Link>
                        </>
                      )}

                      <div className="border-t border-gray-50 mt-1 pt-1">
                        <button
                          onClick={handleLogout}
                          className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
                        >
                          Sair
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                to="/auth/login"
                className="bg-brand-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-primary/90 transition-all shadow-md shadow-brand-primary/20 hover:shadow-lg hover:shadow-brand-primary/30 active:scale-95"
              >
                Entrar
              </Link>
            )}
          </div>

          {/* Mobile Menu Button - "Hamburger" */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-brand-primary focus:outline-none transition-colors"
              aria-label="Menu principal"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 md:hidden"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 right-0 w-full max-w-xs bg-white shadow-2xl z-40 md:hidden flex flex-col overflow-y-auto"
            >
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <span className="text-xl font-bold text-gray-900">Menu</span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-4 space-y-4 flex-1">
                {user && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-4">
                    <OptimizedImage
                      src={user.avatar || `https://i.pravatar.cc/150?u=${user.id}`}
                      alt={user.name}
                      className="h-10 w-10 rounded-full bg-white shadow-sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{user.type === 'client' ? 'Cliente' : 'Empresa'}</p>
                    </div>
                  </div>
                )}

                <nav className="space-y-1">
                  <Link to="/" className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-brand-primary hover:bg-brand-primary/5 rounded-lg transition-colors">
                    Início
                  </Link>
                  <Link to="/empresas" className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-brand-primary hover:bg-brand-primary/5 rounded-lg transition-colors">
                    Buscar Empresas
                  </Link>
                  <Link to="/para-empresas" className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-brand-primary hover:bg-brand-primary/5 rounded-lg transition-colors">
                    Para Empresas
                  </Link>
                </nav>

                <div className="border-t border-gray-100 my-4 pt-4">
                  <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Conta</p>
                  {user ? (
                    <div className="space-y-1">
                      {user.type === 'client' ? (
                        <>
                          <Link to="/perfil/cliente" className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg">Meu Perfil</Link>
                          <Link to="/favoritos" className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg">Favoritos</Link>
                          <Link to="/minhas-mensagens" className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg">Mensagens</Link>
                        </>
                      ) : (
                        <>
                          <Link to="/dashboard/empresa" className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg">Dashboard</Link>
                        </>
                      )}
                      <button
                        onClick={handleLogout}
                        className="w-full text-left block px-3 py-2 text-base font-medium text-red-600 hover:bg-red-50 rounded-lg mt-2"
                      >
                        Sair
                      </button>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      <Link to="/auth/login" className="flex items-center justify-center w-full px-4 py-2 border border-transparent rounded-xl shadow-sm text-base font-medium text-white bg-brand-primary hover:bg-brand-primary/90">
                        Entrar
                      </Link>
                      <Link to="/auth/register" className="flex items-center justify-center w-full px-4 py-2 border border-brand-primary text-brand-primary rounded-xl font-medium hover:bg-brand-primary/5">
                        Criar Conta
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
