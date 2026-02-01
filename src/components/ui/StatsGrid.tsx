import React from 'react';

interface StatItem {
    label: string;
    value: string | number;
    icon?: React.ReactNode;
}

interface StatsGridProps {
    stats: StatItem[];
}

const StatsGrid: React.FC<StatsGridProps> = ({ stats }) => {
    return (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {stats.map((stat, index) => (
                <div key={index} className="bg-white overflow-hidden shadow rounded-[var(--radius-box)] px-4 py-5 sm:p-6">
                    <dt className="text-sm font-medium text-gray-500 truncate">{stat.label}</dt>
                    <dd className="mt-1 text-3xl font-semibold text-gray-900">{stat.value}</dd>
                </div>
            ))}
        </div>
    );
};

export default StatsGrid;
