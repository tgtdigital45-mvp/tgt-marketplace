import React, { useState, useEffect } from 'react';
import { supabase } from '@tgt/core';;
import { useAuth } from '@/contexts/AuthContext';
import { MapPin, Plus, Trash2, Edit2, Home, Briefcase, User, Check } from 'lucide-react';


import { useToast } from '@/contexts/ToastContext';
import { Input, Button } from '@tgt/ui-web';


interface Address {
    id: string;
    nickname: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zip_code: string;
    reference_point?: string;
    is_default: boolean;
}

const ClientAddresses: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);

    useEffect(() => {
        if (user) {
            fetchAddresses();
        }
    }, [user]);

    const fetchAddresses = async () => {
        try {
            const { data, error } = await supabase
                .from('user_addresses')
                .select('*')
                .eq('user_id', user?.id)
                .order('is_default', { ascending: false })
                .order('created_at', { ascending: false });

            if (error) throw error;
            setAddresses(data || []);
        } catch (err) {
            console.error('Error fetching addresses:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Tem certeza que deseja excluir este endereço?')) return;

        try {
            const { error } = await supabase.from('user_addresses').delete().eq('id', id);
            if (error) throw error;
            addToast('Endereço excluído com sucesso!', 'success');
            fetchAddresses();
        } catch (err) {
            addToast('Erro ao excluir endereço.', 'error');
        }
    };

    const handleSetDefault = async (id: string) => {
        try {
            await supabase.from('user_addresses').update({ is_default: false }).eq('user_id', user?.id);
            const { error } = await supabase.from('user_addresses').update({ is_default: true }).eq('id', id);
            if (error) throw error;
            fetchAddresses();
        } catch (err) {
            addToast('Erro ao definir endereço padrão.', 'error');
        }
    };

    if (loading) return (
        <div className="p-20 text-center space-y-4">
            <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Carregando seus endereços...</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Meus Endereços</h2>
                    <p className="text-sm text-slate-400 font-medium">Gerencie onde você recebe seus atendimentos.</p>
                </div>
                {!showForm && (
                    <Button
                        variant="primary"
                        onClick={() => { setShowForm(true); setEditingAddress(null); }}
                        className="flex items-center gap-2 rounded-xl px-6 font-black text-xs uppercase tracking-widest"
                    >
                        <Plus size={18} /> Novo Endereço
                    </Button>
                )}
            </div>

            {showForm ? (
                <AddressForm
                    userId={user?.id}
                    initialData={editingAddress}
                    onCancel={() => setShowForm(false)}
                    onSuccess={() => { setShowForm(false); fetchAddresses(); }}
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {addresses.length === 0 ? (
                        <div className="md:col-span-2 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3rem] p-20 text-center">
                            <MapPin size={64} className="text-slate-200 mx-auto mb-6" />
                            <h3 className="text-xl font-black text-slate-400 mb-2">Nenhum endereço cadastrado</h3>
                            <p className="text-slate-400 text-sm font-medium mb-8">Adicione um endereço para agilizar suas contratações.</p>
                            <Button onClick={() => setShowForm(true)} variant="outline" className="rounded-xl border-slate-200">Começar Agora</Button>
                        </div>
                    ) : (
                        addresses.map((address) => (
                            <div
                                key={address.id}
                                className={`p-8 rounded-[2.5rem] border transition-all relative group overflow-hidden ${address.is_default 
                                    ? 'bg-white border-brand-primary/20 shadow-xl shadow-brand-primary/5 ring-4 ring-brand-primary/5' 
                                    : 'bg-white border-slate-100 hover:border-slate-300 hover:shadow-lg'
                                }`}
                            >
                                {address.is_default && (
                                    <div className="absolute top-0 right-0 px-6 py-2 bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest rounded-bl-3xl shadow-lg">
                                        Padrão
                                    </div>
                                )}
                                
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-4 rounded-2xl ${address.nickname === 'Casa' ? 'bg-blue-50 text-blue-600' : address.nickname === 'Trabalho' ? 'bg-orange-50 text-orange-600' : 'bg-slate-50 text-slate-600'}`}>
                                            {address.nickname === 'Casa' ? <Home size={24} /> : address.nickname === 'Trabalho' ? <Briefcase size={24} /> : <User size={24} />}
                                        </div>
                                        <h3 className="text-xl font-black text-slate-800">{address.nickname}</h3>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                        <button
                                            onClick={() => { setEditingAddress(address); setShowForm(true); }}
                                            className="p-3 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-indigo-600 transition-colors bg-white border border-slate-100 shadow-sm"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(address.id)}
                                            className="p-3 hover:bg-red-50 rounded-xl text-slate-400 hover:text-red-500 transition-colors bg-white border border-slate-100 shadow-sm"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-lg font-bold text-slate-700 leading-tight">
                                        {address.street}, {address.number}
                                    </p>
                                    {address.complement && (
                                        <p className="text-slate-400 font-medium text-sm italic">{address.complement}</p>
                                    )}
                                    <p className="text-xs text-slate-500 font-black uppercase tracking-widest pt-2">
                                        {address.neighborhood}, {address.city} - {address.state}
                                    </p>
                                </div>

                                <div className="mt-8 flex items-center justify-between pt-6 border-t border-slate-50">
                                    <div className="flex items-center gap-2">
                                        <MapPin size={14} className="text-brand-primary" />
                                        <span className="text-[11px] font-black text-slate-400 tracking-widest">
                                            CEP {address.zip_code}
                                        </span>
                                    </div>
                                    {!address.is_default && (
                                        <button
                                            onClick={() => handleSetDefault(address.id)}
                                            className="text-[10px] font-black text-slate-400 hover:text-brand-primary uppercase tracking-widest transition-all hover:translate-x-1"
                                        >
                                            Definir como padrão →
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

const AddressForm: React.FC<{ userId?: string, initialData: Address | null, onCancel: () => void, onSuccess: () => void }> = ({ userId, initialData, onCancel, onSuccess }) => {
    const { addToast } = useToast();
    const [formData, setFormData] = useState<Partial<Address>>(initialData || {
        nickname: '',
        street: '',
        number: '',
        neighborhood: '',
        city: '',
        state: '',
        zip_code: '',
        is_default: false
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (initialData?.id) {
                const { error } = await supabase.from('user_addresses').update(formData).eq('id', initialData.id);
                if (error) throw error;
                addToast('Endereço atualizado!', 'success');
            } else {
                const { error } = await supabase.from('user_addresses').insert([{ ...formData, user_id: userId }]);
                if (error) throw error;
                addToast('Endereço adicionado!', 'success');
            }
            onSuccess();
        } catch (err) {
            addToast('Erro ao salvar endereço.', 'error');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-2xl space-y-8 max-w-3xl mx-auto animate-in zoom-in-95 duration-200 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-primary to-indigo-500"></div>
            
            <div>
                <h3 className="text-2xl font-black text-slate-800">{initialData ? 'Editar Endereço' : 'Cadastrar Novo Endereço'}</h3>
                <p className="text-sm text-slate-400 font-medium">Preencha os campos abaixo com atenção.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                    label="Apelido (ex: Casa, Trabalho)"
                    value={formData.nickname}
                    onChange={e => setFormData({ ...formData, nickname: e.target.value })}
                    required
                    className="bg-slate-50/50"
                />
                <Input
                    label="CEP"
                    value={formData.zip_code}
                    onChange={e => setFormData({ ...formData, zip_code: e.target.value })}
                    required
                    className="bg-slate-50/50"
                />
                <div className="md:col-span-2">
                    <Input
                        label="Rua / Avenida"
                        value={formData.street}
                        onChange={e => setFormData({ ...formData, street: e.target.value })}
                        required
                        className="bg-slate-50/50 text-lg font-bold"
                    />
                </div>
                <Input
                    label="Número"
                    value={formData.number}
                    onChange={e => setFormData({ ...formData, number: e.target.value })}
                    required
                    className="bg-slate-50/50"
                />
                <Input
                    label="Complemento"
                    value={formData.complement}
                    onChange={e => setFormData({ ...formData, complement: e.target.value })}
                    className="bg-slate-50/50"
                />
                <Input
                    label="Bairro"
                    value={formData.neighborhood}
                    onChange={e => setFormData({ ...formData, neighborhood: e.target.value })}
                    required
                    className="bg-slate-50/50"
                />
                <Input
                    label="Cidade"
                    value={formData.city}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                    required
                    className="bg-slate-50/50"
                />
                <Input
                    label="Estado"
                    value={formData.state}
                    onChange={e => setFormData({ ...formData, state: e.target.value })}
                    required
                    className="bg-slate-50/50"
                />
            </div>

            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <input
                    type="checkbox"
                    id="is_default"
                    checked={formData.is_default}
                    onChange={e => setFormData({ ...formData, is_default: e.target.checked })}
                    className="w-5 h-5 rounded text-brand-primary focus:ring-brand-primary cursor-pointer transition-all"
                />
                <label htmlFor="is_default" className="text-sm font-black text-slate-600 cursor-pointer select-none">Definir como endereço padrão para novos agendamentos</label>
            </div>

            <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" type="button" onClick={onCancel} className="rounded-xl px-8 font-black">Cancelar</Button>
                <Button variant="primary" type="submit" className="rounded-xl px-8 font-black shadow-lg shadow-brand-primary/20">Salvar Endereço Premium</Button>
            </div>
        </form>
    );
};

export default ClientAddresses;
