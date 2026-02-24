import React, { useState, useEffect } from 'react';
import { supabase } from '@tgt/shared';
import { useAuth } from '@/contexts/AuthContext';
import { MapPin, Plus, Trash2, Edit2, Home, Briefcase, User, Check } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useToast } from '@/contexts/ToastContext';

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
            // Clear all defaults first
            await supabase.from('user_addresses').update({ is_default: false }).eq('user_id', user?.id);
            // Set new default
            const { error } = await supabase.from('user_addresses').update({ is_default: true }).eq('id', id);
            if (error) throw error;
            fetchAddresses();
        } catch (err) {
            addToast('Erro ao definir endereço padrão.', 'error');
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Carregando endereços...</div>;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-800">Meus Endereços</h2>
                {!showForm && (
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={() => { setShowForm(true); setEditingAddress(null); }}
                        className="flex items-center gap-2"
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.length === 0 ? (
                        <div className="md:col-span-2 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
                            <MapPin size={48} className="text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-500 font-medium">Você ainda não cadastrou nenhum endereço.</p>
                        </div>
                    ) : (
                        addresses.map((address) => (
                            <div
                                key={address.id}
                                className={`p-6 rounded-3xl border transition-all relative group ${address.is_default ? 'bg-brand-primary/5 border-brand-primary/20 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-300'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-xl ${address.nickname === 'Casa' ? 'bg-blue-100 text-blue-600' : address.nickname === 'Trabalho' ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-600'}`}>
                                            {address.nickname === 'Casa' ? <Home size={20} /> : address.nickname === 'Trabalho' ? <Briefcase size={20} /> : <User size={20} />}
                                        </div>
                                        <h3 className="font-bold text-slate-800">{address.nickname}</h3>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => { setEditingAddress(address); setShowForm(true); }}
                                            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(address.id)}
                                            className="p-2 hover:bg-red-50 rounded-lg text-red-400 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                                    {address.street}, {address.number}
                                    {address.complement && ` - ${address.complement}`}
                                </p>
                                <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-tight">
                                    {address.neighborhood}, {address.city} - {address.state}
                                </p>

                                <div className="mt-4 flex items-center justify-between">
                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none">
                                        CEP {address.zip_code}
                                    </span>
                                    {!address.is_default ? (
                                        <button
                                            onClick={() => handleSetDefault(address.id)}
                                            className="text-xs font-bold text-slate-400 hover:text-brand-primary transition-colors"
                                        >
                                            Definir como padrão
                                        </button>
                                    ) : (
                                        <span className="flex items-center gap-1 text-xs font-bold text-brand-primary">
                                            <Check size={14} strokeWidth={3} /> Padrão
                                        </span>
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
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-lg space-y-6 max-w-2xl mx-auto animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-800">{initialData ? 'Editar Endereço' : 'Cadastrar Novo Endereço'}</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                    label="Apelido (ex: Casa, Trabalho)"
                    value={formData.nickname}
                    onChange={e => setFormData({ ...formData, nickname: e.target.value })}
                    required
                />
                <Input
                    label="CEP"
                    value={formData.zip_code}
                    onChange={e => setFormData({ ...formData, zip_code: e.target.value })}
                    required
                />
                <div className="md:col-span-2">
                    <Input
                        label="Rua / Avenida"
                        value={formData.street}
                        onChange={e => setFormData({ ...formData, street: e.target.value })}
                        required
                    />
                </div>
                <Input
                    label="Número"
                    value={formData.number}
                    onChange={e => setFormData({ ...formData, number: e.target.value })}
                    required
                />
                <Input
                    label="Complemento"
                    value={formData.complement}
                    onChange={e => setFormData({ ...formData, complement: e.target.value })}
                />
                <Input
                    label="Bairro"
                    value={formData.neighborhood}
                    onChange={e => setFormData({ ...formData, neighborhood: e.target.value })}
                    required
                />
                <Input
                    label="Cidade"
                    value={formData.city}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                    required
                />
                <Input
                    label="Estado"
                    value={formData.state}
                    onChange={e => setFormData({ ...formData, state: e.target.value })}
                    required
                />
            </div>

            <div className="flex items-center gap-2 py-2">
                <input
                    type="checkbox"
                    id="is_default"
                    checked={formData.is_default}
                    onChange={e => setFormData({ ...formData, is_default: e.target.checked })}
                    className="w-4 h-4 rounded text-brand-primary focus:ring-brand-primary"
                />
                <label htmlFor="is_default" className="text-sm font-bold text-slate-600 cursor-pointer">Definir como endereço padrão</label>
            </div>

            <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" type="button" onClick={onCancel}>Cancelar</Button>
                <Button variant="primary" type="submit">Salvar Endereço</Button>
            </div>
        </form>
    );
};

export default ClientAddresses;
