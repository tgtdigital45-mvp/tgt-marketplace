import React from 'react';
import { Company } from '../types';
import Badge from './ui/Badge';
import Button from './ui/Button';

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

    return (
        <div className="sticky top-24 space-y-6">
            {/* Profile Card */}
            <div className="bg-white p-6 rounded-[var(--radius-box)] border border-gray-100 shadow-sm relative overflow-hidden">
                {/* Online Status Indicator */}
                <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-100">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    Online
                </div>

                <div className="flex flex-col items-center text-center">
                    <div className="relative mb-4">
                        <img
                            src={owner?.avatar || company.logo}
                            alt={owner?.fullName || company.companyName}
                            className="w-32 h-32 rounded-full object-cover border-4 border-gray-50 shadow-md"
                        />
                        {company.verified && (
                            <div className="absolute bottom-1 right-1 bg-blue-500 text-white p-1 rounded-full shadow-sm border-2 border-white" title="Verificado">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        )}
                    </div>

                    <h2 className="text-xl font-bold text-gray-900 mb-1 flex items-center justify-center gap-2">
                        {owner?.fullName || company.companyName}
                        {company.current_plan_tier === 'pro' && (
                            <Badge variant="primary" size="sm">PRO</Badge>
                        )}
                        {company.current_plan_tier === 'agency' && (
                            <Badge variant="secondary" size="sm">AGENCY</Badge>
                        )}
                    </h2>
                    <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                        {company.category} • {owner?.location || "Brasil"}
                    </p>

                    <Button className="w-full mb-3 shadow-[0_4px_14px_0_rgba(var(--brand-primary-rgb),0.39)]" onClick={onContactClick}>
                        Fale Comigo
                    </Button>

                    <Button variant="outline" className="w-full" onClick={onRequestQuote}>
                        Solicitar Orçamento
                    </Button>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-100 space-y-4">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            De
                        </span>
                        <span className="font-semibold text-gray-900">{owner?.location || "Brasil"}</span>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Membro desde
                        </span>
                        <span className="font-semibold text-gray-900">{owner?.memberSince || "Fev 2024"}</span>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Tempo de resposta
                        </span>
                        <span className="font-semibold text-gray-900">{owner?.responseTime || "1 hora"}</span>
                    </div>
                </div>
            </div>

            {/* Languages & Skills */}
            {(owner?.languages?.length || company.services.length) > 0 && (
                <div className="bg-white p-6 rounded-[var(--radius-box)] border border-gray-100 shadow-sm">
                    {owner?.languages && owner.languages.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-sm font-bold text-gray-900 mb-3">Idiomas</h3>
                            <ul className="space-y-2">
                                {owner.languages.map((lang, idx) => (
                                    <li key={idx} className="flex justify-between text-sm">
                                        <span className="text-gray-700">{lang.language}</span>
                                        <span className="text-gray-400 text-xs">{lang.level}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {(owner?.skills && owner.skills.length > 0) && (
                        <div className="mb-6">
                            <h3 className="text-sm font-bold text-gray-900 mb-3">Skills</h3>
                            <div className="flex flex-wrap gap-2">
                                {owner.skills.map((skill, idx) => (
                                    <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {owner?.education && owner.education.length > 0 && (
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 mb-3">Educação</h3>
                            <ul className="space-y-3">
                                {owner.education.map((edu, idx) => (
                                    <li key={idx} className="text-sm border-l-2 border-gray-200 pl-3">
                                        <div className="font-medium text-gray-900">{edu.degree}</div>
                                        <div className="text-gray-500 text-xs">{edu.institution}, {edu.year}</div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {/* Actions (Like Favorite) */}
            {isClient && (
                <div className="bg-white p-4 rounded-[var(--radius-box)] border border-gray-100 shadow-sm flex items-center justify-center">
                    <button
                        onClick={onToggleFavorite}
                        className={`flex items-center gap-2 text-sm font-medium transition-colors ${isFavorited ? 'text-red-500 hover:text-red-600' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isFavorited ? 'fill-current' : 'none'}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        {isFavorited ? 'Salvo nos favoritos' : 'Salvar nos favoritos'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default ProfileSidebar;
