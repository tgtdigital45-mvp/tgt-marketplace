import React, { useState, useEffect } from 'react';
import { supabase } from '@tgt/core';
import { useAuth } from '@/contexts/AuthContext';
import { MapPin, Plus, Trash2, Edit2, Home, Check, Loader2 } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { Input, Button } from '@tgt/ui-web';
import { useClientProfileData } from '@/hooks/useClientProfileData';

interface AddressJSON {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zip_code: string;
    nickname?: string;
}

const EMPTY_ADDRESS: AddressJSON = {
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zip_code: '',
    nickname: 'Principal'
};

const ClientAddresses: React.FC = () => {
    const { user, refreshSession } = useAuth();
    const { addToast } = useToast();
    const { data: profileData, isLoading, refetch } = useClientProfileData(user?.id);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    
    // Local state for the single primary address
    const [address, setAddress] = useState<AddressJSON | null>(null);

    useEffect(() => {
        if (profileData?.profile?.address) {
            setAddress(profileData.profile.address);
        }
    }, [profileData]);

    const handleSavePrimaryAddress = async (formData: AddressJSON) => {
        if (!user) return;
        try {
            setSaving(true);
            const { error } = await supabase
                .from('profiles')
                .update({ address: formData })
                .eq('id', user.id);

            if (error) throw error;
            
            addToast('Endereço principal atualizado!', 'success');
            if (refreshSession) await refreshSession();
            await refetch();
            setShowForm(false);
        } catch (err) {
            console.error(err);
            addToast('Erro ao salvar endereço.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteAddress = async () => {
        if (!window.confirm('Deseja realmente remover o endereço principal?')) return;
        try {
            setSaving(true);
            const { error } = await supabase
                .from('profiles')
                .update({ address: null })
                .eq('id', user?.id);

            if (error) throw error;
            addToast('Endereço removido.', 'success');
            if (refreshSession) await refreshSession();
            await refetch();
            setAddress(null);
        } catch (err) {
            addToast('Erro ao remover endereço.', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (isLoading) return (
        <div className="p-20 text-center space-y-4">
            <Loader2 size={48} className="text-brand-primary animate-spin mx-auto opacity-20" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Acessando dados seguros...</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center bg-white/80 backdrop-blur-xl rounded-[2rem] p-8 border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Endereço de Preferência</h2>
                    <p className="text-sm text-slate-400 font-medium">Local principal para recebimento de serviços.</p>
                </div>
                {!showForm && !address && (
                    <Button
                        variant="primary"
                        onClick={() => setShowForm(true)}
                        className="flex items-center gap-2 rounded-xl px-6 font-black text-xs uppercase tracking-widest h-12 shadow-lg shadow-brand-primary/20"
                    >
                        <Plus size={18} /> Configurar Endereço
                    </Button>
                )}
            </div>

            {showForm ? (
                <AddressForm
                    initialData={address || EMPTY_ADDRESS}
                    loading={saving}
                    onCancel={() => setShowForm(false)}
                    onSave={handleSavePrimaryAddress}
                />
            ) : (
                <div className="w-full">
                    {!address ? (
                        <div className="bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-[3rem] p-20 text-center">
                            <MapPin size={64} className="text-slate-200 mx-auto mb-6" />
                            <h3 className="text-xl font-black text-slate-400 mb-2">Sem Endereço Cadastrado</h3>
                            <p className="text-slate-400 text-sm font-medium mb-8">Defina seu endereço principal para agilizar orçamentos e agendamentos.</p>
                            <Button onClick={() => setShowForm(true)} variant="outline" className="rounded-xl border-slate-200 font-black uppercase text-[10px] tracking-widest px-10 h-14">Cadastrar Agora</Button>
                        </div>
                    ) : (
                        <div className="bg-white/80 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[3rem] p-10 relative overflow-hidden group">
                           <div className="absolute top-0 right-0 px-8 py-3 bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest rounded-bl-3xl shadow-lg flex items-center gap-2">
                                <Check size={14} /> Endereço Principal
                            </div>

                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10">
                                <div className="flex items-center gap-6">
                                    <div className="w-20 h-20 bg-brand-primary/5 text-brand-primary rounded-3xl flex items-center justify-center shadow-inner border border-brand-primary/10">
                                        <Home size={36} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <h3 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2">{address.nickname || 'Principal'}</h3>
                                        <div className="flex items-center gap-2 text-slate-400 text-sm font-bold">
                                            <MapPin size={14} className="text-brand-primary" />
                                            CEP {address.zip_code}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setShowForm(true)}
                                        className="flex items-center gap-2 px-6 py-4 bg-white border border-slate-100 rounded-2xl text-slate-600 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-sm"
                                    >
                                        <Edit2 size={16} /> Editar
                                    </button>
                                    <button
                                        onClick={handleDeleteAddress}
                                        className="p-4 bg-red-50 text-red-400 rounded-2xl hover:bg-red-600 hover:text-white transition-all shadow-sm border border-red-100/30"
                                        disabled={saving}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-6">
                                    <div className="bg-slate-50/80 rounded-2xl p-6 border border-slate-100/50">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Logradouro e Número</label>
                                        <p className="text-lg font-black text-slate-800 leading-tight">{address.street}, {address.number}</p>
                                        {address.complement && <p className="text-sm font-bold text-slate-500 mt-1">{address.complement}</p>}
                                    </div>
                                    <div className="bg-slate-50/80 rounded-2xl p-6 border border-slate-100/50">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Referência / Bairro</label>
                                        <p className="text-lg font-black text-slate-800 leading-tight">{address.neighborhood}</p>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <div className="bg-slate-50/80 rounded-2xl p-6 border border-slate-100/50">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Cidade e Estado</label>
                                        <p className="text-xl font-black text-slate-800 tracking-tight capitalize">{address.city} - {address.state}</p>
                                    </div>
                                    <div className="flex items-center gap-4 p-6 bg-emerald-50 rounded-2xl border border-emerald-100/50">
                                        <div className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-md">
                                            <Check size={20} strokeWidth={3} />
                                        </div>
                                        <div>
                                            <p className="text-emerald-700 font-black text-[10px] uppercase tracking-widest leading-none mb-1">Localização Verificada</p>
                                            <p className="text-xs font-bold text-emerald-600/70">Pronto para receber agendamentos</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const AddressForm: React.FC<{ initialData: AddressJSON, loading: boolean, onCancel: () => void, onSave: (data: AddressJSON) => void }> = ({ initialData, loading, onCancel, onSave }) => {
    const [formData, setFormData] = useState<AddressJSON>(initialData);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white/90 backdrop-blur-xl p-10 rounded-[3rem] border border-white shadow-[0_32px_64px_rgba(0,0,0,0.1)] space-y-10 max-w-4xl mx-auto animate-in zoom-in-95 duration-300 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-primary via-indigo-500 to-purple-500 shadow-sm"></div>
            
            <div className="flex items-center gap-6 pb-6 border-b border-slate-100">
                <div className="w-16 h-16 bg-brand-primary text-white rounded-2xl flex items-center justify-center shadow-xl rotate-3">
                    <MapPin size={32} />
                </div>
                <div>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tighter">Onde você está localizado?</h3>
                    <p className="text-sm text-slate-400 font-semibold">Atualize seu endereço para receber os melhores profissionais locais.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2">
                    <Input
                        label="Apelido (ex: Casa, Trabalho)"
                        value={formData.nickname}
                        onChange={e => setFormData({ ...formData, nickname: e.target.value })}
                        required
                        className="bg-slate-50/50 h-14 text-lg font-black"
                    />
                </div>
                <Input
                    label="CEP"
                    value={formData.zip_code}
                    onChange={e => setFormData({ ...formData, zip_code: e.target.value })}
                    required
                    className="bg-slate-50/50 h-14 text-lg font-black"
                    placeholder="00000-000"
                />
                
                <div className="md:col-span-2">
                    <Input
                        label="Logradouro"
                        value={formData.street}
                        onChange={e => setFormData({ ...formData, street: e.target.value })}
                        required
                        className="bg-slate-50 h-14 text-lg font-black"
                    />
                </div>
                <Input
                    label="Número"
                    value={formData.number}
                    onChange={e => setFormData({ ...formData, number: e.target.value })}
                    required
                    className="bg-slate-50 h-14 text-lg font-black"
                />

                <Input
                    label="Complemento"
                    value={formData.complement}
                    onChange={e => setFormData({ ...formData, complement: e.target.value })}
                    className="bg-slate-50/50 h-14 font-black"
                />
                <Input
                    label="Bairro"
                    value={formData.neighborhood}
                    onChange={e => setFormData({ ...formData, neighborhood: e.target.value })}
                    required
                    className="bg-slate-50/50 h-14 font-black"
                />
                <Input
                    label="Cidade"
                    value={formData.city}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                    required
                    className="bg-slate-50/50 h-14 font-black"
                />
                <div className="md:col-span-1">
                    <Input
                        label="Estado"
                        value={formData.state}
                        onChange={e => setFormData({ ...formData, state: e.target.value })}
                        required
                        className="bg-slate-50/50 h-14 font-black"
                        placeholder="Ex: SP"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                <div className="w-12 h-12 bg-white rounded-xl shadow-inner flex items-center justify-center text-slate-300">
                    <Check size={24} />
                </div>
                <p className="text-xs font-bold text-slate-500 leading-relaxed uppercase tracking-widest">Este endereço será utilizado como base para cálculos de deslocamento e disponibilidade dos prestadores.</p>
            </div>

            <div className="flex justify-end gap-4 pt-6">
                <Button variant="ghost" type="button" onClick={onCancel} className="rounded-2xl px-10 font-black text-[10px] uppercase tracking-widest h-14">Cancelar</Button>
                <Button 
                    variant="primary" 
                    type="submit" 
                    isLoading={loading}
                    className="rounded-2xl px-12 font-black text-[10px] uppercase tracking-widest h-14 shadow-xl shadow-brand-primary/20"
                >
                    Salvar Detalhes do Local
                </Button>
            </div>
        </form>
    );
};

export default ClientAddresses;
