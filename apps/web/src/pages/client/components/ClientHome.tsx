import React from 'react';
import { Search, Grid, Clock, ChevronRight, Star, DollarSign, Briefcase, MessageSquare, PlusCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useClientProfileData } from '@/hooks/useClientProfileData';
import OptimizedImage from '@/components/ui/OptimizedImage';

const categories = [
    { id: 'limpeza', name: 'Limpeza', icon: '🧹', color: 'bg-blue-50' },
    { id: 'manutencao', name: 'Manutenção', icon: '🔧', color: 'bg-orange-50' },
    { id: 'tecnologia', name: 'Tecnologia', icon: '💻', color: 'bg-indigo-50' },
    { id: 'reformas', name: 'Reformas', icon: '🏗️', color: 'bg-green-50' },
    { id: 'saude', name: 'Saúde', icon: '⚕️', color: 'bg-red-50' },
    { id: 'juridico', name: 'Jurídico', icon: '⚖️', color: 'bg-slate-50' },
];

const ClientHome: React.FC = () => {
    const { user } = useAuth();
    const { data } = useClientProfileData(user?.id);

    const activeOrders = data?.orders?.filter(o => o.status === 'active' || o.status === 'in_progress').length || 0;
    const pendingQuotes = data?.quotes?.filter(q => q.status === 'pending').length || 0;
    const unreadMessages = data?.conversations?.filter(c => c.unread).length || 0;
    const totalSpent = data?.totalSpent || 0;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Welcome & Stats Row */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight">
                        Olá, {user?.name.split(' ')[0]}! <span className="animate-pulse">👋</span>
                    </h2>
                    <p className="text-slate-500 font-medium mt-1">Bem-vindo ao seu painel de controle premium.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <StatChip 
                        icon={<DollarSign size={14} />} 
                        label="Total Investido" 
                        value={`R$ ${totalSpent.toLocaleString('pt-BR')}`} 
                        color="bg-emerald-50 text-emerald-600" 
                    />
                    <StatChip 
                        icon={<Briefcase size={14} />} 
                        label="Serviços Ativos" 
                        value={activeOrders.toString()} 
                        color="bg-blue-50 text-blue-600" 
                    />
                    {(unreadMessages + pendingQuotes) > 0 && (
                        <StatChip 
                            icon={<MessageSquare size={14} />} 
                            label="Ações Pendentes" 
                            value={(unreadMessages + pendingQuotes).toString()} 
                            color="bg-orange-50 text-orange-600" 
                            animate
                        />
                    )}
                </div>
            </header>

            {/* Main Action Hub */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 bg-gradient-to-br from-[#1E293B] to-[#334155] rounded-[2.5rem] p-10 text-white shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-brand-primary/20 rounded-full blur-3xl -mr-40 -mt-40 group-hover:bg-brand-primary/30 transition-all duration-700"></div>
                    <div className="relative z-10 space-y-6">
                        <div className="space-y-2">
                            <h2 className="text-3xl font-black tracking-tight">O que você precisa contratar hoje?</h2>
                            <p className="text-slate-300 font-medium max-w-md">Encontre profissionais verificados e gerencie seus projetos em um só lugar.</p>
                        </div>

                        <div className="relative group max-w-xl">
                            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                                <Search size={22} className="text-slate-400 group-focus-within:text-brand-primary transition-colors" />
                            </div>
                            <input
                                type="text"
                                placeholder="Encanador, Designer, Advogado..."
                                className="w-full bg-white/10 border border-white/20 text-white placeholder:text-slate-400 pl-14 pr-6 py-5 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand-primary/20 focus:bg-white focus:text-slate-900 transition-all shadow-inner font-medium"
                            />
                        </div>

                        <div className="flex gap-4 pt-2">
                            <Link to="/empresas">
                                <Button className="rounded-xl px-8 font-black text-xs uppercase tracking-widest shadow-lg shadow-brand-primary/20">Explorar Marketplace</Button>
                            </Link>
                            <Link to="/postar-vaga">
                                <Button variant="outline" className="rounded-xl px-8 border-white/20 text-white hover:bg-white/10 font-black text-xs uppercase tracking-widest">Postar Orçamento</Button>
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-6 font-black">
                            <PlusCircle size={24} />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 leading-tight">Atalhos de Contratação</h3>
                        <p className="text-slate-400 text-sm font-medium mt-2">Acesse suas ferramentas rapidamente.</p>
                    </div>
                    <div className="space-y-3 mt-8">
                        <QuickLink to="/minhas-mensagens" icon={<MessageSquare size={16} />} label="Conversas em aberto" count={unreadMessages} />
                        <QuickLink to="/meus-favoritos" icon={<Star size={16} />} label="Profissionais favoritos" />
                        <QuickLink to="/payment-history" icon={<DollarSign size={16} />} label="NF-e e Pagamentos" />
                    </div>
                </div>
            </div>

            {/* Categories Carousel */}
            <section>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                        <Grid size={22} className="text-brand-primary" />
                        Explorar Categorias
                    </h3>
                    <Link to="/empresas" className="text-sm font-black text-brand-primary hover:underline flex items-center gap-1">
                        Ver todas <ChevronRight size={14} />
                    </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                    {categories.map((cat) => (
                        <Link
                            key={cat.id}
                            to={`/empresas?category=${cat.id}`}
                            className={`${cat.color} p-6 rounded-3xl hover:shadow-xl hover:scale-105 transition-all flex flex-col items-center text-center group border border-transparent hover:border-white`}
                        >
                            <span className="text-4xl mb-3 group-hover:rotate-12 transition-transform">{cat.icon}</span>
                            <span className="text-xs font-black text-slate-700 uppercase tracking-widest font-mono">{cat.name}</span>
                        </Link>
                    ))}
                </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Favorites Spotlight */}
                <section className="space-y-6">
                    <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                        <Star size={22} className="text-yellow-500 fill-yellow-500" />
                        Seus Profissionais
                    </h3>
                    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
                        {data?.favorites?.length === 0 ? (
                            <div className="text-center py-6">
                                <p className="text-sm text-slate-400 font-medium italic">Você ainda não salvou profissionais favoritos.</p>
                                <Link to="/empresas" className="text-brand-primary text-xs font-black mt-2 inline-block">Começar a explorar</Link>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {data?.favorites?.slice(0, 3).map((f) => (
                                    <Link key={f.id} to={`/empresa/${f.company?.id}`} className="flex gap-4 items-center group">
                                        <OptimizedImage
                                            src={f.company?.logo_url || ''}
                                            alt={f.company?.name || 'Empresa'}
                                            className="w-14 h-14 bg-slate-100 rounded-2xl flex-shrink-0 object-cover shadow-sm group-hover:shadow-md transition-all"
                                            fallbackSrc={`https://ui-avatars.com/api/?name=${f.company?.name}&background=random`}
                                        />
                                        <div className="flex-grow">
                                            <h4 className="font-black text-slate-800 group-hover:text-brand-primary transition-colors">{f.company?.name}</h4>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{f.company?.category}</p>
                                        </div>
                                        <ChevronRight size={16} className="text-slate-300 group-hover:text-brand-primary transition-colors" />
                                    </Link>
                                ))}
                                <Link to="/perfil?activeTab=favorites" className="block pt-2">
                                    <Button variant="outline" size="sm" className="w-full rounded-xl font-black text-[10px] uppercase tracking-widest py-4">Ver todos os {data?.favorites?.length} salvos</Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </section>

                {/* Recent Items (Orders & Quotes) */}
                <section className="space-y-6">
                    <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                        <Clock size={22} className="text-brand-primary" />
                        Atividade Recente
                    </h3>
                    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
                        {data?.orders?.length === 0 && data?.quotes?.length === 0 ? (
                            <div className="text-center py-10">
                                <Clock size={40} className="text-slate-100 mx-auto mb-4" />
                                <p className="text-sm text-slate-400 font-medium">Você ainda não tem pedidos ou orçamentos.</p>
                            </div>
                        ) : (
                            <div className="space-y-5">
                                {[...(data?.orders || []).slice(0, 2), ...(data?.quotes || []).slice(0, 2)].slice(0, 3).map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors cursor-pointer">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm">
                                                {(item as any).status === 'pending' ? <Clock size={18} /> : <Briefcase size={18} />}
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black text-slate-800">{(item as any).service_title || (item as any).description?.substring(0, 20)}...</h4>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{(item as any).status}</p>
                                            </div>
                                        </div>
                                        <ChevronRight size={14} className="text-slate-300" />
                                    </div>
                                ))}
                                <Button variant="outline" size="sm" className="w-full rounded-xl font-black text-[10px] uppercase tracking-widest py-4">Ver painel completo</Button>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
};

const StatChip = ({ icon, label, value, color, animate }: { icon: React.ReactNode, label: string, value: string, color: string, animate?: boolean }) => (
    <div className={`px-4 py-2 rounded-2xl flex items-center gap-3 border shadow-sm ${color} ${animate ? 'animate-bounce' : ''} border-transparent hover:border-current/20 transition-all cursor-default`}>
        <div className="p-1.5 bg-white/50 rounded-lg">
            {icon}
        </div>
        <div>
            <p className="text-[10px] font-black opacity-60 uppercase tracking-tighter leading-none mb-1">{label}</p>
            <p className="text-sm font-black tracking-tight leading-none">{value}</p>
        </div>
    </div>
);

const QuickLink = ({ to, icon, label, count }: { to: string, icon: React.ReactNode, label: string, count?: number }) => (
    <Link to={to} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-indigo-50 hover:text-indigo-600 transition-all group">
        <div className="flex items-center gap-3">
            <span className="text-slate-400 group-hover:text-indigo-500 transition-colors">{icon}</span>
            <span className="text-sm font-bold tracking-tight">{label}</span>
        </div>
        {count ? (
            <span className="w-5 h-5 bg-indigo-600 text-white text-[10px] font-black rounded-lg flex items-center justify-center shadow-lg shadow-indigo-200 animate-pulse">
                {count}
            </span>
        ) : (
            <ChevronRight size={14} className="text-slate-300 group-hover:translate-x-1 transition-all" />
        )}
    </Link>
);

export default ClientHome;
