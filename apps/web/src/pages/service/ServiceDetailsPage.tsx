import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@tgt/shared';
import { Service, DbCompany } from '@tgt/shared';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import Button from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import OptimizedImage from '@/components/ui/OptimizedImage';
import SellerBadge, { SellerLevel } from '@/components/SellerBadge';
import SEO from '@/components/SEO';
import ServiceGallery from '@/components/service/ServiceGallery';
import ServiceAttributes from '@/components/service/ServiceAttributes';
import ServiceComparisonTable from '@/components/service/ServiceComparisonTable';
const ServiceBookingModal = lazy(() => import('@/components/ServiceBookingModal'));

import { Disclosure } from '@headlessui/react';
import { ChevronUpIcon, CheckIcon, StarIcon, MapPinIcon, ClockIcon, GlobeAmericasIcon, UserGroupIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/solid';

// Helper to format currency
const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

// --- Components ---

// 1. Pricing Card Component (Sidebar)
interface PricingCardProps {
    packages: any;
    onCheckout: (tier: string) => void;
    canCheckout?: boolean;
    checkoutDisabledReason?: string;
    requiresQuote?: boolean;
}

const PricingCard = ({ packages, onCheckout, canCheckout, checkoutDisabledReason, requiresQuote }: PricingCardProps) => {
    const [selectedTier, setSelectedTier] = useState<'basic' | 'standard' | 'premium'>('basic');

    if (!packages) return null;

    const currentPackage = packages[selectedTier];
    const tiers: { id: 'basic' | 'standard' | 'premium', label: string }[] = [];
    if (packages.basic) tiers.push({ id: 'basic', label: 'Básico' });
    if (packages.standard) tiers.push({ id: 'standard', label: 'Padrão' });
    if (packages.premium) tiers.push({ id: 'premium', label: 'Premium' });

    if (tiers.length === 0) return null;

    useEffect(() => {
        if (!packages[selectedTier] && tiers.length > 0) {
            setSelectedTier(tiers[0].id);
        }
    }, [packages, selectedTier]);

    if (!currentPackage) return null;

    return (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-xl sticky top-24 overflow-hidden transition-all duration-300">
            {/* Tabs */}
            <div className="flex border-b border-gray-100 bg-gray-50">
                {tiers.map(tier => (
                    <button
                        key={tier.id}
                        onClick={() => setSelectedTier(tier.id)}
                        className={`flex-1 py-3 text-sm font-semibold transition-all relative
                            ${selectedTier === tier.id
                                ? 'text-gray-900 bg-white shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        {tier.label}
                    </button>
                ))}
            </div>

            <div className="p-6 space-y-6">
                <div className="flex items-baseline justify-between mb-1">
                    <h3 className="font-bold text-gray-900 text-lg uppercase tracking-wide truncate pr-2">
                        {currentPackage.name}
                    </h3>
                    <span className="text-2xl font-extrabold text-gray-900">
                        {requiresQuote ? 'Sob Consulta' : formatCurrency(currentPackage.price || 0)}
                    </span>
                </div>

                <p className="text-sm text-gray-600 leading-relaxed min-h-[40px]">
                    {currentPackage.description}
                </p>

                <div className="flex items-center justify-between text-sm font-medium text-gray-700 bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                        <ClockIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-xs font-bold uppercase text-gray-500">Entrega</span>
                        <span>{currentPackage.delivery_time} dias</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase text-gray-500">Revisões</span>
                        <span>{currentPackage.revisions === -1 ? '∞' : currentPackage.revisions}</span>
                    </div>
                </div>

                {currentPackage.features && (
                    <ul className="space-y-2 pt-2">
                        {currentPackage.features.map((feature: string, idx: number) => (
                            <li key={idx} className="flex items-start text-sm text-gray-600">
                                <CheckIcon className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                <span>{feature}</span>
                            </li>
                        ))}
                    </ul>
                )}

                {canCheckout === false && checkoutDisabledReason && (
                    <div className="bg-orange-50 text-orange-800 text-xs p-3 rounded-lg font-medium text-center border border-orange-200 mb-3">
                        {checkoutDisabledReason}
                    </div>
                )}

                <Button
                    variant="primary"
                    className="w-full py-3.5 text-base font-bold shadow-lg shadow-brand-primary/20 hover:shadow-brand-primary/30"
                    onClick={() => onCheckout(selectedTier)}
                    disabled={canCheckout === false}
                >
                    {requiresQuote ? 'Solicitar Orçamento' : `Continuar (${formatCurrency(currentPackage.price || 0)})`}
                </Button>

                <div className="text-center">
                    <button onClick={() => document.getElementById('compare-packages')?.scrollIntoView({ behavior: 'smooth' })} className="text-xs text-gray-500 hover:text-brand-primary underline transition-colors">Comparar pacotes</button>
                </div>
            </div>
        </div>
    );
};

const ServiceDetailsPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [service, setService] = useState<Service | null>(null);
    const [company, setCompany] = useState<DbCompany | null>(null);
    const [relatedServices, setRelatedServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

    useEffect(() => {
        if (!id) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('services')
                    .select(`*, company:companies (*) `)
                    .eq('id', id)
                    .is('deleted_at', null)
                    .single();

                if (error) throw error;
                if (!data) throw new Error('Serviço não encontrado');

                setService(data as any);
                setCompany(data.company as any);

                // Fetch related services
                if (data.category_tag) {
                    const { data: related } = await supabase
                        .from('services')
                        .select(`*, company:companies(slug, company_name, logo_url)`)
                        .eq('category_tag', data.category_tag)
                        .is('deleted_at', null)
                        .neq('id', data.id)
                        .limit(4);
                    setRelatedServices((related as any) || []);
                }

            } catch (err: any) {
                console.error("Error fetching service:", err);
                setError(err.message || 'Erro ao carregar serviço');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        window.scrollTo(0, 0);
    }, [id]);

    const handleCheckout = (tier: string) => {
        if (service?.requires_quote) {
            setIsBookingModalOpen(true);
            return;
        }

        if (!user) {
            const redirectPath = service?.use_company_availability
                ? `/agendar/${id}?tier=${tier}`
                : `/checkout/${id}?tier=${tier}`;
            navigate('/login/cliente', { state: { from: redirectPath } });
            return;
        }

        if (service?.use_company_availability) {
            navigate(`/agendar/${id}?tier=${tier}`);
        } else {
            navigate(`/checkout/${id}?tier=${tier}`);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-white pb-20 pt-28">
            <div className="container mx-auto px-4 max-w-7xl animate-pulse">
                <div className="mb-8 space-y-4">
                    <div className="h-4 w-32 bg-gray-200 rounded" />
                    <div className="h-10 w-3/4 bg-gray-200 rounded" />
                    <div className="flex gap-4">
                        <div className="h-8 w-32 bg-gray-200 rounded" />
                        <div className="h-8 w-32 bg-gray-200 rounded" />
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-8 space-y-8">
                        <div className="aspect-video w-full bg-gray-200 rounded-2xl" />
                        <div className="h-40 w-full bg-gray-100 rounded-xl" />
                        <div className="h-60 w-full bg-gray-100 rounded-xl" />
                    </div>
                    <div className="lg:col-span-4">
                        <div className="h-[450px] w-full bg-gray-100 rounded-2xl" />
                    </div>
                </div>
            </div>
        </div>
    );
    if (error || !service) return <div className="min-h-screen pt-20 text-center">Erro ao carregar serviço</div>;

    const sellerName = company?.company_name || "Vendedor";
    const sellerAvatar = company?.logo_url || "https://placehold.co/100?text=Logo";
    const sellerLevel = company?.level || 'Iniciante';
    const sellerRating = company?.rating || 5.0;
    const sellerReviews = company?.review_count || 0;
    const isVerified = company?.verified;

    return (
        <main className="min-h-screen bg-white pb-20">
            <SEO title={`${service.title} | CONTRATTO`} description={service.description} image={service.gallery?.[0]} />

            <div className="container mx-auto px-4 py-8 max-w-7xl">

                {/* 1. Header Section */}
                <div className="mb-8">
                    <nav className="flex items-center text-sm text-gray-500 space-x-2 mb-4">
                        <Link to="/" className="hover:text-brand-primary">Home</Link>
                        <span>/</span>
                        <Link to={`/servicos?category=${service.category_tag}`} className="hover:text-brand-primary">{service.category_tag || 'Serviços'}</Link>
                    </nav>
                    <h1 className="font-display text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 leading-tight">{service.title}</h1>

                    <div className="flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
                                <OptimizedImage src={sellerAvatar} alt={sellerName} className="w-full h-full object-cover" />
                            </div>
                            <Link to={`/empresa/${company?.slug}`} className="font-bold text-gray-900 hover:underline">{sellerName}</Link>
                            <SellerBadge level={sellerLevel as SellerLevel} />
                        </div>
                        <div className="h-4 w-px bg-gray-300 hidden sm:block"></div>
                        <div className="flex items-center gap-1 text-gray-700">
                            <StarIcon className="w-5 h-5 text-yellow-500" />
                            <span className="font-bold">{sellerRating.toFixed(1)}</span>
                            <span className="text-gray-500">({sellerReviews} avaliações)</span>
                        </div>
                        {isVerified && (
                            <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-semibold flex items-center gap-1">
                                <CheckIcon className="w-3 h-3" /> Verificado
                            </span>
                        )}
                        {company?.clients_count ? (
                            <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded text-xs font-semibold">
                                {company.recurring_clients_percent}% Clientes Recorrentes
                            </span>
                        ) : null}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                    {/* LEFT COLUMN (Content) */}
                    <div className="lg:col-span-8 space-y-10">
                        {/* 2. Gallery */}
                        <ServiceGallery images={service.gallery || []} title={service.title} />

                        {/* 3. Highlighted Reviews (Mocked for now) */}
                        <div className="border-b border-gray-100 pb-8">
                            <h3 className="font-display font-bold text-xl text-gray-900 mb-4">O que as pessoas estão dizendo</h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-8 h-8 rounded-full bg-gray-300"></div>
                                        <div>
                                            <p className="font-bold text-sm">João Silva</p>
                                            <div className="flex text-yellow-400 w-16"><StarIcon className="w-3 h-3" /><StarIcon className="w-3 h-3" /><StarIcon className="w-3 h-3" /><StarIcon className="w-3 h-3" /><StarIcon className="w-3 h-3" /></div>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-600 italic">"Excelente serviço! Entregou antes do prazo e com muita qualidade."</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-8 h-8 rounded-full bg-gray-300"></div>
                                        <div>
                                            <p className="font-bold text-sm">Maria Oliveira</p>
                                            <div className="flex text-yellow-400 w-16"><StarIcon className="w-3 h-3" /><StarIcon className="w-3 h-3" /><StarIcon className="w-3 h-3" /><StarIcon className="w-3 h-3" /><StarIcon className="w-3 h-3" /></div>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-600 italic">"Profissional muito atencioso, recomendo a todos."</p>
                                </div>
                            </div>
                        </div>

                        {/* 4. About Service */}
                        <div className="space-y-6">
                            <h2 className="font-display text-2xl font-bold text-gray-900">Sobre este serviço</h2>
                            <div className="prose prose-purple max-w-none text-gray-600 whitespace-pre-wrap">
                                {service.description}
                            </div>

                            {/* Service Details/Methodology if available */}
                            {service.details && (
                                <div className="grid gap-6 mt-6">
                                    {Object.entries(service.details).map(([key, value]) => (
                                        <div key={key}>
                                            <h4 className="font-bold text-gray-900 capitalize mb-1">{key.replace(/_/g, ' ')}</h4>
                                            <p className="text-gray-600 text-sm">{value}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* 6. Characteristics (Attributes) */}
                        <div className="border-t border-b border-gray-100 py-8">
                            <h3 className="font-bold text-lg text-gray-900 mb-4">Ficha Técnica</h3>
                            <ServiceAttributes attributes={service.attributes} />
                        </div>

                        {/* 5 & 8. Plans & Comparison */}
                        <div id="compare-packages" className="space-y-6">
                            <h2 className="font-display text-2xl font-bold text-gray-900">Compare os Pacotes</h2>
                            <p className="text-gray-600">Escolha o plano ideal para a sua necessidade.</p>

                            {service.packages && (
                                <ServiceComparisonTable
                                    packages={service.packages}
                                    onSelect={(tier) => handleCheckout(tier)}
                                    requiresQuote={service.requires_quote}
                                />
                            )}
                        </div>

                        {/* 7. About The Company (Advanced) */}
                        <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200">
                            <h2 className="font-display text-xl font-bold text-gray-900 mb-6">Sobre a Empresa</h2>
                            <div className="flex flex-col md:flex-row gap-8">
                                <div className="flex-shrink-0 text-center md:text-left">
                                    <div className="w-24 h-24 rounded-full bg-white mx-auto md:mx-0 overflow-hidden border border-gray-200 shadow-sm mb-3">
                                        <OptimizedImage src={sellerAvatar} alt={sellerName} className="w-full h-full object-cover" />
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => navigate(`/empresa/${company?.slug}`)} className="w-full">
                                        Ver Perfil
                                    </Button>
                                </div>
                                <div className="flex-1 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-bold text-gray-900">{sellerName}</h3>
                                        <div className="flex text-yellow-500 gap-1 font-bold items-center"><StarIcon className="w-5 h-5" /> {sellerRating}</div>
                                    </div>
                                    <p className="text-gray-600 text-sm leading-relaxed">{company?.description?.substring(0, 300)}...</p>

                                    <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm pt-4 border-t border-gray-200">
                                        <div>
                                            <span className="block text-gray-500">Localização</span>
                                            <span className="font-semibold text-gray-900 flex items-center gap-1"><MapPinIcon className="w-4 h-4" /> {company?.address?.city}, {company?.address?.state}</span>
                                        </div>
                                        <div>
                                            <span className="block text-gray-500">Membro desde</span>
                                            <span className="font-semibold text-gray-900">2024</span>
                                        </div>
                                        <div>
                                            <span className="block text-gray-500">Tempo de Resposta</span>
                                            <span className="font-semibold text-gray-900 flex items-center gap-1"><ClockIcon className="w-4 h-4" /> ~1 hora</span>
                                        </div>
                                        <div>
                                            <span className="block text-gray-500">Clientes Atendidos</span>
                                            <span className="font-semibold text-gray-900 flex items-center gap-1"><UserGroupIcon className="w-4 h-4" /> {company?.clients_count || '150+'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 11. FAQ */}
                        {service.faq && service.faq.length > 0 && (
                            <div className="space-y-6">
                                <h2 className="font-display text-xl font-bold text-gray-900">Perguntas Frequentes</h2>
                                <div className="space-y-4">
                                    {service.faq.map((item, index) => (
                                        <Disclosure key={index} as="div" className="border-b border-gray-200 pb-4">
                                            {({ open }) => (
                                                <>
                                                    <Disclosure.Button className="flex justify-between w-full text-left text-gray-900 font-medium hover:text-brand-primary focus:outline-none">
                                                        <span>{item.question}</span>
                                                        <ChevronUpIcon className={`${open ? 'transform rotate-180' : ''} w-5 h-5 text-gray-500 transition-transform`} />
                                                    </Disclosure.Button>
                                                    <Disclosure.Panel className="mt-2 text-gray-600 leading-relaxed text-sm">
                                                        {item.answer}
                                                    </Disclosure.Panel>
                                                </>
                                            )}
                                        </Disclosure>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 9. Related Services */}
                        {relatedServices.length > 0 && (
                            <div className="pt-10 border-t border-gray-100">
                                <h2 className="font-display text-xl font-bold text-gray-900 mb-6">Serviços Semelhantes</h2>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                    {relatedServices.map(rel => (
                                        <Link key={rel.id} to={`/servico/${rel.id}`} className="group block">
                                            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden mb-3">
                                                <OptimizedImage src={rel.image_url || rel.gallery?.[0]} alt={rel.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                            </div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden"><OptimizedImage src={rel.company?.logo_url || "https://placehold.co/50"} alt="" className="w-full h-full object-cover" /></div>
                                                <span className="text-xs text-gray-500 truncate">{rel.company?.company_name}</span>
                                            </div>
                                            <h4 className="font-semibold text-gray-900 group-hover:text-brand-primary line-clamp-2 text-sm leading-snug mb-2">{rel.title}</h4>
                                            <span className="font-bold text-gray-900 text-sm">A partir de {formatCurrency(rel.starting_price || rel.price || 0)}</span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>

                    {/* RIGHT SIDEBAR (Sticky) */}
                    <div className="lg:col-span-4 relative">
                        <PricingCard
                            packages={service.packages}
                            onCheckout={handleCheckout}
                            requiresQuote={service.requires_quote}
                            canCheckout={company?.is_active !== false && (service.requires_quote || company?.stripe_charges_enabled !== false)}
                            checkoutDisabledReason={
                                company?.is_active === false
                                    ? "Esta empresa está temporariamente suspensa."
                                    : (!service.requires_quote && company?.stripe_charges_enabled === false)
                                        ? "Esta empresa está finalizando a configuração de pagamentos e não pode receber agendamentos no momento."
                                        : undefined
                            }
                        />

                        <div className="mt-8 bg-gray-50 rounded-xl p-6 border border-gray-100 text-center">
                            <h4 className="font-bold text-gray-900 mb-2">Precisa de algo personalizado?</h4>
                            <p className="text-sm text-gray-600 mb-4">Entre em contato com a empresa para um orçamento sob medida.</p>
                            <Button variant="outline" className="w-full" onClick={() => navigate(`/empresa/${company?.slug}`)}>
                                Falar com a Empresa
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <Suspense fallback={null}>
                {isBookingModalOpen && (
                    <ServiceBookingModal
                        isOpen={isBookingModalOpen}
                        onClose={() => setIsBookingModalOpen(false)}
                        service={service}
                        companyName={company?.company_name || ""}
                        canCheckout={company?.is_active !== false && (service.requires_quote || company?.stripe_charges_enabled !== false)}
                        checkoutDisabledReason={
                            company?.is_active === false
                                ? "Esta empresa está temporariamente suspensa."
                                : (!service.requires_quote && company?.stripe_charges_enabled === false)
                                    ? "Esta empresa está finalizando a configuração de pagamentos e não pode receber agendamentos no momento."
                                    : undefined
                        }
                    />
                )}
            </Suspense>
        </main>
    );
};

export default ServiceDetailsPage;
