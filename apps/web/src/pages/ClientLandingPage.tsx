import React from 'react';
import SEO from '@/components/SEO';
import HeroSection from '@/components/HeroSection';
import BenefitsBar from '@/components/landing/BenefitsBar';
import IntroSection from '@/components/landing/IntroSection';
import FeaturedProfessional from '@/components/landing/FeaturedProfessional';
import ProfessionalGallery from '@/components/landing/ProfessionalGallery';
import PricingSection from '@/components/landing/PricingSection';
import BlogSection from '@/components/landing/BlogSection';
import SpecialistCTA from '@/components/landing/SpecialistCTA';




// ─── Main Page ────────────────────────────────────────────────────────────────
const ClientLandingPage: React.FC = () => {


  return (
    <div className="bg-white text-gray-800">
      <SEO
        title="CONTRATTO | Conectando Profissionais e Empresas com Excelência"
        description="A maior rede corporativa de serviços locais. Encontre contadores, engenheiros, especialistas em estética e muito mais em um ecossistema seguro e verificado."
        keywords="empresas locais, serviços profissionais, marketplace b2b, contabilidade, engenharia, estética, parcerias comerciais"
      />

      {/* 1. Hero Section (always visible) */}
      <HeroSection />

      {/* 2. Benefits Bar */}
      <BenefitsBar />



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
