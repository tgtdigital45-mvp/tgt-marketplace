import React, { ImgHTMLAttributes, useState } from 'react';
import { getOptimizedImageUrl } from '@/utils/supabase-image-loader';

interface OptimizedImageProps extends ImgHTMLAttributes<HTMLImageElement> {
    fallbackSrc?: string;
    alt: string;
    /** Largura desejada para otimização (padrão: 800px) */
    optimizedWidth?: number;
    /** Qualidade da imagem 1-100 (padrão: 75) */
    quality?: number;
    /** Aspect ratio para prevenir CLS (ex: '16/9', '1/1', '4/3') */
    aspectRatio?: string;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
    src,
    alt,
    className = '',
    fallbackSrc = 'https://placehold.co/400x300?text=No+Image',
    optimizedWidth = 800,
    quality = 75,
    aspectRatio,
    ...props
}) => {
    // Aplicar transformação de imagem se for do Supabase
    const optimizedSrc = src ? getOptimizedImageUrl(src, optimizedWidth, quality) : fallbackSrc;

    const [imgSrc, setImgSrc] = useState(optimizedSrc);
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);

    const handleError = () => {
        if (!hasError && fallbackSrc) {
            setImgSrc(fallbackSrc);
            setHasError(true);
        }
    };

    return (
        <div
            className={`relative overflow-hidden ${className}`}
            style={aspectRatio ? { aspectRatio } : undefined}
        >
            {!isLoaded && (
                <div className="absolute inset-0 bg-gray-200 animate-pulse" />
            )}
            <img
                src={imgSrc}
                alt={alt}
                className={`w-full h-full object-cover transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setIsLoaded(true)}
                onError={handleError}
                loading="lazy"
                {...props}
            />
        </div>
    );
};

export default OptimizedImage;
