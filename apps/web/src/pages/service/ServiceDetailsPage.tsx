import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@tgt/shared';
import { Service, ServicePackage, ServicePackages, DbCompany, Company } from '@tgt/shared';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import Button from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import OptimizedImage from '@/components/ui/OptimizedImage';
import SellerBadge, { SellerLevel } from '@/components/SellerBadge';
import SEO from '@/components/SEO';
import { Disclosure } from '@headlessui/react';
import { ChevronUpIcon, CheckIcon } from '@heroicons/react/24/solid';

// Helper to format currency
const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

// --- Components ---

// 1. Pricing Card Component (Sidebar)
interface PricingCardProps {
    packages: ServicePackages | undefined;
    onCheckout: (tier: string) => void;
}

const PricingCard = ({ packages, onCheckout }: PricingCardProps) => {
    const [selectedTier, setSelectedTier] = useState<'basic' | 'standard' | 'premium'>('basic');

    // Safety check: ensure packages object exists
    if (!packages) return (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center shadow-lg">
            <p className="text-gray-500">Pacotes não disponíveis para este serviço.</p>
        </div>
    );

    const currentPackage = packages[selectedTier];

    // Tiers mapping for tabs
    const tiers: { id: 'basic' | 'standard' | 'premium', label: string }[] = [];
    if (packages.basic) tiers.push({ id: 'basic', label: 'Básico' });
    if (packages.standard) tiers.push({ id: 'standard', label: 'Padrão' });
    if (packages.premium) tiers.push({ id: 'premium', label: 'Premium' });

    // If no packages are defined (edge case), show fallback
    if (tiers.length === 0) return null;

    // Ensure selected tier exists, fallback to first available
    useEffect(() => {
        if (!packages[selectedTier] && tiers.length > 0) {
            setSelectedTier(tiers[0].id);
        }
    }, [packages, selectedTier, tiers]);

    if (!currentPackage) return null;

    return (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-xl sticky top-24 overflow-hidden transition-all duration-300 hover:shadow-2xl">
            {/* Tabs */}
            <div className="flex border-b border-gray-100">
                {tiers.map(tier => (
                    <button
                        key={tier.id}
                        onClick={() => setSelectedTier(tier.id)}
                        className={`flex-1 py-4 text-sm font-bold transition-all relative
                            ${selectedTier === tier.id
                                ? 'text-brand-primary bg-brand-primary/5'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        {tier.label}
                        {selectedTier === tier.id && (
                            <div className="absolute bottom-0 left-0 w-full h-1 bg-brand-primary rounded-t-full" />
                        )}
                    </button>
                ))}
            </div>

            <div className="p-6 md:p-8 space-y-6">
                {/* Price & Title */}
                <div className="flex items-baseline justify-between mb-2">
                    <h3 className="font-bold text-gray-900 text-lg uppercase tracking-wide">
                        {currentPackage.name || tiers.find(t => t.id === selectedTier)?.label}
                    </h3>
                    <span className="text-2xl font-extrabold text-brand-primary">
                        {formatCurrency(currentPackage.price || 0)}
                    </span>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600 leading-relaxed min-h-[60px]">
                    {currentPackage.description}
                </p>

                {/* Delivery & Revisions */}
                <div className="flex items-center justify-between text-sm font-medium text-gray-700 pt-2">
                    <div className="flex items-center">
                        <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="flex flex-col leading-none">
                            <span className="text-[10px] text-gray-400 uppercase">Entrega</span>
                            <span>{currentPackage.delivery_time} dias</span>
                        </span>
                    </div>
                    <div className="flex items-center">
                        <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span className="flex flex-col leading-none">
                            <span className="text-[10px] text-gray-400 uppercase">Revisões</span>
                            <span>{currentPackage.revisions === -1 ? 'Ilimitadas' : currentPackage.revisions}</span>
                        </span>
                    </div>
                </div>

                {/* Features List */}
                {currentPackage.features && currentPackage.features.length > 0 && (
                    <ul className="space-y-3 pt-4 border-t border-gray-100">
                        {currentPackage.features.map((feature: string, idx: number) => (
                            <li key={idx} className="flex items-start text-sm text-gray-600">
                                <CheckIcon className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                                <span>{feature}</span>
                            </li>
                        ))}
                    </ul>
                )}

                {/* CTA Button */}
                <Button
                    variant="primary"
                    className="w-full py-4 text-lg font-bold shadow-lg shadow-brand-primary/25 hover:shadow-brand-primary/40 transform hover:-translate-y-0.5 transition-all"
                    onClick={() => onCheckout(selectedTier)}
                >
                    Continuar ({formatCurrency(currentPackage.price || 0)})
                </Button>

                <div className="text-center">
                    <button className="text-xs text-gray-400 hover:text-brand-primary underline">
                        Comparar pacotes
                    </button>
                </div>
            </div>
        </div>
    );
};

// 2. FAQ Accordion
const FAQSection = ({ faq }: { faq?: { question: string, answer: string }[] }) => {
    if (!faq || faq.length === 0) return null;

    return (
        <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900">Perguntas Frequentes</h3>
            <div className="space-y-2">
                {faq.map((item, index) => (
                    <Disclosure key={index} as="div" className="border border-gray-200 rounded-lg overflow-hidden">
                        {({ open }) => (
                            <>
                                <Disclosure.Button className="flex justify-between w-full px-4 py-4 text-sm font-medium text-left text-gray-900 bg-white hover:bg-gray-50 focus:outline-none focus-visible:ring focus-visible:ring-brand-primary focus-visible:ring-opacity-75">
                                    <span>{item.question}</span>
                                    <ChevronUpIcon
                                        className={`${open ? 'transform rotate-180' : ''} w-5 h-5 text-gray-500 transition-transform`}
                                    />
                                </Disclosure.Button>
                                <Disclosure.Panel className="px-4 pb-4 pt-0 text-gray-600 bg-white leading-relaxed">
                                    {item.answer}
                                </Disclosure.Panel>
                            </>
                        )}
                    </Disclosure>
                ))}
            </div>
        </div>
    );
}

// --- Main Page Component ---

const ServiceDetailsPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    // States
    const [service, setService] = useState<Service | null>(null);
    const [company, setCompany] = useState<DbCompany | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    // Fetch Data
    useEffect(() => {
        if (!id) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch service with company details
                // Note: The prompt asked for 'profiles:owner_id', but we follow the existing schema 
                // where Service -> Company. We can fetch Company Owner profile if needed, 
                // but Company info is usually sufficient for "Seller".

                const { data, error } = await supabase
                    .from('services')
                    .select(`
                        *,
                        company:companies (
                            *
                        )
                    `)
                    .eq('id', id)
                    .single();

                if (error) throw error;
                if (!data) throw new Error('Serviço não encontrado');

                setService(data);
                setCompany(data.company); // Adjust based on actual join response structure
            } catch (err: any) {
                console.error("Error fetching service:", err);
                setError(err.message || 'Erro ao carregar serviço');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const handleCheckout = (tier: string) => {
        if (!user) {
            // Optional: redirect to login with return url
            navigate('/login/cliente', { state: { from: `/checkout/${id}?tier=${tier}` } });
            return;
        }
        navigate(`/checkout/${id}?tier=${tier}`);
    };

    const { user } = useAuth(); // Needed for permission check/redirect only

    // Loading State
    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 space-y-6">
                    <LoadingSkeleton className="h-8 w-3/4 rounded-lg" />
                    <LoadingSkeleton className="h-6 w-1/3 rounded-lg" />
                    <div className="aspect-video rounded-2xl overflow-hidden"><LoadingSkeleton className="w-full h-full" /></div>
                    <LoadingSkeleton className="h-40 w-full rounded-xl" />
                </div>
                <div className="lg:col-span-4 hidden lg:block">
                    <LoadingSkeleton className="h-96 w-full rounded-2xl" />
                </div>
            </div>
        );
    }

    // Error State
    if (error || !service) {
        return (
            <div className="min-h-screen flex items-center justify-center flex-col bg-gray-50">
                <div className="text-center space-y-4">
                    <div className="text-6xl">😕</div>
                    <h1 className="text-2xl font-bold text-gray-900">Ops! Serviço não encontrado.</h1>
                    <p className="text-gray-500 max-w-md">O serviço que você está procurando pode ter sido removido ou o link está incorreto.</p>
                    <Button variant="outline" onClick={() => navigate('/')}>Voltar para o Início</Button>
                </div>
            </div>
        );
    }

    const gallery = service.gallery || [];
    // Ensure we have at least one image to show
    const displayGallery = gallery.length > 0 ? gallery : ['https://placehold.co/800x450/f3f4f6/9ca3af?text=Sem+Imagem'];
    const activeImageUrl = displayGallery[activeImageIndex];

    // Determine "Seller" info to display (Company or Owner Profile)
    // Using Company as primary
    const sellerName = company?.company_name || "Vendedor";
    const sellerAvatar = company?.logo_url || company?.owner?.avatar_url;
    const sellerLevel = company?.level || 'Iniciante';
    const sellerRating = company?.rating || 5.0;
    const sellerReviews = company?.review_count || 0;

    return (
        <main className="min-h-screen bg-gray-50 pb-20">
            <SEO
                title={`${service.title} | TGT`}
                description={service.description?.substring(0, 160)}
                image={gallery[0]}
            />

            <div className="container mx-auto px-4 py-8">
                {/* Responsive Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

                    {/* LEFT COLUMN (Content) - 8 cols */}
                    <div className="lg:col-span-8 space-y-8">

                        {/* Header Section */}
                        <div className="space-y-4">
                            {/* Breadcrumb */}
                            <nav className="flex items-center text-sm text-gray-500 space-x-2">
                                <Link to="/" className="hover:text-brand-primary">Home</Link>
                                <span>/</span>
                                <span className="hover:text-brand-primary cursor-pointer">{company?.category || 'Serviços'}</span>
                                <span>/</span>
                                <span className="text-gray-900 font-medium truncate max-w-[200px]">{service.title}</span>
                            </nav>

                            {/* Title */}
                            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight">
                                {service.title}
                            </h1>

                            {/* Seller Mini Profile */}
                            <div className="flex items-center space-x-3 py-2 border-y border-transparent">
                                <Link to={`/empresa/${company?.slug || '#'}`} className="flex items-center space-x-3 group">
                                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden ring-2 ring-white shadow-sm">
                                        <OptimizedImage
                                            src={sellerAvatar}
                                            alt={sellerName}
                                            width={40} height={40}
                                            className="w-full h-full object-cover"
                                            fallbackSrc="https://placehold.co/40x40?text=U"
                                        />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-gray-900 group-hover:text-brand-primary transition-colors flex items-center gap-2">
                                            {sellerName}
                                            <SellerBadge level={sellerLevel as SellerLevel} />
                                        </span>
                                        <div className="flex items-center text-xs text-gray-500">
                                            <svg className="w-3 h-3 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                            <span className="font-semibold text-gray-700 mr-1">{sellerRating.toFixed(1)}</span>
                                            <span>({sellerReviews})</span>
                                            <span className="mx-2">•</span>
                                            <span className="text-green-600 font-medium">Online Agora</span>
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        </div>

                        {/* Gallery Section */}
                        <div className="space-y-3">
                            <div className="bg-gray-100 rounded-2xl overflow-hidden border border-gray-200 shadow-sm relative group">
                                <div className="aspect-video w-full cursor-zoom-in">
                                    <OptimizedImage
                                        src={activeImageUrl}
                                        alt={service.title}
                                        className="w-full h-full object-contain bg-gray-50"
                                        optimizedWidth={1280}
                                        quality={90}
                                    />
                                </div>

                                {/* Navigation Arrows (optional enhancement) */}
                            </div>

                            {/* Thumbnails */}
                            {displayGallery.length > 1 && (
                                <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide">
                                    {displayGallery.map((img, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setActiveImageIndex(idx)}
                                            className={`relative w-24 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all 
                                                ${activeImageIndex === idx
                                                    ? 'border-brand-primary ring-2 ring-brand-primary/20 opacity-100'
                                                    : 'border-transparent hover:border-gray-300 opacity-70 hover:opacity-100'
                                                }`}
                                        >
                                            <OptimizedImage src={img} alt={`Thumb ${idx}`} width={100} className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Description Section */}
                        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Sobre este serviço</h2>
                            <div className="prose prose-purple max-w-none text-gray-600 whitespace-pre-wrap leading-relaxed">
                                {service.description}
                            </div>
                        </div>

                        {/* About The Seller */}
                        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Sobre o Vendedor</h2>
                            <div className="flex flex-col md:flex-row gap-6">
                                <div className="flex-shrink-0 flex flex-col items-center text-center md:items-start md:text-left space-y-3">
                                    <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden ring-4 ring-gray-50">
                                        <OptimizedImage src={sellerAvatar} alt={sellerName} className="w-full h-full object-cover" />
                                    </div>
                                </div>
                                <div className="flex-1 space-y-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 justify-center md:justify-start">
                                            {sellerName}
                                            <SellerBadge level={sellerLevel as SellerLevel} />
                                        </h3>
                                        <p className="text-gray-500 text-sm mt-1">{company?.legal_name || company?.category}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 border-y border-gray-100 py-4">
                                        <div>
                                            <span className="block text-gray-400 text-xs uppercase mb-1">De</span>
                                            <span className="font-semibold">{company?.address?.city || 'Brasil'}, {company?.address?.state || 'BR'}</span>
                                        </div>
                                        <div>
                                            <span className="block text-gray-400 text-xs uppercase mb-1">Membro desde</span>
                                            <span className="font-semibold">{company?.owner?.memberSince || '2024'}</span>
                                        </div>
                                        <div>
                                            <span className="block text-gray-400 text-xs uppercase mb-1">Tempo de Resposta</span>
                                            <span className="font-semibold">{company?.owner?.responseTime || '1 hora'}</span>
                                        </div>
                                        <div>
                                            <span className="block text-gray-400 text-xs uppercase mb-1">Última entrega</span>
                                            <span className="font-semibold">2 dias atrás</span>
                                        </div>
                                    </div>

                                    <p className="text-gray-600 leading-relaxed">
                                        {company?.description?.substring(0, 300)}...
                                    </p>

                                    <Button variant="outline" onClick={() => navigate(`/empresa/${company?.slug}`)}>
                                        Ver Perfil Completo
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* FAQ Section */}
                        {service.faq && service.faq.length > 0 && (
                            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                                <FAQSection faq={service.faq} />
                            </div>
                        )}

                        {/* Reviews would go here */}

                    </div>

                    {/* RIGHT SIDEBAR (Sticky) - 4 cols */}
                    <div className="lg:col-span-4 relative">
                        <PricingCard
                            packages={service.packages}
                            onCheckout={handleCheckout}
                        />

                        {/* Safety Contact Box */}
                        <div className="mt-6 bg-gray-100 rounded-xl p-6 text-center">
                            <div className="flex justify-center mb-3">
                                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                            </div>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                Sua proteção é nossa prioridade. Todos os pagamentos são retidos em segurança até que você confirme a entrega do serviço.
                            </p>
                            <Button variant="ghost" size="sm" className="mt-2 text-gray-600">
                                Fale com a TGT
                            </Button>
                        </div>
                    </div>

                </div>
            </div>
        </main>
    );
};

export default ServiceDetailsPage;
