import React from 'react';
import { Link } from 'react-router-dom';

const DesktopNav: React.FC = () => {
    return (
        <nav className="hidden md:flex items-center space-x-6">
            <Link
                to="/empresas"
                className="text-slate-600 hover:text-primary-600 font-medium transition-colors text-sm"
            >
                Buscar Empresas
            </Link>
            <Link
                to="/para-empresas"
                className="text-slate-600 hover:text-primary-600 font-medium transition-colors text-sm"
            >
                Para Empresas
            </Link>
        </nav>
    );
};

export default DesktopNav;
