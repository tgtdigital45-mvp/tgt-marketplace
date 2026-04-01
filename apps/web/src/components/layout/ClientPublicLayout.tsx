import React, { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, X, ArrowRight, Instagram, 
  Linkedin, Twitter, Facebook, Sparkles 
} from 'lucide-react';
import { Button } from '@tgt/ui-web';

/**
 * ClientPublicLayout
 * Layout principal para as páginas institucionais do Web Client (Consumidor).
 * Estética: Dark Premium / Glassmorphism (inspirado em Marqo).
 */
const ClientPublicLayout: React.FC = () => {
  const { pathname } = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Descobrir', href: '/servicos' },
    { label: 'Preços', href: '/planos' },
    { label: 'Updates', href: '/updates' },
    { label: 'Cases', href: '/cases' },
    { label: 'Blog', href: '/blog' },
    { label: 'Suporte', href: '/ajuda' },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-emerald-100 selection:text-emerald-900 overflow-x-hidden">
      
      {/* Navbar Flutuante (Pill Style) */}
      <nav 
        className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-[95%] max-w-7xl transition-all duration-500 ${
          isScrolled 
          ? 'bg-white/80 backdrop-blur-2xl border border-slate-200 py-3 px-6 shadow-xl shadow-slate-200/20' 
          : 'bg-white/40 backdrop-blur-md border border-white/40 py-5 px-6'
        } rounded-full flex items-center justify-between`}
      >
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform">
             <Sparkles className="text-black" size={18} />
          </div>
          <span className="text-xl font-display font-black tracking-tighter uppercase italic text-slate-950">
            CONTRATTO
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link 
              key={link.href} 
              to={link.href}
              className={`text-xs font-black uppercase tracking-widest transition-colors hover:text-emerald-600 ${
                pathname === link.href ? 'text-emerald-600' : 'text-slate-500'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Action Button */}
        <div className="hidden md:flex items-center gap-4">
           <Link to="/login/cliente">
              <span className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-emerald-600 transition-colors cursor-pointer mr-2">Login</span>
           </Link>
           <Link to="/cadastro/cliente">
             <Button size="sm" className="bg-white text-black hover:bg-slate-200 rounded-xl px-5 py-2.5 font-bold">
               Explorar
             </Button>
           </Link>
        </div>

        {/* Mobile Toggle */}
        <button 
          className="md:hidden p-2 text-white"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="fixed inset-0 z-[90] bg-black p-8 pt-32 flex flex-col gap-6 md:hidden"
          >
             {navLinks.map((link) => (
               <Link 
                key={link.href} 
                to={link.href}
                className="text-4xl font-display font-bold text-white hover:text-emerald-500 transition-colors"
               >
                 {link.label}
               </Link>
             ))}
             <div className="mt-auto flex flex-col gap-4">
                <Link to="/cadastro/cliente">
                   <Button className="w-full bg-emerald-500 text-black py-4 rounded-2xl font-bold">Criar Conta</Button>
                </Link>
                <Link to="/login/cliente">
                   <Button variant="outline" className="w-full border-white/10 text-white py-4 rounded-2xl">Acessar Painel</Button>
                </Link>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="relative z-10">
        <Outlet />
      </main>

      <footer className="bg-slate-50 border-t border-slate-100 pt-32 pb-20 mt-20">
        <div className="container mx-auto px-6">
           <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20 text-slate-900">
              <div className="md:col-span-1">
                 <Link to="/" className="flex items-center gap-2 mb-8">
                    <Sparkles className="text-emerald-500" size={24} />
                    <span className="text-2xl font-display font-black tracking-tighter uppercase italic text-slate-950">CONTRATTO</span>
                 </Link>
                 <p className="text-slate-500 mb-8 max-w-xs leading-relaxed font-medium">
                   A maior rede de especialistas e profissionais verificados da região, unificados por tecnologia e IA.
                 </p>
                 <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-emerald-500 hover:border-emerald-500 transition-all cursor-pointer">
                       <Instagram size={18} />
                    </div>
                    <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-emerald-500 hover:border-emerald-500 transition-all cursor-pointer">
                       <Twitter size={18} />
                    </div>
                    <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-emerald-500 hover:border-emerald-500 transition-all cursor-pointer">
                       <Linkedin size={18} />
                    </div>
                 </div>
              </div>
 
              <div>
                 <h4 className="font-black uppercase tracking-widest text-[10px] text-slate-400 mb-8 underline decoration-emerald-500 decoration-2 underline-offset-8">Navegação</h4>
                 <ul className="space-y-4 text-slate-600 font-bold text-sm">
                    <li><Link to="/servicos" className="hover:text-emerald-600 transition-colors">Marketplace</Link></li>
                    <li><Link to="/empresas" className="hover:text-emerald-600 transition-colors">Empresas</Link></li>
                    <li><Link to="/planos" className="hover:text-emerald-600 transition-colors">Planos</Link></li>
                    <li><Link to="/pro/landing" className="hover:text-emerald-600 transition-colors">Para Profissionais</Link></li>
                 </ul>
              </div>
 
              <div>
                 <h4 className="font-black uppercase tracking-widest text-[10px] text-slate-400 mb-8 underline decoration-emerald-500 decoration-2 underline-offset-8">Institucional</h4>
                 <ul className="space-y-4 text-slate-600 font-bold text-sm">
                    <li><Link to="/sobre" className="hover:text-emerald-600 transition-colors">Sobre Nós</Link></li>
                    <li><Link to="/blog" className="hover:text-emerald-600 transition-colors">Blog & Dicas</Link></li>
                    <li><Link to="/updates" className="hover:text-emerald-600 transition-colors">Release Notes</Link></li>
                    <li><Link to="/carreiras" className="hover:text-emerald-600 transition-colors">Carreiras</Link></li>
                 </ul>
              </div>
 
              <div>
                 <h4 className="font-black uppercase tracking-widest text-[10px] text-slate-400 mb-8 underline decoration-emerald-500 decoration-2 underline-offset-8">Newsletter</h4>
                 <p className="text-sm text-slate-500 mb-6 font-medium">Receba as novidades da rede em primeira mão.</p>
                 <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="seu@profissional.com" 
                      className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex-1 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                    <Button className="bg-emerald-500 text-black px-4 rounded-xl hover:bg-emerald-400"><ArrowRight size={18} /></Button>
                 </div>
              </div>
           </div>
 
           <div className="pt-12 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">
              <p>© 2025 CONTRATTO. Todos os direitos reservados.</p>
              <div className="flex gap-8">
                 <Link to="/privacidade" className="hover:text-emerald-600">Privacidade</Link>
                 <Link to="/termos" className="hover:text-emerald-600">Termos</Link>
                 <Link to="/ajuda" className="hover:text-emerald-600">Suporte</Link>
              </div>
           </div>
        </div>
      </footer>
    </div>
  );
};

export default ClientPublicLayout;
