import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import OptimizedImage from './ui/OptimizedImage';

export interface LightboxItem {
  id: string;
  image_url: string;
  video_url?: string;
  title?: string;
}

interface PortfolioLightboxProps {
  items: LightboxItem[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

const PortfolioLightbox: React.FC<PortfolioLightboxProps> = ({ items, initialIndex, isOpen, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setIsPlaying(false);
  }, [initialIndex, isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, items.length]);

  if (!isOpen || items.length === 0) return null;

  const currentItem = items[currentIndex];

  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
    setIsPlaying(false);
  };

  const prev = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
    setIsPlaying(false);
  };

  const getEmbedUrl = (url: string) => {
    // Basic YouTube convert To embed
    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})/);
    if (ytMatch && ytMatch[1]) {
      return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`;
    }
    // Basic Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|)(\d+)(?:$|\/|\?)/);
    if (vimeoMatch && vimeoMatch[1]) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
    }
    return url;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition-all"
        >
          <X size={24} />
        </button>

        {/* Previous Button */}
        {items.length > 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-4 z-50 p-3 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition-all"
          >
            <ChevronLeft size={32} />
          </button>
        )}

        {/* Next Button */}
        {items.length > 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-4 z-50 p-3 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition-all"
          >
            <ChevronRight size={32} />
          </button>
        )}

        {/* Content Area */}
        <div 
          className="relative w-full h-full max-w-5xl max-h-[85vh] flex items-center justify-center p-4 md:p-12"
          onClick={onClose} // Clicking outside closes
        >
          <motion.div
            key={currentItem.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking content
          >
            {currentItem.video_url && isPlaying ? (
              <div className="w-full aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
                <iframe
                  src={getEmbedUrl(currentItem.video_url)}
                  className="w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            ) : (
              <div 
                className={`relative max-w-full max-h-full rounded-lg overflow-hidden shadow-2xl ${currentItem.video_url ? 'cursor-pointer group' : ''}`}
                onClick={() => {
                  if (currentItem.video_url) setIsPlaying(true);
                }}
              >
                <img
                  src={currentItem.image_url}
                  alt={currentItem.title || 'Portfolio Item'}
                  className="max-w-full max-h-[80vh] object-contain"
                />
                
                {currentItem.video_url && (
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <div className="w-16 h-16 bg-brand-primary/90 text-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Play size={32} className="ml-1" />
                    </div>
                  </div>
                )}
                
                {currentItem.title && (
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-6 pt-12">
                    <p className="text-white text-lg font-medium">{currentItem.title}</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
        
        {/* Counter */}
        {items.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 font-medium tracking-widest text-sm">
            {currentIndex + 1} / {items.length}
          </div>
        )}
      </div>
    </AnimatePresence>
  );
};

export default PortfolioLightbox;
