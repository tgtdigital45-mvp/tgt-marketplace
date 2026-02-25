import React from 'react';
import SEO from '@/components/SEO';
import HeroSection from '@/components/HeroSection';
import LogoBar from '@/components/landing/LogoBar';
import BenefitsBar from '@/components/landing/BenefitsBar';
import HowItWorks from '@/components/landing/HowItWorks';
import CategoriesSection from '@/components/landing/CategoriesSection';
import StatsSection from '@/components/landing/StatsSection';
import FeaturedProfessional from '@/components/landing/FeaturedProfessional';
import ProfessionalGallery from '@/components/landing/ProfessionalGallery';
import TestimonialsSection from '@/components/landing/TestimonialsSection';
import PricingSection from '@/components/landing/PricingSection';
import FAQ from '@/components/landing/FAQ';
import SpecialistCTA from '@/components/landing/SpecialistCTA';

// ─── Main Landing Page ─────────────────────────────────────────────────────────
// Section order optimized for conversion funnel:
// 1. Hero         → First impression + search (capture intent)
// 2. LogoBar      → Immediate social proof (trust)
// 3. Benefits     → Value proposition (why us)
// 4. HowItWorks   → Reduce friction (how it works)
// 5. Categories   → Browse options (exploration)
// 6. Stats        → Hard numbers (credibility)
// 7. Featured     → Success story (aspiration)
// 8. Gallery      → Real professionals (tangibility)
// 9. Testimonials → Social proof (validation)
// 10. Pricing     → Investment (after value is clear)
// 11. FAQ         → Remove objections (final doubts)
// 12. CTA         → Final push (conversion)
const ClientLandingPage: React.FC = () => {
  return (
    <div className="bg-white text-gray-800">
      <SEO
        title="CONTRATTO | A Rede Verificada de Prestadores de Servico do Parana"
        description="Encontre, compare e contrate os melhores prestadores verificados. Mais de 5.000 empresas avaliadas por clientes reais com garantia CONTRATTO."
        keywords="prestadores verificados, servicos profissionais, marketplace b2b, contabilidade, engenharia, tecnologia, saude, parana"
      />

      {/* 1. Hero — First impression + search */}
      <HeroSection />

      {/* 2. LogoBar — Immediate social proof */}
      <LogoBar />

      {/* 3. Benefits — Why choose CONTRATTO */}
      <BenefitsBar />

      {/* 4. How It Works — Reduce friction */}
      <HowItWorks />

      {/* 5. Categories — Browse by specialty */}
      <CategoriesSection />

      {/* 6. Stats — Hard numbers for credibility */}
      <StatsSection />

      {/* 7. Featured Professional — Success spotlight */}
      <FeaturedProfessional />

      {/* 8. Professional Gallery — Real people */}
      <ProfessionalGallery />

      {/* 9. Testimonials — Client validation */}
      <TestimonialsSection />

      {/* 10. Pricing — After value is established */}
      <PricingSection />

      {/* 11. FAQ — Remove final objections */}
      <FAQ />

      {/* 12. CTA — Final conversion push */}
      <SpecialistCTA />
    </div>
  );
};

export default ClientLandingPage;
