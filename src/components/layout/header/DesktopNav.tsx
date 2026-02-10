import React from 'react';
import { Link } from 'react-router-dom';

interface DesktopNavProps {
    isScrolled: boolean;
    isTransparent: boolean;
}

const DesktopNav: React.FC<DesktopNavProps> = ({ isScrolled, isTransparent }) => {
    // Logic: If on a transparent background (unscrolled home), use white. Otherwise gray/dark.
    const baseTextColor = !isScrolled && isTransparent ? 'text-white/90 hover:text-white' : 'text-gray-600 hover:text-brand-primary';
    const activeIndicatorColor = !isScrolled && isTransparent ? 'bg-white' : 'bg-brand-primary';

    return (
        <nav className="hidden md:flex items-center space-x-8">
            <Link
                to="/empresas"
                className={`${baseTextColor} font-bold text-sm transition-colors flex items-center gap-2 group`}
            >
                <div className={`w-1.5 h-1.5 rounded-full bg-transparent group-hover:${activeIndicatorColor} transition-colors`}></div>
                Buscar Empresas
            </Link>
            <Link
                to="/para-empresas"
                className={`${baseTextColor} font-bold text-sm transition-colors flex items-center gap-2 group`}
            >
                <div className={`w-1.5 h-1.5 rounded-full bg-transparent group-hover:${activeIndicatorColor} transition-colors`}></div>
                Para Empresas
            </Link>
        </nav>
    );
};

export default DesktopNav;
