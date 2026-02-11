import React from 'react';
import { CheckIcon } from '@heroicons/react/24/solid';
import Button from '../ui/Button';

interface PlanCardProps {
    title: string;
    price: string;
    description: string;
    features: string[];
    isCurrent?: boolean;
    buttonText?: string;
    onButtonClick?: () => void;
    isLoading?: boolean;
    highlight?: boolean;
    tier: 'starter' | 'pro' | 'agency';
}

const PlanCard: React.FC<PlanCardProps> = ({
    title,
    price,
    description,
    features,
    isCurrent,
    buttonText = 'Assinar Agora',
    onButtonClick,
    isLoading,
    highlight,
    tier
}) => {
    return (
        <div className={`
            relative p-6 rounded-2xl border transition-all duration-300 flex flex-col h-full
            ${isCurrent
                ? 'border-brand-primary bg-brand-primary/5 ring-1 ring-brand-primary'
                : highlight
                    ? 'border-brand-secondary/50 bg-white shadow-xl scale-105 z-10'
                    : 'border-gray-200 bg-white shadow-sm hover:shadow-md'
            }
        `}>
            {isCurrent && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-brand-primary text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                        Plano Atual
                    </span>
                </div>
            )}

            {highlight && !isCurrent && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-brand-secondary text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                        Recomendado
                    </span>
                </div>
            )}

            <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide">{title}</h3>
                <div className="mt-4 flex items-baseline">
                    <span className="text-3xl font-extrabold text-gray-900">{price}</span>
                    <span className="ml-1 text-gray-500 text-sm">/mês</span>
                </div>
                <p className="mt-4 text-sm text-gray-600 min-h-[40px]">{description}</p>
            </div>

            <ul className="space-y-4 mb-8 flex-grow">
                {features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                        <CheckIcon className="h-5 w-5 text-green-500 shrink-0 mr-2" />
                        <span className="text-sm text-gray-600">{feature}</span>
                    </li>
                ))}
            </ul>

            <Button
                variant={isCurrent ? 'outline' : highlight ? 'primary' : 'secondary'}
                className="w-full justify-center"
                onClick={onButtonClick}
                loading={isLoading}
                disabled={isCurrent || isLoading}
            >
                {isCurrent ? 'Plano Ativo' : buttonText}
            </Button>
        </div>
    );
};

export default PlanCard;
