import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';

// --- Purity UI / TGT Components ---

interface StatCardProps {
    title: string;
    value: string;
    change?: string;
    icon: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, icon }) => (
    <div className="bg-white rounded-2xl shadow-sm p-4 flex items-center justify-between min-w-[240px]">
        <div>
            <p className="text-gray-400 text-sm font-semibold mb-1">{title}</p>
            <div className="flex items-center gap-2">
                <h3 className="text-gray-800 text-xl font-bold">{value}</h3>
                {change && (
                    <span className={`text-sm font-bold ${change.startsWith('+') ? 'text-green-500' : 'text-gray-500'}`}>
                        {change}
                    </span>
                )}
            </div>
        </div>
        <div className="w-12 h-12 bg-brand-primary rounded-xl flex items-center justify-center text-white shadow-md">
            {icon}
        </div>
    </div>
);

const MiniTable: React.FC<{ data: any[] }> = ({ data }) => (
    <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col h-full">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Atividade Recente</h3>
        <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr>
                        <th className="text-gray-400 text-[10px] font-bold uppercase py-2 border-b border-gray-100">Serviço</th>
                        <th className="text-gray-400 text-[10px] font-bold uppercase py-2 border-b border-gray-100 pl-4">Valor</th>
                        <th className="text-gray-400 text-[10px] font-bold uppercase py-2 border-b border-gray-100 pl-4">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {data.length === 0 ? (
                        <tr><td colSpan={3} className="py-4 text-center text-gray-500 text-sm">Nenhuma atividade recente.</td></tr>
                    ) : (
                        data.map((item, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                <td className="py-3 items-center flex gap-3 border-b border-gray-100">
                                    <div className="w-6 h-6 rounded-full bg-brand-secondary/20 flex items-center justify-center text-xs font-bold text-brand-secondary">
                                        {item.service_title ? item.service_title.charAt(0) : 'S'}
                                    </div>
                                    <span className="text-sm font-bold text-gray-700 truncate max-w-[150px]">{item.service_title || 'Serviço sem título'}</span>
                                </td>
                                <td className="py-3 border-b border-gray-100 pl-4 text-sm text-gray-600 font-semibold">
                                    R$ {item.agreed_price?.toFixed(2)}
                                </td>
                                <td className="py-3 border-b border-gray-100 pl-4">
                                    <span className={`text-xs font-bold px-2 py-1 rounded-md 
                                        ${item.status === 'in_progress' ? 'bg-blue-100 text-blue-600' :
                                            item.status === 'completed' ? 'bg-green-100 text-green-600' :
                                                item.status === 'cancelled' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                                        {item.status === 'in_progress' ? 'Em Progresso' :
                                            item.status === 'completed' ? 'Concluído' :
                                                item.status === 'pending_payment' ? 'Aguardando Pagamento' : item.status}
                                    </span>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    </div>
);

// --- Icons ---
const WalletIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" /></svg>;
const GlobeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg>;
const DocumentIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>;
const CartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" /></svg>;


const DashboardOverviewPage: React.FC = () => {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(true);

    // --- State for Data ---
    const [stats, setStats] = useState({
        totalEarnings: 'R$ 0,00',
        activeClients: 0,
        newProjects: 0,
        totalSales: 0,
        totalSalesValue: 'R$ 0,00'
    });

    const [chartData, setChartData] = useState<any[]>([]);
    const [recentActivity, setRecentActivity] = useState<any[]>([]);

    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Call the unified RPC
                const { data, error } = await supabase.rpc('get_seller_dashboard_metrics', {
                    p_seller_id: user.id
                });

                if (error) {
                    console.error("RPC Error:", error);
                    throw error;
                }

                if (data) {
                    setStats({
                        totalEarnings: `R$ ${(data.total_earnings || 0).toLocaleString('pt-BR')}`,
                        activeClients: data.active_clients || 0,
                        newProjects: data.new_projects_week || 0,
                        totalSales: data.total_sales_count || 0,
                        totalSalesValue: `R$ ${(data.total_earnings || 0).toLocaleString('pt-BR')}`
                    });

                    setChartData(data.sales_chart || []);
                    setRecentActivity(data.recent_activity || []);
                }

            } catch (err) {
                console.error("Error fetching dashboard data:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [user]);

    if (isLoading) {
        return <div className="p-6"><LoadingSkeleton className="h-64 w-full" /></div>;
    }

    return (
        <div className="p-6 space-y-6 bg-gray-50 min-h-full">
            {/* ROW 1: Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Money */}
                <StatCard
                    title="Ganhos Totais"
                    value={stats.totalEarnings}
                    change=""
                    icon={<WalletIcon />}
                />
                {/* Clients */}
                <StatCard
                    title="Clientes Ativos"
                    value={stats.activeClients.toString()}
                    change=""
                    icon={<GlobeIcon />}
                />
                {/* Projects */}
                <StatCard
                    title="Novos Projetos (7d)"
                    value={`+${stats.newProjects}`}
                    change=""
                    icon={<DocumentIcon />}
                />
                {/* Sales */}
                <StatCard
                    title="Vendas Totais"
                    value={stats.totalSales.toString()}
                    change=""
                    icon={<CartIcon />}
                />
            </div>


            {/* ROW 2: Welcome Section */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm p-6 relative overflow-hidden flex flex-col justify-between min-h-[220px]">
                    <div className="z-10 relative">
                        <p className="text-gray-400 font-bold text-sm mb-1 uppercase">Bem-vindo ao TGT Contratto</p>
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">Painel do Profissional</h3>
                        <p className="text-gray-500 text-sm mb-8 sm:mb-12 max-w-sm">
                            Acompanhe suas métricas, gerencie pedidos e cresça seu negócio.
                        </p>
                    </div>
                    <div className="absolute right-0 top-0 h-full w-2/5 p-4 flex items-center justify-center">
                        <div className="w-full h-full bg-brand-primary rounded-2xl flex items-center justify-center text-white opacity-90 shadow-lg transform rotate-6 translate-x-4">
                            <svg viewBox="0 0 24 24" className="w-16 h-16 sm:w-24 sm:h-24" fill="currentColor"><path d="M12 0L1.75 6v12L12 24l10.25-6V6L12 0zm0 2.25l8 4.65v9.3L12 20.85 4 16.2v-9.3l8-4.65zM11.25 12v-6l-5.25 3v6l5.25-3zm1.5 0l5.25 3v-6l-5.25-3v6z" /></svg>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 rounded-2xl shadow-sm p-6 relative overflow-hidden flex flex-col justify-between min-h-[220px] bg-gradient-to-br from-gray-800 to-gray-900">
                    <div className="z-10 relative text-white">
                        <h3 className="text-xl font-bold mb-2">Dica Pro</h3>
                        <p className="text-white/80 text-sm mb-8 sm:mb-12">
                            Mantenha seu perfil atualizado e responda rápido para ganhar mais destaque.
                        </p>
                    </div>
                </div>
            </div>

            {/* ROW 3: Charts Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Chart (Revenue) */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-1">Histórico de Vendas</h3>
                    <p className="text-sm text-gray-500 mb-6">Últimos 6 meses</p>

                    <div className="w-full h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#004E89" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#004E89" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#A0AEC0', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#A0AEC0', fontSize: 12 }} />
                                <Tooltip formatter={(value: number) => [`R$ ${value}`, 'Vendas']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                                <Area type="monotone" dataKey="sales" stroke="#004E89" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Secondary Chart (Orders Count) */}
                <div className="bg-gradient-to-br from-[#FF6B35] to-[#FF8C61] rounded-2xl shadow-sm p-6 text-white relative overflow-hidden">
                    <div className="relative z-10">
                        <h3 className="text-lg font-bold mb-2">Pedidos Realizados</h3>
                        <p className="text-white/80 text-sm mb-6">Volume mensal</p>

                        <div className="w-full h-[220px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <Bar dataKey="orders_count" fill="rgba(255,255,255,0.8)" radius={[4, 4, 0, 0]} barSize={8} />
                                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.1)' }} contentStyle={{ backgroundColor: '#333', border: 'none', borderRadius: '8px', color: '#fff' }} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            {/* ROW 3: Content Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                <div className="lg:col-span-3 h-full">
                    <MiniTable data={recentActivity} />
                </div>
            </div>
        </div>
    );
};

export default DashboardOverviewPage;
