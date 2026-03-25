import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ImageCropModal from '@/components/ImageCropModal';
import { ServicePackages } from '@tgt/core';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@tgt/core';
import { SERVICE_CATEGORIES } from '@/data/serviceDefinitions';
import { Input, Select, Button } from '@tgt/ui-web';

// Step Components
const StepOverview = ({ data, updateData, errors }: any) => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [uploading, setUploading] = useState(false);

    const categoryOptions = SERVICE_CATEGORIES.map(cat => ({
        label: cat.label,
        value: cat.id
    }));

    const selectedCategory = SERVICE_CATEGORIES.find(cat => cat.id === data.category);
    const subcategoryOptions = selectedCategory?.subcategories.map(sub => ({
        label: sub.label,
        value: sub.id
    })) || [];

    const selectedSubcategory = selectedCategory?.subcategories.find(sub => sub.id === data.subcategory);

    const serviceTypeOptions = [
        { label: 'Fixo', value: 'fixed', description: 'Preço definido e agendamento direto.', icon: 'Zap' },
        { label: 'Pacotes', value: 'packages', description: 'Três níveis de pacotes (Básico, Padrão, Premium).', icon: 'Layers' },
        { label: 'Orçamento', value: 'budget', description: 'O cliente descreve a necessidade e você envia o valor.', icon: 'FileText' },
    ];

    const locationOptions = [
        { label: 'Presencial (Empresa)', value: 'in_store', icon: 'Home' },
        { label: 'Presencial (Cliente)', value: 'at_home', icon: 'MapPin' },
        { label: 'Remoto (Online)', value: 'remote', icon: 'Globe' },
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center mb-10">
                <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight">Primeiros Passos</h3>
                <p className="text-gray-500 mt-3 text-lg">Defina o nome, categoria e como você atende seus clientes.</p>
            </div>

            <div className="space-y-8 max-w-3xl mx-auto">
                <motion.div animate={errors?.title ? { x: [-10, 10, -10, 10, 0] } : {}} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <label className="block text-sm font-bold text-gray-700 mb-3 ml-1 uppercase tracking-wider">Nome do Serviço</label>
                    <Input
                        placeholder="Ex: Consultoria de Design de Interiores"
                        value={data.title}
                        onChange={(e) => updateData({ title: e.target.value })}
                        className={`!text-lg !py-4 ${errors?.title ? "border-red-500 focus:ring-red-500" : ""}`}
                    />
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-5">
                        <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider ml-1">Onde ele se encaixa?</label>
                        <Select
                            label="Categoria Principal"
                            value={data.category}
                            onChange={(value) => updateData({ category: value, subcategory: '' })}
                            options={categoryOptions}
                            placeholder="Selecione..."
                        />
                        <Select
                            label="Subcategoria"
                            value={data.subcategory}
                            onChange={(value) => updateData({ subcategory: value })}
                            options={subcategoryOptions}
                            placeholder="Aguardando categoria..."
                            disabled={!data.category}
                        />
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                        <label className="block text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider ml-1">Onde é feito?</label>
                        <div className="grid grid-cols-1 gap-3">
                            {locationOptions.map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => updateData({ locationType: opt.value })}
                                    className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                                        data.locationType === opt.value
                                        ? 'border-primary-500 bg-primary-50/30'
                                        : 'border-gray-50 bg-gray-50/50 hover:bg-gray-100'
                                    }`}
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                        data.locationType === opt.value ? 'bg-primary-500 text-white' : 'bg-white text-gray-400'
                                    }`}>
                                        <div className="w-5 h-5 flex items-center justify-center">
                                            {opt.value === 'in_store' && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                            {opt.value === 'at_home' && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                            {opt.value === 'remote' && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                        </div>
                                    </div>
                                    <div>
                                        <p className={`font-bold text-sm ${data.locationType === opt.value ? 'text-primary-900' : 'text-gray-700'}`}>{opt.label}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
                    <label className="block text-sm font-black text-gray-900 uppercase tracking-widest text-center mb-2">Formato Comercial</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {serviceTypeOptions.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => {
                                    updateData({ 
                                        priceType: opt.value, 
                                        isSinglePackage: opt.value === 'fixed',
                                        requiresQuote: opt.value === 'budget'
                                    });
                                }}
                                className={`relative p-5 rounded-3xl border-2 transition-all flex flex-col items-center text-center gap-3 group ${
                                    data.priceType === opt.value
                                    ? 'border-primary-500 bg-primary-50/20 ring-4 ring-primary-500/10'
                                    : 'border-gray-50 bg-gray-50/50 hover:border-gray-200 hover:bg-white'
                                }`}
                            >
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                                    data.priceType === opt.value ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30' : 'bg-white text-gray-400 border border-gray-100'
                                }`}>
                                    {opt.value === 'fixed' && <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M13 10V3L4 14h7v7l9-11h-7z" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                    {opt.value === 'packages' && <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                    {opt.value === 'budget' && <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                </div>
                                <p className="font-bold text-gray-900">{opt.label}</p>
                            </button>
                        ))}
                    </div>
                </div>

                <AnimatePresence>
                    {(data.priceType === 'budget') && (
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-amber-50 p-8 rounded-[40px] border border-amber-100">
                            <h4 className="font-bold text-amber-900 mb-4">Perguntas do Orçamento</h4>
                            <div className="space-y-3">
                                {data.questions?.map((q: string, idx: number) => (
                                    <div key={idx} className="flex gap-2">
                                        <input className="flex-1 bg-white border border-amber-200 rounded-2xl px-4 py-3 text-sm" value={q} onChange={(e) => {
                                            const newQ = [...data.questions];
                                            newQ[idx] = e.target.value;
                                            updateData({ questions: newQ });
                                        }} />
                                        <button onClick={() => updateData({ questions: data.questions.filter((_: any, i: number) => i !== idx) })} className="p-3 text-amber-400 hover:text-red-500">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></svg>
                                        </button>
                                    </div>
                                ))}
                                <button onClick={() => updateData({ questions: [...(data.questions || []), ''] })} className="w-full py-4 border-2 border-dashed border-amber-200 rounded-2xl text-amber-600 font-bold">
                                    Adicionar Pergunta
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
                    <label className="block text-sm font-black text-gray-900 uppercase tracking-widest text-center">Ficha Técnica</label>
                    <div className="space-y-4">
                        {Object.entries(data.attributes || {}).map(([key, value], idx) => (
                            <div key={idx} className="flex gap-4 items-center">
                                <Input className="flex-1" placeholder="Ex: Formato" value={key} onChange={(e) => {
                                    const newAttrs = { ...data.attributes };
                                    const val = newAttrs[key];
                                    delete newAttrs[key];
                                    newAttrs[e.target.value] = val;
                                    updateData({ attributes: newAttrs });
                                }} />
                                <Input className="flex-1" placeholder="Ex: Digital" value={value as string} onChange={(e) => {
                                    const newAttrs = { ...data.attributes };
                                    newAttrs[key] = e.target.value;
                                    updateData({ attributes: newAttrs });
                                }} />
                                <button onClick={() => {
                                    const newAttrs = { ...data.attributes };
                                    delete newAttrs[key];
                                    updateData({ attributes: newAttrs });
                                }} className="p-3 text-red-500"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></svg></button>
                            </div>
                        ))}
                        <button onClick={() => updateData({ attributes: { ...(data.attributes || {}), [`Nova Característica ${Object.keys(data.attributes || {}).length + 1}`]: '' } })} className="w-full py-4 border-2 border-dashed border-gray-100 rounded-2xl text-gray-400 font-bold">
                            Adicionar Atributo
                        </button>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                    <textarea value={data.description} onChange={e => updateData({ description: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-xl h-32" maxLength={2000} />
                </div>
            </div>
        </div>
    );
};

const StepPricing = ({ data, updateData }: any) => {
    React.useEffect(() => {
        if (!data.packages || Object.keys(data.packages).length === 0) {
            updateData({
                packages: {
                    basic: { name: 'Básico', price: 0, delivery_time: 1, delivery_unit: 'days', revisions: 0, features: [], description: '' },
                    standard: { name: 'Padrão', price: 0, delivery_time: 3, delivery_unit: 'days', revisions: 2, features: [], description: '' },
                    premium: { name: 'Premium', price: 0, delivery_time: 7, delivery_unit: 'days', revisions: -1, features: [], description: '' }
                }
            });
        }
    }, [data.priceType]);

    const handleChange = (tier: string, field: string, value: any) => {
        updateData({ packages: { ...data.packages, [tier]: { ...data.packages?.[tier], [field]: value } } });
    };

    if (data.priceType === 'fixed') {
        return (
            <div className="space-y-10 max-w-2xl mx-auto">
                <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-xl space-y-8">
                    <div className="space-y-4">
                        <label className="block text-sm font-black text-gray-900 uppercase tracking-widest">Preço Individual (R$)</label>
                        <input type="number" value={data.packages?.basic?.price || ''} onChange={e => handleChange('basic', 'price', Number(e.target.value))} className="w-full p-6 bg-gray-50 border-2 rounded-3xl text-3xl font-black" />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <label className="block text-sm font-black">Prazo</label>
                            <input type="number" value={data.packages?.basic?.delivery_time || ''} onChange={e => handleChange('basic', 'delivery_time', Number(e.target.value))} className="w-full p-4 bg-gray-50 border-2 rounded-3xl" />
                        </div>
                        <div className="space-y-4">
                            <label className="block text-sm font-black text-gray-900">Unidade</label>
                            <select value={data.packages?.basic?.delivery_unit || 'days'} onChange={e => handleChange('basic', 'delivery_unit', e.target.value)} className="w-full p-4 bg-gray-50 border-2 rounded-3xl">
                                <option value="minutes">Minutos</option>
                                <option value="hours">Horas</option>
                                <option value="days">Dias</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (data.priceType === 'budget') {
        return <div className="p-10 bg-amber-50 rounded-[40px] text-center"><h3 className="text-xl font-bold">Modo Orçamento Ativo</h3><p>O preço será definido após a solicitação do cliente.</p></div>;
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {['basic', 'standard', 'premium'].map((tier) => (
                <div key={tier} className="bg-white rounded-[40px] border-2 p-8 space-y-4">
                    <h4 className="text-xl font-black uppercase text-center">{tier}</h4>
                    <input type="number" value={data.packages?.[tier]?.price || ''} onChange={e => handleChange(tier, 'price', Number(e.target.value))} className="w-full p-4 bg-gray-50 rounded-2xl" placeholder="Preço" />
                    <textarea value={data.packages?.[tier]?.description || ''} onChange={e => handleChange(tier, 'description', e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl h-24" placeholder="O que inclui?" />
                </div>
            ))}
        </div>
    );
};

const StepGallery = ({ data, updateData }: any) => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [uploading, setUploading] = useState(false);
    const [cropModal, setCropModal] = useState({ isOpen: false, imageSrc: '' });

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const reader = new FileReader();
            reader.onload = () => setCropModal({ isOpen: true, imageSrc: reader.result as string });
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleCropComplete = async (croppedBlob: Blob) => {
        if (!user) return;
        setUploading(true);
        try {
            const fileName = `${user.id}/${Date.now()}.jpg`;
            const { error: uploadError } = await supabase.storage.from('portfolio').upload(`gallery/${fileName}`, croppedBlob);
            if (uploadError) throw uploadError;
            const { data: { publicUrl } } = supabase.storage.from('portfolio').getPublicUrl(`gallery/${fileName}`);
            updateData({ gallery: [...(data.gallery || []), publicUrl] });
            addToast("Imagem adicionada!", "success");
        } catch (err) { addToast("Erro no upload.", "error"); }
        finally { setUploading(false); setCropModal({ isOpen: false, imageSrc: '' }); }
    };

    return (
        <div className="space-y-10 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div onClick={() => document.getElementById('image-upload')?.click()} className="aspect-square bg-gray-50 border-2 border-dashed rounded-[40px] flex items-center justify-center cursor-pointer">
                    <input type="file" id="image-upload" className="hidden" accept="image/*" onChange={handleImageChange} />
                    {uploading ? <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" /> : <p className="font-bold">Adicionar Foto</p>}
                </div>
                {data.gallery?.map((url: string, i: number) => (
                    <div key={i} className="aspect-square relative rounded-[40px] overflow-hidden group">
                        <img src={url} className="w-full h-full object-cover" />
                        <button onClick={() => updateData({ gallery: data.gallery.filter((_: any, idx: number) => idx !== i) })} className="absolute inset-0 bg-red-500/50 opacity-0 group-hover:opacity-100 text-white font-bold">Remover</button>
                    </div>
                ))}
            </div>
            <ImageCropModal isOpen={cropModal.isOpen} imageSrc={cropModal.imageSrc} aspectRatio={16 / 9} onClose={() => setCropModal({ isOpen: false, imageSrc: '' })} onCropComplete={handleCropComplete} />
        </div>
    );
};

const ServiceWizard = ({ onCancel, initialData, onSuccess }: any) => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<any>({});
    const [formData, setFormData] = useState({
        title: initialData?.title || '',
        category: initialData?.category_tag || '',
        subcategory: initialData?.subcategory || '',
        priceType: initialData?.requires_quote ? 'budget' : (initialData?.is_single_package ? 'fixed' : 'packages'),
        locationType: initialData?.location_type || 'in_store',
        description: initialData?.description || '',
        tags: Array.isArray(initialData?.tags) ? initialData.tags.join(', ') : '',
        packages: initialData?.packages || {},
        gallery: initialData?.gallery || [],
        questions: initialData?.service_forms?.[0]?.questions || [],
        attributes: initialData?.attributes || {}
    });

    const isEditing = !!initialData;
    const steps = [{ title: 'Geral', component: StepOverview }, { title: 'Preço', component: StepPricing }, { title: 'Galeria', component: StepGallery }];

    const handleSubmit = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data: company } = await supabase.from('companies').select('id, h3_index').eq('profile_id', user.id).single();
            if (!company) throw new Error("Empresa não encontrada.");

            const servicePayload = {
                company_id: company.id,
                title: formData.title,
                description: formData.description,
                price: formData.packages?.basic?.price || 0,
                starting_price: formData.packages?.basic?.price || 0,
                packages: formData.priceType === 'fixed' ? { basic: formData.packages.basic } : formData.packages,
                gallery: formData.gallery,
                service_type: formData.priceType === 'budget' ? 'requires_quote' : (formData.locationType === 'remote' ? 'remote_fixed' : (formData.locationType === 'at_home' ? 'local_client_fixed' : 'local_provider_fixed')),
                location_type: formData.locationType,
                h3_index: formData.locationType === 'remote' ? null : company.h3_index,
                category_tag: formData.category,
                subcategory: formData.subcategory,
                is_single_package: formData.priceType === 'fixed',
                requires_quote: formData.priceType === 'budget',
                tags: formData.tags.split(',').map((t: string) => t.trim()).filter(Boolean),
                attributes: formData.attributes
            };

            const { data: service, error } = isEditing 
                ? await supabase.from('services').update(servicePayload).eq('id', initialData.id).select().single() 
                : await supabase.from('services').insert([servicePayload]).select().single();
            
            if (error) throw error;

            if (formData.priceType === 'budget') {
                await supabase.from('service_forms').upsert({ service_id: service.id, questions: formData.questions }, { onConflict: 'service_id' });
            }

            addToast(isEditing ? "Atualizado!" : "Criado!", "success");
            if (onSuccess) onSuccess();
            else navigate('/dashboard/servicos');
        } catch (e: any) { addToast(e.message, "error"); }
        finally { setLoading(false); }
    };

    const handleNext = () => {
        if (currentStep === 0 && !formData.title) return setErrors({ title: true });
        if (currentStep < steps.length - 1) setCurrentStep(s => s + 1);
        else handleSubmit();
    };

    const CurrentComponent = steps[currentStep].component;

    return (
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 p-4 border-b flex justify-between">
                {steps.map((s, i) => (
                    <div key={i} className={`flex items-center ${i === currentStep ? 'text-primary-600 font-bold' : 'text-gray-400'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 border-2 ${i === currentStep ? 'border-primary-600' : 'border-gray-300'}`}>{i + 1}</div>
                        <span>{s.title}</span>
                    </div>
                ))}
            </div>
            <div className="p-8 min-h-[400px]">
                <CurrentComponent data={formData} updateData={(d: any) => setFormData(p => ({ ...p, ...d }))} errors={errors} />
            </div>
            <div className="p-4 border-t flex justify-between">
                <Button variant="secondary" onClick={() => currentStep === 0 ? onCancel?.() : setCurrentStep(s => s - 1)}>Voltar</Button>
                <Button variant="primary" onClick={handleNext} isLoading={loading}>{currentStep === steps.length - 1 ? 'Salvar' : 'Próximo'}</Button>
            </div>
        </div>
    );
};

export default ServiceWizard;
