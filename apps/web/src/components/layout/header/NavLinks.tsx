import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const NavLinks: React.FC = () => {
    const location = useLocation();

    const getLinkClass = (path: string) => {
        const isActive = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
        return `${isActive 
            ? 'text-brand-primary bg-white/40 shadow-sm' 
            : 'text-slate-600/80 hover:text-brand-primary hover:bg-white/30'} text-sm font-medium transition-all duration-200 py-1.5 px-4 rounded-full`;
    };

    return (
        <nav className="hidden lg:flex items-center gap-2">
            <Link to="/servicos" className={getLinkClass('/servicos')}>
                Serviços
            </Link>
            <Link to="/empresas" className={getLinkClass('/empresas')}>
                Empresas
            </Link>
            <Link to="/para-empresas" className={getLinkClass('/para-empresas')}>
                Para Empresas
            </Link>
        </nav>
    );
};

export default NavLinks;
