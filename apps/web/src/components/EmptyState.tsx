import React from 'react';

interface EmptyStateProps {
    title?: string;
    description?: string;
    icon?: React.ReactNode;
    action?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({
    title = 'Nenhum resultado encontrado',
    description = 'Tente ajustar seus filtros ou buscar por outro termo.',
    icon,
    action,
}) => {
    return (
        <div className="text-center py-16 px-4 bg-white rounded-[var(--radius-box)] border border-gray-100 flex flex-col items-center justify-center">
            <div className="bg-gray-50 p-4 rounded-full mb-4">
                {icon ? (
                    icon
                ) : (
                    <svg
                        className="w-12 h-12 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                    </svg>
                )}
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-500 max-w-sm mb-6">{description}</p>
            {action && <div>{action}</div>}
        </div>
    );
};

export default EmptyState;
