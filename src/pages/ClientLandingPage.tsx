import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import CompanyCard from '../components/CompanyCard';
import { useMockData } from '../contexts/MockContext';
// import QuickSearch from '../components/QuickSearch'; // Unused
import HeroSection from '../components/HeroSection';
import OptimizedImage from '../components/ui/OptimizedImage';
import AnimatedSection from '../components/ui/AnimatedSection';
import ReorderCarousel from '../components/client/ReorderCarousel';


const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const CompareIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ConnectIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2V7a2 2 0 012-2h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 01.293.707V8z" /></svg>;


const ClientLandingPage: React.FC = () => {
  const { companies: featuredCompanies } = useMockData();

  return (
    <div className="bg-white text-gray-800">
      {/* Hero Section */}
      <HeroSection />

      {/* How it Works Section - Asymmetric Staggered Layout */}
      <section className="py-24 bg-white relative">
        <div className="container mx-auto px-4">
          <AnimatedSection>
            <h2 className="text-5xl md:text-7xl font-black mb-16 text-brand-secondary tracking-tighter">
              COMO<br />FUNCIONA
            </h2>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Step 1: Dominant */}
            <AnimatedSection delay={0.1} className="md:col-span-5 p-8 md:p-12 bg-brand-secondary text-white rounded-sharp shadow-xl min-h-[400px] flex flex-col justify-between group hover:-translate-y-2 transition-transform duration-500">
              <div className="bg-brand-primary w-12 h-12 flex items-center justify-center font-bold text-2xl rounded-sharp mb-8">1</div>
              <div>
                <h3 className="text-3xl font-bold mb-4">Busque</h3>
                <p className="text-white/80 text-lg leading-relaxed">
                  Não perca tempo. Digite o que precisa e receba instantaneamente uma lista curada de profissionais verificados na sua região.
                </p>
              </div>
              <SearchIcon />
            </AnimatedSection>

            {/* Step 2: Offset */}
            <AnimatedSection delay={0.2} className="md:col-span-4 md:mt-24 p-8 border-4 border-brand-primary bg-white rounded-sharp min-h-[350px] flex flex-col justify-between group hover:-translate-y-2 transition-transform duration-500">
              <div className="text-brand-primary w-12 h-12 flex items-center justify-center font-bold text-2xl border-2 border-brand-primary rounded-sharp mb-8">2</div>
              <div>
                <h3 className="text-3xl font-bold mb-4 text-brand-secondary">Compare</h3>
                <p className="text-gray-600 leading-relaxed">
                  Transparência total. Analise perfis, fotos reais, portfólios e avaliações honestas sem filtros ocultos.
                </p>
              </div>
              <div className="text-brand-primary"><CompareIcon /></div>
            </AnimatedSection>

            {/* Step 3: Vertical Strip */}
            <AnimatedSection delay={0.3} className="md:col-span-3 md:mt-48 p-8 bg-gray-100/50 backdrop-blur rounded-sharp min-h-[300px] flex flex-col justify-between group hover:-translate-y-2 transition-transform duration-500">
              <div className="text-gray-400 w-12 h-12 flex items-center justify-center font-bold text-2xl mb-8">3</div>
              <div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">Conecte-se</h3>
                <p className="text-sm text-gray-500">
                  Negocie direto. Sem intermediários, sem taxas surpresa. O acordo é entre você e o profissional.
                </p>
              </div>
              <div className="text-gray-400 grayscale group-hover:grayscale-0 transition-all"><ConnectIcon /></div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Featured Companies Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Empresas em Destaque</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {featuredCompanies.slice(0, 2).map(company => (
              <CompanyCard key={company.id} company={company} />
            ))}
          </div>
        </div>
      </section>

      {/* Video Section - Overlap Layout */}
      <section className="py-24 bg-brand-secondary text-white overflow-hidden relative">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-[20%] right-[-10%] w-[50vw] h-[50vw] bg-brand-primary rounded-full blur-[120px]" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-[1fr_1.5fr] gap-12 items-center">
            <AnimatedSection className="order-2 md:order-1 relative z-20 bg-brand-secondary/80 backdrop-blur p-8 md:-mr-24 rounded-sharp border border-white/10 shadow-2xl">
              <h2 className="text-4xl font-black mb-6 leading-none">
                QUALIDADE & CONFIANÇA<br />
                <span className="text-brand-primary">PERTO DE VOCÊ</span>
              </h2>
              <p className="text-brand-accent/80 text-lg mb-6 leading-relaxed">
                Nossa missão é fortalecer o comércio local. Sem algoritmos opacos, apenas conexões reais entre quem precisa e quem resolve.
              </p>
              <Button variant="secondary" className="border-white text-white hover:bg-white hover:text-brand-secondary">
                Assista ao Manifesto
              </Button>
            </AnimatedSection>

            <AnimatedSection delay={0.2} className="order-1 md:order-2 relative aspect-video bg-black rounded-sharp overflow-hidden group cursor-pointer shadow-2xl">
              <OptimizedImage src="https://picsum.photos/seed/videobg/800/450" alt="Video placeholder" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity duration-500" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 bg-brand-primary rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white ml-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Testimonials Section - Asymmetric Grid */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <AnimatedSection>
            <h2 className="text-4xl font-bold text-center mb-16 uppercase tracking-wider">O que dizem por ai</h2>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            {/* Main Testimonial (Large) */}
            <AnimatedSection className="md:col-span-2 bg-gray-50 p-10 rounded-sharp border border-gray-200 shadow-sm relative">
              <div className="text-6xl text-brand-primary absolute top-4 left-6 opacity-20 font-serif">"</div>
              <p className="text-2xl text-gray-800 font-medium leading-relaxed relative z-10">
                "Usei a TGT para encontrar uma consultoria de vinhos e a experiência foi incrível! Encontrei a Adega Vinho Sul, que prestou um serviço impecável."
              </p>
              <div className="mt-8 flex items-center gap-4 border-t pt-6 border-gray-200">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-brand-primary">
                  <OptimizedImage src="https://i.pravatar.cc/150?u=a042581f4e29026704d" className="w-full h-full object-cover" alt="Carlos Pereira" />
                </div>
                <div>
                  <p className="font-bold text-lg">Carlos Pereira</p>
                  <p className="text-sm text-brand-secondary font-medium">Cliente Verificado</p>
                </div>
              </div>
            </AnimatedSection>

            {/* Secondary Testimonial (Compact) */}
            <AnimatedSection delay={0.2} className="bg-brand-primary text-white p-8 rounded-sharp shadow-lg mt-0 md:mt-12">
              <p className="text-lg italic opacity-90 mb-6">
                "Finalmente uma plataforma que facilita encontrar bons fornecedores. Contratei a Tech Solutions e a qualidade foi surpreendente."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden border border-white/50">
                  <OptimizedImage src="https://i.pravatar.cc/150?u=a042581f4e29026706d" className="w-full h-full object-cover" alt="Mariana Costa" />
                </div>
                <div>
                  <p className="font-bold text-sm">Mariana Costa</p>
                  <p className="text-xs opacity-75">Cliente Satisfeita</p>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gray-50">
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-3xl font-bold text-gray-900">Pronto para encontrar o que precisa?</h2>
          <p className="mt-2 text-gray-600 max-w-2xl mx-auto">Milhares de empresas e serviços locais esperam por você. A busca é rápida, fácil e gratuita.</p>
          <Link to="/empresas" className="mt-8 inline-block">
            <Button className="text-lg px-8 py-3 transform hover:scale-105 transition-transform">
              Começar a buscar agora
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default ClientLandingPage;
