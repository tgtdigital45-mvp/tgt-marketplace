import React from 'react';

/**
 * Skeleton para ServiceCard
 * Imita a estrutura exata do ServiceCard para prevenir CLS
 */
const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => {
    return (
        <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className}`}>
            {/* Image skeleton */}
            <div className="relative aspect-video bg-gray-200 animate-pulse" />

            {/* Content skeleton */}
            <div className="p-6 space-y-4">
                {/* Title */}
                <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse" />

                {/* Description */}
                <div className="space-y-2">
                    <div className="h-4 bg-gray-100 rounded w-full animate-pulse" />
                    <div className="h-4 bg-gray-100 rounded w-5/6 animate-pulse" />
                </div>

                {/* Meta info */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
                        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                    </div>
                    <div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
                </div>
            </div>
        </div>
    );
};

export default SkeletonCard;
