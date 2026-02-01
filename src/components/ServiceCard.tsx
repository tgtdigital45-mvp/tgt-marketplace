import React, { useState } from 'react';
import { Service } from '../types';
import Button from './ui/Button';

interface ServiceCardProps {
  service: Service;
  onRequestQuote?: (service: Service) => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service, onRequestQuote }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="group relative bg-white border border-gray-100 rounded-[var(--radius-box)] p-6 flex flex-col transition-all duration-500 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-1 overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-brand-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative z-10 flex flex-col h-full">
        <h3 className="text-xl font-bold text-gray-900 leading-tight group-hover:text-brand-primary transition-colors duration-300">
          {service.title}
        </h3>

        <p className="mt-3 text-sm text-gray-600 flex-grow leading-relaxed line-clamp-3">
          {service.description}
        </p>

        <div className="mt-6 pt-4 border-t border-gray-50 flex items-end justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Investimento
            </span>
            {service.price ? (
              <span className="text-2xl font-extrabold text-brand-primary tracking-tight">
                R$ {service.price.toFixed(0)}
                <span className="text-sm font-normal text-gray-400 ml-1">,00</span>
              </span>
            ) : (
              <span className="text-lg font-bold text-green-600">Sob Consulta</span>
            )}

            {service.duration && (
              <div className="flex items-center mt-2 text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-md w-fit">
                <svg className="w-3.5 h-3.5 mr-1.5 text-brand-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {service.duration}
              </div>
            )}
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => onRequestQuote?.(service)}
            className={`shadow-lg shadow-brand-primary/20 transform transition-all duration-300 ${isHovered ? 'scale-105 translate-x-1' : ''}`}
          >
            Solicitar Orçamento
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ServiceCard;
