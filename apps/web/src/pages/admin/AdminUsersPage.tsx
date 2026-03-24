import React, { useEffect, useState } from 'react';
import { supabase } from '@tgt/core';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { LoadingSpinner, Button } from '@tgt/ui-web';
import { Link, useNavigate } from 'react-router-dom';

interface Profile {
    id: string;
    full_name: string;
    email: string;
    user_type: string;
    role: string;
    created_at: string;
    status: string; // Coluna nova a ser adicionada via SQL: 'active', 'suspended'
    companies?: { id: string, current_plan_tier: string }[];
}

const AdminUsersPage = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const navigate = useNavigate();

    const fetchProfiles = async () => {
        try {
            setLoading(true);
            const { data: profilesData, error: profilesError } = await supabase
                .from('profiles')
                .select('id, full_name, email, user_type, role, created_at, status')
                .order('created_at', { ascending: false });

            let validProfiles: any[] = profilesData || [];

            if (profilesError) {
                // Em caso de erro pela falta da coluna 'status', tenta novamente ignorando-a
                if (profilesError.code === '42703' /* Missing Column */) {
                   const { data: fallbackData } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
                   validProfiles = (fallbackData || []).map(p => ({ ...p, status: 'active' }));
                } else {
                   throw profilesError;
                }
            }

            // Realiza um lookup independente das empresas para evitar 'Could not find a relationship' (PGRST 400)
            const { data: companiesData } = await supabase
                .from('companies')
                .select('id, profile_id, current_plan_tier');

            const companiesMap = new Map();
            if (companiesData) {
                companiesData.forEach(c => companiesMap.set(c.profile_id, c));
            }

            // Mapeia os dados do perfil fundindo a informação de plano se houver
            const mergedProfiles = validProfiles.map(p => {
                const company = companiesMap.get(p.id);
                return {
                    ...p,
                    companies: company ? [company] : undefined
                };
            });

            setProfiles(mergedProfiles as any);
        } catch (err: any) {
            console.error('Error fetching profiles:', err);
            addToast('Erro ao carregar usuários', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.role === 'admin' || import.meta.env.DEV) {
            fetchProfiles();
        } else {
            console.warn("User is not admin");
            navigate('/admin');
        }
    }, [user, navigate]);

    const handleChangePlan = async (profileId: string, companyId: string, currentPlan: string) => {
        const newPlan = prompt(`Digite o novo plano (basic, pro, agency):`, currentPlan || 'basic');
        if (!newPlan) return;
        
        try {
            setProcessingId(profileId);
            const { error } = await supabase.from('companies').update({ current_plan_tier: newPlan }).eq('id', companyId);
            if (error) throw error;
            
            addToast('Plano de assinatura atualizado com sucesso!', 'success');
            setProfiles(prev => prev.map(p => {
                if (p.id === profileId && p.companies) {
                    return { ...p, companies: [{...p.companies[0], current_plan_tier: newPlan}] };
                }
                return p;
            }));
        } catch (err: any) {
            console.error(err);
            addToast('Erro ao atualizar plano de assinatura.', 'error');
        } finally {
            setProcessingId(null);
        }
    };

    const handleToggleStatus = async (profile: Profile) => {
        const newStatus = profile.status === 'suspended' ? 'active' : 'suspended';
        const actionStr = newStatus === 'suspended' ? 'SUSPENDER' : 'REATIVAR';
        
        if (!confirm(`Tem certeza que deseja ${actionStr} a conta de ${profile.full_name}?`)) return;

        setProcessingId(profile.id);
        try {
            const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', profile.id);

            if (error) {
                 if (error.code === '42703') throw new Error('A coluna de status ainda não existe no Banco. Rode o Script SQL da Sprint 2.');
                 throw error;
            }

            addToast(`Conta ${newStatus === 'suspended' ? 'suspensa' : 'reativada'} com sucesso!`, 'success');
            setProfiles(prev => prev.map(p => p.id === profile.id ? { ...p, status: newStatus } : p));
        } catch (err: any) {
            console.error('Action error:', err);
            addToast('Erro ao processar ação: ' + err.message, 'error');
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Gerenciamento de Usuários</h1>
                        <p className="text-gray-500 mt-1">Lista completa e moderação direta dos perfis do MVP.</p>
                    </div>
                    <Link to="/admin" className="text-brand-primary hover:text-brand-secondary">
                        &larr; Voltar ao Dashboard
                    </Link>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuário</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registro</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plano</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading ? (
                                    <tr><td colSpan={5} className="py-8"><LoadingSpinner /></td></tr>
                                ) : profiles.map((p) => (
                                    <tr key={p.id} className="hover:bg-gray-50 text-sm">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-900">{p.full_name || 'Sem Nome'}</div>
                                            <div className="text-gray-500">{p.email}</div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">
                                            {p.created_at ? new Date(p.created_at).toLocaleDateString('pt-BR') : '--'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-2 py-0.5 text-xs font-bold rounded-full ${p.user_type === 'client' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                                {p.user_type === 'client' ? 'Cliente' : 'Empresa'}
                                            </span>
                                            {p.role === 'admin' && <span className="ml-1 text-[10px] text-red-500 font-bold uppercase">(Admin)</span>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-2 py-0.5 text-xs font-bold rounded ${(!p.status || p.status === 'active') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {(!p.status || p.status === 'active') ? 'Ativo' : 'Suspenso'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-medium text-gray-500">
                                            {p.user_type === 'company' && p.companies && p.companies.length > 0 ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="uppercase text-brand-primary font-bold">{p.companies[0].current_plan_tier || 'basic'}</span>
                                                    <button onClick={() => handleChangePlan(p.id, p.companies![0].id, p.companies![0].current_plan_tier)} className="text-gray-400 hover:text-brand-primary" title="Forçar Alteração de Plano">✏️</button>
                                                </div>
                                            ) : (
                                                '--'
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {p.role !== 'admin' && (
                                                <Button
                                                    variant={(!p.status || p.status === 'active') ? "danger" : "outline"}
                                                    size="sm"
                                                    disabled={processingId === p.id}
                                                    onClick={() => handleToggleStatus(p)}
                                                >
                                                    {processingId === p.id ? '...' : ((!p.status || p.status === 'active') ? 'Suspender Conta' : 'Reativar')}
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminUsersPage;
