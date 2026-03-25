import React from 'react';
import { Link } from 'react-router-dom';
import { Star, MapPin, CheckCircle2, ShieldCheck, Heart } from 'lucide-react';
import { Company } from '@tgt/core';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { Badge } from '@tgt/ui-web';

interface CompanyCardProps {
    company: Company;
}

const CompanyCard: React.FC<CompanyCardProps> = ({ company }) => {
    const { user } = useAuth();
    const { addFavorite, removeFavorite, isFavorite } = useFavorites();
    const favorited = isFavorite(company.id);

    const handleToggleFavorite = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (favorited) {
            removeFavorite(company.id);
        } else {
            addFavorite(company.id);
        }
    };

    return (
        <article className="group relative flex flex-col bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ring-1 ring-gray-100/80 hover:ring-brand-primary overflow-hidden h-full border border-gray-100">
            <Link to={company.slug ? `/empresa/${company.slug}` : '#'} className="flex flex-col h-full cursor-pointer">
                <div className="relative w-full aspect-video bg-gray-100 overflow-hidden">
                    <OptimizedImage
                        src={company.coverImage || (company as any).cover_image_url}
                        alt={company.companyName}
                        aspectRatio="16/9"
                        width={600}
                        height={338}
                        optimizedWidth={600}
                        quality={80}
                        fallbackSrc="https://placehold.co/600x450/f1f5f9/94a3b8?text=CONTRATTO"
                        className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>

                    {/* Logo and Name Area - Inserted over the image gradient */}
                    <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3">
                        <OptimizedImage
                            src={company.logo}
                            alt={`${company.companyName} logo`}
                            aspectRatio="1/1"
                            width={100}
                            height={100}
                            optimizedWidth={100}
                            quality={80}
                            fallbackSrc="https://placehold.co/100x100/f1f5f9/94a3b8?text=Logo"
                            className="w-12 h-12 rounded-full border-2 border-white shadow-md object-cover bg-white"
                        />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 max-w-full">
                                <h3 className="font-bold text-base sm:text-lg text-white truncate drop-shadow-md">
                                    {company.companyName}
                                </h3>
                                {((company as any).current_plan_tier === 'pro' || (company as any).current_plan_tier === 'agency') && (
                                    <div className="flex items-center justify-center shrink-0 w-4 h-4 bg-blue-500 rounded-full shadow-sm" title="Empresa Verificada">
                                        <ShieldCheck size={10} className="text-white" strokeWidth={3} />
                                    </div>
                                )}
                            </div>
                            <span className="text-xs font-bold text-white/80 uppercase tracking-wider drop-shadow-sm">
                                {company.category || 'Serviços'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="p-4 flex flex-col flex-grow">
                    {/* Bio / Teaser */}
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {(company as any).description 
                            ? (company as any).description 
                            : `O melhor serviço de ${company.category || 'qualidade'} para suas necessidades.`}
                    </p>

                    {/* Metrics and Location */}
                    <div className="flex flex-col gap-2 mt-auto">
                        <div className="flex items-center gap-1.5 text-sm text-gray-500">
                            <MapPin size={16} className="text-brand-primary shrink-0" />
                            <span className="truncate">
                                {company.address?.city 
                                    ? `${company.address.city}${company.address.state ? ` - ${company.address.state}` : ''}` 
                                    : (company as any).city 
                                        ? `${(company as any).city}${((company as any).state ? ` - ${(company as any).state}` : '')}` 
                                        : company.location || 'Localização Indisponível'
                                }
                            </span>
                            {company.distance != null && (
                                <span className="ml-auto font-medium text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">
                                    {company.distance < 1 ? '< 1km' : `${company.distance.toFixed(1)}km`}
                                </span>
                            )}
                        </div>

                        <div className="flex items-center justify-between mt-2 pt-3 border-t border-gray-100">
                            <div className="flex items-center gap-1.5">
                                <Star size={18} className="text-brand-accent fill-brand-accent" />
                                <span className="font-bold text-gray-900 leading-none">{(company.rating || 0).toFixed(1)}</span>
                                <span className="text-xs text-gray-500 leading-none">({company.reviewCount ?? (company as any).review_count ?? 0})</span>
                            </div>

                            {company.services && company.services.length > 0 && company.services[0].price != null && (
                                <div className="text-right">
                                    <span className="text-xs text-gray-400 block leading-none">A partir de</span>
                                    <span className="font-bold text-brand-primary">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(company.services[0].price)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </Link>

            {user && user.type === 'client' && (
                <button
                    onClick={handleToggleFavorite}
                    style={{ zIndex: 10 }}
                    className={`absolute top-3 right-3 p-2.5 rounded-full border transition-all ${
                        favorited 
                            ? 'bg-red-50 border-red-100 text-red-500' 
                            : 'bg-white/90 border-transparent text-gray-400 hover:text-red-500 hover:bg-white'
                    } shadow-sm backdrop-blur-sm`}
                    aria-label={favorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                >
                    <Heart size={20} className={favorited ? 'fill-red-500' : ''} />
                </button>
            )}
        </article>
    );
};

export default CompanyCard;
