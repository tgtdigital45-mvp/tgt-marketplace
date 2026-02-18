import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Service } from '@tgt/shared';
import Button from '@/components/ui/Button';
import SellerBadge, { SellerLevel } from '@/components/SellerBadge';
import { getOptimizedImageUrl } from '@/utils/supabase-image-loader';

interface ServiceCardProps {
  service: Service;
  onRequestQuote?: (service: Service) => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service, onRequestQuote }) => {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  // @ts-ignore - Supabase join
  const company = service.companies || (service as any).company;

  return (
    <div
      className="group relative bg-white border border-gray-100 rounded-[var(--radius-box)] p-0 flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Service Image */}
      <div className="relative aspect-video w-full overflow-hidden bg-gray-100">
        {service.gallery && service.gallery.length > 0 ? (
          <img
            src={getOptimizedImageUrl(service.gallery[0], 800, 75)}
            alt={service.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300">
            <span className="text-xs">Sem imagem</span>
          </div>
        )}

        {/* Company Logo Overlay (Bottom Left of Image) */}
        {company && (
          <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-white/95 backdrop-blur-sm p-1.5 rounded-lg shadow-sm">
            <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-100">
              {company.logo_url && (
                <img src={getOptimizedImageUrl(company.logo_url, 64, 64)} alt={company.company_name} className="w-full h-full object-cover" />
              )}
            </div>
            <span className="text-[10px] font-bold text-brand-primary line-clamp-1 max-w-[100px]">{company.company_name}</span>
          </div>
        )}
      </div>

      <div className="flex flex-col flex-grow p-5">
        {/* Title */}
        <h3 className="text-base font-bold text-brand-primary leading-tight group-hover:text-brand-accent transition-colors duration-300 line-clamp-2 mb-2 min-h-[2.5em]">
          {service.title}
        </h3>

        {/* Description */}
        <p className="text-xs text-brand-secondary line-clamp-2 mb-4 flex-grow">
          {service.description}
        </p>

        {/* Footer: Price & Action */}
        <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
              A partir de
            </span>
            <span className="text-lg font-extrabold text-brand-success tracking-tight">
              R$ {(service.price || service.starting_price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </div>

          <Button
            size="sm"
            onClick={() => navigate(`/servico/${service.id}`)}
            className="bg-brand-accent hover:bg-brand-accent/90 text-white font-medium shadow-sm shadow-brand-accent/20"
          >
            Ver Detalhes
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ServiceCard;
