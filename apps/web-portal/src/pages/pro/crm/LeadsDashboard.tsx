import React from 'react';
import { PageTransition } from '@tgt/shared';
import { useLeads, LeadOpportunity } from '@portal/hooks/useLeads';
import { 
  Flame, 
  Thermometer, 
  TrendingUp, 
  Search, 
  Filter, 
  Clock, 
  MoreVertical,
  ChevronRight,
  MessageSquare,
  Phone,
  Calendar,
  Zap,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

const LeadsDashboard: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { leads, isLoading, refreshScore } = useLeads();

  const getTempColor = (temp: string) => {
    switch (temp) {
      case 'hot': return 'text-orange-600 bg-orange-50 border-orange-100';
      case 'warm': return 'text-amber-600 bg-amber-50 border-amber-100';
      default: return 'text-blue-600 bg-blue-50 border-blue-100';
    }
  };

  if (isLoading) {
    return (
      <div className="h-[600px] flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-100">
        <Loader2 className="w-10 h-10 text-brand-primary animate-spin mb-4" />
        <p className="text-slate-500 font-medium anim-pulse">Analisando oportunidades quentes...</p>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
              Dashboard de Leads
              <span className="bg-orange-500 text-white text-[10px] uppercase font-black px-2 py-0.5 rounded-full tracking-tighter shadow-lg shadow-orange-500/20">Alpha</span>
            </h1>
            <p className="text-slate-500 text-sm">Priorizamos para você as pessoas com maior probabilidade de fechar serviço hoje.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-primary transition-colors" />
              <input 
                type="text" 
                placeholder="Buscar oportunidade..."
                className="bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all outline-none w-64 shadow-sm"
              />
            </div>
            <button className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
              <Filter className="w-5 h-5 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Intelligence Cards Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-5">
            <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center">
              <Flame className="w-7 h-7 text-orange-500" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Hot Leads</p>
              <p className="text-2xl font-black text-slate-900">{leads?.filter(l => l.temperature === 'hot').length || 0}</p>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-5">
            <div className="w-14 h-14 bg-brand-primary/5 rounded-2xl flex items-center justify-center">
              <Zap className="w-7 h-7 text-brand-primary" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Pontuação Média</p>
              <p className="text-2xl font-black text-slate-900">
                {leads && leads.length > 0 
                  ? Math.round(leads.reduce((acc, curr) => acc + curr.score, 0) / leads.length) 
                  : 0}
              </p>
            </div>
          </div>

          <div className="bg-brand-primary p-6 rounded-3xl shadow-xl shadow-brand-primary/20 text-white group cursor-help relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <AlertCircle className="w-20 h-20" />
            </div>
            <h3 className="font-bold mb-1 flex items-center gap-2">
              Auto Follow-up
            </h3>
            <p className="text-brand-light/70 text-xs">Existem 3 clientes aguardando resposta há mais de 24h. Comece por eles!</p>
          </div>
        </div>

        {/* Main Leads List */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200">
                  <th className="px-6 py-4 text-[10px] uppercase font-black text-slate-400 tracking-widest">Oportunidade</th>
                  <th className="px-6 py-4 text-[10px] uppercase font-black text-slate-400 tracking-widest text-center">Score / Temp.</th>
                  <th className="px-6 py-4 text-[10px] uppercase font-black text-slate-400 tracking-widest">Última Interação</th>
                  <th className="px-6 py-4 text-[10px] uppercase font-black text-slate-400 tracking-widest">Potencial</th>
                  <th className="px-6 py-4 text-[10px] uppercase font-black text-slate-400 tracking-widest">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leads && leads.length > 0 ? (
                  leads.map((lead) => (
                    <tr key={lead.customer_id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <Link 
                          to={`/dashboard/empresa/${slug}/crm/cliente/${lead.customer_id}`}
                          className="flex items-center gap-3"
                        >
                          <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 flex-shrink-0">
                            {lead.customer_avatar ? (
                              <img src={lead.customer_avatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold">
                                {lead.customer_name[0]}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-800 truncate hover:text-brand-primary transition-colors">{lead.customer_name}</p>
                            <span className="text-[10px] text-slate-400 font-medium">#{lead.customer_id.substring(0, 8)}</span>
                          </div>
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-center gap-1.5">
                          <div className="flex items-center gap-2">
                             <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${lead.temperature === 'hot' ? 'bg-orange-500' : lead.temperature === 'warm' ? 'bg-amber-400' : 'bg-blue-400'}`}
                                  style={{ width: `${Math.min(lead.score, 100)}%` }}
                                />
                             </div>
                             <span className="text-xs font-black text-slate-700">{lead.score}</span>
                          </div>
                          <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${getTempColor(lead.temperature)}`}>
                            {lead.temperature === 'hot' ? 'Fogo' : lead.temperature === 'warm' ? 'Morno' : 'Frio'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-600 text-xs font-medium">
                          <Clock className="w-3.5 h-3.5 opacity-40" />
                          {new Date(lead.last_interaction_at).toLocaleDateString('pt-BR')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-slate-700">Exploração</span>
                          <p className="text-[10px] text-slate-400 leading-tight">Cliente recorrente em potencial</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-2 text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-all" title="Enviar Mensagem">
                            <MessageSquare className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => refreshScore(lead.customer_id)}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all" 
                            title="Recalcular Score"
                          >
                            <TrendingUp className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-20 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <Search className="w-12 h-12 mb-4 opacity-10" />
                        <h3 className="font-bold text-lg mb-1">Nenhum lead encontrado</h3>
                        <p className="text-sm max-w-xs mx-auto">Assim que você receber novos orçamentos ou mensagens, a inteligência do CRM começará a mapeá-los aqui.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default LeadsDashboard;
