import React from 'react';
import { Check } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';

interface PricingCardProps {
    title: string;
    price: string;
    rate: string;
    features: string[];
    recommended?: boolean;
    current?: boolean;
    onSubscribe: () => void;
    loading?: boolean;
    tier: 'starter' | 'pro' | 'agency';
}

const PricingCard: React.FC<PricingCardProps> = ({
    title,
    price,
    rate,
    features,
    recommended,
    current,
    onSubscribe,
    loading,
}) => {
    return (
        <div
            className={`relative rounded-2xl border p-8 shadow-sm transition-all duration-300 hover:shadow-lg flex flex-col
      ${recommended ? 'border-primary-500 ring-2 ring-primary-500/20 bg-white scale-[1.02] z-10' : 'border-slate-200 bg-white'}
      ${current ? 'border-slate-300 bg-slate-50' : ''}
      `}
        >
            {recommended && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-primary-600 px-4 py-1 text-xs font-semibold text-white shadow-sm">
                    Recomendado
                </div>
            )}

            <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
                <div className="mt-4 flex items-baseline">
                    <span className="text-4xl font-bold tracking-tight text-slate-900">
                        {price}
                    </span>
                    {price !== 'Grátis' && (
                        <span className="text-lg font-semibold text-slate-500">/mês</span>
                    )}
                </div>
                <p className="mt-2 text-sm text-slate-500">
                    Taxa de serviço: <span className="font-semibold text-primary-600">{rate}</span>
                </p>
            </div>

            <ul className="mb-8 space-y-4 flex-1">
                {features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                        <Check className="mr-3 h-5 w-5 flex-shrink-0 text-primary-500" />
                        <span className="text-sm text-slate-600">{feature}</span>
                    </li>
                ))}
            </ul>

            <button
                onClick={onSubscribe}
                disabled={current || loading}
                className={`w-full rounded-lg px-4 py-2.5 text-center text-sm font-semibold transition-all duration-200
        ${current
                        ? 'cursor-not-allowed bg-slate-100 text-slate-400'
                        : recommended
                            ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-md hover:shadow-lg'
                            : 'bg-white text-slate-900 ring-1 ring-slate-200 hover:bg-slate-50'
                    }
        `}
            >
                {loading ? (
                    <svg className="animate-spin h-5 w-5 mx-auto text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                ) : current ? (
                    'Plano Atual'
                ) : (
                    'Fazer Upgrade'
                )}
            </button>
        </div>
    );
};

export const PricingTable: React.FC = () => {
    const { currentPlan, handleSubscribe, isLoadingSubscribe } = useSubscription();

    const plans = [
        {
            tier: 'starter',
            title: 'Starter',
            price: 'Grátis',
            rate: '20%',
            features: [
                'Acesso a oportunidades',
                'Perfil básico',
                'Taxa de 20% por serviço',
                'Suporte por email',
            ],
            priceId: undefined, // Free plan
        },
        {
            tier: 'pro',
            title: 'CONTRATTO Pro',
            price: 'R$ 89,90',
            rate: '12%',
            recommended: true,
            features: [
                'Tudo do Starter',
                'Taxa reduzida de 12%',
                'Destak em buscas',
                'Selo Pro no perfil',
                'Suporte prioritário',
            ],
            priceId: 'price_1Qv...Pro', // Replace with Actual Stripe Price ID or handle in Edge Function mapping
        },
        {
            tier: 'agency',
            title: 'Agency',
            price: 'R$ 249,90',
            rate: '8%',
            features: [
                'Tudo do Pro',
                'Taxa mínima de 8%',
                'Múltiplos usuários (em breve)',
                'Gerente de conta dedicado',
                'API de integração',
            ],
            priceId: 'price_1Qv...Agency',
        },
    ];

    return (
        <div className="mx-auto max-w-7xl px-6 lg:px-8 py-12">
            <div className="mx-auto max-w-4xl text-center mb-16">
                <h2 className="text-base font-semibold leading-7 text-primary-600">Planos & Taxas</h2>
                <p className="mt-2 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                    Escolha o plano ideal para seu crescimento
                </p>
                <p className="mt-6 text-lg leading-8 text-slate-600">
                    Reduza suas taxas de serviço e aumente seus lucros assinando nossos planos profissionais.
                </p>
            </div>

            <div className="isolate mx-auto grid max-w-md grid-cols-1 gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-3">
                {plans.map((plan) => (
                    <PricingCard
                        key={plan.tier}
                        {...plan}
                        current={currentPlan === plan.tier}
                        loading={isLoadingSubscribe}
                        onSubscribe={() => handleSubscribe(plan.priceId)}
                    />
                ))}
            </div>

            <div className="mt-16 flex justify-center">
                <button
                    onClick={() => handleSubscribe()} // Call without priceId for portal
                    className="text-sm font-semibold leading-6 text-primary-600 hover:text-primary-500 flex items-center gap-2"
                >
                    Já possui assinatura? Gerenciar planos <span aria-hidden="true">→</span>
                </button>
            </div>
        </div>
    );
};
