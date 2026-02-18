import React from 'react';

/**
 * Skeleton para Gráficos (Recharts)
 * Imita a altura exata dos charts para prevenir CLS
 */
const SkeletonChart: React.FC<{ className?: string; height?: number }> = ({
    className = '',
    height = 300
}) => {
    return (
        <div
            className={`relative w-full bg-gray-50 rounded-xl overflow-hidden ${className}`}
            style={{ height: `${height}px` }}
        >
            {/* Animated gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-gray-50 via-gray-100 to-gray-50 animate-pulse" />

            {/* Chart placeholder elements */}
            <div className="absolute inset-0 p-6">
                {/* Y-axis labels */}
                <div className="absolute left-2 top-6 bottom-6 flex flex-col justify-between">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-3 w-8 bg-gray-200 rounded animate-pulse" />
                    ))}
                </div>

                {/* Bars/Lines placeholder */}
                <div className="ml-12 h-full flex items-end justify-around gap-2 pb-8">
                    {[...Array(7)].map((_, i) => (
                        <div
                            key={i}
                            className="flex-1 bg-gray-300 rounded-t animate-pulse"
                            style={{ height: `${Math.random() * 60 + 40}%` }}
                        />
                    ))}
                </div>

                {/* X-axis labels */}
                <div className="absolute bottom-2 left-12 right-2 flex justify-around">
                    {[...Array(7)].map((_, i) => (
                        <div key={i} className="h-3 w-12 bg-gray-200 rounded animate-pulse" />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SkeletonChart;
