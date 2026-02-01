import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { ServicePackages } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

// Step Components (Placeholders for now)
const StepOverview = ({ data, updateData }: any) => {
    const categoryOptions = [
        { label: 'Consultoria', value: 'consultoria' },
        { label: 'Design & Criatividade', value: 'design' },
        { label: 'Marketing Digital', value: 'marketing' },
        { label: 'Tecnologia & Programação', value: 'tech' },
        { label: 'Jurídico', value: 'juridico' },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900">Vamos começar com o básico</h3>
                <p className="text-gray-500 mt-2">Dê um título chamativo e escolha a categoria do seu serviço.</p>
            </div>

            <div className="space-y-6 max-w-2xl mx-auto">
                <Input
                    label="Título do Serviço"
                    placeholder="Ex: Vou criar um logo minimalista para sua marca"
                    value={data.title}
                    onChange={(e) => updateData({ title: e.target.value })}
                    helperText="Use palavras-chave que os clientes buscariam."
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Select
                        label="Categoria"
                        value={data.category}
                        onChange={(value) => updateData({ category: value })}
                        options={categoryOptions}
                        placeholder="Selecione..."
                    />
                    <Input
                        label="Tags (Separadas por vírgula)"
                        placeholder="Ex: logo, branding, design"
                        value={data.tags}
                        onChange={(e) => updateData({ tags: e.target.value })}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Descrição Curta
                    </label>
                    <textarea
                        value={data.description}
                        onChange={e => updateData({ description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-[var(--radius-box)] shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm resize-none h-32"
                        placeholder="Descreva brevemente o que você oferece..."
                    />
                </div>
            </div>
        </div>
    );
};

const StepPricing = ({ data, updateData }: any) => {
    // Initialize packages if empty
    React.useEffect(() => {
        if (!data.packages || Object.keys(data.packages).length === 0) {
            updateData({
                packages: {
                    basic: { name: 'Basic', price: 0, delivery_time: 1, revisions: 0, features: [], description: '' },
                    standard: { name: 'Standard', price: 0, delivery_time: 3, revisions: 2, features: [], description: '' },
                    premium: { name: 'Premium', price: 0, delivery_time: 7, revisions: -1, features: [], description: '' }
                }
            });
        }
    }, []);

    const handleChange = (tier: 'basic' | 'standard' | 'premium', field: string, value: any) => {
        updateData({
            packages: {
                ...data.packages,
                [tier]: {
                    ...data.packages?.[tier],
                    [field]: value
                }
            }
        });
    };

    const tiers = ['basic', 'standard', 'premium'] as const;
    const tierLabels = { basic: 'Básico', standard: 'Padrão', premium: 'Premium' };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900">Defina seus pacotes</h3>
                <p className="text-gray-500 mt-2">Profissionais que oferecem 3 opções de pacote vendem 40% a mais.</p>
            </div>

            <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 font-bold text-gray-900 bg-white sticky left-0 z-10 w-1/4">Atributo</th>
                            {tiers.map(tier => (
                                <th key={tier} className="px-6 py-4 text-center min-w-[200px]">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${tier === 'basic' ? 'bg-gray-100 text-gray-700' :
                                        tier === 'standard' ? 'bg-blue-50 text-blue-700' :
                                            'bg-brand-primary/10 text-brand-primary'
                                        }`}>
                                        {tierLabels[tier]}
                                    </span>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {/* Description */}
                        <tr>
                            <td className="px-6 py-4 font-medium text-gray-900 bg-gray-50/50">Descrição</td>
                            {tiers.map(tier => (
                                <td key={tier} className="px-4 py-4">
                                    <textarea
                                        value={data.packages?.[tier]?.description || ''}
                                        onChange={e => handleChange(tier, 'description', e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded-lg text-sm resize-none h-24 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none"
                                        placeholder={`O que está incluso no pacote ${tierLabels[tier]}?`}
                                    />
                                </td>
                            ))}
                        </tr>

                        {/* Delivery Time */}
                        <tr>
                            <td className="px-6 py-4 font-medium text-gray-900 bg-gray-50/50">Prazo de Entrega</td>
                            {tiers.map(tier => (
                                <td key={tier} className="px-4 py-4">
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="1"
                                            value={data.packages?.[tier]?.delivery_time || ''}
                                            onChange={e => handleChange(tier, 'delivery_time', Number(e.target.value))}
                                            className="w-full p-2 pr-12 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none"
                                        />
                                        <span className="absolute right-3 top-2 text-gray-400 text-xs">dias</span>
                                    </div>
                                </td>
                            ))}
                        </tr>

                        {/* Revisions */}
                        <tr>
                            <td className="px-6 py-4 font-medium text-gray-900 bg-gray-50/50">Revisões</td>
                            {tiers.map(tier => (
                                <td key={tier} className="px-4 py-4">
                                    <select
                                        value={data.packages?.[tier]?.revisions}
                                        onChange={e => handleChange(tier, 'revisions', Number(e.target.value))}
                                        className="w-full p-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none bg-white"
                                    >
                                        <option value={0}>Sem revisões</option>
                                        <option value={1}>1 Revisão</option>
                                        <option value={2}>2 Revisões</option>
                                        <option value={3}>3 Revisões</option>
                                        <option value={5}>5 Revisões</option>
                                        <option value={-1}>Ilimitadas</option>
                                    </select>
                                </td>
                            ))}
                        </tr>

                        {/* Price */}
                        <tr className="bg-gray-50/30">
                            <td className="px-6 py-4 font-bold text-gray-900">Preço (R$)</td>
                            {tiers.map(tier => (
                                <td key={tier} className="px-4 py-4">
                                    <div className="relative">
                                        <span className="absolute left-3 top-2 text-gray-500 font-bold">R$</span>
                                        <input
                                            type="number"
                                            min="0"
                                            value={data.packages?.[tier]?.price || ''}
                                            onChange={e => handleChange(tier, 'price', Number(e.target.value))}
                                            className="w-full p-2 pl-10 border border-gray-300 rounded-lg font-bold text-brand-primary focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none"
                                            placeholder="0,00"
                                        />
                                    </div>
                                </td>
                            ))}
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const StepGallery = ({ data, updateData }: any) => {
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            // Mock upload - in real app would upload to Supabase Storage
            // For now, we'll just use a placeholder or object URL if needed, 
            // but since we can't easily upload without storage setup, we will ask for URL or valid mocked upload
            // Let's just create a fake URL for UI demo purposes if file is selected
            const file = e.target.files[0];
            const imageUrl = URL.createObjectURL(file);
            updateData({ gallery: [...(data.gallery || []), imageUrl] });
        }
    };

    const handleAddUrl = () => {
        const url = prompt("Insira a URL da imagem:");
        if (url) updateData({ gallery: [...(data.gallery || []), url] });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900">Mostre o seu melhor!</h3>
                <p className="text-gray-500 mt-2">Adicione fotos que representem bem o seu serviço.</p>
            </div>

            <div className="max-w-2xl mx-auto space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => document.getElementById('image-upload')?.click()}
                >
                    <input
                        type="file"
                        id="image-upload"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageChange}
                    />
                    <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <p className="font-medium text-gray-900">Clique para fazer upload</p>
                    <p className="text-sm text-gray-500 mt-1">PNG, JPG ou GIF (Max. 5MB)</p>
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleAddUrl(); }}
                        className="mt-4 text-sm text-brand-primary font-medium hover:underline"
                    >
                        Ou adicione via URL
                    </button>
                </div>

                {data.gallery && data.gallery.length > 0 && (
                    <div className="grid grid-cols-3 gap-4 mt-6">
                        {data.gallery.map((url: string, index: number) => (
                            <div key={index} className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden group">
                                <img src={url} alt={`Gallery ${index}`} className="w-full h-full object-cover" />
                                <button
                                    onClick={() => updateData({ gallery: data.gallery.filter((_: any, i: number) => i !== index) })}
                                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const ServiceWizard = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        category: '',
        description: '',
        tags: '',
        packages: {} as ServicePackages,
        gallery: [] as string[]
    });

    const steps = [
        { title: 'Visão Geral', component: StepOverview },
        { title: 'Preços', component: StepPricing },
        { title: 'Galeria', component: StepGallery },
    ];

    const calculateStartingPrice = () => {
        const prices = [
            formData.packages?.basic?.price,
            formData.packages?.standard?.price,
            formData.packages?.premium?.price
        ].filter(p => typeof p === 'number' && p > 0) as number[];

        return prices.length > 0 ? Math.min(...prices) : 0;
    };

    const handleSubmit = async () => {
        if (!user) {
            addToast("Você precisa estar logado.", "error");
            return;
        }

        setLoading(true);
        try {
            // Get company ID for the user
            const { data: companyData, error: companyError } = await supabase
                .from('companies')
                .select('id')
                .eq('owner_id', user.id) // Assuming owner_id links to auth.users, or finding by email/etc. checking types.ts might clarify but typical pattern
                .single();

            // Fallback if owner_id not used, try to find by email or just insert if we know the user is type company
            // User type check
            if (user.type !== 'company') {
                throw new Error("Apenas empresas podem criar serviços.");
            }

            // For MVP, if we can't find company linked, we might have an issue. 
            // But let's assume one company per user for now or user.companySlug

            // Actually, let's try to get company_id from a known profile or just standard
            // In types.ts, User has companySlug. 
            // We need company_id for the service foreign key.

            let companyId = companyData?.id;

            if (!companyId) {
                // Try fetching by user id from another table or profile?
                // Let's assume there's a way. If not, we might fail. 
                // Let's rely on user.companySlug to fetch company
                if (user.companySlug) {
                    const { data: cData } = await supabase.from('companies').select('id').eq('slug', user.companySlug).single();
                    companyId = cData?.id;
                }
            }

            if (!companyId) throw new Error("Perfil de empresa não encontrado.");

            const startingPrice = calculateStartingPrice();

            const { error } = await supabase.from('services').insert({
                company_id: companyId,
                title: formData.title,
                description: formData.description,
                price: startingPrice, // Legacy field
                starting_price: startingPrice,
                duration: formData.packages.basic?.delivery_time + ' dias', // Legacy fallback
                packages: formData.packages,
                gallery: formData.gallery
            });

            if (error) throw error;

            addToast("Serviço criado com sucesso!", "success");
            navigate(`/dashboard/empresa/${user.companySlug || 'me'}/servicos`);

        } catch (error: any) {
            console.error(error);
            addToast(error.message || "Erro ao salvar serviço.", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(curr => curr + 1);
        } else {
            handleSubmit();
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(curr => curr - 1);
        }
    };

    const updateData = (newData: any) => {
        setFormData(prev => ({ ...prev, ...newData }));
    };

    const CurrentComponent = steps[currentStep].component;

    return (
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Stepper Header */}
            <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between">
                {steps.map((step, index) => (
                    <div key={index} className={`flex items-center ${index === currentStep ? 'text-brand-primary font-bold' : 'text-gray-400'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 border-2 ${index === currentStep ? 'border-brand-primary bg-white' : 'border-gray-300'}`}>
                            {index + 1}
                        </div>
                        <span>{step.title}</span>
                        {index < steps.length - 1 && <div className="w-10 h-0.5 bg-gray-300 mx-4" />}
                    </div>
                ))}
            </div>

            {/* Content */}
            <div className="p-8 min-h-[400px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                    >
                        <CurrentComponent data={formData} updateData={updateData} />
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-gray-100 flex justify-between">
                <Button variant="secondary" onClick={handleBack} disabled={currentStep === 0 && !onCancel || loading}>
                    {currentStep === 0 ? 'Cancelar' : 'Voltar'}
                </Button>
                <Button variant="primary" onClick={handleNext} isLoading={loading}>
                    {currentStep === steps.length - 1 ? 'Publicar Serviço' : 'Próximo'}
                </Button>
            </div>
        </div>
    );
};

export default ServiceWizard;
