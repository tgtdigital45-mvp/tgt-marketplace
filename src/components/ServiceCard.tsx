import React, { useState } from 'react';
import { Service } from '../types';
import Button from './ui/Button';

interface ServiceCardProps {
  service: Service;
  onRequestQuote?: (service: Service) => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service, onRequestQuote }) => {
  const [isHovered, setIsHovered] = useState(false);
  const company = (service as any).company; // Assuming joined data

  return (
    <div
      className="group relative bg-white border border-gray-100 rounded-[var(--radius-box)] p-6 flex flex-col transition-all duration-500 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-1 overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-brand-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative z-10 flex flex-col h-full">
        {/* Service Image (First Image) */}
        {service.gallery && service.gallery.length > 0 && (
          <div className="w-full h-40 mb-4 rounded-lg overflow-hidden bg-gray-100">
            <img src={service.gallery[0]} alt={service.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          </div>
        )}

        {/* Header: Seller Info (Trust Signals) */}
        {company && (
          <div className="flex items-center mb-3 space-x-2">
            <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
              {company.logo_url && <img src={company.logo_url} alt={company.company_name} className="w-full h-full object-cover" />}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-gray-900 line-clamp-1">{company.company_name}</span>
              <div className="flex items-center text-[10px] text-gray-500">
                <svg className="w-3 h-3 text-yellow-400 mr-[1px]" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                <span>{company.rating || 5.0}</span>
                <span className="text-gray-400 ml-1">({company.review_count || 0})</span>
              </div>
            </div>
          </div>
        )}

        <h3 className="text-lg font-bold text-gray-900 leading-tight group-hover:text-brand-primary transition-colors duration-300 line-clamp-2 mb-2">
          {service.title}
        </h3>

        <p className="text-sm text-gray-600 flex-grow leading-relaxed line-clamp-2">
          {service.description}
        </p>

        <div className="mt-4 pt-4 border-t border-gray-50 flex items-end justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
              A partir de
            </span>
            {service.price ? (
              <span className="text-xl font-extrabold text-brand-primary tracking-tight">
                R$ {service.price.toFixed(0)}
              </span>
            ) : (
              <span className="text-md font-bold text-green-600">Sob Consulta</span>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onRequestQuote?.(service)}
            className={`transform transition-all duration-300 ${isHovered ? 'bg-brand-primary text-white border-brand-primary' : ''}`}
          >
            Ver Detalhes
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ServiceCard;
