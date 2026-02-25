import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Service } from '@tgt/shared';
import Button from '@/components/ui/Button';
import SellerBadge, { SellerLevel } from '@/components/SellerBadge';
import OptimizedImage from '@/components/ui/OptimizedImage';

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
      className="group relative bg-white border border-gray-100 rounded-[var(--radius-box)] p-0 flex flex-col transition-all duration-300 hover:shadow-lg hover:-translate-y-1 overflow-hidden h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Service Image */}
      <div className="relative aspect-video w-full overflow-hidden bg-gray-100">
        <OptimizedImage
          src={service.gallery && service.gallery.length > 0 ? service.gallery[0] : undefined}
          alt={service.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          optimizedWidth={800}
        />

        {/* Company Logo Overlay (Bottom Left of Image) */}
        {company && (
          <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-white/95 backdrop-blur-sm p-1.5 rounded-lg shadow-sm">
            <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-100">
              {company.logo_url && (
                <OptimizedImage
                  src={company.logo_url}
                  alt={company.company_name}
                  className="w-full h-full object-cover"
                  optimizedWidth={64}
                />
              )}
            </div>
            <span className="text-[10px] font-bold text-brand-primary line-clamp-1 max-w-[100px]">{company.company_name}</span>
          </div>
        )}
      </div>

      <div className="flex flex-col flex-grow p-5">
        {/* Title */}
        <h3 className="font-display text-base font-bold text-brand-primary leading-tight group-hover:text-brand-accent transition-colors duration-300 line-clamp-2 mb-2 min-h-[2.5em]">
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
            className="font-medium"
          >
            Ver Detalhes
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ServiceCard;
