import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { supabase } from '@tgt/core';
import { SERVICE_CATEGORIES } from '@/data/serviceDefinitions';
import { Input, Select } from '@tgt/ui-web';
import type { StepProps, PackageTier } from '../wizard.types';

// ─── StepOverview ─────────────────────────────────────────────────────────────

const StepOverview = ({ data, updateData, errors }: StepProps) => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [uploading, setUploading] = useState(false);

    const categoryOptions = SERVICE_CATEGORIES.map(cat => ({
        label: cat.label,
        value: cat.id,
    }));

    const selectedCategory = SERVICE_CATEGORIES.find(cat => cat.id === data.category);
    const subcategoryOptions = selectedCategory?.subcategories.map(sub => ({
        label: sub.label,
        value: sub.id,
    })) || [];

    const subcategory = selectedCategory?.subcategories.find(sub => sub.id === data.subcategory);
    const hideFixedPrice = subcategory?.hideFixedPrice;
    const requiresProfessionalId = subcategory?.requiresProfessionalId;
    const boardName = subcategory?.requiresBoard?.name || 'Registro Profissional';

    const serviceTypeOptions = [
        { label: 'Fixo', value: 'fixed' as const, description: 'Preço definido e agendamento direto.', hidden: hideFixedPrice },
        { label: 'Pacotes', value: 'packages' as const, description: 'Três níveis de pacotes (Básico, Padrão, Premium).', hidden: hideFixedPrice },
        { label: 'Orçamento', value: 'budget' as const, description: 'O cliente descreve a necessidade e você envia o valor.' },
    ].filter(opt => !opt.hidden);

    // Auto-select budget if fixed price is hidden and current selection is fixed/packages
    React.useEffect(() => {
        if (hideFixedPrice && (data.priceType === 'fixed' || data.priceType === 'packages')) {
            updateData({ priceType: 'budget' });
        }
    }, [hideFixedPrice, data.priceType, updateData]);

    const locationOptions = [
        { label: 'Presencial (Empresa)', value: 'in_store' as const },
        { label: 'Presencial (Cliente)', value: 'at_home' as const },
        { label: 'Remoto (Online)', value: 'remote' as const },
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
                        className={`!text-lg !py-4 ${errors?.title ? 'border-red-500 focus:ring-red-500' : ''}`}
                    />
                    {errors?.title && <p className="text-red-500 text-sm mt-1 ml-1">{errors.title}</p>}
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
                        {errors?.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
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
                                    <p className={`font-bold text-sm ${data.locationType === opt.value ? 'text-primary-900' : 'text-gray-700'}`}>{opt.label}</p>
                                </button>
                            ))}
                        </div>

                        <AnimatePresence mode="wait">
                            {data.locationType === 'remote' && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="pt-4">
                                    <Input
                                        label="Link da Reunião (Zoom/Meet)"
                                        placeholder="https://meet.google.com/..."
                                        value={data.meetingUrl || ''}
                                        onChange={(e) => updateData({ meetingUrl: e.target.value })}
                                    />
                                </motion.div>
                            )}
                            {data.locationType === 'at_home' && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="pt-4 grid grid-cols-2 gap-4">
                                    <Input
                                        label="Raio de Atendimento (Km)"
                                        type="number"
                                        placeholder="Ex: 15"
                                        value={data.radiusKm || ''}
                                        onChange={(e) => updateData({ radiusKm: Number(e.target.value) })}
                                    />
                                    <Input
                                        label="Taxa de Deslocamento (R$)"
                                        type="number"
                                        placeholder="Ex: 20"
                                        value={data.travelFee || ''}
                                        onChange={(e) => updateData({ travelFee: Number(e.target.value) })}
                                    />
                                </motion.div>
                            )}
                            {data.locationType === 'in_store' && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="pt-4">
                                    <Select
                                        label="Selecione o Endereço"
                                        value={data.addressId || ''}
                                        onChange={(val) => updateData({ addressId: val })}
                                        options={[
                                            { label: 'Endereço Principal (Cadastrado no Perfil)', value: 'main' }
                                        ]}
                                        placeholder="Carregando endereços..."
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <AnimatePresence>
                    {requiresProfessionalId && (
                        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="bg-blue-50 p-8 rounded-[40px] border border-blue-100 space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-blue-500 rounded-lg text-white">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></svg>
                                </div>
                                <h4 className="font-bold text-blue-900 tracking-tight">Validação Profissional Necessária</h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label={`Número do ${boardName}`}
                                    placeholder="Ex: 12345"
                                    value={data.registrationNumber || ''}
                                    onChange={(e) => updateData({ registrationNumber: e.target.value })}
                                />
                                <Select
                                    label="Estado (UF)"
                                    value={data.registrationState || ''}
                                    onChange={(val) => updateData({ registrationState: val })}
                                    options={[
                                        { label: 'SP', value: 'SP' }, { label: 'RJ', value: 'RJ' }, { label: 'MG', value: 'MG' },
                                        { label: 'PR', value: 'PR' }, { label: 'RS', value: 'RS' }, { label: 'SC', value: 'SC' }
                                        // ... add others or use a constant
                                    ]}
                                    placeholder="Selecione..."
                                />
                            </div>
                            <p className="text-sm text-blue-600 italic">* Sua conta passará por uma auditoria antes do serviço ser liberado.</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
                    <label className="block text-sm font-black text-gray-900 uppercase tracking-widest text-center mb-2">Formato Comercial</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {serviceTypeOptions.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => updateData({ priceType: opt.value })}
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
                    {data.priceType === 'budget' && (
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-amber-50 p-8 rounded-[40px] border border-amber-100">
                            <h4 className="font-bold text-amber-900 mb-4">Perguntas do Orçamento</h4>
                            <div className="space-y-3">
                                {data.questions.map((q, idx) => (
                                    <div key={`question-${idx}-${q.slice(0, 8)}`} className="flex gap-2">
                                        <input
                                            className="flex-1 bg-white border border-amber-200 rounded-2xl px-4 py-3 text-sm"
                                            value={q}
                                            onChange={(e) => {
                                                const newQ = [...data.questions];
                                                newQ[idx] = e.target.value;
                                                updateData({ questions: newQ });
                                            }}
                                        />
                                        <button
                                            onClick={() => updateData({ questions: data.questions.filter((_, i) => i !== idx) })}
                                            className="p-3 text-amber-400 hover:text-red-500"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></svg>
                                        </button>
                                    </div>
                                ))}
                                <button onClick={() => updateData({ questions: [...data.questions, ''] })} className="w-full py-4 border-2 border-dashed border-amber-200 rounded-2xl text-amber-600 font-bold">
                                    Adicionar Pergunta
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
                    <label className="block text-sm font-black text-gray-900 uppercase tracking-widest text-center">Ficha Técnica</label>
                    <div className="space-y-4">
                        {Object.entries(data.attributes).map(([key, value], idx) => (
                            <div key={`attr-${idx}-${key}`} className="flex gap-4 items-center">
                                <Input className="flex-1" placeholder="Ex: Formato" value={key} onChange={(e) => {
                                    const newAttrs = { ...data.attributes };
                                    const val = newAttrs[key];
                                    delete newAttrs[key];
                                    newAttrs[e.target.value] = val;
                                    updateData({ attributes: newAttrs });
                                }} />
                                <Input className="flex-1" placeholder="Ex: Digital" value={value} onChange={(e) => {
                                    updateData({ attributes: { ...data.attributes, [key]: e.target.value } });
                                }} />
                                <button onClick={() => {
                                    const newAttrs = { ...data.attributes };
                                    delete newAttrs[key];
                                    updateData({ attributes: newAttrs });
                                }} className="p-3 text-red-500">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></svg>
                                </button>
                            </div>
                        ))}
                        <button onClick={() => updateData({ attributes: { ...data.attributes, [`Nova Característica ${Object.keys(data.attributes).length + 1}`]: '' } })} className="w-full py-4 border-2 border-dashed border-gray-100 rounded-2xl text-gray-400 font-bold">
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

export default StepOverview;
