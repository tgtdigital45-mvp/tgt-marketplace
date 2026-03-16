import React from 'react';
import { PageTransition } from '@tgt/shared';
import { useCRMAnalytics } from '@portal/hooks/useCRMAnalytics';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Target, 
  BarChart3, 
  PieChart as PieChartIcon,
  Loader2,
  AlertCircle
} from 'lucide-react';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const CRMAnalyticsPage: React.FC = () => {
  const { data: stats, isLoading, isError } = useCRMAnalytics();

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-brand-primary animate-spin" />
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className="p-8 text-center bg-red-50 rounded-3xl border border-red-100 m-6">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-lg font-bold text-red-800">Erro ao carregar Analytics</h2>
        <p className="text-red-600">Verifique se você tem permissões ou se o banco de dados está sincronizado.</p>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="p-6 md:p-10 space-y-8 bg-slate-50 min-h-screen">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-brand-primary" />
              CRM Insights & BI
            </h1>
            <p className="text-slate-500 text-sm">Visão inteligente da sua performance de vendas e prospecção.</p>
          </div>
          <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-xs font-bold text-slate-600">Dados em Tempo Real</span>
          </div>
        </header>

        {/* Global KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard 
            title="Pipeline Total" 
            value={`R$ ${(stats.pipeline_value || 0).toLocaleString('pt-BR')}`} 
            icon={<DollarSign className="w-6 h-6" />}
            subtitle="Valor em negociação"
            color="indigo"
          />
          <KPICard 
            title="Taxa de Conversão" 
            value={`${(stats.conversion_rate || 0).toFixed(1)}%`} 
            icon={<Target className="w-6 h-6" />}
            subtitle="Leads fechados / total"
            color="emerald"
          />
          <KPICard 
            title="Volume de Funil" 
            value={(stats.funnel_data || []).reduce((acc, curr) => acc + (curr.item_count || 0), 0).toString()} 
            icon={<BarChart3 className="w-6 h-6" />}
            subtitle="Itens ativos no Kanban"
            color="amber"
          />
          <KPICard 
            title="Ticket Médio CRM" 
            value={`R$ ${((stats.pipeline_value || 0) / ((stats.funnel_data || []).reduce((acc, curr) => acc + (curr.item_count || 0), 0) || 1)).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`} 
            icon={<TrendingUp className="w-6 h-6" />}
            subtitle="Valor médio por card"
            color="violet"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Funnel Distribution Chart */}
          <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
            <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-500" />
                Saúde do Funil (Financeiro)
            </h2>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.funnel_data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} tick={{ fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} fontSize={12} tick={{ fill: '#64748b' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="total_value" name="Valor Total" radius={[8, 8, 0, 0]} barSize={40}>
                    {stats.funnel_data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex flex-wrap gap-4">
               {stats.funnel_data.map((stage, idx) => (
                 <div key={stage.slug} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="text-[10px] font-bold text-slate-500 uppercase">{stage.name}: {stage.item_count} itens</span>
                 </div>
               ))}
            </div>
          </div>

          {/* Lead Temperature Distribution */}
          <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
            <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-amber-500" />
                Qualidade das Oportunidades
            </h2>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.temperature_data}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={8}
                    dataKey="count"
                    nameKey="temperature"
                  >
                    {stats.temperature_data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.temperature === 'Quente' ? '#ef4444' : entry.temperature === 'Morna' ? '#f59e0b' : '#3b82f6'} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center mt-2">
                <p className="text-xs text-slate-400 italic">Baseado no Lead Scoring da Sprint 3</p>
            </div>
          </div>
        </div>

        {/* Detailed Metrics Table */}
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
             <div className="p-8 border-b border-slate-50">
                 <h2 className="text-xl font-black text-slate-800">Detalhamento por Estágio</h2>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50">
                            <th className="px-8 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Estágio</th>
                            <th className="px-8 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Métricas</th>
                            <th className="px-8 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-right">Valor Projetado</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {stats.funnel_data.map((stage) => (
                            <tr key={stage.slug} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-400">
                                            {stage.order_index}
                                        </div>
                                        <span className="font-bold text-slate-800">{stage.name}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-black">
                                        {stage.item_count} {stage.item_count === 1 ? 'oportunidade' : 'oportunidades'}
                                    </span>
                                </td>
                                <td className="px-8 py-6 text-right font-black text-slate-900">
                                    R$ {(stage.total_value || 0).toLocaleString('pt-BR')}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>
        </div>
      </div>
    </PageTransition>
  );
};

interface KPICardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  color: 'indigo' | 'emerald' | 'amber' | 'violet';
}

const KPICard: React.FC<KPICardProps> = ({ title, value, subtitle, icon, color }) => {
  const colorMap = {
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    violet: 'bg-violet-50 text-violet-600',
  };

  return (
    <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm group hover:scale-[1.02] transition-all cursor-default">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-2xl ${colorMap[color]} group-hover:scale-110 transition-all`}>
          {icon}
        </div>
        <div className="bg-slate-50 px-2 py-0.5 rounded-lg text-[10px] font-black text-slate-400 uppercase tracking-widest">KPI</div>
      </div>
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter mb-1">{title}</p>
        <h3 className="text-2xl font-black text-slate-900 mb-1">{value}</h3>
        <p className="text-[10px] text-slate-400 flex items-center gap-1">
          {subtitle}
        </p>
      </div>
    </div>
  );
};

export default CRMAnalyticsPage;
