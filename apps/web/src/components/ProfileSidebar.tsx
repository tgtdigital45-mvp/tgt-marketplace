import React from 'react';
import { Company } from '@tgt/shared';
import Button from '@/components/ui/Button';
import { MapPin, Calendar, Clock, CheckCircle, Facebook, Instagram, Linkedin, Globe, ExternalLink, Star } from 'lucide-react';
import OptimizedImage from '@/components/ui/OptimizedImage';

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
        <div className="space-y-4">
            {/* ── Main Profile Card ── */}
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100/80 overflow-hidden">

                {/* Top gradient banner */}
                <div className="h-28 bg-gradient-to-br from-slate-900 via-slate-800 to-[#1e2d4a] relative overflow-hidden">
                    {/* Decorative glow circles */}
                    <div
                        className="absolute inset-0"
                        style={{
                            backgroundImage:
                                'radial-gradient(circle at 20% 60%, rgba(37,99,235,0.25) 0%, transparent 55%), radial-gradient(circle at 80% 30%, rgba(255,107,53,0.12) 0%, transparent 50%)',
                        }}
                    />
                    {/* Subtle dot pattern */}
                    <div
                        className="absolute inset-0 opacity-[0.07]"
                        style={{
                            backgroundImage:
                                'radial-gradient(circle, #fff 1px, transparent 1px)',
                            backgroundSize: '20px 20px',
                        }}
                    />

                    {/* Online badge */}
                    <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 bg-white/10 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-widest rounded-full border border-white/20 shadow-sm">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow shadow-emerald-400/60" />
                        Online
                    </div>
                </div>

                {/* Avatar – floats over banner */}
                <div className="flex flex-col items-center -mt-14 px-6 pb-0">
                    <div className="relative mb-3">
                        <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-2xl ring-2 ring-slate-900/10">
                            <OptimizedImage
                                src={avatarUrl}
                                alt={displayName}
                                className="w-full h-full object-cover"
                                optimizedWidth={128}
                                fallbackSrc={`https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0f172a&color=ffffff&size=128`}
                            />
                        </div>
                        {company.verified && (
                            <div
                                className="absolute bottom-1 right-1 bg-blue-500 text-white p-1.5 rounded-full shadow-lg border-2 border-white"
                                title="Perfil Verificado"
                            >
                                <CheckCircle className="w-3 h-3" />
                            </div>
                        )}
                    </div>

                    {/* Name & headline */}
                    <h2 className="text-xl font-extrabold text-gray-900 text-center leading-tight">{displayName}</h2>
                    <p className="text-[13px] text-gray-500 mt-1 mb-4 font-medium text-center">
                        {company.category}
                        {(owner?.location || 'Brasil') && (
                            <> &middot; {owner?.location || 'Brasil'}</>
                        )}
                    </p>

                    {/* Badges */}
                    {(company.level || company.current_plan_tier) && (
                        <div className="flex flex-wrap justify-center gap-2 mb-5">
                            {company.level && (
                                <span className="inline-flex items-center px-3 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-500 border border-gray-200 tracking-wide">
                                    {company.level}
                                </span>
                            )}
                            {company.current_plan_tier === 'pro' && (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-extrabold bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-md shadow-orange-300/40 tracking-wide">
                                    ✦ PRO
                                </span>
                            )}
                            {company.current_plan_tier === 'agency' && (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-extrabold bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-purple-300/40 tracking-wide">
                                    ◆ AGÊNCIA
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 border-t border-gray-100">
                    <div className="flex flex-col items-center py-4 border-r border-gray-100 bg-gray-50/50">
                        <span className="text-2xl font-extrabold text-gray-900 leading-none tabular-nums">
                            {company.reviewCount || 0}
                        </span>
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                            Avaliações
                        </span>
                    </div>
                    <div className="flex flex-col items-center py-4 bg-gray-50/50">
                        <div className="flex items-center gap-1 leading-none">
                            <Star className="w-4 h-4 fill-amber-400 text-amber-400 -mt-px" />
                            <span className="text-2xl font-extrabold text-gray-900 tabular-nums">
                                {company.rating ? company.rating.toFixed(1) : '—'}
                            </span>
                        </div>
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                            Avaliação
                        </span>
                    </div>
                </div>

                {/* CTA Buttons */}
                <div className="px-6 py-5 space-y-3">
                    <Button
                        variant="primary"
                        onClick={onContactClick}
                        className="w-full h-auto py-3.5 text-sm font-bold tracking-wide rounded-2xl shadow-lg shadow-orange-300/40 hover:shadow-xl hover:shadow-orange-300/50 hover:-translate-y-0.5 transition-all"
                    >
                        Fale Comigo
                    </Button>
                    <Button
                        variant="outline"
                        onClick={onRequestQuote}
                        className="w-full h-auto py-3 text-sm font-semibold rounded-2xl border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    >
                        Solicitar Orçamento
                    </Button>
                </div>

                {/* Mini map */}
                {embedUrl && (
                    <div className="px-6 pb-5">
                        <div className="w-full h-32 rounded-2xl overflow-hidden border border-gray-100 relative group bg-gray-50 shadow-inner">
                            <iframe
                                title="Localização"
                                width="100%"
                                height="100%"
                                frameBorder="0"
                                style={{ border: 0 }}
                                src={embedUrl}
                                allowFullScreen
                                className="grayscale group-hover:grayscale-0 transition-all duration-700"
                            />
                            <a
                                href={googleMapsUrl || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm p-1.5 rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-all duration-300 border border-gray-100"
                                title="Ver no Google Maps"
                            >
                                <ExternalLink size={13} className="text-brand-primary" />
                            </a>
                        </div>
                    </div>
                )}

                {/* Info footer */}
                <div className="px-6 pb-6 space-y-3.5 border-t border-gray-50 pt-4">
                    {/* Address */}
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-brand-primary/5 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-brand-primary" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-gray-800 leading-tight">
                                {company.address
                                    ? `${company.address.street}, ${company.address.number}`
                                    : (owner?.location || 'Brasil')}
                            </p>
                            {(company.address?.district || company.address?.city) && (
                                <p className="text-[11px] text-gray-400 mt-0.5 font-medium">
                                    {[company.address.district, company.address.city, company.address.state]
                                        .filter(Boolean)
                                        .join(', ')}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Member since + response time */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 bg-brand-primary/5 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Calendar className="w-3.5 h-3.5 text-brand-primary" />
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider leading-none">
                                    Membro desde
                                </p>
                                <p className="text-[12px] font-bold text-gray-700 mt-0.5">
                                    {owner?.memberSince || '2024'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 bg-brand-primary/5 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Clock className="w-3.5 h-3.5 text-brand-primary" />
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider leading-none">
                                    Resposta
                                </p>
                                <p className="text-[12px] font-bold text-gray-700 mt-0.5">
                                    {owner?.responseTime || '~1h'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Social links */}
                    {(company.social_links?.facebook ||
                        company.social_links?.instagram ||
                        company.social_links?.linkedin ||
                        company.website) && (
                        <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                                Redes Sociais
                            </span>
                            <div className="flex items-center gap-2">
                                {company.social_links?.facebook && (
                                    <a
                                        href={company.social_links.facebook}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-8 h-8 bg-gray-50 text-gray-400 hover:bg-blue-50 hover:text-blue-600 rounded-xl flex items-center justify-center transition-all border border-gray-100 hover:border-blue-200 hover:shadow-sm"
                                    >
                                        <Facebook className="w-3.5 h-3.5" />
                                    </a>
                                )}
                                {company.social_links?.instagram && (
                                    <a
                                        href={company.social_links.instagram}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-8 h-8 bg-gray-50 text-gray-400 hover:bg-pink-50 hover:text-pink-600 rounded-xl flex items-center justify-center transition-all border border-gray-100 hover:border-pink-200 hover:shadow-sm"
                                    >
                                        <Instagram className="w-3.5 h-3.5" />
                                    </a>
                                )}
                                {company.social_links?.linkedin && (
                                    <a
                                        href={company.social_links.linkedin}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-8 h-8 bg-gray-50 text-gray-400 hover:bg-sky-50 hover:text-sky-700 rounded-xl flex items-center justify-center transition-all border border-gray-100 hover:border-sky-200 hover:shadow-sm"
                                    >
                                        <Linkedin className="w-3.5 h-3.5" />
                                    </a>
                                )}
                                {company.website && (
                                    <a
                                        href={company.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-8 h-8 bg-gray-50 text-gray-400 hover:bg-brand-primary/5 hover:text-brand-primary rounded-xl flex items-center justify-center transition-all border border-gray-100 hover:border-brand-primary/20 hover:shadow-sm"
                                    >
                                        <Globe className="w-3.5 h-3.5" />
                                    </a>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Favourite button */}
            {isClient && (
                <button
                    onClick={onToggleFavorite}
                    className={`w-full py-3.5 rounded-2xl border-2 flex items-center justify-center gap-2 text-sm font-bold transition-all duration-200 ${
                        isFavorited
                            ? 'bg-red-50 border-red-200 text-red-600 shadow-sm shadow-red-100/60'
                            : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:shadow-md hover:text-gray-700'
                    }`}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`h-4 w-4 transition-all ${isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                    </svg>
                    {isFavorited ? 'Salvo nos Favoritos' : 'Salvar nos Favoritos'}
                </button>
            )}
        </div>
    );
};

export default ProfileSidebar;
