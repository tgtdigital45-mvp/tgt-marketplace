import React from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import MainRoutes from '../../routes';

const MainLayout: React.FC = () => {
    const location = useLocation();

    // Pages that should have a transparent header at the top (Dark Hero background)
    // MUST match the list in Header.tsx or better yet, move this config to a shared constant
    const transparentHeaderPages = ['/', '/landing-client'];
    const isTransparentPage = transparentHeaderPages.includes(location.pathname);

    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main
                className="flex-grow"
                style={{ minHeight: 'calc(100vh - 80px - 200px)' }}
            >
                <MainRoutes />
            </main>
            <Footer />
        </div>
    );
};

export default MainLayout;
