import React from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import { useSubscription } from '@/hooks/useSubscription';
import PlanCard from '@/components/subscription/PlanCard';
import Button from '@/components/ui/Button';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import { motion } from 'framer-motion';
import {
  ChevronRight,
  ShieldCheck,
  CreditCard,
  ArrowUpRight,
  Headphones,
  Sparkles,
} from 'lucide-react';

// Real Stripe Price IDs
const PRICES = {
  STARTER: 'price_1SzSFqE72T1QHvIbDVIMu7nR',
  PRO: 'price_1SzSFTE72T1QHvIbUuPtfr7T',
  AGENCY: 'price_1SzSFTE72T1QHvIbFhyM0f6J',
};

const TIER_LABELS: Record<string, string> = {
  starter: 'Starter',
  pro: 'CONTRATTO Pro',
  agency: 'Agency',
};

const DashboardSubscriptionPage: React.FC = () => {
  const { company, isLoading: isCompanyLoading } = useCompany();
  const { subscribe, manageSubscription, isLoadingSubscribe: isSubLoading } = useSubscription();

  if (isCompanyLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-5 sm:space-y-6">
        <LoadingSkeleton className="h-10 w-64 rounded-xl" />
        <LoadingSkeleton className="h-32 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <LoadingSkeleton key={i} className="h-96 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!company) return <div className="p-8 text-sm text-gray-500">Empresa nao encontrada.</div>;

  const currentTier = company.current_plan_tier || 'starter';
  const hasActiveSub =
    company.subscription_status === 'active' || company.subscription_status === 'trialing';

  const handleSubscribe = (priceId: string) => {
    if (hasActiveSub) {
      manageSubscription();
    } else {
      subscribe(priceId, company.id);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5 sm:space-y-6">
      {/* ─── Page Header ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3"
      >
        <div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
            <span>Dashboard</span>
            <ChevronRight size={12} />
            <span className="text-gray-600 font-medium">Assinatura</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              Assinatura e Planos
            </h1>
            <span
              className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                hasActiveSub
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {hasActiveSub ? 'Ativo' : 'Inativo'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
            Gerencie sua assinatura e desbloqueie recursos exclusivos
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={manageSubscription}
          isLoading={isSubLoading}
          className="!rounded-xl"
        >
          <CreditCard size={14} className="mr-1.5" />
          Portal de Cobranca
        </Button>
      </motion.div>

      {/* ─── Current Plan Status Card ────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 relative overflow-hidden"
      >
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                currentTier === 'pro' || currentTier === 'agency'
                  ? 'bg-primary-50 text-primary-500'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              <ShieldCheck size={22} />
            </div>
            <div>
              <p className="text-xs text-gray-400">Plano Atual</p>
              <h2 className="text-lg font-bold text-gray-900">
                {TIER_LABELS[currentTier] || 'Starter'}
              </h2>
              <span
                className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  hasActiveSub
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                {hasActiveSub ? 'Ativo' : 'Aguardando Pagamento'}
              </span>
            </div>
          </div>

          {hasActiveSub && currentTier !== 'starter' && (
            <div className="flex flex-col sm:items-end gap-1">
              <span className="text-xs text-gray-400">
                Proxima cobranca gerenciada pelo{' '}
                <span className="font-medium text-gray-600">Stripe</span>
              </span>
              <button
                onClick={manageSubscription}
                className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
              >
                Cancelar Assinatura
              </button>
            </div>
          )}
        </div>

        {/* Decorative element */}
        {(currentTier === 'pro' || currentTier === 'agency') && (
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary-500/5 rounded-full blur-2xl" />
        )}
      </motion.div>

      {/* ─── Plans Grid ──────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={14} className="text-primary-500" />
          <h3 className="text-sm font-bold text-gray-800">Escolha seu plano</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <PlanCard
              tier="starter"
              title="Starter"
              price="R$ 49,90"
              description="Para quem esta comecando a vender servicos."
              features={[
                'Ate 5 servicos ativos',
                'Taxa de servico: 20%',
                'Perfil basico da empresa',
                'Listagem na busca',
              ]}
              isCurrent={currentTier === 'starter'}
              buttonText="Seu Plano Atual"
              onButtonClick={() => {}}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <PlanCard
              tier="pro"
              title="CONTRATTO Pro"
              price="R$ 99,90"
              description="Para profissionais que buscam mais visibilidade e menor taxa."
              features={[
                'Servicos ilimitados',
                'Taxa reduzida: 12%',
                'Selo de Verificado',
                'Emissor de NF-e Automatico',
              ]}
              highlight
              isCurrent={currentTier === 'pro'}
              isLoading={isSubLoading}
              buttonText={
                hasActiveSub && currentTier !== 'pro' ? 'Alterar para Pro' : 'Assinar Agora'
              }
              onButtonClick={() => handleSubscribe(PRICES.PRO)}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <PlanCard
              tier="agency"
              title="Agency"
              price="R$ 299,90"
              description="Para agencias e empresas com alto volume de vendas."
              features={[
                'Tudo do plano Pro',
                'Taxa minima: 8%',
                'Menor taxa do mercado',
                'Multi-usuarios',
                'Relatorios de Inteligencia',
              ]}
              isCurrent={currentTier === 'agency'}
              isLoading={isSubLoading}
              buttonText={
                hasActiveSub && currentTier !== 'agency'
                  ? 'Alterar para Agency'
                  : 'Assinar Agora'
              }
              onButtonClick={() => handleSubscribe(PRICES.AGENCY)}
            />
          </motion.div>
        </div>
      </motion.div>

      {/* ─── Custom Plan CTA ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gray-50 rounded-2xl border border-gray-100 p-6 sm:p-8 text-center"
      >
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mx-auto mb-3 border border-gray-100 shadow-sm">
          <Headphones size={18} className="text-gray-500" />
        </div>
        <h3 className="text-sm font-bold text-gray-800 mb-1">Precisa de um plano customizado?</h3>
        <p className="text-xs text-gray-400 mb-4 max-w-md mx-auto leading-relaxed">
          Para grandes volumes ou necessidades especificas, entre em contato com nosso time
          comercial.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open('mailto:contato@contratto.com', '_blank')}
          className="!rounded-xl"
        >
          Falar com Vendas
          <ArrowUpRight size={12} className="ml-1.5" />
        </Button>
      </motion.div>
    </div>
  );
};

export default DashboardSubscriptionPage;
