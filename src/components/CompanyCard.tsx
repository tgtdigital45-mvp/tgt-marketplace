import React from 'react';
import { Link } from 'react-router-dom';
import { Company } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useFavorites } from '../contexts/FavoritesContext';
import OptimizedImage from '@/components/ui/OptimizedImage';
import Badge from '@/components/ui/Badge';


interface CompanyCardProps {
    company: Company;
}

const HeartIcon: React.FC<{ favorited: boolean }> = ({ favorited }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 transition-all duration-200 ${favorited ? 'text-red-500' : 'text-white'}`} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
    </svg>
);


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
        <div className="group relative">
            <Link to={`/empresa/${company.slug}`} className="block bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ring-1 ring-gray-100 hover:ring-brand-primary">
                <div className="relative w-full h-48 bg-gray-200">
                    <OptimizedImage src={company.coverImage} alt={company.companyName} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>

                    {/* Availability Badge */}
                    <div className="absolute top-2 left-2">
                        <Badge variant="success">
                            Disponível Hoje
                        </Badge>
                    </div>

                    <div className="absolute bottom-2 left-2 w-16 h-16 rounded-full border-2 border-white bg-white shadow-md overflow-hidden">
                        <OptimizedImage src={company.logo} alt={`${company.companyName} logo`} className="w-full h-full object-cover" />
                    </div>
                </div>
                <div className="p-4">
                    <p className="text-xs font-bold text-brand-primary uppercase tracking-wider">{company.category}</p>
                    <p className="block mt-1 text-lg font-bold text-gray-900 group-hover:text-brand-primary transition-colors">{company.companyName}</p>
                    <div className="mt-2 flex items-center">
                        <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                                <svg key={i} className={`w-4 h-4 ${i < Math.round(company.rating) ? 'text-brand-accent' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                            ))}
                        </div>
                        <p className="ml-2 text-sm text-gray-500">{company.rating.toFixed(1)} ({company.reviewCount} avaliações)</p>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm">
                        <div className="flex items-center text-gray-500 text-sm mb-3">
                            <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="truncate">
                                {company.address?.district && `${company.address.district}, `}
                                {company.address?.city}
                                {company.distance && (
                                    <span className="ml-2 text-brand-primary font-medium bg-brand-primary/10 px-2 py-0.5 rounded-full text-xs">
                                        {company.distance < 1 ? `${(company.distance * 1000).toFixed(0)}m` : `${company.distance.toFixed(1)}km`}
                                    </span>
                                )}
                            </span>
                        </div>
                        {company.services.length > 0 && company.services[0].price && (
                            <div className="flex items-center font-semibold text-brand-primary">
                                <span className="text-xs text-gray-500 mr-1">A partir de</span>
                                <span>R$ {company.services[0].price.toFixed(0)}</span>
                            </div>
                        )}
                    </div>
                </div>
            </Link>
            {user && user.type === 'client' && (
                <button
                    onClick={handleToggleFavorite}
                    className="absolute top-2 right-2 p-3 bg-black/40 rounded-full hover:bg-black/60 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black/50 focus:ring-white min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label={favorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                >
                    <HeartIcon favorited={favorited} />
                </button>
            )}
        </div>
    );
};

export default CompanyCard;
