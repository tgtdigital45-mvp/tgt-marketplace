import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Timer, Star, ChevronLeft, ChevronRight, ArrowRight, Verified, Sparkles, Plus, MapPin, Wifi, Loader2, AlertCircle, Monitor, Briefcase, PenTool, Stethoscope, Camera, Scale, Hammer, Shapes } from 'lucide-react';
import SEO from '@/components/SEO';
import { useServicesMarketplace } from '@/hooks/useServicesMarketplace';
import OptimizedImage from '@/components/ui/OptimizedImage';

export default function DiscoverCategoriesPage() {
    const { services, loading, error } = useServicesMarketplace({
        limit: 50,
    });

    // Extrai categorias únicas e atribui um ícone para representar
    const categoryVerticals = useMemo(() => {
        const catSet = new Set<string>();
        services.forEach(s => {
            if (s.category_tag) {
                catSet.add(s.category_tag);
            }
        });

        const catNames = Array.from(catSet);
        if (catNames.length === 0) {
            catNames.push('Tecnologia', 'Marketing', 'Design', 'Saúde', 'Fotografia', 'Direito', 'Serviços Gerais');
        }

        return catNames.map(name => {
            let Icon = Shapes;
            const lowerName = name.toLowerCase();
            if (lowerName.includes('tecno')) Icon = Monitor;
            else if (lowerName.includes('market') || lowerName.includes('venda') || lowerName.includes('consultoria')) Icon = Briefcase;
            else if (lowerName.includes('design') || lowerName.includes('arte')) Icon = PenTool;
            else if (lowerName.includes('saude') || lowerName.includes('saúde') || lowerName.includes('médico')) Icon = Stethoscope;
            else if (lowerName.includes('foto') || lowerName.includes('video') || lowerName.includes('vídeo')) Icon = Camera;
            else if (lowerName.includes('direito') || lowerName.includes('advoca') || lowerName.includes('jurídico')) Icon = Scale;
            else if (lowerName.includes('serviços') || lowerName.includes('manuten') || lowerName.includes('obra')) Icon = Hammer;

            return { name, Icon };
        });
    }, [services]);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    // Recorta dados para as diferentes seções
    // Ofertas Relâmpago reais baseadas no banco de dados (promotional_price existente)
    // Fallback apenas visual na fase de implementação
    const realOffers = services.filter(s => s.promotional_price);
    const flashOffers = realOffers.length > 0 ? realOffers.slice(0, 3) : services.slice(0, 3);

    // Recomendados: exclui os que já estão nas ofertas e dá prioridade para patrocinados
    const recommended = services
        .filter(s => !flashOffers.find(fo => fo.id === s.id))
        .sort((a, b) => {
            if (a.is_sponsored && !b.is_sponsored) return -1;
            if (!a.is_sponsored && b.is_sponsored) return 1;
            return 0;
        })
        .slice(0, 8);

    // Novidades: ordenado por data de criação de forma decrescente
    const newAdditions = [...services]
        .filter(s => s.created_at)
        .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
        .slice(0, 4);

    // Se ainda não houver suficientes para as novidades no banco por não ter data, cai pro slice básico
    const safeNewAdditions = newAdditions.length >= 2 ? newAdditions : services.slice(0, 4);

    return (
        <div className="bg-[#f8f9fc] min-h-screen text-slate-900 pb-32 pt-8 selection:bg-blue-500/30 selection:text-blue-900 overflow-hidden">
            <SEO 
                title="Categorias em Destaque | Marketplace Contratto" 
                description="Descubra e explore as diversas categorias de serviços profissionais disponíveis na Contratto." 
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-16 pb-10">
                
                {loading && (
                    <div className="flex flex-col items-center justify-center py-24 gap-3">
                        <Loader2 size={32} className="animate-spin text-blue-500" />
                        <p className="text-slate-500 text-sm">Carregando marketplace...</p>
                    </div>
                )}
                
                {error && !loading && (
                    <div className="flex flex-col items-center justify-center py-24 gap-3">
                        <AlertCircle size={32} className="text-red-400" />
                        <p className="text-slate-600 font-medium">Erro ao carregar dados do marketplace</p>
                        <p className="text-slate-400 text-sm">{error}</p>
                    </div>
                )}
                
                {!loading && !error && (
                    <>
                        {/* ─── Categorias Scroll Horizontal ─── */}
                        <section>
                            <div className="mb-6">
                                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-2 block">
                                    Especialidades
                                </span>
                                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-800 uppercase italic">
                                    CATEGORIAS
                                </h2>
                            </div>
                            
                            <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 pt-2 snap-x scrollbar-hide">
                                {categoryVerticals.map((cat, idx) => {
                                    const Icon = cat.Icon;
                                    return (
                                        <Link 
                                            key={idx}
                                            to={`/servicos/busca?category=${encodeURIComponent(cat.name)}`} 
                                            className="min-w-[80px] sm:min-w-[100px] snap-start group flex flex-col items-center gap-3"
                                        >
                                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center bg-white shadow-sm ring-1 ring-slate-200 group-hover:bg-blue-50 group-hover:ring-2 group-hover:ring-blue-500 group-hover:-translate-y-1 transition-all text-slate-500 group-hover:text-blue-600">
                                                <Icon size={32} strokeWidth={1.5} />
                                            </div>
                                            <span className="text-xs sm:text-sm font-bold text-slate-700 text-center line-clamp-1 group-hover:text-blue-600 transition-colors px-1">
                                                {cat.name}
                                            </span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </section>

                        {/* ─── Ofertas Relâmpago ─── */}
                        {flashOffers.length > 0 && (
                            <section>
                                <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
                                    <div>
                                        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#3b82f6] mb-2 block">
                                            Por Tempo Limitado
                                        </span>
                                        <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 uppercase italic">
                                            OFERTAS RELÂMPAGO
                                        </h2>
                                    </div>
                                    <div className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-full shadow-sm">
                                        <Timer size={16} className="text-slate-400" />
                                        <span className="text-sm font-bold tabular-nums text-slate-700">02:45:12</span>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {flashOffers.map((service, index) => {
                                        const originalPrice = service.starting_price ?? service.price ?? 50;
                                        
                                        // Usa o preço promocional real. Se não existir, moca um desconto apenas na fase de dev / sem dados.
                                        const discountsMock = [40, 25, 50];
                                        const fallbackDiscount = discountsMock[index % discountsMock.length];
                                        const promoPrice = service.promotional_price ?? (originalPrice * (1 - fallbackDiscount / 100));
                                        
                                        const discountRaw = Math.round((1 - (promoPrice / originalPrice)) * 100);

                                        return (
                                            <div key={service.id} className="group relative overflow-hidden rounded-xl bg-white border border-slate-200 hover:border-blue-300 p-1.5 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1">
                                                <div className="relative aspect-[16/10] overflow-hidden rounded-lg bg-slate-100">
                                                    <OptimizedImage 
                                                        src={service.image_url || service.company_cover_url}
                                                        alt={service.title} 
                                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" 
                                                        optimizedWidth={600}
                                                    />
                                                    <div className="absolute top-3 left-3 bg-[#3b82f6] text-white px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-md">
                                                        -{discountRaw}% OFF
                                                    </div>
                                                    
                                                    {/* Sponsor Badge */}
                                                    {(service.is_sponsored || service.company_is_sponsored) && (
                                                        <div className="absolute top-3 right-3 bg-slate-900/90 backdrop-blur text-amber-400 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md">
                                                            <Sparkles size={10} fill="currentColor" /> Patrocinado
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="p-4 space-y-3">
                                                    <div className="flex justify-between items-start">
                                                        <h3 className="text-lg font-bold text-slate-800 tracking-tight line-clamp-1">{service.title}</h3>
                                                        {service.company_rating && (
                                                            <div className="flex gap-1 bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded text-xs font-bold items-center shrink-0 ml-2">
                                                                <Star size={12} fill="currentColor" />
                                                                <span>{service.company_rating.toFixed(1)}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <p className="text-slate-500 text-sm leading-relaxed line-clamp-1 flex items-center gap-1.5">
                                                        <span className="w-5 h-5 rounded-full overflow-hidden shrink-0 inline-block align-middle">
                                                            <OptimizedImage src={service.company_logo} alt="Logo" className="w-full h-full object-cover" />
                                                        </span>
                                                        {service.company_name}
                                                    </p>
                                                    <div className="flex items-center justify-between pt-2">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs text-slate-400 line-through">{formatCurrency(originalPrice)}</span>
                                                            <span className="text-xl font-black text-[#3b82f6]">{formatCurrency(promoPrice)}</span>
                                                        </div>
                                                        <Link to={`/empresa/${service.company_slug}`} className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-lg font-bold text-sm transition-all active:scale-95 inline-block whitespace-nowrap">
                                                            Ver Oferta
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        )}

                        {/* ─── Altamente Recomendados ─── */}
                        {recommended.length > 0 && (
                            <section>
                                <div className="flex items-end justify-between mb-8">
                                    <div>
                                        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-2 block">
                                            Especialistas Bem Avaliados
                                        </span>
                                        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 uppercase italic">
                                            ALTAMENTE RECOMENDADOS
                                        </h2>
                                    </div>
                                    <div className="hidden sm:flex gap-2">
                                        <button className="w-10 h-10 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all">
                                            <ChevronLeft size={20} />
                                        </button>
                                        <button className="w-10 h-10 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all">
                                            <ChevronRight size={20} />
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-6 pt-2 snap-x scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
                                    {recommended.map((service) => (
                                        <div key={service.id} className="min-w-[280px] sm:min-w-[300px] snap-start group relative bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden hover:shadow-lg hover:border-blue-300 transition-all duration-300">
                                            <div className="h-24 bg-slate-100 relative">
                                                <OptimizedImage src={service.company_cover_url || service.image_url} alt="Cover" className="w-full h-full object-cover opacity-80" optimizedWidth={400} />
                                                <div className="absolute inset-0 bg-gradient-to-t from-white to-transparent"></div>
                                                
                                                {/* Sponsor Badge */}
                                                {(service.is_sponsored || service.company_is_sponsored) && (
                                                    <div className="absolute top-3 right-3 bg-slate-900/90 backdrop-blur text-amber-400 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm z-10">
                                                        <Sparkles size={10} fill="currentColor" /> Patrocinado
                                                    </div>
                                                )}
                                            </div>
                                            <div className="px-5 pb-5 -mt-8 relative z-10">
                                                <div className="relative inline-block mb-3">
                                                    <img 
                                                        src={service.company_logo || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200'} 
                                                        alt={service.company_name} 
                                                        className="w-16 h-16 rounded-xl object-cover border-4 border-white shadow-sm" 
                                                    />
                                                    <div className="absolute -bottom-1 -right-1 bg-green-500 w-3.5 h-3.5 rounded-full border-2 border-white"></div>
                                                </div>
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="pr-2">
                                                        <h3 className="text-lg font-bold text-slate-800 line-clamp-1">{service.company_name}</h3>
                                                        <p className="text-[#3b82f6] font-bold text-[10px] uppercase tracking-widest mt-0.5">{service.category_tag}</p>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <div className="flex items-center gap-1 text-slate-800 justify-end font-bold text-sm bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                                                            <Star size={12} className="text-amber-500" fill="currentColor" />
                                                            <span>{service.company_rating?.toFixed(1) || 'N/A'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <p className="text-slate-500 text-sm line-clamp-2 mb-5 mt-2 h-10 border-b border-slate-50 pb-2">
                                                    {service.title}
                                                </p>
                                                <Link to={`/empresa/${service.company_slug}`} className="block text-center w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 py-2.5 rounded-lg font-bold text-sm transition-all duration-300 active:scale-95 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-100">
                                                    Ver Perfil
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* ─── Novidades na Contratto (Bento Grid) ─── */}
                        {newAdditions.length >= 2 && (
                            <section>
                                <div className="flex items-end justify-between mb-8">
                                    <div>
                                        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-2 block">
                                            Adições Recentes
                                        </span>
                                        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 uppercase italic">
                                            NOVIDADES NA CONTRATTO
                                        </h2>
                                    </div>
                                    <Link to="/servicos/busca" className="hidden sm:flex text-slate-500 text-sm font-bold items-center gap-1 hover:text-blue-600 transition-colors">
                                        Ver Todas as Novidades
                                        <ArrowRight size={14} />
                                    </Link>
                                </div>
                                
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 auto-rows-min lg:h-[400px]">
                                    
                                    {/* Large Featured Pro - Retém impacto mesmo no Light mode, um pouco escurecido pela imagem */}
                                    {newAdditions[0] && (
                                        <div className="relative overflow-hidden rounded-2xl bg-slate-900 border border-slate-200 shadow-md flex flex-col justify-end h-[350px] lg:h-auto group">
                                            <OptimizedImage 
                                                src={newAdditions[0].image_url || newAdditions[0].company_cover_url} 
                                                alt={newAdditions[0].title} 
                                                className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-700"
                                                optimizedWidth={800}
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent"></div>
                                            
                                            <div className="relative p-6 sm:p-8 w-full z-10 flex flex-col gap-3">
                                                <div className="flex gap-2 mb-2">
                                                    <span className="bg-[#3b82f6] text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                                                        NOVO PRO
                                                    </span>
                                                    <span className="bg-white/20 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase flex items-center gap-1 backdrop-blur-md">
                                                        <Verified size={10} /> {newAdditions[0].company_name}
                                                    </span>
                                                </div>
                                                <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">{newAdditions[0].title}</h3>
                                                <p className="text-slate-300 text-sm max-w-md line-clamp-1">{newAdditions[0].category_tag} especialist.</p>
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-2">
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] text-slate-300 uppercase font-bold tracking-wider">Investimento</span>
                                                        <span className="text-2xl font-black text-white">
                                                            {newAdditions[0].starting_price ? formatCurrency(newAdditions[0].starting_price) : formatCurrency(newAdditions[0].price || 0)}
                                                        </span>
                                                    </div>
                                                    <Link to={`/empresa/${newAdditions[0].company_slug}`} className="w-full sm:flex-1 bg-white text-slate-900 py-3 rounded-lg font-bold text-center hover:bg-slate-100 transition-colors active:scale-95">
                                                        Ver Mais
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Right column items */}
                                    <div className="flex flex-col gap-4 h-full">
                                        {/* Top row - Medium item */}
                                        {newAdditions[1] && (
                                            <Link to={`/empresa/${newAdditions[1].company_slug}`} className="flex-1 relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-6 flex flex-col justify-between group hover:border-blue-300 hover:shadow-lg transition-all min-h-[190px]">
                                                <div className="flex justify-between items-start">
                                                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded uppercase tracking-widest">{newAdditions[1].category_tag}</span>
                                                    <div className="flex items-center gap-1 text-slate-400 text-xs">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> Novo
                                                    </div>
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-bold text-slate-900 mb-1 leading-tight line-clamp-2">{newAdditions[1].title}</h3>
                                                    <p className="text-slate-500 text-xs mb-4 line-clamp-1">Por {newAdditions[1].company_name}</p>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xl font-black text-[#3b82f6]">
                                                            {newAdditions[1].starting_price ? formatCurrency(newAdditions[1].starting_price) : formatCurrency(newAdditions[1].price || 0)}
                                                        </span>
                                                        <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all">
                                                            <Plus size={16} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </Link>
                                        )}

                                        {/* Bottom row - Two small items */}
                                        <div className="grid grid-cols-2 gap-4 flex-1">
                                            {newAdditions[2] && (
                                                <Link to={`/empresa/${newAdditions[2].company_slug}`} className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 flex flex-col justify-between group hover:border-blue-300 hover:shadow-lg transition-all min-h-[190px]">
                                                    <div className="h-16 w-full -mt-4 sm:-mt-5 -mx-4 sm:-mx-5 mb-3 sm:mb-4 relative overflow-hidden bg-slate-100">
                                                        <OptimizedImage src={newAdditions[2].image_url || newAdditions[2].company_cover_url} alt={newAdditions[2].title} className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-500" />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-white to-transparent"></div>
                                                    </div>
                                                    <div className="flex-1 flex flex-col">
                                                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate block">{newAdditions[2].category_tag}</span>
                                                        <h3 className="font-bold text-slate-800 text-xs sm:text-sm my-1 leading-tight line-clamp-2">{newAdditions[2].title}</h3>
                                                        <p className="text-slate-400 text-[10px] truncate">{newAdditions[2].company_name}</p>
                                                    </div>
                                                    <div className="flex justify-between items-center mt-2">
                                                        <span className="text-sm border-t border-slate-50 pt-2 w-full font-black text-slate-900 truncate flex justify-between">
                                                            {newAdditions[2].starting_price ? formatCurrency(newAdditions[2].starting_price) : formatCurrency(newAdditions[2].price || 0)}
                                                            <div className="w-4 h-4 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center group-hover:bg-[#3b82f6] group-hover:border-[#3b82f6] transition-colors ml-1 shrink-0">
                                                                <div className="w-1.5 h-1.5 bg-white rounded-full opacity-0 group-hover:opacity-100"></div>
                                                            </div>
                                                        </span>
                                                    </div>
                                                </Link>
                                            )}

                                            {newAdditions[3] && (
                                                <Link to={`/empresa/${newAdditions[3].company_slug}`} className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 flex flex-col justify-between group hover:border-blue-300 hover:shadow-lg transition-all min-h-[190px]">
                                                    <div className="h-16 w-full -mt-4 sm:-mt-5 -mx-4 sm:-mx-5 mb-3 sm:mb-4 relative overflow-hidden bg-slate-100">
                                                        <OptimizedImage src={newAdditions[3].image_url || newAdditions[3].company_cover_url} alt={newAdditions[3].title} className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-500" />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-white to-transparent"></div>
                                                    </div>
                                                    <div className="flex-1 flex flex-col">
                                                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate block">{newAdditions[3].category_tag}</span>
                                                        <h3 className="font-bold text-slate-800 text-xs sm:text-sm my-1 leading-tight line-clamp-2">{newAdditions[3].title}</h3>
                                                        <p className="text-slate-400 text-[10px] truncate">{newAdditions[3].company_name}</p>
                                                    </div>
                                                    <div className="flex justify-between items-center mt-2">
                                                        <span className="text-sm border-t border-slate-50 pt-2 w-full font-black text-slate-900 truncate flex justify-between">
                                                            {newAdditions[3].starting_price ? formatCurrency(newAdditions[3].starting_price) : formatCurrency(newAdditions[3].price || 0)}
                                                            <div className="w-4 h-4 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center group-hover:bg-[#3b82f6] group-hover:border-[#3b82f6] transition-colors ml-1 shrink-0">
                                                                <div className="w-1.5 h-1.5 bg-white rounded-full opacity-0 group-hover:opacity-100"></div>
                                                            </div>
                                                        </span>
                                                    </div>
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                    
                                </div>
                                <div className="mt-4 sm:hidden">
                                     <Link to="/servicos/busca" className="flex w-full justify-center text-slate-500 text-sm font-bold items-center gap-1 hover:text-blue-600 transition-colors">
                                        Ver Todas as Novidades
                                        <ArrowRight size={14} />
                                    </Link>
                                </div>
                            </section>
                        )}
                    </>
                )}
                
                <div className="pb-8"></div>
            </div>
        </div>
    );
}
