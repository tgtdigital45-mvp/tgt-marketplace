import React from 'react';
import { ServicePackages } from '@tgt/shared';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/solid';
import Button from '@/components/ui/Button';

interface ServiceComparisonTableProps {
    packages: ServicePackages;
    onSelect: (tier: string) => void;
}

const ServiceComparisonTable: React.FC<ServiceComparisonTableProps> = ({ packages, onSelect }) => {
    // Helper to get features list (union of all features across packages for rows)
    // For simplicity, we'll just list common known features or map from available packages.
    // In a real app, you might want a defined list of comparison points.
    // Here we'll stick to fixed rows based on the Figma/Upwork style:
    // "Delivery Time", "Revisions", and then dynamic features.

    const tiers = [
        { id: 'basic', label: 'Básico', data: packages.basic },
        { id: 'standard', label: 'Padrão', data: packages.standard },
        { id: 'premium', label: 'Premium', data: packages.premium },
    ].filter(t => t.data); // Only show available tiers

    if (tiers.length === 0) return null;

    // Collect all unique features to create rows
    const allFeatures = new Set<string>();
    tiers.forEach(t => t.data?.features.forEach(f => allFeatures.add(f)));
    const featureList = Array.from(allFeatures);

    return (
        <div className="overflow-x-auto border border-gray-200 rounded-2xl shadow-sm bg-white">
            <table className="w-full min-w-[600px] text-left border-collapse">
                <thead>
                    <tr>
                        <th className="p-6 border-b border-gray-200 bg-gray-50/50 w-1/4 min-w-[200px]">
                            <span className="text-gray-500 font-medium text-sm uppercase tracking-wider">Pacote</span>
                        </th>
                        {tiers.map(tier => (
                            <th key={tier.id} className="p-6 border-b border-gray-200 w-1/4">
                                <div className="text-xl font-bold text-gray-900 mb-1">{tier.data?.price?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                                <div className="text-sm font-semibold text-gray-700 uppercase">{tier.data?.name}</div>
                                <p className="text-xs text-gray-500 mt-2 font-normal leading-relaxed">{tier.data?.description}</p>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {/* Meta Rows */}
                    <tr>
                        <td className="p-4 text-gray-600 font-medium bg-gray-50/30">Prazo de Entrega</td>
                        {tiers.map(tier => (
                            <td key={tier.id} className="p-4 text-center text-gray-700">
                                {tier.data?.delivery_time} dias
                            </td>
                        ))}
                    </tr>
                    <tr>
                        <td className="p-4 text-gray-600 font-medium bg-gray-50/30">Revisões</td>
                        {tiers.map(tier => (
                            <td key={tier.id} className="p-4 text-center text-gray-700">
                                {tier.data?.revisions === -1 ? 'Ilimitadas' : tier.data?.revisions}
                            </td>
                        ))}
                    </tr>

                    {/* Feature Rows */}
                    {featureList.map((feature, idx) => (
                        <tr key={idx}>
                            <td className="p-4 text-gray-600 bg-gray-50/30 text-sm">{feature}</td>
                            {tiers.map(tier => {
                                const hasFeature = tier.data?.features.includes(feature);
                                return (
                                    <td key={tier.id} className="p-4 text-center">
                                        {hasFeature ? (
                                            <CheckIcon className="w-5 h-5 text-gray-900 mx-auto" />
                                        ) : (
                                            <div className="w-1.5 h-1.5 bg-gray-300 rounded-full mx-auto" />
                                        )}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}

                    {/* Button Row */}
                    <tr>
                        <td className="p-6 border-t border-gray-100 bg-gray-50/50"></td>
                        {tiers.map(tier => (
                            <td key={tier.id} className="p-6 border-t border-gray-100 text-center">
                                <Button
                                    variant="primary"
                                    className="w-full py-2.5 text-sm font-bold"
                                    onClick={() => onSelect(tier.id)}
                                >
                                    Selecionar
                                </Button>
                            </td>
                        ))}
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

export default ServiceComparisonTable;
