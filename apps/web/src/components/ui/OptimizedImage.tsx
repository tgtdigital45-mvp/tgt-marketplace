import React, { ImgHTMLAttributes, useState } from 'react';
import { getOptimizedImageUrl } from '@/utils/supabase-image-loader';
import NoImagePlaceholder from './NoImagePlaceholder';

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
    const imgRef = React.useRef<HTMLImageElement>(null);

    // Update state if prop changes
    React.useEffect(() => {
        setImgSrc(optimizedSrc);
        setHasError(false);
        setIsLoaded(false);
    }, [optimizedSrc]);

    // Check if image is already cached
    React.useEffect(() => {
        if (imgRef.current && imgRef.current.complete) {
            setIsLoaded(true);
        }
    }, [imgSrc]);

    const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        console.error(`[OptimizedImage] Failed to load image: ${imgSrc}`, e);
        if (!hasError && fallbackSrc) {
            setImgSrc(fallbackSrc);
            setHasError(true);
            // If fallback load fails, we should still show something, but for now we set it to loaded 
            // so we don't stay in opacity-0
            setIsLoaded(true);
        } else {
            setIsLoaded(true);
        }
    };

    return (
        <div
            className={`relative overflow-hidden ${className}`}
            style={aspectRatio ? { aspectRatio } : undefined}
            data-testid="optimized-image-container"
        >
            {!isLoaded && (
                <div className="absolute inset-0 bg-gray-200 animate-pulse" />
            )}
            {hasError && <NoImagePlaceholder className="absolute inset-0" />}
            <img
                ref={imgRef}
                src={imgSrc}
                alt={alt}
                className={`w-full h-full object-cover transition-opacity duration-300 ${isLoaded && !hasError ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setIsLoaded(true)}
                onError={handleError}
                loading={props.loading || "lazy"}
                {...props}
            />
        </div>
    );
};

export default OptimizedImage;
