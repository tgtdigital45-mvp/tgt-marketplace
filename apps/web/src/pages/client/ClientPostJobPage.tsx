
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@tgt/shared';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useToast } from '@/contexts/ToastContext';

interface Category {
    id: string;
    name: string;
}

const ClientPostJobPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { showToast } = useToast();

    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        category_id: '',
        description: '',
        budget_min: '',
        budget_max: '',
        address: '',
        city: '',
        state: '',
        zip_code: '',
        urgency: 'medium'
    });


    const fetchCategories = React.useCallback(async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('categories')
                .select('id, name')
                .order('name');

            if (error) throw error;
            if (data) setCategories(data);
        } catch (error) {
            console.error('Error fetching categories:', error);
            showToast('Erro ao carregar categorias', 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        // Basic Validation
        if (!formData.title || !formData.category_id || !formData.description) {
            showToast('Preencha os campos obrigatórios', 'error');
            return;
        }

        try {
            setSubmitting(true);

            const { error } = await supabase.from('jobs').insert({
                user_id: user.id,
                category_id: formData.category_id,
                title: formData.title,
                description: formData.description,
                budget_min: formData.budget_min ? parseFloat(formData.budget_min) : null,
                budget_max: formData.budget_max ? parseFloat(formData.budget_max) : null,
                address: formData.address,
                city: formData.city,
                state: formData.state,
                zip_code: formData.zip_code,
                urgency: formData.urgency,
                status: 'open',
                proposal_count: 0
            });

            if (error) throw error;

            showToast('Pedido publicado com sucesso!', 'success');
            navigate('/perfil/pedidos'); // Redirect to orders list
        } catch (error) {
            console.error('Error creating job:', error);
            showToast('Erro ao criar pedido. Tente novamente.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-3xl">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">O que você precisa?</h1>
                <p className="text-gray-500 mb-8">Descreva seu pedido para receber orçamentos de profissionais qualificados.</p>

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Section 1: Details */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">Detalhes do Serviço</h2>

                        <Input
                            label="Título do Pedido *"
                            name="title"
                            placeholder="Ex: Instalação de Ar Condicionado Split"
                            value={formData.title}
                            onChange={handleChange}
                            required
                        />

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
                            <select
                                name="category_id"
                                value={formData.category_id}
                                onChange={handleChange}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                required
                                disabled={loading}
                            >
                                <option value="">Selecione uma categoria</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição Detalhada *</label>
                            <textarea
                                name="description"
                                rows={4}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                placeholder="Descreva o que preicsa ser feito, tamanho da área, etc."
                                value={formData.description}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Urgência</label>
                            <select
                                name="urgency"
                                value={formData.urgency}
                                onChange={handleChange}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                            >
                                <option value="low">Baixa (Pode esperar)</option>
                                <option value="medium">Média (Para esta semana)</option>
                                <option value="high">Alta (Urgente / Hoje)</option>
                            </select>
                        </div>
                    </div>

                    {/* Section 2: Location */}
                    <div className="space-y-4 pt-4">
                        <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">Local do Serviço</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="CEP"
                                name="zip_code"
                                placeholder="00000-000"
                                value={formData.zip_code}
                                onChange={handleChange}
                            />
                            <Input
                                label="Cidade"
                                name="city"
                                value={formData.city}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="md:col-span-3">
                                <Input
                                    label="Endereço / Bairro"
                                    name="address"
                                    placeholder="Rua, Número ou Bairro de preferência"
                                    value={formData.address}
                                    onChange={handleChange}
                                />
                            </div>
                            <div>
                                <Input
                                    label="Estado"
                                    name="state"
                                    placeholder="UF"
                                    value={formData.state}
                                    onChange={handleChange}
                                    maxLength={2}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Budget */}
                    <div className="space-y-4 pt-4">
                        <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">Investimento Estimado (Opcional)</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Mínimo (R$)"
                                name="budget_min"
                                type="number"
                                placeholder="0.00"
                                value={formData.budget_min}
                                onChange={handleChange}
                            />
                            <Input
                                label="Máximo (R$)"
                                name="budget_max"
                                type="number"
                                placeholder="0.00"
                                value={formData.budget_max}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="pt-6 flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => navigate(-1)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            isLoading={submitting}
                            className="w-full md:w-auto"
                        >
                            Publicar Pedido
                        </Button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default ClientPostJobPage;
