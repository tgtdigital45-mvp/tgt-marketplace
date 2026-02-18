import React from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import { useSubscription } from '@/hooks/useSubscription';
import PlanCard from '@/components/subscription/PlanCard';
import Button from '@/components/ui/Button';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';

const DashboardSubscriptionPage = () => {
    const { company, isLoading: isCompanyLoading } = useCompany();
    const { subscribe, manageSubscription, isLoadingSubscribe: isSubLoading } = useSubscription();

    if (isCompanyLoading) {
        return <div className="p-8"><LoadingSkeleton className="h-96 w-full" /></div>;
    }

    if (!company) return <div>Empresa não encontrada.</div>;

    const currentTier = company.current_plan_tier || 'starter';
    const hasActiveSub = company.subscription_status === 'active' || company.subscription_status === 'trialing';

    const handleSubscribe = (priceId: string) => {
        // If user already has an active subscription, redirect to portal to manage/swap
        if (hasActiveSub) {
            manageSubscription();
        } else {
            subscribe(priceId, company.id);
        }
    };

    const handleCancel = () => {
        manageSubscription();
    };

    // Real Stripe Price IDs
    const PRICES = {
        STARTER: 'price_1SzSFqE72T1QHvIbDVIMu7nR', // R$ 49,90
        PRO: 'price_1SzSFTE72T1QHvIbUuPtfr7T',     // R$ 99,90
        AGENCY: 'price_1SzSFTE72T1QHvIbFhyM0f6J'  // R$ 299,90
    };

    return (
        <div className="space-y-8 max-w-6xl mx-auto p-4 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Assinatura e Planos</h1>
                    <p className="text-gray-600">Gerencie sua assinatura e desbloqueie recursos exclusivos.</p>
                </div>

                {/* manage billing button */}
                <Button
                    variant="outline"
                    onClick={manageSubscription}
                    loading={isSubLoading}
                    className="w-full md:w-auto"
                >
                    Gerenciar Cobrança (Portal)
                </Button>
            </div>

            {/* Current Plan Status */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center space-x-4">
                        <div className={`p-3 rounded-full ${currentTier === 'pro' ? 'bg-brand-primary/10' : 'bg-gray-100'}`}>
                            <ShieldCheckIcon className={`w-8 h-8 ${currentTier === 'pro' ? 'text-brand-primary' : 'text-gray-500'}`} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Plano Atual</p>
                            <h2 className="text-xl font-bold text-gray-900 capitalize">
                                {currentTier === 'agency' ? 'Agency' : currentTier === 'pro' ? 'TGT Pro' : 'Starter'}
                            </h2>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${company.subscription_status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                }`}>
                                {company.subscription_status === 'active' ? 'Ativo' : 'Aguardando Pagamento'}
                            </span>
                        </div>
                    </div>

                    {/* Cancellation / Upgrade Context Actions */}
                    {hasActiveSub && currentTier !== 'starter' && (
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-500">
                                Próxima cobrança: <span className="font-medium text-gray-900">Gerenciado pelo Stripe</span>
                            </span>
                            <button
                                onClick={handleCancel}
                                className="text-sm text-red-600 hover:text-red-800 font-medium underline"
                            >
                                Cancelar Assinatura
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
                {/* Starter Plan */}
                <PlanCard
                    tier="starter"
                    title="Starter"
                    price="R$ 49,90"
                    description="Para quem está começando a vender serviços."
                    features={[
                        "Até 5 serviços ativos",
                        "Taxa de serviço: 20%",
                        "Perfil básico da empresa",
                        "Listagem na busca"
                    ]}
                    isCurrent={currentTier === 'starter'}
                    buttonText="Seu Plano Atual"
                    onButtonClick={() => { }} // No action for free plan
                />

                {/* Pro Plan */}
                <PlanCard
                    tier="pro"
                    title="TGT Pro"
                    price="R$ 99,90"
                    description="Para profissionais que buscam mais visibilidade e menor taxa."
                    features={[
                        "Serviços ilimitados",
                        "Taxa de serviço reduzida: 12%",
                        "Selo de Verificado",
                        "Emissor de NF-e Automático"
                    ]}
                    highlight={true}
                    isCurrent={currentTier === 'pro'}
                    isLoading={isSubLoading}
                    buttonText={hasActiveSub && currentTier !== 'pro' ? "Alterar para Pro" : "Assinar Agora"}
                    onButtonClick={() => handleSubscribe(PRICES.PRO)}
                />

                {/* Agency Plan */}
                <PlanCard
                    tier="agency"
                    title="Agency"
                    price="R$ 299,90"
                    description="Para agências e empresas com alto volume de vendas."
                    features={[
                        "Tudo do plano Pro",
                        "Taxa de serviço mínima: 8%",
                        "Menor taxa do mercado",
                        "Multi-usuários",
                        "Relatórios de Inteligência"
                    ]}
                    isCurrent={currentTier === 'agency'}
                    isLoading={isSubLoading}
                    buttonText={hasActiveSub && currentTier !== 'agency' ? "Alterar para Agency" : "Assinar Agora"}
                    onButtonClick={() => handleSubscribe(PRICES.AGENCY)}
                />
            </div>

            <div className="mt-12 bg-gray-50 rounded-xl p-8 text-center">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Precisa de um plano customizado?</h3>
                <p className="text-gray-600 mb-6">Para grandes volumes ou necessidades específicas, entre em contato com nosso time comercial.</p>
                <Button variant="outline" onClick={() => window.open('mailto:contato@tgt.com', '_blank')}>
                    Falar com Vendas
                </Button>
            </div>
        </div>
    );
};

export default DashboardSubscriptionPage;
