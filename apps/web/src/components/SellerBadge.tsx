import React from 'react';

export type SellerLevel = 'Iniciante' | 'Nível 1' | 'Pro';

interface SellerBadgeProps {
    level: SellerLevel;
    className?: string;
    showLabel?: boolean;
}

const SellerBadge: React.FC<SellerBadgeProps> = ({ level, className = '', showLabel = false }) => {
    if (!level || level === 'Iniciante') return null;

    const badges = {
        'Nível 1': {
            icon: (
                <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            ),
            bg: 'bg-blue-50',
            text: 'text-blue-700',
            border: 'border-blue-200',
            label: 'Nível 1'
        },
        'Pro': {
            icon: (
                <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
            ),
            bg: 'bg-black',
            text: 'text-white',
            border: 'border-transparent shadow-sm',
            label: 'Pro'
        }
    };

    const style = badges[level] || badges['Nível 1'];

    return (
        <div
            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${style.bg} ${style.text} ${style.border} ${className}`}
            title={`Vendedor ${style.label}`}
        >
            <span className="mr-1">{style.icon}</span>
            {showLabel && style.label}
        </div>
    );
};

export default SellerBadge;
