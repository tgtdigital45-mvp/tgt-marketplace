import React from 'react';
import { Company } from '@tgt/shared';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { MapPin, Calendar, Clock, CheckCircle } from 'lucide-react';
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

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col items-center text-center relative overflow-hidden transition-all hover:shadow-md">
                {/* Online Indicator */}
                <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-0.5 bg-green-50 text-green-700 text-[10px] font-bold uppercase tracking-wide rounded-full border border-green-100">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                    Online
                </div>

                {/* Avatar */}
                <div className="relative mb-5">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg ring-1 ring-gray-100">
                        <OptimizedImage
                            src={avatarUrl}
                            alt={displayName}
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
                <h2 className="text-xl font-bold text-gray-900 mb-1">{displayName}</h2>
                <p className="text-sm text-gray-500 mb-5 font-medium">{company.category} • {owner?.location || "Brasil"}</p>

                {/* Badges */}
                <div className="flex flex-wrap justify-center gap-2 mb-6">
                    {company.level && <Badge variant="secondary" size="sm" className="bg-gray-100 text-gray-600 border-gray-200">{company.level}</Badge>}
                    {company.current_plan_tier === 'pro' && <Badge variant="primary" size="sm">PRO</Badge>}
                    {company.current_plan_tier === 'agency' && <Badge variant="secondary" size="sm">AGÊNCIA</Badge>}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 w-full mb-6 border-t border-b border-gray-50 py-4">
                    <div className="flex flex-col">
                        <span className="text-lg font-bold text-gray-900">{company.reviewCount || 0}</span>
                        <span className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Avaliações</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-lg font-bold text-gray-900">{company.rating ? company.rating.toFixed(1) : 'N/A'}</span>
                        <span className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Nota</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="w-full space-y-3">
                    <Button
                        onClick={onContactClick}
                        className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white shadow-lg shadow-brand-primary/20 rounded-xl py-2.5 font-semibold"
                    >
                        Fale Comigo
                    </Button>
                    <Button
                        variant="outline"
                        onClick={onRequestQuote}
                        className="w-full border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-brand-primary rounded-xl py-2.5 font-semibold"
                    >
                        Solicitar Orçamento
                    </Button>
                </div>

                {/* Meta Information */}
                <div className="mt-6 space-y-3 w-full text-left pt-5 border-t border-gray-50">
                    <div className="flex items-center gap-3 text-xs font-medium text-gray-500">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        {owner?.location || "Brasil"}
                    </div>
                    <div className="flex items-center gap-3 text-xs font-medium text-gray-500">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        Membro desde {owner?.memberSince || "2024"}
                    </div>
                    <div className="flex items-center gap-3 text-xs font-medium text-gray-500">
                        <Clock className="w-4 h-4 text-gray-400" />
                        Tempo de resposta: {owner?.responseTime || "1 hora"}
                    </div>
                </div>
            </div>

            {/* Favorite Action */}
            {isClient && (
                <button
                    onClick={onToggleFavorite}
                    className={`w-full py-3 rounded-xl border flex items-center justify-center gap-2 text-sm font-semibold transition-all shadow-sm ${isFavorited
                        ? 'bg-red-50 border-red-100 text-red-600'
                        : 'bg-white border-gray-100 text-gray-500 hover:border-gray-200 hover:text-gray-700'
                        }`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isFavorited ? 'fill-current' : 'none'}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    {isFavorited ? 'Salvo nos favoritos' : 'Salvar nos favoritos'}
                </button>
            )}
        </div>
    );
};

export default ProfileSidebar;
