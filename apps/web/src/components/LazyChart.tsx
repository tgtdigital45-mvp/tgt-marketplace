import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import SkeletonChart from '@/components/ui/SkeletonChart';
import { logLazyLoad } from '@/utils/performanceAudit';

// Lazy load Recharts components
const AreaChart = lazy(() => import('recharts').then(module => ({ default: module.AreaChart })));
const Area = lazy(() => import('recharts').then(module => ({ default: module.Area })));
const BarChart = lazy(() => import('recharts').then(module => ({ default: module.BarChart })));
const Bar = lazy(() => import('recharts').then(module => ({ default: module.Bar })));
const XAxis = lazy(() => import('recharts').then(module => ({ default: module.XAxis })));
const YAxis = lazy(() => import('recharts').then(module => ({ default: module.YAxis })));
const CartesianGrid = lazy(() => import('recharts').then(module => ({ default: module.CartesianGrid })));
const Tooltip = lazy(() => import('recharts').then(module => ({ default: module.Tooltip })));
const ResponsiveContainer = lazy(() => import('recharts').then(module => ({ default: module.ResponsiveContainer })));

interface LazyChartProps {
    type: 'area' | 'bar';
    data: any[];
    dataKey: string;
    height?: number;
    className?: string;
}

/**
 * Wrapper para Recharts com IntersectionObserver
 * O chunk JS dos gráficos só é baixado quando o usuário rolar até 200px de distância
 */
const LazyChart: React.FC<LazyChartProps> = ({ type, data, dataKey, height = 300, className }) => {
    const [shouldLoad, setShouldLoad] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setShouldLoad(true);

                        // Log em DEV
                        logLazyLoad(`Chart-${type}`);

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
    }, [type]);

    return (
        <div ref={containerRef} className={className} style={{ height: `${height}px` }}>
            {shouldLoad ? (
                <Suspense fallback={<SkeletonChart height={height} className={className} />}>
                    <ResponsiveContainer width="100%" height="100%">
                        {type === 'area' ? (
                            <AreaChart data={data}>
                                <defs>
                                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--color-brand-secondary)" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="var(--color-brand-secondary)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#A0AEC0', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#A0AEC0', fontSize: 12 }} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                                <Area type="monotone" dataKey={dataKey} stroke="var(--color-brand-secondary)" strokeWidth={3} fillOpacity={1} fill="url(#colorViews)" />
                            </AreaChart>
                        ) : (
                            <BarChart data={data}>
                                <Bar dataKey={dataKey} fill="rgba(255,255,255,0.8)" radius={[4, 4, 0, 0]} barSize={8} />
                                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.1)' }} contentStyle={{ backgroundColor: '#333', border: 'none', borderRadius: '8px', color: '#fff' }} />
                            </BarChart>
                        )}
                    </ResponsiveContainer>
                </Suspense>
            ) : (
                <SkeletonChart height={height} className={className} />
            )}
        </div>
    );
};

export default LazyChart;
