import React from 'react';

/**
 * Skeleton para Mapa (Leaflet)
 * Imita a altura exata do MapEmbed para prevenir CLS
 */
const SkeletonMap: React.FC<{ className?: string }> = ({ className = '' }) => {
    return (
        <div className={`relative w-full h-96 bg-gray-100 rounded-xl overflow-hidden ${className}`}>
            {/* Animated gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-pulse" />

            {/* Map placeholder elements */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-3">
                    <div className="w-12 h-12 mx-auto bg-gray-300 rounded-full animate-pulse" />
                    <div className="h-4 w-32 bg-gray-300 rounded animate-pulse" />
                    <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                </div>
            </div>

            {/* Zoom controls placeholder */}
            <div className="absolute top-4 right-4 space-y-2">
                <div className="w-8 h-8 bg-white/80 rounded shadow-sm animate-pulse" />
                <div className="w-8 h-8 bg-white/80 rounded shadow-sm animate-pulse" />
            </div>
        </div>
    );
};

export default SkeletonMap;
