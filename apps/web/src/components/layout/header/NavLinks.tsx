import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const NavLinks: React.FC = () => {
    const location = useLocation();

    const getLinkClass = (path: string) => {
        const isActive = location.pathname === path;
        return `${isActive ? 'text-brand-primary font-bold' : 'text-gray-600 hover:text-brand-primary'} text-sm font-medium transition-colors duration-200`;
    };

    return (
        <nav className="hidden lg:flex items-center gap-8">
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
