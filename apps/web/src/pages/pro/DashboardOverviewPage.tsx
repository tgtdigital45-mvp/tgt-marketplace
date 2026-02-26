import React, { useEffect, useState } from 'react';
import { supabase } from '@tgt/shared';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import { useCompany } from '@/contexts/CompanyContext';
import { motion } from 'framer-motion';
import {
  Wallet,
  Globe,
  FileText,
  ShoppingCart,
  Calendar,
  BadgeCheck,
  Ticket,
  Bell,
  TrendingUp,
  ChevronRight,
  ArrowUpRight,
  MessageSquare,
  Sparkles,
  Eye,
} from 'lucide-react';

// ─── Stat Card ──────────────────────────────────────────────────────────────────
interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  icon: React.ReactNode;
  accent?: string;
  delay?: number;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, icon, accent = 'bg-primary-500', delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 flex items-center justify-between hover:shadow-md hover:-translate-y-0.5 transition-all group"
  >
    <div className="min-w-0">
      <p className="text-gray-400 text-[11px] sm:text-xs font-semibold uppercase tracking-wide mb-1 truncate">{title}</p>
      <div className="flex items-center gap-2">
        <h3 className="text-gray-900 text-lg sm:text-xl font-bold truncate">{value}</h3>
        {change && (
          <span className={`text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded-md ${change.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-500'
            }`}>
            {change}
          </span>
        )}
      </div>
    </div>
    <div className={`w-10 h-10 sm:w-11 sm:h-11 ${accent} rounded-xl flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition-transform flex-shrink-0`}>
      {icon}
    </div>
  </motion.div>
);

