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
      className="group relative bg-white border border-gray-100/80 rounded-2xl flex flex-col transition-all duration-300 hover:shadow-2xl hover:shadow-gray-200/80 hover:-translate-y-1.5 overflow-hidden h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* ── Service Image ── */}
      <div className="relative aspect-video w-full overflow-hidden bg-gray-100">
        {service.gallery && service.gallery.length > 0 ? (
          <>
            <img
              src={getOptimizedImageUrl(service.gallery[0], 800, 75)}
              alt={service.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              loading="lazy"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/5 to-transparent" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
            <span className="text-xs text-gray-300 font-medium">Sem imagem</span>
          </div>
        )}

        {/* Category tag */}
        {service.category_tag && (
          <div className="absolute top-3 left-3">
            <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider bg-brand-primary/80 backdrop-blur-sm text-white px-2.5 py-1 rounded-full shadow-sm">
              {service.category_tag}
            </span>
          </div>
        )}

        {/* Company logo badge */}
        {company && (
          <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-white/95 backdrop-blur-sm px-2.5 py-1.5 rounded-xl shadow-md border border-white/60">
            <div className="w-5 h-5 rounded-full overflow-hidden bg-gray-100 ring-1 ring-white/60 flex-shrink-0">
              {company.logo_url && (
                <img
                  src={getOptimizedImageUrl(company.logo_url, 64, 64)}
                  alt={company.company_name}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <span className="text-[10px] font-bold text-brand-primary line-clamp-1 max-w-[110px]">
              {company.company_name}
            </span>
          </div>
        )}
      </div>

      {/* ── Card Body ── */}
      <div className="flex flex-col flex-grow p-5">
        {/* Title */}
        <h3 className="text-[14px] font-bold text-gray-900 leading-snug group-hover:text-brand-accent transition-colors duration-200 line-clamp-2 mb-2">
          {service.title}
        </h3>

        {/* Description */}
        <p className="text-[12px] text-gray-500 line-clamp-2 mb-4 flex-grow leading-relaxed">
          {service.description}
        </p>

        {/* ── Footer ── */}
        <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between gap-3">
          <div>
            <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
              A partir de
            </span>
            <span className="text-lg font-extrabold text-brand-success leading-none tabular-nums">
              R${' '}
              {(service.price || service.starting_price || 0).toLocaleString('pt-BR', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </span>
          </div>

          <Button
            size="sm"
            onClick={() => navigate(`/servico/${service.id}`)}
            className="bg-brand-accent hover:bg-brand-accent/90 text-white font-semibold shadow-md shadow-brand-accent/20 hover:shadow-brand-accent/30 rounded-xl whitespace-nowrap flex-shrink-0"
          >
            Ver Detalhes
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ServiceCard;
