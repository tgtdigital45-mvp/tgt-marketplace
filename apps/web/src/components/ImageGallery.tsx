import React, { useState } from 'react';
import { PortfolioItem } from '@tgt/shared';

interface ImageGalleryProps {
  items: PortfolioItem[];
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ items }) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const openLightbox = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    setSelectedImage(null);
  };

  // Handle Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
    };
    if (lightboxOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen]);

  if (!items || items.length === 0) {
    return <p className="text-gray-500">Nenhuma imagem no portfólio.</p>;
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((item) => (
          <GalleryItem key={item.id} item={item} openLightbox={openLightbox} />
        ))}
      </div>

      {lightboxOpen && selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
          aria-label="Visualização de imagem"
        >
          <button
            className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300 transition-colors z-50 focus:outline-none focus:ring-2 focus:ring-white rounded-full p-2"
            onClick={closeLightbox}
            aria-label="Fechar"
            autoFocus
          >
            &times;
          </button>
          <img
            src={selectedImage}
            alt="Imagem ampliada"
            className="max-w-full max-h-full object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};

// Subcomponent to handle individual image state
const GalleryItem: React.FC<{ item: PortfolioItem; openLightbox: (url: string) => void }> = ({ item, openLightbox }) => {
  const [imageError, setImageError] = useState(false);

  return (
    <div
      className={`group relative aspect-square rounded-lg overflow-hidden cursor-pointer focus:outline-none focus:ring-4 focus:ring-brand-primary/50 ${imageError ? 'bg-gray-100 border-2 border-dashed border-gray-300' : ''}`}
      onClick={() => !imageError && openLightbox(item.url)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !imageError) {
          e.preventDefault();
          openLightbox(item.url);
        }
      }}
      aria-label={`Ver imagem: ${item.caption}`}
    >
      {!imageError ? (
        <>
          <img
            src={item.url}
            alt={item.caption}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImageError(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-secondary/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4" aria-hidden="true">
            <p className="text-white font-medium transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">{item.caption}</p>
          </div>
        </>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 p-2">
          <svg className="w-8 h-8 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-xs text-center font-medium">Imagem indisponível</span>
        </div>
      )}
    </div>
  );
};

export default ImageGallery;