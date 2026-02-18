import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Building2 } from 'lucide-react';
import SEO from '../components/SEO';
import HeroSection from '../components/HeroSection';
import BenefitsBar from '../components/landing/BenefitsBar';
import IntroSection from '../components/landing/IntroSection';
import FeaturedProfessional from '../components/landing/FeaturedProfessional';
import ProfessionalGallery from '../components/landing/ProfessionalGallery';
import PricingSection from '../components/landing/PricingSection';
import BlogSection from '../components/landing/BlogSection';
import SpecialistCTA from '../components/landing/SpecialistCTA';
import ServicesMarketplacePage from './ServicesMarketplacePage';
import LandingPage from './LandingPage';

type ActiveTab = 'servicos' | 'empresas';

// ─── Tab Bar ─────────────────────────────────────────────────────────────────
function TabBar({ active, onChange }: { active: ActiveTab; onChange: (t: ActiveTab) => void }) {
  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'servicos', label: 'Serviços', icon: <Layers size={16} /> },
    { id: 'empresas', label: 'Empresas & Pros', icon: <Building2 size={16} /> },
  ];

  return (
    <div className="sticky top-0 z-20 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex gap-1 py-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`relative flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${active === tab.id
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-gray-50'
                }`}
            >
              {tab.icon}
              {tab.label}
              {active === tab.id && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"
                />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const ClientLandingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('servicos');

  return (
    <div className="bg-white text-gray-800">
      <SEO
        title="TGT Contratto | Conectando Profissionais e Empresas com Excelência"
        description="A maior rede corporativa de serviços locais. Encontre contadores, engenheiros, especialistas em estética e muito mais em um ecossistema seguro e verificado."
        keywords="empresas locais, serviços profissionais, marketplace b2b, contabilidade, engenharia, estética, parcerias comerciais"
      />

      {/* 1. Hero Section (always visible) */}
      <HeroSection />

      {/* 2. Benefits Bar */}
      <BenefitsBar />

      {/* 3. Tab Navigation */}
      <TabBar active={activeTab} onChange={setActiveTab} />

      {/* 4. Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'servicos' ? (
          <motion.div
            key="servicos"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {/* Service-First marketplace vitrine */}
            <ServicesMarketplacePage />
          </motion.div>
        ) : (
          <motion.div
            key="empresas"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {/* Company directory (reuses existing LandingPage) */}
            <LandingPage />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. Sections below tabs (always visible) */}
      <IntroSection />
      <FeaturedProfessional />
      <ProfessionalGallery />
      <PricingSection />
      <BlogSection />
      <SpecialistCTA />
    </div>
  );
};

export default ClientLandingPage;
