import React, { useEffect, useState } from 'react';
import { supabase } from '@tgt/shared';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import { useCompany } from '@/contexts/CompanyContext';

// --- Purity UI / CONTRATTO Components ---

interface StatCardProps {
    title: string;
    value: string;
    change?: string;
    icon: React.ReactNode;
    accent?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, icon, accent }) => (
    <div className="bg-white rounded-2xl shadow-sm p-4 flex items-center justify-between min-w-[200px]">
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
        <div className={`w-12 h-12 ${accent || 'bg-brand-primary'} rounded-xl flex items-center justify-center text-white shadow-md`}>
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
                        data.map((item) => (
                            <tr key={item.id || item.order_id || Math.random()} className="hover:bg-gray-50 transition-colors">
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
const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>;
const TicketIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" /></svg>;
const CheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const BellIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>;

const DashboardOverviewPage: React.FC = () => {
    const { user } = useAuth();
    const { company } = useCompany();
    const [isLoading, setIsLoading] = useState(true);
    const [chartPeriod, setChartPeriod] = useState<'7d' | '30d'>('30d');

    const [stats, setStats] = useState({
        totalEarnings: 0,
        activeClients: 0,
        newProjects: 0,
        totalSales: 0,
        pendingBookings: 0,
        completedServices: 0,
        avgTicket: 0,
    });

    const [alerts, setAlerts] = useState({
        todayBookings: 0,
        unreadMessages: 0,
        pendingQuotes: 0,
    });

    const [chartData, setChartData] = useState<any[]>([]);
    const [recentActivity, setRecentActivity] = useState<any[]>([]);

    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Main dashboard metrics via RPC
                const { data, error } = await supabase.rpc('get_seller_dashboard_metrics', {
                    p_seller_id: user.id
                });

                if (error) throw error;

                if (data) {
                    const earnings = data.total_earnings || 0;
                    const sales = data.total_sales_count || 0;
                    setStats({
                        totalEarnings: earnings,
                        activeClients: data.active_clients || 0,
                        newProjects: data.new_projects_week || 0,
                        totalSales: sales,
                        pendingBookings: data.pending_bookings || 0,
                        completedServices: data.completed_services || 0,
                        avgTicket: sales > 0 ? earnings / sales : 0,
                    });
                    setChartData(data.sales_chart || []);
                    setRecentActivity(data.recent_activity || []);
                }

                // Alerts: fetch in parallel
                if (company?.id) {
                    const today = new Date().toISOString().split('T')[0];

                    const [todayRes, unreadRes, quotesRes] = await Promise.all([
                        supabase.from('bookings').select('id', { count: 'exact', head: true })
                            .eq('company_id', company.id)
                            .eq('booking_date', today)
                            .in('status', ['pending', 'confirmed']),
                        supabase.from('messages').select('id', { count: 'exact', head: true })
                            .eq('receiver_id', user.id)
                            .is('read_at', null),
                        supabase.from('quotes').select('id', { count: 'exact', head: true })
                            .eq('company_id', company.id)
                            .in('status', ['pending', 'viewed']),
                    ]);

                    setAlerts({
                        todayBookings: todayRes.count || 0,
                        unreadMessages: unreadRes.count || 0,
                        pendingQuotes: quotesRes.count || 0,
                    });
                }

            } catch (err) {
                console.error('Error fetching dashboard data:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [user, company?.id]);

    // Filter chart data by period
    const filteredChart = chartPeriod === '7d'
        ? chartData.slice(-7)
        : chartData;

    const hasAlerts = alerts.todayBookings > 0 || alerts.unreadMessages > 0 || alerts.pendingQuotes > 0;

    if (isLoading) {
        return <div className="p-6"><LoadingSkeleton className="h-64 w-full" /></div>;
    }

    return (
        <div className="p-6 space-y-6 bg-gray-50 min-h-full">

            {/* Critical Alerts Widget */}
            {hasAlerts && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-wrap gap-3 items-center">
                    <div className="flex items-center gap-2 text-amber-700 font-bold text-sm">
                        <BellIcon />
                        Alertas do Dia
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {alerts.todayBookings > 0 && (
                            <Link to={`/dashboard/empresa/${company?.slug}/agenda`} className="flex items-center gap-1.5 bg-white border border-amber-200 text-amber-800 text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-amber-100 transition-colors">
                                <CalendarIcon />
                                {alerts.todayBookings} agendamento{alerts.todayBookings > 1 ? 's' : ''} hoje
                            </Link>
                        )}
                        {alerts.unreadMessages > 0 && (
                            <Link to={`/dashboard/empresa/${company?.slug}/mensagens`} className="flex items-center gap-1.5 bg-white border border-blue-200 text-blue-800 text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-blue-50 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>
                                {alerts.unreadMessages} mensagem{alerts.unreadMessages > 1 ? 'ns' : ''} não lida{alerts.unreadMessages > 1 ? 's' : ''}
                            </Link>
                        )}
                        {alerts.pendingQuotes > 0 && (
                            <Link to={`/dashboard/empresa/${company?.slug}/orcamentos`} className="flex items-center gap-1.5 bg-white border border-purple-200 text-purple-800 text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-purple-50 transition-colors">
                                <DocumentIcon />
                                {alerts.pendingQuotes} solicitaç{alerts.pendingQuotes > 1 ? 'ões' : 'ão'} de orçamento
                            </Link>
                        )}
                    </div>
                </div>
            )}

            {/* ROW 1: Primary Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Ganhos Totais"
                    value={`R$ ${stats.totalEarnings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    icon={<WalletIcon />}
                />
                <StatCard
                    title="Clientes Ativos"
                    value={stats.activeClients.toString()}
                    icon={<GlobeIcon />}
                />
                <StatCard
                    title="Novos Projetos (7d)"
                    value={`+${stats.newProjects}`}
                    icon={<DocumentIcon />}
                />
                <StatCard
                    title="Vendas Totais"
                    value={stats.totalSales.toString()}
                    icon={<CartIcon />}
                />
            </div>

            {/* ROW 2: Secondary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                    title="Agendamentos Pendentes"
                    value={stats.pendingBookings.toString()}
                    icon={<CalendarIcon />}
                    accent="bg-yellow-500"
                />
                <StatCard
                    title="Serviços Concluídos"
                    value={stats.completedServices.toString()}
                    icon={<CheckIcon />}
                    accent="bg-green-500"
                />
                <StatCard
                    title="Ticket Médio"
                    value={`R$ ${stats.avgTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    icon={<TicketIcon />}
                    accent="bg-purple-500"
                />
            </div>

            {/* ROW 3: Welcome Section */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm p-6 relative overflow-hidden flex flex-col justify-between min-h-[220px]">
                    <div className="z-10 relative">
                        <p className="text-gray-400 font-bold text-sm mb-1 uppercase">Bem-vindo à CONTRATTO</p>
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

            {/* ROW 4: Charts Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Chart (Revenue) */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6">
                    <div className="flex items-center justify-between mb-1">
                        <h3 className="text-lg font-bold text-gray-800">Histórico de Vendas</h3>
                        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                            <button
                                onClick={() => setChartPeriod('7d')}
                                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${chartPeriod === '7d' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                7 dias
                            </button>
                            <button
                                onClick={() => setChartPeriod('30d')}
                                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${chartPeriod === '30d' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                30 dias
                            </button>
                        </div>
                    </div>
                    <p className="text-sm text-gray-500 mb-6">
                        {chartPeriod === '7d' ? 'Últimos 7 dias' : 'Últimos 30 dias'}
                    </p>

                    <div className="relative w-full h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={filteredChart}>
                                <defs>
                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--color-brand-secondary)" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="var(--color-brand-secondary)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#A0AEC0', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#A0AEC0', fontSize: 12 }} />
                                <Tooltip formatter={(value: number) => [`R$ ${value}`, 'Vendas']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                                <Area type="monotone" dataKey="sales" stroke="var(--color-brand-secondary)" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Secondary Chart (Orders Count) */}
                <div className="bg-gradient-to-br from-brand-primary to-brand-primary/70 rounded-2xl shadow-sm p-6 text-white relative overflow-hidden">
                    <div className="relative z-10 w-full h-full flex flex-col">
                        <h3 className="text-lg font-bold mb-2">Pedidos Realizados</h3>
                        <p className="text-white/80 text-sm mb-6">Volume mensal</p>

                        <div className="relative flex-1 w-full min-h-[220px]">
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

            {/* ROW 5: Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                <div className="lg:col-span-3 h-full">
                    <MiniTable data={recentActivity} />
                </div>
            </div>
        </div>
    );
};

export default DashboardOverviewPage;
