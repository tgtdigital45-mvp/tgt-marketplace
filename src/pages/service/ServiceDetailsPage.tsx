import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Service } from '../../types';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Button from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

// Pricing Selector Component
const PricingSelector = ({ packages, onSelect, selectedTier }: any) => {
    if (!packages) return null;

    const tiers = ['basic', 'standard', 'premium'] as const;
    const tierLabels = { basic: 'Básico', standard: 'Padrão', premium: 'Premium' };

    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg sticky top-24 overflow-hidden">
            <div className="flex border-b border-gray-200">
                {tiers.map(tier => (
                    <button
                        key={tier}
                        onClick={() => onSelect(tier)}
                        className={`flex-1 py-4 text-sm font-bold transition-colors ${selectedTier === tier
                                ? 'bg-brand-primary/5 text-brand-primary border-b-2 border-brand-primary'
                                : 'text-gray-500 hover:text-gray-700 bg-gray-50'
                            }`}
                    >
                        {tierLabels[tier]}
                    </button>
                ))}
            </div>

            <div className="p-6 space-y-6">
                <div className="space-y-2">
                    <div className="flex items-baseline justify-between">
                        <h3 className="text-xl font-bold text-gray-900">{packages[selectedTier]?.name || tierLabels[selectedTier]}</h3>
                        <span className="text-2xl font-extrabold text-brand-primary">
                            R$ {packages[selectedTier]?.price}
                        </span>
                    </div>
                    <p className="text-sm text-gray-500 min-h-[40px]">{packages[selectedTier]?.description}</p>
                </div>

                <div className="space-y-3 text-sm text-gray-600">
                    <div className="flex items-center">
                        <svg className="w-5 h-5 mr-3 text-brand-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span className="font-semibold">{packages[selectedTier]?.delivery_time} dias de entrega</span>
                    </div>
                    <div className="flex items-center">
                        <svg className="w-5 h-5 mr-3 text-brand-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        <span className="font-semibold">
                            {packages[selectedTier]?.revisions === -1
                                ? 'Revisões Ilimitadas'
                                : `${packages[selectedTier]?.revisions} Revisões`}
                        </span>
                    </div>
                    {/* Add checks for features if they exist */}
                </div>

                <Button variant="primary" className="w-full py-3 text-lg shadow-lg shadow-brand-primary/20">
                    Continuar (R$ {packages[selectedTier]?.price})
                </Button>

                <button className="w-full text-center text-sm text-gray-500 hover:text-brand-primary mt-2">
                    Comparar pacotes
                </button>
            </div>
        </div>
    );
};

const ServiceDetailsPage = () => {
    const { id } = useParams();
    const [service, setService] = useState<Service | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedTier, setSelectedTier] = useState<'basic' | 'standard' | 'premium'>('basic');
    const [company, setCompany] = useState<any>(null); // To store company details

    useEffect(() => {
        const fetchService = async () => {
            if (!id) return;
            try {
                const { data, error } = await supabase
                    .from('services')
                    .select('*, company:companies(*)')
                    .eq('id', id)
                    .single();

                if (error) throw error;
                setService(data);
                setCompany(data.company); // Assuming join works
            } catch (error) {
                console.error("Error loading service", error);
            } finally {
                setLoading(false);
            }
        };
        fetchService();
    }, [id]);

    if (loading) return <div className="h-screen flex items-center justify-center"><LoadingSpinner /></div>;
    if (!service) return <div className="h-screen flex items-center justify-center">Serviço não encontrado.</div>;

    const activeImage = service.gallery && service.gallery.length > 0 ? service.gallery[0] : null;

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Details */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Gallery */}
                        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                            {activeImage ? (
                                <div className="aspect-video bg-gray-100">
                                    <img src={activeImage} alt={service.title} className="w-full h-full object-cover" />
                                </div>
                            ) : (
                                <div className="aspect-video bg-gray-100 flex items-center justify-center text-gray-400">
                                    Sem imagem
                                </div>
                            )}
                            {/* Thumbnails would go here */}
                        </div>

                        {/* Title & Description */}
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-4">{service.title}</h1>

                            {/* Breadcrumbs / Category */}
                            <div className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
                                <span>Serviços</span>
                                <span>/</span>
                                <span className="capitalize">{company?.category || 'Geral'}</span>
                            </div>

                            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                                <h3 className="text-xl font-bold text-gray-900 mb-4">Sobre este serviço</h3>
                                <div className="prose prose-purple max-w-none text-gray-600 whitespace-pre-wrap">
                                    {service.description}
                                </div>
                            </div>
                        </div>

                        {/* Company/Seller Profile */}
                        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex items-start space-x-6">
                            <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                                {company?.logo_url && <img src={company.logo_url} alt={company.company_name} className="w-full h-full object-cover" />}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">{company?.company_name}</h3>
                                <div className="flex items-center text-sm text-gray-500 mt-1 mb-3">
                                    <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                    <span className="font-bold text-gray-900 mr-1">{company?.rating || 5.0}</span>
                                    <span>({company?.review_count || 0} avaliações)</span>
                                </div>
                                <Button variant="secondary" size="sm">Ver Perfil</Button>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Sticky Pricing */}
                    <div className="lg:col-span-1">
                        <PricingSelector
                            packages={service.packages}
                            selectedTier={selectedTier}
                            onSelect={setSelectedTier}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ServiceDetailsPage;
