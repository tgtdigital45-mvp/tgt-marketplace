import React from 'react';

interface LoadingSkeletonProps {
    className?: string;
    count?: number;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ className = "h-4 w-full", count = 1 }) => {
    return (
        <div className="space-y-2 animate-pulse">
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className={`bg-gray-200 rounded-md ${className}`}
                    aria-hidden="true"
                />
            ))}
            <span className="sr-only">Carregando...</span>
        </div>
    );
};

export default LoadingSkeleton;
