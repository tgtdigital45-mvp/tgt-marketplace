import React from 'react';

interface KPICardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    trend?: {
        value: string;
        isPositive: boolean;
    };
}

/**
 * KPICard - Card de métrica para dashboard admin
 */
const KPICard: React.FC<KPICardProps> = ({ title, value, subtitle, icon, trend }) => {
    return (
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        {title}
                    </p>
                    <h3 className="text-3xl font-bold text-gray-900 mb-1">
                        {value}
                    </h3>
                    {subtitle && (
                        <p className="text-sm text-gray-600">
                            {subtitle}
                        </p>
                    )}
                    {trend && (
                        <div className="mt-2 flex items-center gap-1">
                            <span className={`text-sm font-semibold ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                {trend.isPositive ? '↑' : '↓'} {trend.value}
                            </span>
                            <span className="text-xs text-gray-500">vs. mês anterior</span>
                        </div>
                    )}
                </div>
                <div className="w-14 h-14 bg-brand-primary/10 rounded-xl flex items-center justify-center text-brand-primary flex-shrink-0">
                    {icon}
                </div>
            </div>
        </div>
    );
};

export default React.memo(KPICard);
