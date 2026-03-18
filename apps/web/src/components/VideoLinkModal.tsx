import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Youtube, Link as LinkIcon } from 'lucide-react';
import { Button } from '@tgt/ui-web';

interface VideoLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (videoUrl: string, thumbnailUrl: string, title: string) => Promise<void>;
  isSubmitting?: boolean;
}

const VideoLinkModal: React.FC<VideoLinkModalProps> = ({ isOpen, onClose, onSubmit, isSubmitting }) => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');

  // Extract YouTube ID
  const getOutputThumbnail = (videoUrl: string): string => {
    // Check YouTube
    const ytMatch = videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})/);
    if (ytMatch && ytMatch[1]) {
      return `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
    }
    
    // Check Vimeo (Simple placeholder, as Vimeo requires API call for thumbnail)
    const vimeoMatch = videoUrl.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|)(\d+)(?:$|\/|\?)/);
    if (vimeoMatch) {
      return `https://placehold.co/600x400/111827/ffffff?text=Video+Vimeo`;
    }

    // Default Video Placeholder
    return `https://placehold.co/600x400/111827/ffffff?text=Video`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) {
      setError('Por favor, insira o link do vídeo.');
      return;
    }

    try {
      const thumbnailUrl = getOutputThumbnail(url);
      await onSubmit(url, thumbnailUrl, title || 'Video');
      setUrl('');
      setTitle('');
      setError('');
    } catch (err) {
      setError('Erro ao enviar vídeo.');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white rounded-2xl shadow-xl w-full max-w-md relative z-10 overflow-hidden"
        >
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Youtube className="text-red-500" size={20} />
              Adicionar Vídeo
            </h3>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Link do Vídeo (YouTube, Vimeo)
              </label>
              <div className="relative">
                <input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={url}
                  onChange={(e) => { setUrl(e.target.value); setError(''); }}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
                  required
                />
                <LinkIcon className="absolute left-3.5 top-2.5 text-gray-400" size={16} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ex: Porcelanato em Sala de Estar"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}

            <div className="pt-2 flex gap-3">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" className="flex-1 bg-brand-primary" disabled={isSubmitting || !url}>
                {isSubmitting ? 'Adicionando...' : 'Adicionar'}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default VideoLinkModal;
