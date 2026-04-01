import React, { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, MapPin, Wifi, Layers, Star, ArrowRight, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { useServicesMarketplace, ServiceFilter } from '@/hooks/useServicesMarketplace';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { DbService } from '@tgt/core';
import SEO from '@/components/SEO';

// ─── Category translation and normalization ──────────────────────────────────
const CATEGORY_LABELS: Record<string, string> = {
    'Marketing': 'Marketing',
    'Tecnologia': 'Tecnologia',
    'technology': 'Tecnologia',
    'Design': 'Design',
    'Consultoria': 'Consultoria',
    'Contabilidade': 'Contabilidade',
    'Advocacia': 'Advocacia',
    'Arquitetura': 'Arquitetura',
    'Fotografia': 'Fotografia',
    'Educação': 'Educação',
    'Saúde': 'Saúde',
    'saude': 'Saúde',
    'healthcare': 'Saúde',
    'SEO': 'SEO',
    'events': 'Eventos',
    'domestic': 'Serviços Domésticos',
};

const CATEGORIES = [
    { label: 'Todos', value: '' },
    { label: 'Marketing', value: 'Marketing' },
    { label: 'Tecnologia', value: 'Tecnologia' },
    { label: 'Design', value: 'Design' },
    { label: 'Saúde', value: 'Saúde' },
    { label: 'Consultoria', value: 'Consultoria' },
    { label: 'Eventos', value: 'Eventos' },
    { label: 'Serviços Domésticos', value: 'Serviços Domésticos' },
    { label: 'Contabilidade', value: 'Contabilidade' },
    { label: 'Advocacia', value: 'Advocacia' },
    { label: 'Arquitetura', value: 'Arquitetura' },
    { label: 'Fotografia', value: 'Fotografia' },
    { label: 'Educação', value: 'Educação' },
    { label: 'SEO', value: 'SEO' },
];

const SERVICE_TYPE_FILTERS: { label: string; value: ServiceFilter; icon: React.ReactNode }[] = [
    { label: 'Todos', value: 'all', icon: <Layers size={14} /> },
    { label: 'Remoto', value: 'remote', icon: <Wifi size={14} /> },
    { label: 'Presencial', value: 'presential', icon: <MapPin size={14} /> },
];

// ─── Service Card ─────────────────────────────────────────────────────────────
const ServiceCard: React.FC<{ service: DbService }> = ({ service }) => {
    const price = service.starting_price ?? service.price;
    const lType = service.location_type || 'remote';
    const isPresential = lType === 'in_store' || lType === 'at_home' || lType === 'hybrid';

    return (
        <Link 
            to={`/empresa/${service.company_slug}`} 
            className="group block bg-white dark:bg-slate-900 rounded-2xl border border-gray-100/80 dark:border-white/5 shadow-sm hover:shadow-xl hover:shadow-blue-900/5 dark:hover:shadow-indigo-500/10 hover:-translate-y-1.5 transition-all duration-500 overflow-hidden h-full flex flex-col"
        >
            <div className="relative aspect-[4/3] overflow-hidden">
                <OptimizedImage
                    src={service.image_url || service.company_cover_url}
                    alt={service.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    optimizedWidth={400}
                />
                
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                    <span className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm shadow-sm rounded-lg text-[10px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider border border-white/20 dark:border-white/5 w-fit">
                        {isPresential ? <MapPin size={10} className="text-blue-600 dark:text-blue-400" /> : <Wifi size={10} className="text-blue-600 dark:text-blue-400" />}
                        {lType === 'in_store' ? 'Presencial' : lType === 'at_home' ? 'No Cliente' : '100% Remoto'}
                    </span>
                    
                    <span className="px-2.5 py-1 bg-slate-900/80 dark:bg-indigo-500/20 backdrop-blur-sm shadow-sm rounded-lg text-[10px] font-bold text-white dark:text-indigo-300 uppercase tracking-wider border border-white/10 dark:border-indigo-500/20 w-fit">
                        {service.category_tag}
                    </span>

                    {(service.is_sponsored || service.company_is_sponsored) && (
                        <span className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-sm rounded-lg text-[10px] font-black uppercase tracking-wider w-fit">
                             <Sparkles size={10} fill="currentColor" /> Patrocinado
                        </span>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="p-5 flex-grow flex flex-col">
                {/* Company info */}
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 ring-2 ring-gray-100 dark:ring-white/5">
                        <OptimizedImage
                            src={service.company_logo}
                            alt={service.company_name}
                            className="w-full h-full object-cover"
                            optimizedWidth={64}
                        />
                    </div>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate max-w-[120px]">{service.company_name}</span>
                    {service.company_rating && service.company_rating > 0 && (
                        <div className="ml-auto flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 dark:bg-amber-500/10 rounded-md border border-amber-100 dark:border-amber-500/20 text-[10px] text-amber-700 dark:text-amber-400 font-bold">
                            <Star size={10} fill="currentColor" />
                            {service.company_rating.toFixed(1)}
                        </div>
                    )}
                </div>

                {/* Title */}
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-snug line-clamp-2 h-10 mb-4 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {service.title}
                </h3>

                <div className="mt-auto pt-4 border-t border-gray-50 flex items-end justify-between">
                    <div>
                        {price ? (
                            <>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-tighter">Investimento</span>
                                {service.promotional_price ? (
                                    <div className="flex flex-col">
                                        <span className="text-xs text-slate-400 line-through">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price)}
                                        </span>
                                        <p className="text-lg font-black text-blue-600 dark:text-blue-400 leading-none">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(service.promotional_price)}
                                        </p>
                                    </div>
                                ) : (
                                    <p className="text-lg font-black text-slate-900 dark:text-white leading-none">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price)}
                                    </p>
                                )}
                            </>
                        ) : (
                            <p className="text-xs font-bold text-slate-500 uppercase italic">Sob Consulta</p>
                        )}
                    </div>
                    
                    <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                        <ArrowRight size={16} />
                    </div>
                </div>
            </div>
        </Link>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ServicesMarketplacePage({ hideHeader = false }: { hideHeader?: boolean }) {
    const [searchParams, setSearchParams] = useSearchParams();
    const initialCategory = searchParams.get('category') || '';
    
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState(initialCategory);
    const [activeFilter, setActiveFilter] = useState<ServiceFilter>('all');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const cat = searchParams.get('category');
        if (cat && cat !== activeCategory) {
            setActiveCategory(cat);
        }
    }, [searchParams]);

    const handleCategoryClick = (cat: string) => {
        setActiveCategory(cat);
        if (cat) {
            setSearchParams({ category: cat });
        } else {
            setSearchParams({});
        }
    };

    const seoTitle = searchQuery 
        ? `${searchQuery} | Marketplace Contratto` 
        : activeCategory 
            ? `${activeCategory} | Marketplace Contratto` 
            : 'Encontre os melhores serviços | Marketplace Contratto';

    // Debounce search input
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setSearchQuery(val);
        clearTimeout((handleSearchChange as any)._timer);
        (handleSearchChange as any)._timer = setTimeout(() => setDebouncedSearch(val), 400);
    };

    const { services, loading, error, hasLocation, locationLoading, isAIPowered } = useServicesMarketplace({
        category: activeCategory || undefined,
        searchQuery: debouncedSearch || undefined,
        serviceFilter: activeFilter,
        limit: 24,
    });

    // Group services by category for display
    const grouped = useMemo(() => {
        if (activeCategory || debouncedSearch) return null; // flat list when filtering
        const map = new Map<string, DbService[]>();
        services.forEach((s) => {
            const rawCat = s.category_tag || 'Outros';
            const cat = CATEGORY_LABELS[rawCat] || CATEGORY_LABELS[rawCat.toLowerCase()] || rawCat;
            if (!map.has(cat)) map.set(cat, []);
            map.get(cat)!.push(s);
        });
        return map;
    }, [services, activeCategory, debouncedSearch]);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-500">
            <SEO 
                title={seoTitle}
                description="Encontre e contrate os melhores serviços profissionais certificados. Especialistas em marketing, tecnologia, design e muito mais."
                url="/marketplace"
            />
            {/* ── Search Header ── */}
            {!hideHeader && (
                <div className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-white/5 sticky top-0 z-20 shadow-sm transition-colors duration-500">
                    <div className="max-w-6xl mx-auto px-4 py-4">
                        {/* Search bar */}
                        <div className="relative mb-4">
                            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="O que você busca? Ex: Design de Logo, Marketing, Limpeza..."
                                value={searchQuery}
                                onChange={handleSearchChange}
                                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-200 dark:border-white/5 bg-gray-50/50 dark:bg-slate-950/50 focus:bg-white dark:focus:bg-slate-950 focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 dark:focus:ring-blue-900/20 outline-none text-base transition-all duration-300 placeholder:text-slate-400 dark:placeholder:text-slate-600 dark:text-white shadow-inner"
                            />
                        </div>

                        {/* Service type filter pills */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                            {SERVICE_TYPE_FILTERS.map((f) => (
                                <button
                                    key={f.value}
                                    onClick={() => setActiveFilter(f.value)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${activeFilter === f.value
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'bg-gray-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700'
                                        }`}
                                >
                                    {f.icon}
                                    {f.label}
                                </button>
                            ))}

                            <div className="w-px h-4 bg-gray-200 dark:bg-slate-800 mx-1" />

                            {/* Category pills */}
                            {CATEGORIES.map((cat) => (
                                <button
                                    key={cat.value}
                                    onClick={() => handleCategoryClick(cat.value)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${activeCategory === cat.value
                                        ? 'bg-slate-800 dark:bg-indigo-600 text-white'
                                        : 'bg-gray-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700'
                                        }`}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Location Notice ── */}

            {!locationLoading && !hasLocation && activeFilter !== 'remote' && (
                <div className="max-w-6xl mx-auto px-4 pt-4">
                    <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/20 rounded-xl px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
                        <MapPin size={16} className="shrink-0" />
                        <span>
                            Ative a localização para ver serviços presenciais próximos a você.{' '}
                            <button
                                onClick={() => window.location.reload()}
                                className="underline font-medium hover:text-amber-800 dark:hover:text-amber-300"
                            >
                                Tentar novamente
                            </button>
                        </span>
                    </div>
                </div>
            )}

            {/* ── Content ── */}
            <div className="max-w-6xl mx-auto px-4 py-6">
                {(loading || error || services.length > 0) && (
                    <>
                        {/* Loading state */}
                        {loading && (
                            <div className="flex flex-col items-center justify-center py-24 gap-3">
                                <Loader2 size={32} className="animate-spin text-blue-500" />
                                <p className="text-slate-500 text-sm">Buscando serviços...</p>
                            </div>
                        )}

                        {/* Error state */}
                        {!loading && error && (
                            <div className="flex flex-col items-center justify-center py-24 gap-3">
                                <AlertCircle size={32} className="text-red-400" />
                                <p className="text-slate-600 dark:text-slate-300 font-medium">Erro ao carregar serviços</p>
                                <p className="text-slate-400 dark:text-slate-500 text-sm">{error}</p>
                            </div>
                        )}

                        {/* Grouped view (no active filter) */}
                        {!loading && !error && grouped && grouped.size > 0 && (
                            <div className="space-y-10">
                                {Array.from(grouped.entries()).map(([category, items]) => (
                                    <section key={category}>
                                        <div className="flex items-center justify-between mb-4">
                                            <h2 className="font-display text-lg font-bold text-slate-800 dark:text-white">{category}</h2>
                                            <button
                                                onClick={() => handleCategoryClick(category)}
                                                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                                            >
                                                Ver todos <ArrowRight size={14} />
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                            {items.slice(0, 4).map((service) => (
                                                <ServiceCard key={service.id} service={service} />
                                            ))}
                                        </div>
                                    </section>
                                ))}
                            </div>
                        )}

                        {/* Flat list (with active filter/search) */}
                        {!loading && !error && !grouped && services.length > 0 && (
                            <>
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        {services.length} serviço{services.length !== 1 ? 's' : ''} encontrado{services.length !== 1 ? 's' : ''}
                                    </p>
                                    
                                    {isAIPowered && (
                                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm animate-in fade-in slide-in-from-right-4 duration-500">
                                            <Sparkles size={10} className="text-blue-100" />
                                            Busca Inteligente Ativa
                                        </div>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {services.map((service) => (
                                        <ServiceCard key={service.id} service={service} />
                                    ))}
                                </div>
                            </>
                        )}
                    </>
                )}

                {/* ── Empty State Profissional ── */}
                {!loading && !error && services.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-24 text-center px-4 max-w-2xl mx-auto">
                        <div className="w-20 h-20 bg-blue-50 dark:bg-blue-500/10 rounded-full flex items-center justify-center mb-6">
                            <Search className="text-blue-500 w-10 h-10" />
                        </div>
                        <h3 className="font-display text-2xl font-bold text-slate-800 dark:text-white mb-3">
                            Não encontramos prestadores para "{searchQuery || activeCategory || 'esta busca'}"
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md">
                            Nossa rede está crescendo rápido! Deixe seu contato e o serviço que precisa, e nós buscaremos um profissional qualificado para você em até 24h.
                        </p>

                        <div className="w-full max-w-md bg-white dark:bg-slate-900 p-2 border border-gray-200 dark:border-white/5 rounded-2xl shadow-sm flex flex-col sm:flex-row gap-2">
                             <input
                                 type="email"
                                 placeholder="Seu melhor e-mail"
                                 className="flex-1 px-4 py-3 bg-transparent outline-none text-sm dark:text-white"
                             />
                            <button
                                className="bg-brand-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-brand-primary-hover transition-colors whitespace-nowrap"
                                onClick={() => alert("Interesse registrado! Entraremos em contato em breve.")}
                            >
                                Me avise
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
