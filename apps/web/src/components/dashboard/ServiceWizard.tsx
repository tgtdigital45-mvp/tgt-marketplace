import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { ServicePackages } from '@tgt/shared';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@tgt/shared';
import { SERVICE_CATEGORIES } from '@/data/serviceDefinitions';

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
        { label: 'Presencial (Cliente vai até a empresa)', value: 'presential_customer_goes' },
        { label: 'Presencial (Empresa vai até o cliente)', value: 'presential_company_goes' },
        { label: 'Remoto (Online)', value: 'remote' },
        { label: 'Híbrido', value: 'hybrid' },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900">Vamos começar com o básico</h3>
                <p className="text-gray-500 mt-2">Dê um título chamativo e escolha a categoria do seu serviço.</p>
            </div>

            <div className="space-y-6 max-w-2xl mx-auto">
                <motion.div animate={errors?.title ? { x: [-10, 10, -10, 10, 0] } : {}}>
                    <Input
                        label="Título do Serviço"
                        placeholder="Ex: Vou criar um logo minimalista para sua marca"
                        value={data.title}
                        onChange={(e) => updateData({ title: e.target.value })}
                        helperText="Use palavras-chave que os clientes buscariam."
                        className={errors?.title ? "border-red-500 focus:ring-red-500" : ""}
                    />
                    {errors?.title && <p className="text-red-500 text-xs mt-1">O título é obrigatório.</p>}
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <motion.div animate={errors?.category ? { x: [-10, 10, -10, 10, 0] } : {}} className="space-y-4">
                        <Select
                            label="Categoria"
                            value={data.category}
                            onChange={(value) => updateData({ category: value, subcategory: '' })}
                            options={categoryOptions}
                            placeholder="Selecione..."
                        />
                        {errors?.category && <p className="text-red-500 text-xs mt-1">Selecione uma categoria.</p>}

                        <Select
                            label="Subcategoria"
                            value={data.subcategory}
                            onChange={(value) => updateData({ subcategory: value })}
                            options={subcategoryOptions}
                            placeholder="Selecione..."
                            disabled={!data.category}
                        />
                        {errors?.subcategory && <p className="text-red-500 text-xs mt-1">Selecione uma subcategoria.</p>}

                        {selectedSubcategory?.registrationRules && (
                            <div className="mt-4 p-4 bg-purple-50 rounded-xl border border-purple-100 animate-in slide-in-from-top-2 duration-300">
                                <h4 className="text-sm font-bold text-purple-900 mb-2 flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    Regras de Cadastro para {selectedSubcategory.label}
                                </h4>
                                <ul className="space-y-1">
                                    {selectedSubcategory.registrationRules.map((rule, idx) => (
                                        <li key={idx} className="text-xs text-purple-700 flex items-start gap-2">
                                            <span className="mt-1 w-1 h-1 rounded-full bg-purple-400 shrink-0" />
                                            {rule}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </motion.div>

                    <motion.div className="w-full">
                        <Select
                            label="Tipo de Atendimento"
                            value={data.serviceType}
                            onChange={(value) => updateData({ serviceType: value })}
                            options={serviceTypeOptions}
                            placeholder="Selecione..."
                        />
                        <div className="mt-4 flex flex-col gap-3">
                            <div className="flex items-start p-3 bg-blue-50 rounded-lg border border-blue-100">
                                <div className="flex h-5 items-center">
                                    <input
                                        id="useCompanyAvailability"
                                        type="checkbox"
                                        checked={data.useCompanyAvailability}
                                        onChange={(e) => updateData({ useCompanyAvailability: e.target.checked })}
                                        className="h-4 w-4 text-brand-primary focus:ring-brand-primary border-gray-300 rounded"
                                    />
                                </div>
                                <div className="ml-3 text-sm">
                                    <label htmlFor="useCompanyAvailability" className="font-medium text-gray-700">
                                        Limitar agendamento aos horários da empresa
                                    </label>
                                    <p className="text-gray-500">Se marcado, o cliente só poderá agendar nos dias/horas configurados na sua Agenda.</p>
                                </div>
                            </div>

                            <div className="flex items-start p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex h-5 items-center">
                                    <input
                                        id="isSinglePackage"
                                        type="checkbox"
                                        checked={data.isSinglePackage}
                                        onChange={(e) => updateData({ isSinglePackage: e.target.checked })}
                                        className="h-4 w-4 text-brand-primary focus:ring-brand-primary border-gray-300 rounded"
                                    />
                                </div>
                                <div className="ml-3 text-sm">
                                    <label htmlFor="isSinglePackage" className="font-medium text-gray-700">
                                        Serviço Padrão (Pacote Único)
                                    </label>
                                    <p className="text-gray-500">Marque se este serviço possui apenas um preço/formato (ex: Clareamento R$ 300).</p>
                                </div>
                            </div>

                            <div className="flex items-start p-3 bg-orange-50 rounded-lg border border-orange-100">
                                <div className="flex h-5 items-center">
                                    <input
                                        id="requiresQuote"
                                        type="checkbox"
                                        checked={data.requiresQuote}
                                        onChange={(e) => updateData({ requiresQuote: e.target.checked })}
                                        className="h-4 w-4 text-orange-600 focus:ring-orange-600 border-gray-300 rounded"
                                    />
                                </div>
                                <div className="ml-3 text-sm">
                                    <label htmlFor="requiresQuote" className="font-medium text-gray-700">
                                        Necessita de Orçamento Prévio
                                    </label>
                                    <p className="text-gray-500">Os clientes solicitarão um orçamento antes de visualizar o preço final.</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

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
                    basic: { name: 'Basic', price: 0, delivery_time: 1, delivery_unit: 'days', revisions: 0, features: [], description: '' },
                    standard: { name: 'Standard', price: 0, delivery_time: 3, delivery_unit: 'days', revisions: 2, features: [], description: '' },
                    premium: { name: 'Premium', price: 0, delivery_time: 7, delivery_unit: 'days', revisions: -1, features: [], description: '' }
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

    if (data.isSinglePackage) {
        return (
            <div className="space-y-6 animate-in fade-in duration-500 max-w-2xl mx-auto">
                <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-gray-900">Detalhes de Preço e Prazo</h3>
                    <p className="text-gray-500 mt-2">Defina as condições do seu serviço.</p>
                </div>

                <div className="space-y-6 bg-gray-50/50 p-6 rounded-xl border border-gray-200">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descrição Inclusa</label>
                        <textarea
                            value={data.packages?.basic?.description || ''}
                            onChange={e => handleChange('basic', 'description', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg text-sm resize-none h-24 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none bg-white"
                            placeholder="Descreva o que está incluso ao contratar este serviço"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Duração / Prazo de Entrega</label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <input
                                        type="number"
                                        min="1"
                                        value={data.packages?.basic?.delivery_time || ''}
                                        onChange={e => handleChange('basic', 'delivery_time', Number(e.target.value))}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none bg-white"
                                    />
                                </div>
                                <div className="flex bg-gray-100 p-1 rounded-lg">
                                    <button
                                        type="button"
                                        onClick={() => handleChange('basic', 'delivery_unit', 'minutes')}
                                        className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${data.packages?.basic?.delivery_unit === 'minutes' ? 'bg-white text-brand-primary shadow-sm' : 'text-gray-500'}`}
                                    >
                                        Minutos
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleChange('basic', 'delivery_unit', 'hours')}
                                        className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${data.packages?.basic?.delivery_unit === 'hours' ? 'bg-white text-brand-primary shadow-sm' : 'text-gray-500'}`}
                                    >
                                        Horas
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleChange('basic', 'delivery_unit', 'days')}
                                        className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${data.packages?.basic?.delivery_unit !== 'hours' && data.packages?.basic?.delivery_unit !== 'minutes' ? 'bg-white text-brand-primary shadow-sm' : 'text-gray-500'}`}
                                    >
                                        Dias
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {data.requiresQuote ? (
                        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg flex items-center gap-3">
                            <svg className="w-6 h-6 text-orange-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <div>
                                <p className="text-orange-800 font-medium text-sm">Orçamento Prévio Necessário</p>
                                <p className="text-xs text-orange-600 mt-0.5">O cliente solicitará um orçamento. Você definirá o preço ao responder.</p>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Preço (R$)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-3 text-gray-500 font-bold">R$</span>
                                <input
                                    type="number"
                                    min="0"
                                    value={data.packages?.basic?.price || ''}
                                    onChange={e => handleChange('basic', 'price', Number(e.target.value))}
                                    className="w-full p-3 pl-12 border border-gray-300 rounded-lg font-bold text-brand-primary text-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none bg-white"
                                    placeholder="0,00"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

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
                                    <div className="flex flex-col gap-2">
                                        <input
                                            type="number"
                                            min="1"
                                            value={data.packages?.[tier]?.delivery_time || ''}
                                            onChange={e => handleChange(tier, 'delivery_time', Number(e.target.value))}
                                            className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none"
                                        />
                                        <div className="flex bg-gray-100 p-1 rounded-lg w-fit mx-auto">
                                            <button
                                                type="button"
                                                onClick={() => handleChange(tier, 'delivery_unit', 'minutes')}
                                                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${data.packages?.[tier]?.delivery_unit === 'minutes' ? 'bg-white text-brand-primary shadow-sm' : 'text-gray-500'}`}
                                            >
                                                M
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleChange(tier, 'delivery_unit', 'hours')}
                                                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${data.packages?.[tier]?.delivery_unit === 'hours' ? 'bg-white text-brand-primary shadow-sm' : 'text-gray-500'}`}
                                            >
                                                H
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleChange(tier, 'delivery_unit', 'days')}
                                                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${data.packages?.[tier]?.delivery_unit !== 'hours' && data.packages?.[tier]?.delivery_unit !== 'minutes' ? 'bg-white text-brand-primary shadow-sm' : 'text-gray-500'}`}
                                            >
                                                D
                                            </button>
                                        </div>
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
                        {!data.requiresQuote ? (
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
                        ) : (
                            <tr className="bg-orange-50/30">
                                <td className="px-6 py-4 font-bold text-orange-900">Preço</td>
                                <td colSpan={3} className="px-4 py-4 text-center">
                                    <span className="text-orange-700 font-medium">Sob Consulta (Requer Orçamento Prévio)</span>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const StepGallery = ({ data, updateData }: any) => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [uploading, setUploading] = useState(false);

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && user) {
            setUploading(true);
            try {
                const file = e.target.files[0];
                const fileExt = file.name.split('.').pop();
                const fileName = `${user.id}/${Math.random()}.${fileExt}`;
                const filePath = `services/${fileName}`;

                // Upload to 'portfolio' bucket as it's already configured and likely has correct policies
                const { error: uploadError } = await supabase.storage
                    .from('portfolio')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('portfolio')
                    .getPublicUrl(filePath);

                updateData({ gallery: [...(data.gallery || []), publicUrl] });
                addToast("Imagem carregada com sucesso!", "success");
            } catch (err: any) {
                console.error("Error uploading image:", err);
                addToast(err.message || "Erro ao carregar imagem.", "error");
            } finally {
                setUploading(false);
            }
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
        serviceType: initialData?.service_type || 'presential_customer_goes', // Default to presential
        description: initialData?.description || '',
        tags: Array.isArray(initialData?.tags) ? initialData.tags.join(', ') : (initialData?.tags || ''),
        packages: initialData?.packages || {} as ServicePackages,
        gallery: initialData?.gallery || [] as string[],
        useCompanyAvailability: initialData?.use_company_availability ?? true, // Default to true
        isSinglePackage: initialData?.is_single_package ?? false,
        requiresQuote: initialData?.requires_quote ?? false,
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

            // Fallback for ID if not found via profile_id (unlikely if flow is correct)
            if (!companyId && user.companySlug) {
                const { data: cData } = await supabase.from('companies').select('id, h3_index').eq('slug', user.companySlug).single();
                companyId = cData?.id;
                companyH3 = cData?.h3_index;
            }

            if (!companyId) throw new Error("Perfil de empresa não encontrado.");

            // Determine H3 for service
            // If remote, h3_index is null. If presential/hybrid, inherit from company.
            const serviceH3Index = (formData.serviceType === 'remote') ? null : companyH3;

            let finalPackages = formData.packages;
            if (formData.isSinglePackage) {
                // Nullify standard and premium if single package
                finalPackages = { ...(formData.packages as any), standard: null, premium: null };
            }

            const basicPackage = (formData.packages as any)?.basic;
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

            const payload = {
                title: formData.title,
                description: formData.description,
                price: startingPrice, // Legacy field
                starting_price: startingPrice,
                duration: durationLabel, // Readable string
                duration_minutes: durationMinutes, // NEW: Minutes for scheduling
                packages: finalPackages,
                gallery: formData.gallery,
                service_type: formData.serviceType,
                h3_index: serviceH3Index,
                category_tag: formData.category, // Syncing category_tag
                subcategory: formData.subcategory,
                use_company_availability: formData.useCompanyAvailability,
                is_single_package: formData.isSinglePackage,
                requires_quote: formData.requiresQuote,
                tags: formData.tags.split(',').map((t: string) => t.trim()).filter(Boolean),
                // Registration fields
                registration_number: formData.registrationNumber,
                registration_state: formData.registrationState,
                registration_image: formData.registrationImage,
                certification_id: formData.certificationId
            };

            if (isEditing) {
                const { error } = await supabase
                    .from('services')
                    .update(payload)
                    .eq('id', initialData.id);

                if (error) throw error;
                addToast("Serviço atualizado com sucesso!", "success");
            } else {
                const { error } = await supabase.from('services').insert({
                    company_id: companyId,
                    ...payload
                });

                if (error) throw error;
                addToast("Serviço criado com sucesso!", "success");
            }

            if (onSuccess) {
                onSuccess();
            } else {
                // Default behavior if no callback
                navigate(`/dashboard/empresa/${user.companySlug || 'me'}/servicos`);
            }
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
