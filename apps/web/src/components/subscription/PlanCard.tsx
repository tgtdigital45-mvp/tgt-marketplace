import React from 'react';
import { Check } from 'lucide-react';
import Button from '@/components/ui/Button';

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
  tier,
}) => {
  return (
    <div
      className={`relative p-6 rounded-2xl border transition-all duration-300 flex flex-col h-full ${
        isCurrent
          ? 'border-primary-500 bg-primary-50/50 ring-1 ring-primary-500'
          : highlight
            ? 'border-primary-200 bg-white shadow-xl scale-[1.03] z-10'
            : 'border-gray-100 bg-white shadow-sm hover:shadow-md'
      }`}
    >
      {isCurrent && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-primary-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            Plano Atual
          </span>
        </div>
      )}

      {highlight && !isCurrent && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-secondary-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            Recomendado
          </span>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">{title}</h3>
        <div className="mt-3 flex items-baseline">
          <span className="text-3xl font-extrabold text-gray-900">{price}</span>
          <span className="ml-1 text-gray-400 text-xs">/mes</span>
        </div>
        <p className="mt-3 text-xs text-gray-500 leading-relaxed min-h-[36px]">{description}</p>
      </div>

      <ul className="space-y-3 mb-8 flex-grow">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2.5">
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                isCurrent || highlight
                  ? 'bg-emerald-100 text-emerald-600'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              <Check size={12} strokeWidth={3} />
            </div>
            <span className="text-sm text-gray-600">{feature}</span>
          </li>
        ))}
      </ul>

      <Button
        variant={isCurrent ? 'outline' : highlight ? 'primary' : 'secondary'}
        className="w-full justify-center !rounded-xl"
        onClick={onButtonClick}
        isLoading={isLoading}
        disabled={isCurrent || isLoading}
        size="sm"
      >
        {isCurrent ? 'Plano Ativo' : buttonText}
      </Button>
    </div>
  );
};

export default PlanCard;
