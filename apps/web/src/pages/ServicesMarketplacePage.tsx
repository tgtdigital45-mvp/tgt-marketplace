import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Wifi, Layers, Star, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { useServicesMarketplace, ServiceFilter } from '@/hooks/useServicesMarketplace';
import { DbService } from '@tgt/shared';

// ─── Category definitions (must match DB category_tag values) ────────────────
const CATEGORIES = [
    { label: 'Todos', value: '' },
    { label: 'Marketing', value: 'Marketing' },
    { label: 'Tecnologia', value: 'Tecnologia' },
    { label: 'Design', value: 'Design' },
    { label: 'Consultoria', value: 'Consultoria' },
    { label: 'Contabilidade', value: 'Contabilidade' },
    { label: 'Advocacia', value: 'Advocacia' },
    { label: 'Arquitetura', value: 'Arquitetura' },
    { label: 'Fotografia', value: 'Fotografia' },
    { label: 'Educação', value: 'Educação' },
    { label: 'Saúde', value: 'Saúde' },
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
    const isPresential = service.service_type === 'presential';

    return (
        <Link
            to={`/servico/${service.id}`}
            className="group block bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
        >
            {/* Thumbnail */}
            <div className="relative h-44 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
                {service.image_url ? (
                    <img
                        src={service.image_url}
                        alt={service.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <span className="text-4xl font-bold text-slate-300">
                            {service.title.charAt(0)}
                        </span>
                    </div>
                )}
                {/* Service type badge */}
                <span
                    className={`absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${isPresential
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-blue-100 text-blue-700'
                        }`}
                >
                    {isPresential ? <MapPin size={10} /> : <Wifi size={10} />}
                    {isPresential ? 'Presencial' : 'Remoto'}
                </span>
                {/* Category tag */}
                {service.category_tag && (
                    <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-slate-600 text-xs font-medium px-2 py-1 rounded-full">
                        {service.category_tag}
                    </span>
                )}
            </div>

            {/* Content */}
            <div className="p-4">
                {/* Company info */}
                <div className="flex items-center gap-2 mb-2">
                    {service.company_logo ? (
                        <img
                            src={service.company_logo}
                            alt={service.company_name}
                            className="w-6 h-6 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center">
                            <span className="text-xs font-bold text-slate-500">
                                {service.company_name?.charAt(0) ?? '?'}
                            </span>
                        </div>
                    )}
                    <span className="text-xs text-slate-500 truncate">{service.company_name}</span>
                    {service.company_rating && service.company_rating > 0 && (
                        <span className="ml-auto flex items-center gap-0.5 text-xs text-amber-500 font-semibold">
                            <Star size={10} fill="currentColor" />
                            {service.company_rating.toFixed(1)}
                        </span>
                    )}
                </div>

                {/* Title */}
                <h3 className="font-semibold text-slate-800 text-sm leading-snug line-clamp-2 mb-3 group-hover:text-blue-600 transition-colors">
                    {service.title}
                </h3>

                {/* Price */}
                <div className="flex items-center justify-between">
                    <div>
                        {price ? (
                            <>
                                <span className="text-xs text-slate-400">A partir de</span>
                                <p className="text-base font-bold text-slate-900">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price)}
                                </p>
                            </>
                        ) : (
                            <p className="text-sm text-slate-400 italic">Consultar preço</p>
                        )}
                    </div>
                    <ArrowRight
                        size={16}
                        className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all"
                    />
                </div>
            </div>
        </Link>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ServicesMarketplacePage({ hideHeader = false }: { hideHeader?: boolean }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('');
    const [activeFilter, setActiveFilter] = useState<ServiceFilter>('all');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Debounce search input
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setSearchQuery(val);
        clearTimeout((handleSearchChange as any)._timer);
        (handleSearchChange as any)._timer = setTimeout(() => setDebouncedSearch(val), 400);
    };

    const { services, loading, error, hasLocation, locationLoading } = useServicesMarketplace({
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
            const cat = s.category_tag || 'Outros';
            if (!map.has(cat)) map.set(cat, []);
            map.get(cat)!.push(s);
        });
        return map;
    }, [services, activeCategory, debouncedSearch]);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* ── Search Header ── */}
            {!hideHeader && (
                <div className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
                    <div className="max-w-6xl mx-auto px-4 py-4">
                        {/* Search bar */}
                        <div className="relative mb-4">
                            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="O que você precisa? Ex: Logo Design, Gestão de Tráfego..."
                                value={searchQuery}
                                onChange={handleSearchChange}
                                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all"
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
                                        : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
                                        }`}
                                >
                                    {f.icon}
                                    {f.label}
                                </button>
                            ))}

                            <div className="w-px h-4 bg-gray-200 mx-1" />

                            {/* Category pills */}
                            {CATEGORIES.map((cat) => (
                                <button
                                    key={cat.value}
                                    onClick={() => setActiveCategory(cat.value)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${activeCategory === cat.value
                                        ? 'bg-slate-800 text-white'
                                        : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
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
                    <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
                        <MapPin size={16} className="shrink-0" />
                        <span>
                            Ative a localização para ver serviços presenciais próximos a você.{' '}
                            <button
                                onClick={() => window.location.reload()}
                                className="underline font-medium"
                            >
                                Tentar novamente
                            </button>
                        </span>
                    </div>
                </div>
            )}

            {/* ── Content ── */}
            {(loading || error || services.length > 0) && (
                <div className="max-w-6xl mx-auto px-4 py-6">
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
                            <p className="text-slate-600 font-medium">Erro ao carregar serviços</p>
                            <p className="text-slate-400 text-sm">{error}</p>
                        </div>
                    )}

                    {/* Grouped view (no active filter) */}
                    {!loading && !error && grouped && grouped.size > 0 && (
                        <div className="space-y-10">
                            {Array.from(grouped.entries()).map(([category, items]) => (
                                <section key={category}>
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-lg font-bold text-slate-800">{category}</h2>
                                        <button
                                            onClick={() => setActiveCategory(category)}
                                            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                                        >
                                            Ver todos <ArrowRight size={14} />
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
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
                            <p className="text-sm text-slate-500 mb-4">
                                {services.length} serviço{services.length !== 1 ? 's' : ''} encontrado{services.length !== 1 ? 's' : ''}
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                {services.map((service) => (
                                    <ServiceCard key={service.id} service={service} />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
