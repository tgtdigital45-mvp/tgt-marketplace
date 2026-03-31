import React from 'react';
import { CompanyProject, Service } from '@tgt/core';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Link as LinkIcon, Share2, Info } from 'lucide-react';

interface ProjectDetailModalProps {
  project: CompanyProject | null;
  isOpen: boolean;
  onClose: () => void;
  services?: Service[];
}

const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({ project, isOpen, onClose, services }) => {
  if (!project) return null;

  const relatedService = services?.find(s => s.id === project.service_id);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-gray-900/90 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full max-w-5xl bg-white sm:rounded-3xl shadow-2xl overflow-hidden h-full sm:h-[90vh] flex flex-col"
          >
            {/* Modal Header/Top Bar */}
            <div className="absolute top-0 left-0 right-0 z-10 px-6 py-4 flex items-center justify-between bg-white shadow-sm sm:shadow-none sm:bg-transparent">
              <div className="sm:hidden font-bold truncate pr-10">{project.title}</div>
              <button 
                onClick={onClose} 
                className="p-2 sm:p-3 bg-gray-100 hover:bg-gray-200 sm:bg-white/80 sm:backdrop-blur-sm sm:hover:bg-white rounded-full sm:shadow-xl transition-all text-gray-900 absolute top-4 right-4"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Content (Storytelling) */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
              {/* Cover Image Section */}
              <div className="w-full aspect-[16/9] sm:aspect-[21/9] bg-gray-100 relative group overflow-hidden">
                <OptimizedImage
                  src={project.main_image_url}
                  alt={project.title}
                  className="w-full h-full object-cover"
                  optimizedWidth={1200}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent" />
                
                <div className="absolute bottom-8 left-8 right-8">
                    <motion.h1 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-2xl sm:text-5xl font-black text-white leading-tight mb-4 tracking-tighter"
                    >
                        {project.title}
                    </motion.h1>
                    
                    <div className="flex flex-wrap gap-4 text-white/80 text-xs sm:text-sm font-medium">
                        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                            <Calendar size={14} className="text-white" />
                            <span>Concluído em: {project.completion_date ? new Date(project.completion_date).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : 'Recente'}</span>
                        </div>
                        
                        {relatedService && (
                            <div className="flex items-center gap-2 bg-blue-500/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-blue-400/20 text-blue-100">
                                <LinkIcon size={14} />
                                <span>Relacionado a: {relatedService.title}</span>
                            </div>
                        )}
                    </div>
                </div>
              </div>

              {/* StoryContent Section */}
              <div className="max-w-4xl mx-auto py-12 px-6 sm:px-10">
                {/* Intro / Challenge Section */}
                <div className="mb-16">
                    <div className="flex items-center gap-2 text-blue-500 mb-2 uppercase tracking-[0.2em] font-bold text-[10px]">
                        <Info size={14} />
                        Visão Geral do Projeto
                    </div>
                    <p className="text-lg sm:text-2xl text-gray-700 leading-relaxed font-medium whitespace-pre-wrap">
                        {project.description || 'Este projeto demonstra a excelência técnica e o compromisso com a qualidade que nossa empresa entrega em cada detalhe.'}
                    </p>
                </div>

                {/* Storytelling Gallery Section (Long Scroll Images) */}
                <div className="space-y-8 sm:space-y-12">
                   {project.gallery_urls?.map((url, idx) => (
                       <motion.div 
                        key={idx}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        className="rounded-2xl sm:rounded-3xl overflow-hidden bg-gray-50 border border-gray-100 shadow-lg group hover:shadow-2xl transition-all duration-500"
                       >
                           <OptimizedImage
                            src={url}
                            alt={`Galeria ${idx + 1}`}
                            className="w-full h-auto object-contain sm:max-h-[85vh] mx-auto hover:scale-[1.01] transition-transform duration-700"
                           />
                       </motion.div>
                   ))}
                </div>

                {/* Feedback / Call to action area */}
                <div className="mt-20 py-16 border-t border-gray-100 text-center">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4 tracking-tight">Gostou deste resultado?</h3>
                    <p className="text-gray-400 mb-8 max-w-md mx-auto text-sm">Entre em contato agora mesmo para iniciarmos um projeto similar de sucesso para você.</p>
                    
                    <div className="flex flex-wrap items-center justify-center gap-4">
                        <button 
                            className="px-8 py-3 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/20 hover:scale-105 transition-transform"
                            onClick={onClose}
                        >
                            Solicitar Orçamento
                        </button>
                        <button className="p-3 bg-gray-50 text-gray-400 hover:text-blue-500 hover:bg-white rounded-2xl border border-gray-100 transition-all">
                            <Share2 size={20} />
                        </button>
                    </div>
                </div>
              </div>
            </div>
            
            {/* Footer shadow fade for web scroll hint (optional) */}
            <div className="h-6 w-full bg-gradient-to-t from-black/5 to-transparent absolute bottom-0 pointer-events-none" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ProjectDetailModal;
