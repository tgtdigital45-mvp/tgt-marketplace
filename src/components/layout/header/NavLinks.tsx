import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface NavLinksProps {
    isScrolled: boolean;
    isTransparent: boolean;
}

const NavLinks: React.FC<NavLinksProps> = ({ isScrolled, isTransparent }) => {
    const location = useLocation();

    // Helper to determine link styles
    const getLinkClass = (path: string) => {
        const isActive = location.pathname === path;

        // Base text color logic
        // Transparent mode (Top of home): White text
        // Scrolled or normal page: Gray text, hover primary
        const baseColor = !isScrolled && isTransparent
            ? 'text-white/90 hover:text-white'
            : 'text-gray-600 hover:text-brand-primary';

        const activeColor = !isScrolled && isTransparent
            ? 'text-white font-bold'
            : 'text-brand-primary font-bold';

        return `${isActive ? activeColor : baseColor} text-sm font-medium transition-colors duration-200`;
    };

    return (
        <nav className="hidden md:flex items-center gap-8">
            <Link to="/servicos" className={getLinkClass('/servicos')}>
                Serviços
            </Link>
            <Link to="/empresas" className={getLinkClass('/empresas')}>
                Empresas
            </Link>
            <Link to="/para-empresas" className={getLinkClass('/para-empresas')}>
                Para Empresas
            </Link>
            {/* Keeping Novidades as auxiliary or removing based on strict request? 
                User asked for the 3 specific ones. I will keep Novidades if it was there before or if it's 'blog'.
                The user asked 'cade aba serviços, empresas e para empresas', so I will put those 3.
            */}
        </nav>
    );
};

export default NavLinks;
