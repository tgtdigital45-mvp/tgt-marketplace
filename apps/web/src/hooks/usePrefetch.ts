import { useEffect, useRef } from 'react';
import { logPrefetch } from '@/utils/performanceAudit';

/**
 * Verifica se o usuário está em modo de economia de dados ou conexão lenta
 */
const shouldPrefetch = (): boolean => {
    // @ts-ignore - NetworkInformation API não está em todos os tipos
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

    if (!connection) return true; // Se não temos info, prefetch

    // Não fazer prefetch se:
    // 1. saveData está ativo (modo economia)
    // 2. Conexão é 2G ou slow-2g
    if (connection.saveData) return false;
    if (connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g') return false;

    return true;
};

/**
 * Hook para prefetch de rotas ao fazer hover com debounce de 50ms
 * Melhora a percepção de performance ao pré-carregar páginas que o usuário provavelmente visitará
 */
export const usePrefetchOnHover = (route: string) => {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleMouseEnter = () => {
        // Verificar se devemos fazer prefetch
        if (!shouldPrefetch()) return;

        // Debounce de 50ms para evitar falsos positivos
        timeoutRef.current = setTimeout(() => {
            // Criar link de prefetch
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = route;
            link.as = 'document';

            // Evitar duplicatas
            const existing = document.querySelector(`link[rel="prefetch"][href="${route}"]`);
            if (!existing) {
                document.head.appendChild(link);

                // Log em DEV
                logPrefetch(route);
            }
        }, 50);
    };

    const handleMouseLeave = () => {
        // Cancelar timeout se o usuário sair antes de 50ms
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return {
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave
    };
};

/**
 * Hook para prefetch automático de rotas críticas após delay
 * Útil para pré-carregar páginas importantes após o usuário demonstrar engajamento
 */
export const usePrefetchCriticalRoutes = (routes: string[], delayMs: number = 2000) => {
    useEffect(() => {
        // Verificar se devemos fazer prefetch
        if (!shouldPrefetch()) {
            if (process.env.NODE_ENV === 'development') {
                console.log('[Prefetch] Skipped - saveData or slow connection');
            }
            return;
        }

        const timer = setTimeout(() => {
            routes.forEach(route => {
                const link = document.createElement('link');
                link.rel = 'prefetch';
                link.href = route;
                link.as = 'document';

                // Evitar duplicatas
                const existing = document.querySelector(`link[rel="prefetch"][href="${route}"]`);
                if (!existing) {
                    document.head.appendChild(link);

                    // Log em DEV
                    if (process.env.NODE_ENV === 'development') {
                        console.log(`[Prefetch Critical] ${route}`);
                    }
                }
            });
        }, delayMs);

        return () => clearTimeout(timer);
    }, [routes, delayMs]);
};
