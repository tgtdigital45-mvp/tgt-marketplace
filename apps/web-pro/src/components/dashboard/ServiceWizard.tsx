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


// Step Components (Placeholders for now)
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
                {/* Título */}
                <motion.div animate={errors?.title ? { x: [-10, 10, -10, 10, 0] } : {}} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <label className="block text-sm font-bold text-gray-700 mb-3 ml-1 uppercase tracking-wider">Nome do Serviço</label>
                    <Input
                        placeholder="Ex: Consultoria de Design de Interiores"
                        value={data.title}
                        onChange={(e) => updateData({ title: e.target.value })}
                        className={`!text-lg !py-4 ${errors?.title ? "border-red-500 focus:ring-red-500" : ""}`}
                    />
                    <p className="text-xs text-gray-400 mt-2 ml-1">Um nome claro e objetivo facilita a busca.</p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Categoria */}
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

                    {/* Localização */}
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
                                        {/* Lucide Icons map locally if needed, using placeholders for clarity */}
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

                {/* Tipo de Preço / Modelo de Negócio */}
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
                                <div>
                                    <p className="font-bold text-gray-900">{opt.label}</p>
                                    <p className="text-[10px] text-gray-400 mt-1 leading-tight">{opt.description}</p>
                                </div>
                                {data.priceType === opt.value && (
                                    <motion.div layoutId="active-tip" className="absolute -top-2 -right-2 bg-primary-500 text-white p-1 rounded-full shadow-lg">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                                    </motion.div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Pergunta do Orçamento (Apenas se format for budget) */}
                <AnimatePresence>
                    {(data.priceType === 'budget' || data.requiresQuote) && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-amber-50 p-8 rounded-[40px] border border-amber-100 shadow-inner"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-amber-500 rounded-xl text-white">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></svg>
                                </div>
                                <div>
                                    <h4 className="font-bold text-amber-900">Perguntas do Orçamento</h4>
                                    <p className="text-xs text-amber-700">O que o cliente precisa te informar para você dar o preço?</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {data.questions?.map((q: string, idx: number) => (
                                    <div key={idx} className="flex gap-2">
                                        <input
                                            className="flex-1 bg-white border border-amber-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                                            placeholder={`Ex: Qual o tamanho da área? (Pergunta ${idx+1})`}
                                            value={q}
                                            onChange={(e) => {
                                                const newQ = [...data.questions];
                                                newQ[idx] = e.target.value;
                                                updateData({ questions: newQ });
                                            }}
                                        />
                                        <button 
                                            onClick={() => updateData({ questions: data.questions.filter((_: any, i: number) => i !== idx) })}
                                            className="p-3 text-amber-400 hover:text-red-500 transition-colors"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></svg>
                                        </button>
                                    </div>
                                ))}
                                <button 
                                    onClick={() => updateData({ questions: [...(data.questions || []), ''] })}
                                    className="w-full py-4 border-2 border-dashed border-amber-200 rounded-2xl text-amber-600 font-bold hover:bg-amber-100/50 transition-colors flex items-center justify-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 6v6m0 0v6m0-6h6m-6 0H6" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></svg>
                                    Adicionar Pergunta
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="grid grid-cols-1 gap-6">
                    <Input
                        label="Tags (Separadas por vírgula)"
                        placeholder="Ex: logo, branding, design"
                        value={data.tags}
                        onChange={(e) => updateData({ tags: e.target.value })}
                    />
                </div>

                {/* Professional Registration Fields */}
                <AnimatePresence>
                    {(selectedSubcategory?.requiresBoard || selectedSubcategory?.requiresCertification) && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="p-6 bg-purple-50/50 rounded-2xl border border-purple-100 space-y-6 overflow-hidden"
                        >
                            <div className="flex items-center gap-2 text-purple-900 font-bold">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                <span>Validação Profissional {(selectedSubcategory.requiresBoard?.name || selectedSubcategory.requiresCertification?.name)}</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {selectedSubcategory.requiresBoard && (
                                    <>
                                        <Input
                                            label={`Número do Registro (${selectedSubcategory.requiresBoard.name})`}
                                            placeholder="Ex: 123456"
                                            value={data.registrationNumber || ''}
                                            onChange={(e) => updateData({ registrationNumber: e.target.value })}
                                            className={errors?.registrationNumber ? "border-red-500" : ""}
                                        />
                                        {selectedSubcategory.requiresBoard.showUf && (
                                            <Select
                                                label="Estado (UF)"
                                                value={data.registrationState || ''}
                                                onChange={(value) => updateData({ registrationState: value })}
                                                options={[
                                                    { label: 'Acre (AC)', value: 'AC' },
                                                    { label: 'Alagoas (AL)', value: 'AL' },
                                                    { label: 'Amapá (AP)', value: 'AP' },
                                                    { label: 'Amazonas (AM)', value: 'AM' },
                                                    { label: 'Bahia (BA)', value: 'BA' },
                                                    { label: 'Ceará (CE)', value: 'CE' },
                                                    { label: 'Distrito Federal (DF)', value: 'DF' },
                                                    { label: 'Espírito Santo (ES)', value: 'ES' },
                                                    { label: 'Goiás (GO)', value: 'GO' },
                                                    { label: 'Maranhão (MA)', value: 'MA' },
                                                    { label: 'Mato Grosso (MT)', value: 'MT' },
                                                    { label: 'Mato Grosso do Sul (MS)', value: 'MS' },
                                                    { label: 'Minas Gerais (MG)', value: 'MG' },
                                                    { label: 'Pará (PA)', value: 'PA' },
                                                    { label: 'Paraíba (PB)', value: 'PB' },
                                                    { label: 'Paraná (PR)', value: 'PR' },
                                                    { label: 'Pernambuco (PE)', value: 'PE' },
                                                    { label: 'Piauí (PI)', value: 'PI' },
                                                    { label: 'Rio de Janeiro (RJ)', value: 'RJ' },
                                                    { label: 'Rio Grande do Norte (RN)', value: 'RN' },
                                                    { label: 'Rio Grande do Sul (RS)', value: 'RS' },
                                                    { label: 'Rondônia (RO)', value: 'RO' },
                                                    { label: 'Roraima (RR)', value: 'RR' },
                                                    { label: 'Santa Catarina (SC)', value: 'SC' },
                                                    { label: 'São Paulo (SP)', value: 'SP' },
                                                    { label: 'Sergipe (SE)', value: 'SE' },
                                                    { label: 'Tocantins (TO)', value: 'TO' },
                                                ]}
                                                placeholder="Selecione..."
                                            />
                                        )}
                                    </>
                                )}

                                {selectedSubcategory.requiresCertification && !selectedSubcategory.requiresBoard && (
                                    <Input
                                        label={`Identificação da Certificação (${selectedSubcategory.requiresCertification.name})`}
                                        placeholder="Ex: CNH, Registro, etc."
                                        value={data.certificationId || ''}
                                        onChange={(e) => updateData({ certificationId: e.target.value })}
                                        className={errors?.certificationId ? "border-red-500" : ""}
                                    />
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Upload do Documento (Frente e Verso)
                                </label>
                                <div
                                    className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${data.registrationImage ? 'border-green-200 bg-green-50' : 'border-purple-200 hover:bg-purple-50'
                                        }`}
                                    onClick={() => document.getElementById('reg-image-upload')?.click()}
                                >
                                    <input
                                        type="file"
                                        id="reg-image-upload"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={async (e) => {
                                            if (e.target.files && e.target.files[0] && user) {
                                                setUploading(true);
                                                try {
                                                    const file = e.target.files[0];
                                                    const fileExt = file.name.split('.').pop();
                                                    const fileName = `${user.id}/${Math.random()}.${fileExt}`;
                                                    const filePath = `verifications/${fileName}`;

                                                    const { error: uploadError } = await supabase.storage
                                                        .from('portfolio') // Reuse existing bucket
                                                        .upload(filePath, file);

                                                    if (uploadError) throw uploadError;

                                                    const { data: { publicUrl } } = supabase.storage
                                                        .from('portfolio')
                                                        .getPublicUrl(filePath);

                                                    updateData({ registrationImage: publicUrl });
                                                    addToast("Documento anexado!", "success");
                                                } catch (err: any) {
                                                    addToast("Erro ao subir documento.", "error");
                                                } finally {
                                                    setUploading(false);
                                                }
                                            }
                                        }}
                                    />
                                    {uploading ? (
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
                                    ) : data.registrationImage ? (
                                        <div className="flex items-center gap-2 text-green-700 font-medium">
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                            Documento Carregado
                                        </div>
                                    ) : (
                                        <>
                                            <svg className="w-8 h-8 text-purple-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                            <span className="text-xs text-purple-600">Clique para anexar foto da carteirinha ou certificado</span>
                                        </>
                                    )}
                                </div>
                                {errors?.registrationImage && <p className="text-red-500 text-xs text-center">O upload do documento é obrigatório.</p>}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Descrição Curta
                    </label>
                    <textarea
                        value={data.description}
                        onChange={e => updateData({ description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-[var(--radius-box)] shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm resize-none h-32"
                        placeholder="Descreva brevemente o que você oferece..."
                        maxLength={2000}
                    />
                </div>
            </div>
        </div>
    );
};

// ... (StepPricing and StepGallery remain largely unchanged unless we add validation there too)
// Skipping large blocks of unchanged code for brevity in tool call, relying on target matching.
// But I need to update the calls to CurrentComponent to pass errors.

/* ... StepPricing ... */
/* ... StepGallery ...) */



const StepPricing = ({ data, updateData }: any) => {
    // Initialize packages if empty
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

    if (data.priceType === 'fixed' || data.isSinglePackage) {
        return (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-2xl mx-auto">
                <div className="text-center">
                    <h3 className="text-3xl font-extrabold text-gray-900">Preço e Prazo</h3>
                    <p className="text-gray-500 mt-2">Defina o valor justo e o tempo necessário para a entrega.</p>
                </div>

                <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-xl space-y-8">
                    <div className="space-y-4">
                        <label className="block text-sm font-black text-gray-900 uppercase tracking-widest ml-1">Quanto custa? (R$)</label>
                        <div className="relative group">
                            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-primary-500/50 group-focus-within:text-primary-500 transition-colors">R$</span>
                            <input
                                type="number"
                                min="0"
                                value={data.packages?.basic?.price || ''}
                                onChange={e => handleChange('basic', 'price', Number(e.target.value))}
                                className="w-full pl-16 pr-8 py-6 bg-gray-50 border-2 border-transparent focus:border-primary-500 focus:bg-white rounded-3xl text-3xl font-black text-gray-900 outline-none transition-all placeholder:text-gray-200"
                                placeholder="0,00"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <label className="block text-sm font-black text-gray-900 uppercase tracking-widest ml-1">Prazo de Entrega</label>
                            <div className="flex bg-gray-50 p-2 rounded-3xl border-2 border-transparent focus-within:border-primary-500 transition-all">
                                <input
                                    type="number"
                                    min="1"
                                    value={data.packages?.basic?.delivery_time || ''}
                                    onChange={e => handleChange('basic', 'delivery_time', Number(e.target.value))}
                                    className="w-20 px-4 py-2 bg-transparent text-xl font-bold text-gray-900 outline-none"
                                />
                                <div className="flex-1 flex gap-1">
                                    {['minutes', 'hours', 'days'].map((unit) => (
                                        <button
                                            key={unit}
                                            onClick={() => handleChange('basic', 'delivery_unit', unit)}
                                            className={`flex-1 py-2 rounded-2xl text-[10px] font-black uppercase tracking-tighter transition-all ${
                                                (data.packages?.basic?.delivery_unit || 'days') === unit
                                                ? 'bg-white text-primary-600 shadow-sm'
                                                : 'text-gray-400 hover:text-gray-600'
                                            }`}
                                        >
                                            {unit === 'minutes' ? 'Min' : unit === 'hours' ? 'Horas' : 'Dias'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="block text-sm font-black text-gray-900 uppercase tracking-widest ml-1">Revisões</label>
                            <select
                                value={data.packages?.basic?.revisions || 0}
                                onChange={e => handleChange('basic', 'revisions', Number(e.target.value))}
                                className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-primary-500 rounded-3xl text-sm font-bold text-gray-700 outline-none appearance-none cursor-pointer"
                            >
                                <option value={0}>Sem revisões</option>
                                <option value={1}>1 Revisão</option>
                                <option value={2}>2 Revisões</option>
                                <option value={3}>3 Revisões</option>
                                <option value={-1}>Ilimitadas</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="block text-sm font-black text-gray-900 uppercase tracking-widest ml-1">O que está incluso?</label>
                        <textarea
                            value={data.packages?.basic?.description || ''}
                            onChange={e => handleChange('basic', 'description', e.target.value)}
                            className="w-full p-6 bg-gray-50 border-2 border-transparent focus:border-primary-500 focus:bg-white rounded-3xl text-sm font-medium text-gray-700 outline-none transition-all resize-none h-32"
                            placeholder="Descreva detalhadamente o que o cliente recebe..."
                        />
                    </div>
                </div>
            </div>
        );
    }

    if (data.priceType === 'budget' || data.requiresQuote) {
        return (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-2xl mx-auto">
                <div className="text-center">
                    <h3 className="text-3xl font-extrabold text-gray-900">Configurações de Orçamento</h3>
                    <p className="text-gray-500 mt-2">Como você deseja lidar com as solicitações de preço?</p>
                </div>

                <div className="bg-amber-50 p-10 rounded-[40px] border border-amber-100 shadow-xl space-y-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <svg className="w-32 h-32" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>

                    <div className="space-y-2 relative z-10">
                        <h4 className="text-xl font-black text-amber-900">Venda sob Demanda</h4>
                        <p className="text-sm text-amber-700 leading-relaxed">
                            Este formato é ideal para serviços complexos onde o preço varia. 
                            O cliente responderá ao seu **questionário** e você enviará uma **proposta personalizada** pelo chat.
                        </p>
                    </div>

                    <div className="bg-white/60 backdrop-blur-sm p-6 rounded-3xl border border-amber-200/50 space-y-4 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-white font-black">!</div>
                            <p className="text-xs font-bold text-amber-900">Lembre-se de configurar as perguntas no passo anterior.</p>
                        </div>
                    </div>

                    <div className="space-y-4 relative z-10">
                        <label className="block text-sm font-black text-amber-900 uppercase tracking-widest ml-1">Prazo Médio de Resposta</label>
                        <select
                            className="w-full p-4 bg-white border-2 border-amber-200 rounded-3xl text-sm font-bold text-amber-900 outline-none shadow-sm"
                            value={data.packages?.basic?.delivery_time || 24}
                            onChange={(e) => handleChange('basic', 'delivery_time', Number(e.target.value))}
                        >
                            <option value={1}>Até 1 hora</option>
                            <option value={4}>Até 4 horas</option>
                            <option value={12}>Até 12 horas</option>
                            <option value={24}>Em até 24 horas</option>
                            <option value={48}>Em até 48 horas</option>
                        </select>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
             <div className="text-center">
                <h3 className="text-3xl font-extrabold text-gray-900">Pacotes Premium</h3>
                <p className="text-gray-500 mt-2">Dê opções aos seus clientes com diferentes níveis de entrega.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {(['basic', 'standard', 'premium'] as const).map((tier) => (
                    <div key={tier} className={`bg-white rounded-[40px] border-2 transition-all overflow-hidden flex flex-col ${
                        tier === 'standard' ? 'border-primary-500 shadow-2xl scale-105 z-10' : 'border-gray-50 shadow-sm'
                    }`}>
                        <div className={`p-6 text-center ${
                             tier === 'basic' ? 'bg-gray-50' : 
                             tier === 'standard' ? 'bg-primary-500' : 
                             'bg-purple-600'
                        }`}>
                            <h4 className={`text-xl font-black uppercase tracking-widest ${tier === 'basic' ? 'text-gray-900' : 'text-white'}`}>
                                {tierLabels[tier]}
                            </h4>
                        </div>

                        <div className="p-8 space-y-8 flex-1">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Nome do Pacote</label>
                                <input
                                    type="text"
                                    value={data.packages?.[tier]?.name || ''}
                                    onChange={e => handleChange(tier, 'name', e.target.value)}
                                    className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary-500 transition-all"
                                    placeholder="Ex: Start, Pro, Master..."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Valor (R$)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-primary-500/50">R$</span>
                                    <input
                                        type="number"
                                        value={data.packages?.[tier]?.price || ''}
                                        onChange={e => handleChange(tier, 'price', Number(e.target.value))}
                                        className="w-full bg-gray-50 border-none rounded-2xl pl-12 pr-4 py-4 text-xl font-black text-gray-900 focus:ring-2 focus:ring-primary-500 transition-all outline-none"
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">O que está incluso?</label>
                                <textarea
                                    value={data.packages?.[tier]?.description || ''}
                                    onChange={e => handleChange(tier, 'description', e.target.value)}
                                    className="w-full bg-gray-50 border-none rounded-2xl px-4 py-4 text-xs font-bold text-gray-600 focus:ring-2 focus:ring-primary-500 transition-all outline-none resize-none h-24"
                                    placeholder="Descreva este nível de entrega..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Prazo (Dias)</label>
                                    <input
                                        type="number"
                                        value={data.packages?.[tier]?.delivery_time || ''}
                                        onChange={e => handleChange(tier, 'delivery_time', Number(e.target.value))}
                                        className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Revisões</label>
                                    <select
                                        value={data.packages?.[tier]?.revisions}
                                        onChange={e => handleChange(tier, 'revisions', Number(e.target.value))}
                                        className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary-500"
                                    >
                                        <option value={0}>0</option>
                                        <option value={1}>1</option>
                                        <option value={3}>3</option>
                                        <option value={-1}>∞</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const StepGallery = ({ data, updateData }: any) => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [uploading, setUploading] = useState(false);
    const [cropModal, setCropModal] = useState({ isOpen: false, imageSrc: '' });

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
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
            const filePath = `gallery/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('portfolio')
                .upload(filePath, croppedBlob);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('portfolio')
                .getPublicUrl(filePath);

            updateData({ gallery: [...(data.gallery || []), publicUrl] });
            addToast("Imagem adicionada!", "success");
        } catch (err: any) {
            addToast("Erro ao carregar imagem.", "error");
        } finally {
            setUploading(false);
            setCropModal({ isOpen: false, imageSrc: '' });
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-4xl mx-auto">
            <div className="text-center">
                <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight">Portfólio & Galeria</h3>
                <p className="text-gray-500 mt-2">Uma imagem vale mais que mil palavras. Mostre seus melhores trabalhos.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Upload Card */}
                <div 
                    onClick={() => document.getElementById('image-upload')?.click()}
                    className="aspect-square bg-gray-50 border-2 border-dashed border-gray-200 rounded-[40px] flex flex-col items-center justify-center p-8 transition-all hover:border-primary-500 hover:bg-primary-50/20 group cursor-pointer"
                >
                    <input type="file" id="image-upload" className="hidden" accept="image/*" onChange={handleImageChange} />
                    {uploading ? (
                         <div className="flex flex-col items-center gap-4">
                            <div className="w-12 h-12 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin" />
                            <p className="text-xs font-black text-primary-600 uppercase tracking-widest">Enviando...</p>
                        </div>
                    ) : (
                        <>
                            <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:shadow-lg transition-all">
                                <svg className="w-8 h-8 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 4v16m8-8H4" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </div>
                            <div className="text-center mt-6">
                                <p className="font-black text-gray-900 uppercase tracking-widest text-xs">Adicionar Foto</p>
                                <p className="text-[10px] text-gray-400 mt-1 font-bold">Resolução 16:9 ideal</p>
                            </div>
                        </>
                    )}
                </div>

                {/* Gallery Items */}
                {data.gallery?.map((url: string, index: number) => (
                    <div key={index} className="aspect-square relative rounded-[40px] overflow-hidden group shadow-md border border-gray-100">
                        <img src={url} alt={`Gallery ${index}`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                            <button 
                                onClick={() => updateData({ gallery: data.gallery.filter((_: any, i: number) => i !== index) })}
                                className="p-4 bg-red-500 text-white rounded-2xl shadow-xl hover:scale-110 transition-transform"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <ImageCropModal
                isOpen={cropModal.isOpen}
                imageSrc={cropModal.imageSrc}
                aspectRatio={16 / 9}
                onClose={() => setCropModal({ isOpen: false, imageSrc: '' })}
                onCropComplete={handleCropComplete}
            />
        </div>
    );
};

const ServiceWizard = ({ onCancel, initialData, onSuccess }: { onCancel?: () => void, initialData?: any, onSuccess?: () => void }) => {
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
        serviceType: initialData?.service_type || 'fixed',
        locationType: initialData?.location_type || 'in_store',
        description: initialData?.description || '',
        tags: Array.isArray(initialData?.tags) ? initialData.tags.join(', ') : (initialData?.tags || ''),
        packages: initialData?.packages || {} as ServicePackages,
        gallery: initialData?.gallery || [] as string[],
        useCompanyAvailability: initialData?.use_company_availability ?? true,
        isSinglePackage: initialData?.is_single_package ?? true,
        requiresQuote: initialData?.requires_quote ?? false,
        allowsEscrow: initialData?.allows_escrow ?? true,
        // Questions
        questions: initialData?.service_forms?.[0]?.questions || [],
        // Registration fields
        registrationNumber: initialData?.registration_number || '',
        registrationState: initialData?.registration_state || '',
        registrationImage: initialData?.registration_image || null,
        certificationId: initialData?.certification_id || ''
    });

    const isEditing = !!initialData;

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
            const startingPrice = calculateStartingPrice();

            // Fetch company to get ID and H3 Index
            const { data: companyData } = await supabase
                .from('companies')
                .select('id, h3_index')
                .eq('profile_id', user.id)
                .single();

            let companyId = companyData?.id;
            let companyH3 = companyData?.h3_index;

            if (!companyId) throw new Error("Perfil de empresa não encontrado.");

            const serviceH3Index = (formData.serviceType === 'remote_fixed' || formData.priceType === 'budget') ? null : companyH3;

            let finalPackages = formData.packages;
            if (formData.priceType === 'fixed') {
                finalPackages = { ...formData.packages, standard: null, premium: null };
            }

            const basicPackage = formData.packages?.basic;
            const deliveryTime = basicPackage?.delivery_time || 1;
            const deliveryUnit = basicPackage?.delivery_unit || 'days';

            let durationMinutes = 0;
            let durationLabel = "";

            if (deliveryUnit === 'minutes') {
                durationMinutes = deliveryTime;
                durationLabel = `${deliveryTime} ${deliveryTime === 1 ? 'minuto' : 'minutos'}`;
            } else if (deliveryUnit === 'hours') {
                durationMinutes = deliveryTime * 60;
                durationLabel = `${deliveryTime} ${deliveryTime === 1 ? 'hora' : 'horas'}`;
            } else {
                durationMinutes = deliveryTime * 1440;
                durationLabel = `${deliveryTime} ${deliveryTime === 1 ? 'dia' : 'dias'}`;
            }

            const servicePayload = {
                company_id: companyId,
                title: formData.title,
                description: formData.description,
                price: startingPrice,
                starting_price: startingPrice,
                duration: durationLabel,
                duration_minutes: durationMinutes,
                packages: finalPackages,
                gallery: (formData.gallery || []).filter((url: string) => !url.startsWith('blob:')),
                service_type: formData.serviceType,
                location_type: formData.locationType,
                h3_index: serviceH3Index,
                category_tag: formData.category,
                subcategory: formData.subcategory,
                use_company_availability: formData.useCompanyAvailability,
                is_single_package: formData.priceType === 'fixed',
                requires_quote: formData.priceType === 'budget',
                allows_escrow: formData.allowsEscrow,
                tags: formData.tags.split(',').map((t: string) => t.trim()).filter(Boolean),
                registration_number: formData.registrationNumber,
                registration_state: formData.registrationState,
                registration_image: (formData.registrationImage?.startsWith('blob:')) ? null : formData.registrationImage,
                certification_id: formData.certificationId
            };

            let serviceId = initialData?.id;
            let newlyCreatedServiceId = null;

            if (isEditing) {
                const { error } = await supabase
                    .from('services')
                    .update(servicePayload)
                    .eq('id', serviceId);

                if (error) throw error;
            } else {
                const { data: newService, error } = await supabase
                    .from('services')
                    .insert([servicePayload])
                    .select()
                    .single();

                if (error) throw error;
                serviceId = newService.id;
            }

            // Save Questions (service_forms)
            if (formData.priceType === 'budget') {
                const validQuestions = formData.questions.map((q: string) => q.trim()).filter((q: string) => q.length > 0);
                
                const { data: existingForm } = await supabase
                    .from('service_forms')
                    .select('id')
                    .eq('service_id', serviceId)
                    .maybeSingle();

                if (existingForm) {
                    await supabase
                        .from('service_forms')
                        .update({ questions: validQuestions })
                        .eq('id', existingForm.id);
                } else {
                    await supabase
                        .from('service_forms')
                        .insert({ service_id: serviceId, questions: validQuestions });
                }
            } else {
                await supabase
                    .from('service_forms')
                    .delete()
                    .eq('service_id', serviceId);
            }

            addToast(isEditing ? "Serviço atualizado!" : "Serviço criado com sucesso!", "success");
            if (onSuccess) onSuccess();
            else navigate(`/dashboard/empresa/${user.companySlug || 'me'}/servicos`);
        } catch (error: any) {
            console.error(error);
            addToast(error.message || "Erro ao salvar serviço.", "error");
        } finally {
            setLoading(false);
        }
    };

    const validateStep = (step: number) => {
        const newErrors: any = {};
        let isValid = true;

        if (step === 0) {
            if (!formData.title.trim()) {
                newErrors.title = true;
                isValid = false;
            }
            if (!formData.category) {
                newErrors.category = true;
                isValid = false;
            }
            if (!formData.subcategory) {
                newErrors.subcategory = true;
                isValid = false;
            }

            // Professional registration validation
            const category = SERVICE_CATEGORIES.find(c => c.id === formData.category);
            const subcategory = category?.subcategories.find(s => s.id === formData.subcategory);

            if (subcategory?.requiresBoard) {
                if (!formData.registrationNumber?.trim()) {
                    newErrors.registrationNumber = true;
                    isValid = false;
                }
                if (subcategory.requiresBoard.showUf && !formData.registrationState) {
                    newErrors.registrationState = true;
                    isValid = false;
                }
                if (!formData.registrationImage) {
                    newErrors.registrationImage = true;
                    isValid = false;
                }
                if (!isValid) addToast(`Campos de registro (${subcategory.requiresBoard.name}) são obrigatórios.`, "error");
            }

            if (subcategory?.requiresCertification && !subcategory.requiresBoard) {
                if (!formData.certificationId?.trim()) {
                    newErrors.certificationId = true;
                    isValid = false;
                }
                if (!formData.registrationImage) {
                    newErrors.registrationImage = true;
                    isValid = false;
                }
                if (!isValid) addToast(`Certificação (${subcategory.requiresCertification.name}) e imagem são obrigatórias.`, "error");
            }
        }

        if (step === 1) {
            if (!formData.requiresQuote) {
                if (formData.isSinglePackage) {
                    if (!formData.packages?.basic?.price || formData.packages.basic.price <= 0) {
                        addToast("Defina um preço válido.", "error");
                        isValid = false;
                    }
                } else {
                    const hasPrice = Object.values(formData.packages || {}).some((p: any) => p && p.price > 0);
                    if (!hasPrice) {
                        addToast("Defina o preço de pelo menos um pacote.", "error");
                        isValid = false;
                    }
                }
            }
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleNext = () => {
        if (!validateStep(currentStep)) {
            return;
        }

        if (currentStep < steps.length - 1) {
            setCurrentStep(curr => curr + 1);
            setErrors({});
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
                        <CurrentComponent data={formData} updateData={updateData} errors={errors} />
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-gray-100 flex justify-between">
                <Button variant="secondary" onClick={currentStep === 0 ? onCancel : handleBack} disabled={(currentStep === 0 && !onCancel) || loading}>
                    {currentStep === 0 ? 'Cancelar' : 'Voltar'}
                </Button>
                <Button variant="primary" onClick={handleNext} isLoading={loading}>
                    {currentStep === steps.length - 1 ? (isEditing ? 'Salvar Alterações' : 'Publicar Serviço') : 'Próximo'}
                </Button>
            </div>
        </div>
    );
};

export default ServiceWizard;
