import React from 'react';
import { motion } from 'framer-motion';
import { useFeaturedCompanies } from '../hooks/useFeaturedCompanies';
import SEO from '../components/SEO';
import HeroSection from '../components/HeroSection';
import BenefitsBar from '../components/landing/BenefitsBar';
import IntroSection from '../components/landing/IntroSection';
import FeaturedProfessional from '../components/landing/FeaturedProfessional';
import ProfessionalGallery from '../components/landing/ProfessionalGallery';
import PricingSection from '../components/landing/PricingSection';
import BlogSection from '../components/landing/BlogSection';
import SpecialistCTA from '../components/landing/SpecialistCTA';
import CompanyCard from '../components/CompanyCard';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';

const ClientLandingPage: React.FC = () => {
  const { data: featuredCompanies = [], isLoading } = useFeaturedCompanies();

  return (
    <div className="bg-white text-gray-800">
      <SEO
        title="TGT Contratto | Conectando Profissionais e Empresas com Excelência"
        description="A maior rede corporativa de serviços locais. Encontre contadores, engenheiros, especialistas em estética e muito mais em um ecossistema seguro e verificado."
        keywords="empresas locais, serviços profissionais, marketplace b2b, contabilidade, engenharia, estética, parcerias comerciais"
      />

      {/* 1. Hero Section */}
      <HeroSection />

      {/* 2. Benefits Bar */}
      <BenefitsBar />

      {/* 3. Introduction Section */}
      <IntroSection />

      {/* 4. Featured Companies (Success Grid) */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div className="max-w-2xl">
              <span className="text-primary-600 font-bold tracking-widest text-[10px] uppercase mb-4 block">Resultados</span>
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight leading-tight">
                Descubra seu caminho para o <span className="text-slate-400">Sucesso</span>
              </h2>
            </div>
            <Link to="/empresas" className="group flex items-center gap-2 text-slate-900 font-bold hover:text-primary-600 transition-colors">
              Explorar Negócios <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              <LoadingSkeleton className="h-96 w-full rounded-2xl" />
              <LoadingSkeleton className="h-96 w-full rounded-2xl" />
              <LoadingSkeleton className="h-96 w-full rounded-2xl" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {featuredCompanies.map((company, index) => (
                <motion.div
                  key={company.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <CompanyCard company={company} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 5. Featured Program/Professional */}
      <FeaturedProfessional />

      {/* 6. Expert Gallery */}
      <ProfessionalGallery />

      {/* 7. Pricing Section */}
      <PricingSection />

      {/* 8. Blog Section */}
      <BlogSection />

      {/* 9. Final Specialist CTA */}
      <SpecialistCTA />

    </div>
  );
};

export default ClientLandingPage;
