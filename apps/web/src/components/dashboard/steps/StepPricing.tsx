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
        </div>
    );
};

export default StepPricing;
