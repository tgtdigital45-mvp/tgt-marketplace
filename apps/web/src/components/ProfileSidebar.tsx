import React from 'react';
import { Company } from '@tgt/core';


import { MapPin, Calendar, Clock, CheckCircle, Facebook, Instagram, Linkedin, Globe, ExternalLink, Star, Info } from 'lucide-react';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { Badge, Button } from '@tgt/ui-web';


interface ProfileSidebarProps {
    company: Company;
    onContactClick: () => void;
    onRequestQuote: () => void;
    isFavorited: boolean;
    onToggleFavorite: () => void;
    isClient: boolean;
}

const ProfileSidebar: React.FC<ProfileSidebarProps> = ({
    company,
    onContactClick,
    onRequestQuote,
    isFavorited,
    onToggleFavorite,
    isClient
}) => {
    const { owner } = company;
    const avatarUrl = owner?.avatar || company.logo;
    const displayName = owner?.fullName || company.companyName;

    const fullAddress = company.address
        ? `${company.address.street}, ${company.address.number}${company.address.district ? `, ${company.address.district}` : ''}, ${company.address.city}, ${company.address.state}`
        : '';

    const googleMapsUrl = fullAddress
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`
        : null;

    const embedUrl = fullAddress
        ? `https://www.google.com/maps?q=${encodeURIComponent(fullAddress)}&output=embed`
        : null;

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-gray-100 dark:border-white/5 flex flex-col items-center relative overflow-hidden transition-all hover:shadow-md">
                {/* Header Section with Profile Info */}
                <div className="p-8 pb-4 w-full flex flex-col items-center text-center">
                    {/* Online Indicator */}
                    <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-0.5 bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 text-[10px] font-bold uppercase tracking-wide rounded-full border border-green-100 dark:border-green-500/20">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                        Online
                    </div>

                    {/* Avatar */}
                    <div className="relative mb-5">
                        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-slate-800 shadow-lg ring-1 ring-gray-100 dark:ring-white/5">
                            <OptimizedImage
                                src={avatarUrl}
                                alt={displayName}
                                aspectRatio="1/1"
                                width={128}
                                height={128}
                                className="w-full h-full object-cover"
                                optimizedWidth={128}
                                fallbackSrc={`https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`}
                            />
                        </div>
                        {company.verified && (
                            <div className="absolute bottom-1 right-1 bg-blue-500 text-white p-1 rounded-full shadow-sm border-2 border-white flex items-center justify-center" title="Verificado">
                                <CheckCircle className="w-3 h-3" />
                            </div>
                        )}
                    </div>

                    {/* Name & Headline */}
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{displayName}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 font-medium">{company.category} • {owner?.location || "Brasil"}</p>

                    {/* Badges */}
                    <div className="flex flex-wrap justify-center gap-2">
                        {company.level && <Badge variant="secondary" size="sm" className="bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400 border-gray-100 dark:border-white/5">{company.level}</Badge>}
                        {company.current_plan_tier === 'pro' && <Badge variant="primary" size="sm">PRO</Badge>}
                        {company.current_plan_tier === 'agency' && <Badge variant="secondary" size="sm">AGÊNCIA</Badge>}
                    </div>
                </div>

                {/* Stats Partition */}
                <div className="flex items-center justify-center gap-2 w-full border-t border-b border-gray-50 dark:border-white/5 py-4 bg-gray-50/30 dark:bg-brand-dark/10">
                    <Star className="w-5 h-5 text-brand-accent fill-brand-accent" />
                    <span className="text-xl font-bold text-gray-900 dark:text-white leading-none">{company.rating ? company.rating.toFixed(1) : 'N/A'}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                        ({company.reviewCount || 0} {company.reviewCount === 1 ? 'avaliação' : 'avaliações'})
                    </span>
                </div>

                {/* Quem Somos - Moved to Sidebar */}
                <div className="px-8 py-6 w-full text-center border-b border-gray-50 dark:border-white/5">
                    <h3 className="font-display text-sm font-bold text-gray-900 dark:text-white mb-3 uppercase tracking-wider flex items-center justify-center gap-1.5">
                        <Info className="w-4 h-4 text-brand-primary dark:text-indigo-400" />
                        Quem Somos
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">
                        {company.description || "Sem descrição."}
                    </p>
                </div>

                {/* Simplified Map Section */}
                {embedUrl && (
                    <div className="w-full px-6 mb-4">
                        <div className="w-full h-32 rounded-2xl overflow-hidden border border-gray-100 dark:border-white/5 shadow-inner relative group bg-gray-50 dark:bg-slate-800">
                            <iframe
                                title="Localização"
                                width="100%"
                                height="100%"
                                frameBorder="0"
                                style={{ border: 0 }}
                                src={embedUrl}
                                allowFullScreen
                                className="grayscale invert-[0.9] hue-rotate-180 contrast-125 dark:invert-0 dark:grayscale dark:hover:grayscale-0 transition-all duration-500"
                            ></iframe>
                            <a
                                href={googleMapsUrl || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="absolute bottom-2 right-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm p-1.5 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity border border-gray-100 dark:border-white/5"
                                title="Ver no Google Maps"
                            >
                                <ExternalLink size={14} className="text-brand-primary" />
                            </a>
                        </div>
                    </div>
                )}

                {/* Meta Information Footer */}
                <div className="px-8 pb-8 pt-2 w-full space-y-4">
                    {/* Address with improved alignment */}
                    <div className="flex items-start gap-3">
                        <div className="mt-1 bg-gray-50 dark:bg-slate-800 p-1.5 rounded-lg">
                            <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 leading-tight">
                                {company.address ?
                                    `${company.address.street}, ${company.address.number}` :
                                    (owner?.location || "Brasil")}
                            </span>
                            {(company.address?.district || company.address?.city) && (
                                <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-tighter">
                                    {[company.address.district, company.address.city, company.address.state].filter(Boolean).join(', ')}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Dense Info Section */}
                    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-50 dark:border-white/5">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600" />
                            <div className="flex flex-col">
                                <span className="text-[9px] font-bold text-gray-300 dark:text-gray-600 uppercase tracking-wide">Membro</span>
                                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{owner?.memberSince || "2024"}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600" />
                            <div className="flex flex-col">
                                <span className="text-[9px] font-bold text-gray-300 dark:text-gray-600 uppercase tracking-wide">Resposta</span>
                                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{owner?.responseTime || "1h"}</span>
                            </div>
                        </div>
                    </div>

                    {/* Integrated Social Links */}
                    {(company.social_links?.facebook || company.social_links?.instagram || company.social_links?.linkedin || company.website) && (
                        <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-white/5">
                            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Siga-nos</span>
                            <div className="flex items-center gap-3">
                                {company.social_links?.facebook && (
                                    <a href={company.social_links.facebook} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-gray-50 dark:bg-slate-800 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-all">
                                        <Facebook className="w-4 h-4" />
                                    </a>
                                )}
                                {company.social_links?.instagram && (
                                    <a href={company.social_links.instagram} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-gray-50 dark:bg-slate-800 text-gray-400 hover:text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-500/10 rounded-lg transition-all">
                                        <Instagram className="w-4 h-4" />
                                    </a>
                                )}
                                {company.social_links?.linkedin && (
                                    <a href={company.social_links.linkedin} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-gray-50 dark:bg-slate-800 text-gray-400 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-all">
                                        <Linkedin className="w-4 h-4" />
                                    </a>
                                )}
                                {company.website && (
                                    <a href={company.website} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-gray-50 dark:bg-slate-800 text-gray-400 hover:text-brand-primary hover:bg-teal-50 dark:hover:bg-teal-500/10 rounded-lg transition-all">
                                        <Globe className="w-4 h-4" />
                                    </a>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Favorite Action Button - Stayed Outside for prominence */}
            {isClient && (
                <button
                    onClick={onToggleFavorite}
                    className={`w-full py-3.5 rounded-2xl border flex items-center justify-center gap-2 text-sm font-bold transition-all shadow-sm ${isFavorited
                        ? 'bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20 text-red-600 shadow-red-100/50'
                        : 'bg-white dark:bg-slate-900 border-gray-100 dark:border-white/5 text-gray-500 dark:text-gray-400 hover:border-gray-200 hover:text-gray-700 dark:hover:text-white hover:shadow-md'
                        }`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isFavorited ? 'fill-current' : 'none'}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    {isFavorited ? 'Salvo' : 'Salvar nos favoritos'}
                </button>
            )}
        </div>
    );
};

export default ProfileSidebar;
