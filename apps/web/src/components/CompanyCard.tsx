import React from 'react';
import { Link } from 'react-router-dom';
import { Company } from '@tgt/shared';
import VerifiedBadge from '@/components/VerifiedBadge';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import OptimizedImage from '@/components/ui/OptimizedImage';
import Badge from '@/components/ui/Badge';

interface CompanyCardProps {
    company: Company;
}

const HeartIcon: React.FC<{ favorited: boolean }> = ({ favorited }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        className={`h-5 w-5 transition-all duration-200 ${favorited ? 'text-red-400 fill-red-400' : 'text-white fill-transparent'}`}
        viewBox="0 0 20 20"
        stroke="currentColor"
        strokeWidth={1.5}
    >
        <path
            fillRule="evenodd"
            d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
            clipRule="evenodd"
        />
    </svg>
);

const StarRow: React.FC<{ rating: number }> = ({ rating }) => (
    <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
            <svg
                key={i}
                className={`w-3.5 h-3.5 ${i < Math.round(rating) ? 'text-amber-400' : 'text-gray-200'}`}
                fill="currentColor"
                viewBox="0 0 20 20"
            >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
        ))}
    </div>
);

const CompanyCard: React.FC<CompanyCardProps> = ({ company }) => {
    const { user } = useAuth();
    const { addFavorite, removeFavorite, isFavorite } = useFavorites();
    const favorited = isFavorite(company.id);

    const handleToggleFavorite = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (favorited) removeFavorite(company.id);
        else addFavorite(company.id);
    };

    return (
        <article className="group relative">
            <Link
                to={company.slug ? `/empresa/${company.slug}` : '#'}
                className="block bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100/80 overflow-hidden"
            >
                {/* Cover image */}
                <div className="relative w-full h-44 bg-gray-200 overflow-hidden">
                    <OptimizedImage
                        src={company.coverImage}
                        alt={company.companyName}
                        aspectRatio="16/9"
                        optimizedWidth={800}
                        quality={75}
                        fallbackSrc="https://placehold.co/800x450/f1f5f9/94a3b8?text=CONTRATTO"
                        className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    {/* Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

                    {/* Category pill */}
                    <div className="absolute top-3 left-3">
                        <span className="text-[10px] font-extrabold uppercase tracking-widest bg-brand-primary/80 backdrop-blur-sm text-white px-2.5 py-1 rounded-full shadow-sm">
                            {company.category || 'Serviços'}
                        </span>
                    </div>

                    {/* Logo – floating */}
                    <div className="absolute -bottom-7 left-5 z-10">
                        <OptimizedImage
                            src={company.logo}
                            alt={`${company.companyName} logo`}
                            aspectRatio="1/1"
                            optimizedWidth={100}
                            quality={80}
                            fallbackSrc="https://placehold.co/100x100/f1f5f9/94a3b8?text=Logo"
                            className="w-14 h-14 rounded-2xl border-3 border-white shadow-lg object-cover bg-white ring-2 ring-white"
                        />
                    </div>
                </div>

                {/* Body */}
                <div className="px-5 pb-5 pt-10">
                    {/* Name + badges */}
                    <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="text-[15px] font-bold text-gray-900 group-hover:text-brand-primary transition-colors leading-tight line-clamp-1">
                            {company.companyName}
                        </span>
                        <div className="flex gap-1 flex-shrink-0">
                            {company.current_plan_tier === 'pro' && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-gradient-to-r from-amber-400 to-orange-500 text-white tracking-wide shadow-sm">
                                    PRO
                                </span>
                            )}
                            {company.current_plan_tier === 'agency' && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-gradient-to-r from-violet-600 to-purple-600 text-white tracking-wide shadow-sm">
                                    AGÊNCIA
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-2 mt-1.5 mb-3">
                        <StarRow rating={company.rating} />
                        <span className="text-[12px] font-bold text-gray-700">{company.rating.toFixed(1)}</span>
                        <span className="text-[11px] text-gray-400">({company.reviewCount} avaliações)</span>
                    </div>

                    {/* Location + price */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                        <div className="flex items-center gap-1 text-gray-500 text-[12px]">
                            <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="truncate max-w-[120px] font-medium text-gray-500">
                                {company.address?.city || 'Brasil'}
                            </span>
                            {company.distance && (
                                <span className="ml-1 text-brand-primary font-bold bg-brand-primary/8 px-1.5 py-0.5 rounded-full text-[10px]">
                                    {company.distance < 1
                                        ? `${(company.distance * 1000).toFixed(0)}m`
                                        : `${company.distance.toFixed(1)}km`}
                                </span>
                            )}
                        </div>
                        {company.services.length > 0 && company.services[0].price && (
                            <div className="text-right">
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none">a partir de</p>
                                <p className="text-[13px] font-extrabold text-brand-success leading-tight tabular-nums">
                                    R$ {company.services[0].price.toFixed(0)}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </Link>

            {/* Favourite button */}
            {user && user.type === 'client' && (
                <button
                    onClick={handleToggleFavorite}
                    className="absolute top-3 right-3 w-9 h-9 bg-black/30 backdrop-blur-sm hover:bg-black/50 rounded-xl flex items-center justify-center transition-all border border-white/10 hover:border-white/20 focus:outline-none"
                    aria-label={favorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                >
                    <HeartIcon favorited={favorited} />
                </button>
            )}
        </article>
    );
};

export default CompanyCard;
