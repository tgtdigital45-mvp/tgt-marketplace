import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, ArrowRight, Building2, Lock, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { LoadingSpinner } from '@tgt/shared';

const PRO_URL = import.meta.env.VITE_PRO_URL || 'https://parceiros.contratto.com.br';

const PortalLandingPage: React.FC = () => {
  const { user, loading } = useAuth();
  const { company, isLoading: companyLoading } = useCompany();

  if (loading || companyLoading) return <LoadingSpinner />;

  if (user) {
    if (company?.slug) return <Navigate to={`/dashboard/empresa/${company.slug}`} replace />;
    return <Navigate to="/cadastro" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Panel — Dark Branding */}
      <motion.div
        className="lg:w-1/2 bg-slate-900 flex flex-col justify-between px-10 py-12 lg:px-16 lg:py-16"
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        {/* Top: Logo + Badge */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <img
              src="/logo-contratto.png"
              alt="CONTRATTO"
              className="h-10 w-auto brightness-0 invert"
            />
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-600 bg-slate-800 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-slate-300">
              <Lock className="h-3 w-3 text-slate-400" />
              Portal de Parceiros
            </span>
          </div>

          {/* Headline */}
          <div className="mt-8 lg:mt-16">
            <motion.h1
              className="text-3xl lg:text-4xl xl:text-5xl font-bold leading-tight text-white"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
            >
              Sua empresa, sua operação,{' '}
              <span className="text-sky-400">tudo em um só lugar.</span>
            </motion.h1>

            <motion.p
              className="mt-5 text-base text-slate-400 leading-relaxed max-w-md"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
            >
              Acesse o painel exclusivo de gestão para empresas parceiras CONTRATTO.
            </motion.p>
          </div>

          {/* Feature Bullets */}
          <motion.ul
            className="mt-8 flex flex-col gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
          >
            {[
              'Dashboard financeiro em tempo real',
              'Gestão de serviços e agendamentos',
              'Faturamento e emissão de NF-e',
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-slate-300 text-sm">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-sky-500/20 ring-1 ring-sky-500/40">
                  <Check className="h-3.5 w-3.5 text-sky-400" strokeWidth={2.5} />
                </span>
                {item}
              </li>
            ))}
          </motion.ul>
        </div>

        {/* Bottom: Security Badges */}
        <motion.div
          className="mt-16 flex flex-wrap items-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800/70 px-3 py-1.5 text-xs text-slate-400">
            <Lock className="h-3 w-3 text-green-400" />
            SSL criptografado
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800/70 px-3 py-1.5 text-xs text-slate-400">
            <ShieldCheck className="h-3 w-3 text-sky-400" />
            Acesso verificado
          </span>
        </motion.div>
      </motion.div>

      {/* Right Panel — Light CTAs */}
      <motion.div
        className="lg:w-1/2 bg-white flex flex-col items-center justify-center px-8 py-14 lg:px-16"
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        {/* Mobile / Tablet logo */}
        <div className="mb-8 lg:hidden">
          <img
            src="/logo-contratto.png"
            alt="CONTRATTO"
            className="h-8 w-auto"
          />
        </div>

        <div className="w-full max-w-sm">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
              Bem-vindo ao Portal
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Selecione como deseja continuar
            </p>
          </motion.div>

          <motion.div
            className="mt-10 flex flex-col gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {/* Primary CTA */}
            <a
              href="/login"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-4 text-base font-semibold text-white shadow-md transition-all hover:bg-slate-800 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
            >
              Entrar na minha conta
              <ArrowRight className="h-4 w-4" />
            </a>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">ou</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            {/* Secondary CTA */}
            <a
              href="/cadastro"
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-6 py-4 text-base font-semibold text-slate-900 transition-all hover:border-slate-300 hover:bg-slate-50 hover:-translate-y-0.5 active:translate-y-0"
            >
              <Building2 className="h-4 w-4" />
              Cadastrar minha empresa
            </a>
          </motion.div>

          {/* Legal */}
          <motion.p
            className="mt-8 text-center text-xs text-slate-400 leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.45 }}
          >
            Ao usar o portal, você concorda com os{' '}
            <Link to="/termos" className="underline underline-offset-2 hover:text-slate-600 transition-colors">
              Termos de Uso
            </Link>{' '}
            e{' '}
            <Link to="/privacidade" className="underline underline-offset-2 hover:text-slate-600 transition-colors">
              Política de Privacidade
            </Link>
            .
          </motion.p>

          {/* Back to site */}
          <motion.div
            className="mt-6 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.55 }}
          >
            <a
              href={PRO_URL}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              ← Voltar ao site
            </a>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default PortalLandingPage;