// ─── Activity Table ─────────────────────────────────────────────────────────────
const ActivityTable: React.FC<{ data: any[] }> = ({ data }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay: 0.6 }}
    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6"
  >
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-sm sm:text-base font-bold text-gray-900">Atividade Recente</h3>
      <span className="text-[10px] text-gray-400 font-medium">Ultimas transacoes</span>
    </div>
    <div className="overflow-x-auto -mx-5 sm:-mx-6 px-5 sm:px-6">
      <table className="w-full text-left">
        <thead>
          <tr>
            <th className="text-gray-400 text-[10px] font-bold uppercase py-2.5 border-b border-gray-100 pr-4">Servico</th>
            <th className="text-gray-400 text-[10px] font-bold uppercase py-2.5 border-b border-gray-100 pr-4">Valor</th>
            <th className="text-gray-400 text-[10px] font-bold uppercase py-2.5 border-b border-gray-100">Status</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={3} className="py-8 text-center text-gray-400 text-sm">
                Nenhuma atividade recente.
              </td>
            </tr>
          ) : (
            data.map((item, idx) => (
              <tr key={item.id || item.order_id || idx} className="hover:bg-gray-50/50 transition-colors">
                <td className="py-3 pr-4 border-b border-gray-50">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-secondary-50 flex items-center justify-center text-[10px] font-bold text-secondary-600 flex-shrink-0">
                      {item.service_title ? item.service_title.charAt(0).toUpperCase() : 'S'}
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-gray-700 truncate max-w-[120px] sm:max-w-[200px]">
                      {item.service_title || 'Servico sem titulo'}
                    </span>
                  </div>
                </td>
                <td className="py-3 pr-4 border-b border-gray-50 text-xs sm:text-sm text-gray-600 font-semibold whitespace-nowrap">
                  R$ {item.agreed_price?.toFixed(2)}
                </td>
                <td className="py-3 border-b border-gray-50">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${item.status === 'in_progress' ? 'bg-blue-50 text-blue-600' :
                      item.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                        item.status === 'cancelled' ? 'bg-red-50 text-red-600' :
                          'bg-gray-50 text-gray-500'
                    }`}>
                    {item.status === 'in_progress' ? 'Em Progresso' :
                      item.status === 'completed' ? 'Concluido' :
                        item.status === 'pending_payment' ? 'Aguardando Pgto' :
                          item.status}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </motion.div>
);

// ─── Greeting Helper ────────────────────────────────────────────────────────────
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
};

const formatDate = () => {
  return new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
};

// ═════════════════════════════════════════════════════════════════════════════════
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
        const { data, error } = await supabase.rpc('get_seller_dashboard_metrics', {
          p_seller_id: user.id,
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

        if (company?.id) {
          const today = new Date().toISOString().split('T')[0];
          const [todayRes, unreadRes, quotesRes] = await Promise.all([
            supabase.from('bookings').select('id', { count: 'exact', head: true })
              .eq('company_id', company.id).eq('booking_date', today).in('status', ['pending', 'confirmed']),
            supabase.from('messages').select('id', { count: 'exact', head: true })
              .eq('receiver_id', user.id).filter('read_at', 'is', null),
            supabase.from('quotes').select('id', { count: 'exact', head: true })
              .eq('company_id', company.id).in('status', ['pending', 'viewed']),
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

  const filteredChart = chartPeriod === '7d' ? chartData.slice(-7) : chartData;
  const hasAlerts = alerts.todayBookings > 0 || alerts.unreadMessages > 0 || alerts.pendingQuotes > 0;

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-4">
        <LoadingSkeleton className="h-12 w-72 rounded-xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => <LoadingSkeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
        <LoadingSkeleton className="h-80 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5 sm:space-y-6">

      {/* ─── Page Header ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
          <span>Dashboard</span>
          <ChevronRight size={12} />
          <span className="text-gray-600 font-medium">Visao Geral</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              {getGreeting()}, {company?.company_name || 'Empresa'}
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-0.5 capitalize">{formatDate()}</p>
          </div>
          <Link
            to={`/empresa/${company?.slug}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-xl hover:shadow-sm transition-all"
          >
            <Eye size={14} />
            Ver Perfil Publico
            <ArrowUpRight size={12} />
          </Link>
        </div>
      </motion.div>

      {/* ─── Alerts Bar ──────────────────────────────────────────────── */}
      {hasAlerts && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-amber-50 border border-amber-100 rounded-2xl p-3 sm:p-4 flex flex-wrap gap-2 sm:gap-3 items-center"
        >
          <div className="flex items-center gap-2 text-amber-700 font-bold text-xs">
            <Bell size={14} />
            Alertas
          </div>
          <div className="flex flex-wrap gap-2">
            {alerts.todayBookings > 0 && (
              <Link to={`/dashboard/empresa/${company?.slug}/agenda`} className="flex items-center gap-1.5 bg-white border border-amber-200 text-amber-800 text-[10px] sm:text-xs font-semibold px-2.5 py-1.5 rounded-full hover:bg-amber-100 transition-colors">
                <Calendar size={12} />
                {alerts.todayBookings} agendamento{alerts.todayBookings > 1 ? 's' : ''} hoje
              </Link>
            )}
            {alerts.unreadMessages > 0 && (
              <Link to={`/dashboard/empresa/${company?.slug}/mensagens`} className="flex items-center gap-1.5 bg-white border border-blue-200 text-blue-800 text-[10px] sm:text-xs font-semibold px-2.5 py-1.5 rounded-full hover:bg-blue-50 transition-colors">
                <MessageSquare size={12} />
                {alerts.unreadMessages} mensagem{alerts.unreadMessages > 1 ? 'ns' : ''} nao lida{alerts.unreadMessages > 1 ? 's' : ''}
              </Link>
            )}
            {alerts.pendingQuotes > 0 && (
              <Link to={`/dashboard/empresa/${company?.slug}/orcamentos`} className="flex items-center gap-1.5 bg-white border border-purple-200 text-purple-800 text-[10px] sm:text-xs font-semibold px-2.5 py-1.5 rounded-full hover:bg-purple-50 transition-colors">
                <FileText size={12} />
                {alerts.pendingQuotes} orcamento{alerts.pendingQuotes > 1 ? 's' : ''} pendente{alerts.pendingQuotes > 1 ? 's' : ''}
              </Link>
            )}
          </div>
        </motion.div>
      )}

      {/* ─── Primary Stats ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Ganhos Totais"
          value={`R$ ${stats.totalEarnings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={<Wallet size={18} />}
          delay={0.15}
        />
        <StatCard
          title="Clientes Ativos"
          value={stats.activeClients.toString()}
          icon={<Globe size={18} />}
          accent="bg-secondary-500"
          delay={0.2}
        />
        <StatCard
          title="Novos Projetos (7d)"
          value={`+${stats.newProjects}`}
          icon={<FileText size={18} />}
          accent="bg-emerald-500"
          delay={0.25}
        />
        <StatCard
          title="Vendas Totais"
          value={stats.totalSales.toString()}
          icon={<ShoppingCart size={18} />}
          accent="bg-violet-500"
          delay={0.3}
        />
      </div>

      {/* ─── Secondary Stats ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <StatCard
          title="Agendamentos Pendentes"
          value={stats.pendingBookings.toString()}
          icon={<Calendar size={18} />}
          accent="bg-amber-500"
          delay={0.35}
        />
        <StatCard
          title="Servicos Concluidos"
          value={stats.completedServices.toString()}
          icon={<BadgeCheck size={18} />}
          accent="bg-emerald-500"
          delay={0.4}
        />
        <StatCard
          title="Ticket Medio"
          value={`R$ ${stats.avgTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={<Ticket size={18} />}
          accent="bg-purple-500"
          delay={0.45}
        />
      </div>

      {/* ─── Welcome + Tip Cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 relative overflow-hidden"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center text-white">
                <TrendingUp size={16} />
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Painel do Profissional</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
              Acompanhe seus resultados
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 max-w-sm leading-relaxed">
              Monitore metricas, gerencie pedidos e faca seu negocio crescer dentro da CONTRATTO.
            </p>
          </div>
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-primary-50 rounded-full opacity-60" />
          <div className="absolute -right-2 -bottom-2 w-20 h-20 bg-primary-100 rounded-full opacity-40" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="lg:col-span-2 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-sm p-5 sm:p-6 relative overflow-hidden"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={16} className="text-amber-400" />
              <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Dica Pro</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white mb-2">Destaque seu perfil</h3>
            <p className="text-xs text-white/60 leading-relaxed">
              Responda rapido, mantenha o portfolio atualizado e receba ate 3x mais contatos.
            </p>
          </div>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/5 rounded-full" />
        </motion.div>
      </div>

      {/* ─── Charts ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6"
        >
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm sm:text-base font-bold text-gray-900">Historico de Vendas</h3>
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setChartPeriod('7d')}
                className={`px-2.5 py-1 text-[10px] sm:text-xs font-bold rounded-md transition-all ${chartPeriod === '7d' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                7 dias
              </button>
              <button
                onClick={() => setChartPeriod('30d')}
                className={`px-2.5 py-1 text-[10px] sm:text-xs font-bold rounded-md transition-all ${chartPeriod === '30d' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                30 dias
              </button>
            </div>
          </div>
          <p className="text-[10px] sm:text-xs text-gray-400 mb-4">
            {chartPeriod === '7d' ? 'Ultimos 7 dias' : 'Ultimos 30 dias'}
          </p>
          <div className="w-full h-[250px] sm:h-[300px]" style={{ minHeight: '250px' }}>
            <ResponsiveContainer width="100%" height="100%" minHeight={250}>
              <AreaChart data={filteredChart}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-brand-secondary)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-brand-secondary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
                <Tooltip
                  formatter={(value: number) => [`R$ ${value}`, 'Vendas']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="sales" stroke="var(--color-brand-secondary)" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.55 }}
          className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl shadow-sm p-5 sm:p-6 text-white relative overflow-hidden"
        >
          <div className="relative z-10 w-full h-full flex flex-col">
            <h3 className="text-sm sm:text-base font-bold mb-1">Pedidos Realizados</h3>
            <p className="text-white/60 text-[10px] sm:text-xs mb-4">Volume mensal</p>
            <div className="flex-1 w-full min-h-[200px] sm:min-h-[220px]" style={{ minHeight: '200px' }}>
              <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                <BarChart data={chartData}>
                  <Bar dataKey="orders_count" fill="rgba(255,255,255,0.8)" radius={[4, 4, 0, 0]} barSize={8} />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.1)' }}
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '12px' }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="absolute -right-6 -top-6 w-28 h-28 bg-white/10 rounded-full" />
        </motion.div>
      </div>

      {/* ─── Recent Activity ─────────────────────────────────────────── */}
      <ActivityTable data={recentActivity} />
    </div>
  );
};

export default DashboardOverviewPage;
