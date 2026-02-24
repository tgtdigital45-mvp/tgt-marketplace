import React from 'react';
import { Search, Grid, Clock, ChevronRight, Star } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Link } from 'react-router-dom';

const categories = [
    { id: 'limpeza', name: 'Limpeza', icon: '🧹', color: 'bg-blue-50' },
    { id: 'manutencao', name: 'Manutenção', icon: '🔧', color: 'bg-orange-50' },
    { id: 'tecnologia', name: 'Tecnologia', icon: '💻', color: 'bg-indigo-50' },
    { id: 'reformas', name: 'Reformas', icon: '🏗️', color: 'bg-green-50' },
    { id: 'saude', name: 'Saúde', icon: '⚕️', color: 'bg-red-50' },
    { id: 'juridico', name: 'Jurídico', icon: '⚖️', color: 'bg-slate-50' },
];

const ClientHome: React.FC = () => {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Search Section */}
            <div className="bg-gradient-to-br from-[#1E293B] to-[#334155] rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                <div className="relative z-10">
                    <h2 className="text-2xl font-bold mb-2">O que você precisa hoje?</h2>
                    <p className="text-slate-300 mb-6">Encontre os melhores profissionais em segundos.</p>

                    <div className="relative group max-w-2xl">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                            <Search size={20} className="text-slate-400 group-focus-within:text-brand-primary transition-colors" />
                        </div>
                        <input
                            type="text"
                            placeholder="Pesquise por serviço, empresa ou categoria..."
                            className="w-full bg-white/10 border border-white/20 text-white placeholder:text-slate-400 pl-12 pr-4 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-primary focus:bg-white focus:text-slate-900 transition-all shadow-inner"
                        />
                    </div>
                </div>
            </div>

            {/* Categories Carousel */}
            <section>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Grid size={18} className="text-brand-primary" />
                        Explorar Categorias
                    </h3>
                    <Link to="/empresas" className="text-sm font-semibold text-brand-primary hover:underline flex items-center gap-1">
                        Ver todas <ChevronRight size={14} />
                    </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                    {categories.map((cat) => (
                        <Link
                            key={cat.id}
                            to={`/empresas?category=${cat.id}`}
                            className={`${cat.color} p-4 rounded-2xl hover:shadow-md transition-all flex flex-col items-center text-center group`}
                        >
                            <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">{cat.icon}</span>
                            <span className="text-xs font-bold text-slate-700 tracking-tight">{cat.name}</span>
                        </Link>
                    ))}
                </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Recommended Companies */}
                <section className="space-y-4">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Star size={18} className="text-yellow-500 fill-yellow-500" />
                        Recomendados na Região
                    </h3>
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
                        {[1, 2].map((i) => (
                            <div key={i} className="flex gap-4 items-center group">
                                <div className="w-12 h-12 bg-slate-100 rounded-xl flex-shrink-0"></div>
                                <div className="flex-grow">
                                    <div className="h-4 bg-slate-100 rounded w-24 mb-2"></div>
                                    <div className="h-3 bg-slate-50 rounded w-32"></div>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center gap-1 text-xs font-bold text-yellow-500">
                                        <Star size={12} fill="currentColor" /> 4.9
                                    </div>
                                </div>
                            </div>
                        ))}
                        <Button variant="outline" size="sm" className="w-full">Descobrir mais profissionais</Button>
                    </div>
                </section>

                {/* Recent Activity */}
                <section className="space-y-4">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Clock size={18} className="text-brand-primary" />
                        Histórico Recente
                    </h3>
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                        <div className="text-center py-6">
                            <Clock size={32} className="text-slate-200 mx-auto mb-2" />
                            <p className="text-sm text-slate-400 font-medium">Você ainda não visualizou serviços recentemente.</p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default ClientHome;
