import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import SkeletonMap from '@/components/ui/SkeletonMap';
import { logLazyLoad } from '@/utils/performanceAudit';

// Lazy load MapEmbed only when visible
const MapEmbed = lazy(() => import('./MapEmbed'));

interface LazyMapEmbedProps {
    address: string;
    className?: string;
}

/**
 * Wrapper para MapEmbed com IntersectionObserver
 * O chunk JS do mapa só é baixado quando o usuário rolar até 200px de distância
 */
const LazyMapEmbed: React.FC<LazyMapEmbedProps> = ({ address, className }) => {
    const [shouldLoad, setShouldLoad] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setShouldLoad(true);

                        // Log em DEV
                        logLazyLoad('MapEmbed');

                        // Desconectar observer após carregar
                        observer.disconnect();
                    }
                });
            },
            {
                // Carregar quando estiver a 200px de distância
                rootMargin: '200px',
            }
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => {
            observer.disconnect();
        };
    }, []);

    return (
        <div ref={containerRef} className={className}>
            {shouldLoad ? (
                <Suspense fallback={<SkeletonMap className={className} />}>
                    <MapEmbed address={address} />
                </Suspense>
            ) : (
                <SkeletonMap className={className} />
            )}
        </div>
    );
};

export default LazyMapEmbed;
