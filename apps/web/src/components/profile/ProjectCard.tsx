import React from 'react';
import { CompanyProject } from '@tgt/core';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { motion } from 'framer-motion';
import { Calendar, ChevronRight } from 'lucide-react';

interface ProjectCardProps {
  project: CompanyProject;
  onClick: () => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick }) => {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      onClick={onClick}
      className="group cursor-pointer bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
        <OptimizedImage
          src={project.main_image_url}
          alt={project.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          optimizedWidth={500}
        />
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
        
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
            <span className="px-2.5 py-1 bg-white/90 backdrop-blur-sm text-gray-900 text-[10px] font-bold rounded-lg shadow-sm border border-white/20">
              VER PROJETO
            </span>
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="text-sm font-bold text-gray-900 line-clamp-1 mb-1 group-hover:text-blue-600 transition-colors">
          {project.title}
        </h3>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-medium">
            <Calendar size={10} className="text-gray-300" />
            <span>{project.completion_date ? new Date(project.completion_date).getFullYear() : 'Recente'}</span>
          </div>
          
          <ChevronRight size={14} className="text-gray-300 group-hover:text-blue-500 transform group-hover:translate-x-1 transition-all" />
        </div>
      </div>
    </motion.div>
  );
};

export default ProjectCard;
