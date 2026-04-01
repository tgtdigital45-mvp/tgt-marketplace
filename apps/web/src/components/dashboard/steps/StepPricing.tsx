import React from 'react';
import type { StepProps, PackageTier } from '../wizard.types';

const StepPricing = ({ data, updateData, errors }: StepProps) => {
    React.useEffect(() => {
        if (!data.packages || Object.keys(data.packages).length === 0) {
            updateData({
                packages: {
                    basic: { name: 'Básico', price: 0, delivery_time: 1, delivery_unit: 'days', revisions: 0, features: [], description: '' },
                    standard: { name: 'Padrão', price: 0, delivery_time: 3, delivery_unit: 'days', revisions: 2, features: [], description: '' },
                    premium: { name: 'Premium', price: 0, delivery_time: 7, delivery_unit: 'days', revisions: -1, features: [], description: '' },
                },
            });
        }
    }, [data.priceType]);

    const handleChange = (tier: PackageTier, field: string, value: string | number) => {
        updateData({ packages: { ...data.packages, [tier]: { ...data.packages?.[tier], [field]: value } } });
    };

    if (data.priceType === 'fixed') {
        return (
            <div className="space-y-10 max-w-2xl mx-auto">
                <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-xl space-y-8">
                    <div className="space-y-4">
                        <label className="block text-sm font-black text-gray-900 uppercase tracking-widest">Preço Individual (R$)</label>
                        <input
                            type="number"
                            min={0}
                            value={data.packages?.basic?.price || ''}
                            onChange={e => handleChange('basic', 'price', Number(e.target.value))}
                            className="w-full p-6 bg-gray-50 border-2 rounded-3xl text-3xl font-black"
                        />
                        {errors?.packages && <p className="text-red-500 text-sm mt-1">{errors.packages}</p>}
                    </div>

                    <div className="space-y-4">
                        <label className="block text-sm font-black text-amber-600 uppercase tracking-widest">Preço Promocional (Opcional)</label>
                        <div className="relative">
                            <input
                                type="number"
                                min={0}
                                value={data.promotionalPrice || ''}
                                onChange={e => updateData({ promotionalPrice: e.target.value ? Number(e.target.value) : undefined })}
                                placeholder="Ex: 197"
                                className="w-full p-5 bg-amber-50/50 border-2 border-amber-100 rounded-3xl text-2xl font-bold text-amber-700 focus:border-amber-400 focus:bg-amber-50 outline-none transition-all"
                            />
                            {data.promotionalPrice && data.packages?.basic?.price && data.packages.basic.price > data.promotionalPrice && (
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-black">
                                    -{Math.round((1 - data.promotionalPrice / data.packages.basic.price) * 100)}% OFF
                                </div>
                            )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium">Deixe em branco para valor normal. O marketplace exibirá o preço riscado.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <label className="block text-sm font-black">Prazo</label>
                            <input
                                type="number"
                                min={1}
                                value={data.packages?.basic?.delivery_time || ''}
                                onChange={e => handleChange('basic', 'delivery_time', Number(e.target.value))}
                                className="w-full p-4 bg-gray-50 border-2 rounded-3xl"
                            />
                        </div>
                        <div className="space-y-4">
                            <label className="block text-sm font-black text-gray-900">Unidade</label>
                            <select
                                value={data.packages?.basic?.delivery_unit || 'days'}
                                onChange={e => handleChange('basic', 'delivery_unit', e.target.value)}
                                className="w-full p-4 bg-gray-50 border-2 rounded-3xl"
                            >
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
        return (
            <div className="p-10 bg-amber-50 rounded-[40px] text-center">
                <h3 className="text-xl font-bold">Modo Orçamento Ativo</h3>
                <p>O preço será definido após a solicitação do cliente.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {errors?.packages && <p className="text-red-500 text-sm text-center">{errors.packages}</p>}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {(['basic', 'standard', 'premium'] as PackageTier[]).map((tier) => (
                    <div key={tier} className="bg-white rounded-[40px] border-2 p-8 space-y-4">
                        <h4 className="text-xl font-black uppercase text-center">{tier}</h4>
                        <input
                            type="number"
                            min={0}
                            value={data.packages?.[tier]?.price || ''}
                            onChange={e => handleChange(tier, 'price', Number(e.target.value))}
                            className="w-full p-4 bg-gray-50 rounded-2xl"
                            placeholder="Preço"
                        />
                        <textarea
                            value={data.packages?.[tier]?.description || ''}
                            onChange={e => handleChange(tier, 'description', e.target.value)}
                            className="w-full p-4 bg-gray-50 rounded-2xl h-24"
                            placeholder="O que inclui?"
                        />
                    </div>
                ))}
            </div>

            <div className="mt-8 bg-amber-50/30 border border-amber-100 rounded-[40px] p-8 space-y-6">
                <div>
                    <h4 className="text-sm font-black text-amber-600 uppercase tracking-widest mb-2">Preço Promocional do Serviço</h4>
                    <p className="text-xs text-slate-500 mb-4">Este valor será exibido como preço principal em destaque, mantendo os pacotes como opções.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <input
                            type="number"
                            min={0}
                            value={data.promotionalPrice || ''}
                            onChange={e => updateData({ promotionalPrice: e.target.value ? Number(e.target.value) : undefined })}
                            placeholder="Valor Promocional (R$)"
                            className="w-full p-4 bg-white border-2 border-amber-100 rounded-3xl font-bold text-amber-700 focus:border-amber-400 outline-none transition-all"
                        />
                        {data.promotionalPrice && data.packages?.basic?.price && data.packages.basic.price > data.promotionalPrice && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-amber-500 text-white px-2.5 py-0.5 rounded-full text-[10px] font-black">
                                -{Math.round((1 - data.promotionalPrice / data.packages.basic.price) * 100)}%
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StepPricing;
