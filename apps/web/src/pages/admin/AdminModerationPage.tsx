import React, { useEffect, useState } from 'react';
import { supabase } from '@tgt/shared';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Flag, 
  CheckCircle, 
  XCircle, 
  User, 
  Clock, 
  ExternalLink,
  ChevronDown,
  AlertTriangle,
  Search
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Report {
    id: string;
    reporter_id: string;
    reported_id: string;
    type: 'company' | 'user' | 'chat';
    reason: string;
    details: string;
    status: 'pending' | 'resolved' | 'dismissed';
    created_at: string;
    reporter: { full_name: string; email: string } | null;
}

const AdminModerationPage: React.FC = () => {
    const { user } = useAuth();
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'resolved' | 'dismissed'>('pending');
    const [searchTerm, setSearchTerm] = useState('');

    const fetchReports = async () => {
        try {
            setLoading(true);
            let query = supabase
                .from('reports')
                .select('*, reporter:reporter_id(full_name, email)')
                .order('created_at', { ascending: false });

            if (filter !== 'all') {
                query = query.eq('status', filter);
            }

            const { data, error } = await query;

            if (error) throw error;
            setReports(data as unknown as Report[]);
        } catch (err) {
            console.error('Error fetching reports:', err);
            toast.error('Erro ao carregar denúncias');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.role === 'admin') {
            fetchReports();
        }
    }, [user, filter]);

    const handleAction = async (reportId: string, status: 'resolved' | 'dismissed') => {
        try {
            const { error } = await supabase
                .from('reports')
                .update({ status })
                .eq('id', reportId);

            if (error) throw error;

            toast.success(`Denúncia ${status === 'resolved' ? 'resolvida' : 'descartada'} com sucesso`);
            setReports(prev => prev.map(r => r.id === reportId ? { ...r, status } : r));
        } catch (err) {
            console.error('Error updating report:', err);
            toast.error('Erro ao atualizar denúncia');
        }
    };

    const filteredReports = reports.filter(r => 
        r.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.reporter?.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (user?.role !== 'admin') {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <Shield className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900">Acesso Restrito</h2>
                    <p className="text-gray-500">Você não tem permissão para acessar esta área.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Shield className="text-primary-600" />
                        Moderação Global
                    </h1>
                    <p className="text-sm text-gray-500">Gerencie denúncias e mantenha a integridade da plataforma.</p>
                </div>

                <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-gray-100 shadow-sm">
                    {(['pending', 'resolved', 'dismissed', 'all'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all capitalize ${
                                filter === f 
                                ? 'bg-primary-600 text-white shadow-md shadow-primary-200' 
                                : 'text-gray-500 hover:bg-gray-50'
                            }`}
                        >
                            {f === 'pending' ? 'Pendentes' : f === 'resolved' ? 'Resolvidos' : f === 'dismissed' ? 'Descartados' : 'Todos'}
                        </button>
                    ))}
                </div>
            </header>

            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors" size={18} />
                <input 
                    type="text" 
                    placeholder="Buscar por motivo, detalhes ou denunciante..."
                    className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-48 bg-gray-100 rounded-3xl animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    <AnimatePresence mode="popLayout">
                        {filteredReports.map((report) => (
                            <motion.div
                                key={report.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className={`bg-white border rounded-3xl p-5 sm:p-6 transition-all	${
                                    report.status === 'pending' 
                                    ? 'border-gray-100 shadow-sm' 
                                    : 'border-transparent bg-gray-50/50 opacity-75'
                                }`}
                            >
                                <div className="flex flex-col sm:flex-row justify-between gap-4">
                                    <div className="space-y-3 flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                                                report.type === 'company' ? 'bg-purple-100 text-purple-700' :
                                                report.type === 'user' ? 'bg-blue-100 text-blue-700' :
                                                'bg-amber-100 text-amber-700'
                                            }`}>
                                                {report.type === 'company' ? 'Empresa' : report.type === 'user' ? 'Usuário' : 'Chat'}
                                            </span>
                                            <span className="flex items-center gap-1 text-[11px] font-bold text-gray-400">
                                                <Clock size={12} />
                                                {new Date(report.created_at).toLocaleString('pt-BR')}
                                            </span>
                                        </div>

                                        <div>
                                            <h3 className="text-base font-bold text-gray-900 mb-1 flex items-center gap-2">
                                                <AlertTriangle size={18} className="text-amber-500" />
                                                {report.reason}
                                            </h3>
                                            <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-2xl border border-gray-100 italic">
                                                "{report.details}"
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2 pt-2">
                                            <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center text-primary-700 font-bold text-xs">
                                                {report.reporter?.full_name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-tight">Denunciante</p>
                                                <p className="text-xs font-bold text-gray-700">{report.reporter?.full_name}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-row sm:flex-col justify-end gap-2 sm:min-w-[140px]">
                                        {report.status === 'pending' ? (
                                            <>
                                                <button 
                                                    onClick={() => handleAction(report.id, 'resolved')}
                                                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-success text-white text-xs font-bold rounded-xl hover:shadow-lg transition-all"
                                                >
                                                    <CheckCircle size={14} />
                                                    Resolver
                                                </button>
                                                <button 
                                                    onClick={() => handleAction(report.id, 'dismissed')}
                                                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-600 text-xs font-bold rounded-xl hover:bg-gray-50 transition-all"
                                                >
                                                    <XCircle size={14} />
                                                    Descartar
                                                </button>
                                            </>
                                        ) : (
                                            <div className="flex items-center justify-center gap-1.5 py-4 px-2">
                                                {report.status === 'resolved' ? (
                                                    <>
                                                        <CheckCircle size={16} className="text-success" />
                                                        <span className="text-xs font-black text-success uppercase tracking-widest">Resolvido</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <XCircle size={16} className="text-gray-400" />
                                                        <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Descartado</span>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                        <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100/80 text-gray-500 text-[10px] font-black uppercase rounded-xl hover:bg-gray-200 transition-all">
                                            <ExternalLink size={12} />
                                            Ver Alvo
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {!loading && filteredReports.length === 0 && (
                        <div className="py-20 text-center space-y-4">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                                <Shield className="w-10 h-10 text-gray-200" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Limpo por aqui!</h3>
                                <p className="text-sm text-gray-400">Nenhuma denúncia pendente encontrada para este filtro.</p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminModerationPage;
