import React, { useState } from 'react';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';

interface ServiceGalleryProps {
    images: string[];
    title: string;
}

const ServiceGallery: React.FC<ServiceGalleryProps> = ({ images, title }) => {
    const [activeIndex, setActiveIndex] = useState(0);

    // Fallback if no images
    const displayImages = images.length > 0 ? images : ['https://placehold.co/800x450/f3f4f6/9ca3af?text=Sem+Imagem'];

    const nextImage = () => setActiveIndex((prev) => (prev + 1) % displayImages.length);
    const prevImage = () => setActiveIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);

    return (
        <div className="space-y-4">
            <div className="relative aspect-video w-full bg-gray-100 rounded-2xl overflow-hidden group shadow-sm border border-gray-100">
                <OptimizedImage
                    src={displayImages[activeIndex]}
                    alt={`${title} - Imagem ${activeIndex + 1}`}
                    className="w-full h-full object-contain bg-gray-50"
                    optimizedWidth={1200}
                />

                {displayImages.length > 1 && (
                    <>
                        <button
                            onClick={prevImage}
                            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300"
                            aria-label="Imagem anterior"
                        >
                            <ChevronLeftIcon className="w-5 h-5" />
                        </button>
                        <button
                            onClick={nextImage}
                            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300"
                            aria-label="Próxima imagem"
                        >
                            <ChevronRightIcon className="w-5 h-5" />
                        </button>
                    </>
                )}

                <div className="absolute bottom-4 right-4 bg-black/60 text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm">
                    {activeIndex + 1} / {displayImages.length}
                </div>
            </div>

            {displayImages.length > 1 && (
                <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide">
                    {displayImages.map((img, idx) => (
                        <button
                            key={idx}
                            onClick={() => setActiveIndex(idx)}
                            className={`relative w-24 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all 
                                ${activeIndex === idx
                                    ? 'border-brand-primary ring-2 ring-brand-primary/20 opacity-100'
                                    : 'border-transparent hover:border-gray-300 opacity-70 hover:opacity-100'
                                }`}
                        >
                            <OptimizedImage src={img} alt={`Thumb ${idx}`} width={100} className="w-full h-full object-cover" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ServiceGallery;
