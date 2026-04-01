import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@tgt/ui-web';
import { HeadphonesIcon } from 'lucide-react';

const PORTAL_URL = import.meta.env.VITE_PORTAL_URL || 'https://portal.ex.com';

const ProNavbar: React.FC = () => {
  return (
    <nav className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-6xl pointer-events-auto">
      <div className="glass-light rounded-full px-5 py-2 flex items-center justify-between border border-white/20 shadow-soft backdrop-blur-md">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 group shrink-0 min-w-[120px]">
            <div className="h-9 flex items-center shrink-0">
              <img
                src="/logo-contratto.png"
                alt="CONTRATTO"
                style={{ height: '28px' }}
                className="w-auto block transition-opacity group-hover:opacity-80 object-contain"
              />
            </div>
            <span className="hidden xl:inline-flex items-center px-2 py-0.5 rounded-full bg-primary-100/50 text-[#04B4E0] text-[8px] font-bold tracking-widest uppercase border border-[#04B4E0]/10 ml-1">
              Parceiros
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-5 text-[13px] font-semibold text-slate-600">
            <Link to="/planos" className="hover:text-[#04B4E0] transition-colors py-1">Preços</Link>
            <Link to="/updates" className="hover:text-[#04B4E0] transition-colors py-1">Atualizações</Link>
            <Link to="/cases" className="hover:text-[#04B4E0] transition-colors py-1">Cases</Link>
            <Link to="/blog" className="hover:text-[#04B4E0] transition-colors py-1">Blog</Link>
          </div>
        </div>

        <div className="flex items-center gap-2 lg:gap-3 shrink-0">
          <Link to="/contato" className="hidden sm:block">
            <Button variant="ghost" size="sm" className="rounded-full flex items-center gap-2 h-8 text-slate-600 hover:text-[#04B4E0] px-3 text-xs">
              <HeadphonesIcon size={14} />
              <span>Suporte</span>
            </Button>
          </Link>

          <div className="h-4 w-px bg-slate-200/50 mx-1 hidden sm:block" />

          <a href={`${PORTAL_URL}/login`} className="text-xs font-bold text-slate-600 hover:text-[#04B4E0] transition-colors px-2">Login</a>

          <a href={`${PORTAL_URL}/cadastro`}>
            <Button size="sm" className="rounded-full px-4 h-8 text-[10px] font-black uppercase tracking-wider shadow-sm transition-all hover:scale-105 bg-[#04B4E0] hover:bg-[#039BBF] text-white border-none">
              Cadastrar
            </Button>
          </a>

          <Link to="/waitlist" className="hidden lg:block">
            <Button size="sm" variant="outline" className="rounded-full px-4 h-8 text-[10px] font-black uppercase tracking-wider border-slate-200 text-slate-500 hover:bg-slate-50">
              Waitlist
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default ProNavbar;
