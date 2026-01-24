import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';
import ServiceCard from '../components/ServiceCard';
// import MapEmbed from '../components/MapEmbed'; // Unused
// import ImageGallery from '../components/ImageGallery'; // Unused
import Button from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { useFavorites } from '../contexts/FavoritesContext';
import MessageModal from '../components/MessageModal';
import ServiceBookingModal from '../components/ServiceBookingModal';
import ReviewModal from '../components/ReviewModal';
import Badge from '../components/ui/Badge';
// import StatsGrid from '../components/ui/StatsGrid'; // Unused
import FAQSection from '../components/FAQSection';
import { Service, Company } from '../types';
import { supabase } from '../lib/supabase';

const HeartIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
  </svg>
);

const CompanyProfilePage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();

  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [heroImageError, setHeroImageError] = useState(false);

  useEffect(() => {
    const fetchCompany = async () => {
      if (!slug) return;
      setLoading(true);
      try {
        // Fetch company details
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('*')
          .eq('slug', slug)
          .single();

        if (companyError) throw companyError;

        // Fetch services for this company
        const { data: servicesData, error: servicesError } = await supabase
          .from('services')
          .select('*')
          .eq('company_id', companyData.id);

        if (servicesError) throw servicesError;

        // Construct Company object compatible with UI types
        // Note: Address is JSONB in DB but object in UI. Cast safely.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const address = companyData.address as any;

        const constructedCompany: Company = {
          id: companyData.id,
          slug: companyData.slug,
          companyName: companyData.company_name,
          legalName: companyData.legal_name,
          cnpj: companyData.cnpj,
          logo: companyData.logo_url || 'https://via.placeholder.com/150',
          coverImage: companyData.cover_image_url || 'https://placehold.co/1200x400',
          category: companyData.category,
          rating: 5.0, // TODO: Calculate from reviews table
          reviewCount: 0, // TODO: Count from reviews table
          description: companyData.description || '',
          address: {
            street: address.street || '',
            number: address.number || '',
            district: address.district || '',
            city: address.city || '',
            state: address.state || '',
            cep: address.cep || '',
            lat: -23.55052, // Placeholder default
            lng: -46.63330  // Placeholder default
          },
          phone: companyData.phone,
          email: companyData.email,
          website: companyData.website,
          services: servicesData || [],
          portfolio: [], // TODO: implementations
          reviews: []    // TODO: implementations
        };

        setCompany(constructedCompany);
      } catch (err) {
        console.error("Error fetching company:", err);
        setError("Empresa não encontrada ou erro ao carregar.");
      } finally {
        setLoading(false);
      }
    };

    fetchCompany();
  }, [slug]);


  if (loading) return <div className="text-center py-20">Carregando perfil...</div>;
  if (!company || error) return <div className="text-center py-20">{error || "Empresa não encontrada."}</div>;

  const favorited = isFavorite(company.id);

  const handleToggleFavorite = () => {
    if (favorited) {
      removeFavorite(company.id);
    } else {
      addFavorite(company.id);
    }
  };

  const handleRequestQuote = (service: Service) => {
    setSelectedService(service);
    setIsBookingModalOpen(true);
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleAddReview = (review: any) => {
    // Placeholder: Connect to DB later
    console.log("Adding review", review);
  }

  return (
    <div className="bg-white">
      <Helmet>
        <title>{company.companyName} | TGT - Guia de Negócios</title>
        <meta name="description" content={`Confira os serviços e avaliações de ${company.companyName} em ${company.address.city}, ${company.address.state}.`} />
        <link rel="canonical" href={`https://tgt-guia-de-negocios.vercel.app/#/empresa/${company.slug}`} />

        {/* Schema.org LocalBusiness Markup */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": company.companyName,
            "image": company.logo,
            "description": company.description,
            "@id": `https://tgt-guia-de-negocios.vercel.app/#/empresa/${company.slug}`,
            "url": company.website || `https://tgt-guia-de-negocios.vercel.app/#/empresa/${company.slug}`,
            "telephone": company.phone,
            "email": company.email,
            "address": {
              "@type": "PostalAddress",
              "streetAddress": `${company.address.street}, ${company.address.number}`,
              "addressLocality": company.address.city,
              "addressRegion": company.address.state,
              "postalCode": company.address.cep,
              "addressCountry": "BR"
            },
            "geo": {
              "@type": "GeoCoordinates",
              "latitude": company.address.lat,
              "longitude": company.address.lng
            },
            "aggregateRating": company.reviewCount > 0 ? {
              "@type": "AggregateRating",
              "ratingValue": company.rating,
              "reviewCount": company.reviewCount
            } : undefined,
            "priceRange": "$$"
          })}
        </script>

        {/* Schema.org Service Markup */}
        {company.services.length > 0 && (
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ItemList",
              "itemListElement": company.services.map((service, index) => ({
                "@type": "ListItem",
                "position": index + 1,
                "item": {
                  "@type": "Service",
                  "name": service.title,
                  "description": service.description,
                  "provider": {
                    "@type": "LocalBusiness",
                    "name": company.companyName
                  },
                  "offers": service.price ? {
                    "@type": "Offer",
                    "price": service.price,
                    "priceCurrency": "BRL"
                  } : undefined
                }
              }))
            })}
          </script>
        )}
      </Helmet>

      {/* Cover Image and Header */}
      <div className={`relative h-64 md:h-80 bg-gray-200 ${heroImageError ? 'bg-gradient-to-r from-brand-primary to-brand-secondary' : ''}`}>
        {!heroImageError && (
          <img
            src={company.coverImage}
            alt={`${company.companyName} cover`}
            className="w-full h-full object-cover absolute inset-0 z-0"
            onError={() => setHeroImageError(true)}
          />
        )}
        {!heroImageError && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10" />
        )}

        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 z-20">
          <div className="container mx-auto flex flex-col md:flex-row items-center">
            <img src={company.logo} alt={`${company.companyName} logo`} className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white bg-white shadow-lg" />
            <div className="md:ml-6 text-center md:text-left mt-4 md:mt-0 flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">{company.companyName}</h1>
              <p className="text-lg text-gray-200 mb-3">{company.category}</p>

              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                <Badge variant="success">Verificado</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-12">

            {/* About Section */}
            <section id="sobre">
              <h2 className="text-2xl font-bold text-gray-900 border-b pb-2 mb-4">Sobre a Empresa</h2>
              <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{company.description}</p>
            </section>

            {/* Services Section */}
            <section id="servicos">
              <h2 className="text-2xl font-bold text-gray-900 border-b pb-2 mb-4">Serviços</h2>
              {company.services.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {company.services.map(service => (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      onRequestQuote={handleRequestQuote}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Nenhum serviço cadastrado.</p>
              )}
            </section>

            {/* Portfolio Section */}
            <section id="portfolio">
              <h2 className="text-2xl font-bold text-gray-900 border-b pb-2 mb-4">Portfólio</h2>
              <p className="text-gray-500">Em breve...</p>
              {/* <ImageGallery items={company.portfolio} /> */}
            </section>

            {/* FAQ Section for GEO */}
            <FAQSection
              companyName={company.companyName}
              faqs={[
                {
                  question: `Qual o horário de atendimento da ${company.companyName}?`,
                  answer: `Entre em contato conosco pelo telefone ${company.phone || 'disponível no site'} para confirmar nossos horários de atendimento.`
                },
                {
                  question: `A ${company.companyName} atende em ${company.address.city}?`,
                  answer: `Sim! Estamos localizados em ${company.address.street}, ${company.address.number}, ${company.address.district}, ${company.address.city} - ${company.address.state}.`
                },
                {
                  question: "Como posso solicitar um orçamento?",
                  answer: "Você pode solicitar um orçamento gratuitamente clicando no botão 'Solicitar Orçamento Grátis' nesta página ou entrando em contato diretamente conosco."
                },
                {
                  question: "Quais formas de pagamento são aceitas?",
                  answer: "Entre em contato conosco para conhecer todas as formas de pagamento disponíveis e condições especiais."
                }
              ]}
            />

          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24 space-y-8">
              <div className="bg-gray-50 p-6 rounded-lg border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações de Contato</h3>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-start"><strong className="w-20 font-medium">Endereço:</strong> <span className="flex-1">{`${company.address.street}, ${company.address.number}, ${company.address.district}`} <br /> {`${company.address.city} - ${company.address.state}, ${company.address.cep}`}</span></li>
                  {company.phone && <li className="flex items-center"><strong className="w-20 font-medium">Telefone:</strong> <a href={`tel:${company.phone}`} className="text-primary-600 hover:underline">{company.phone}</a></li>}
                  <li className="flex items-center"><strong className="w-20 font-medium">Email:</strong> <a href={`mailto:${company.email}`} className="text-primary-600 hover:underline truncate">{company.email}</a></li>
                  {company.website && <li className="flex items-center"><strong className="w-20 font-medium">Website:</strong> <a href={`http://${company.website}`} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">{company.website}</a></li>}
                </ul>
                <div className="mt-6 flex flex-col space-y-3">
                  <Button className="w-full min-h-[48px]" onClick={() => setIsMessageModalOpen(true)}>
                    Solicitar Orçamento Grátis
                  </Button>
                  {user && user.type === 'client' && (
                    <Button
                      className="w-full min-h-[48px]"
                      variant={favorited ? 'danger' : 'secondary'}
                      onClick={handleToggleFavorite}
                    >
                      <HeartIcon />
                      {favorited ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos'}
                    </Button>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Localização</h3>
                <div className="aspect-w-16 aspect-h-9 bg-gray-200 flex items-center justify-center rounded-md">
                  <p className="text-gray-500">Mapa indisponível temporariamente.</p>
                </div>
                {/* <MapEmbed lat={company.address.lat} lng={company.address.lng} address={`${company.address.street}, ${company.address.city}`} /> */}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {company && (
        <>
          <MessageModal
            isOpen={isMessageModalOpen}
            onClose={() => setIsMessageModalOpen(false)}
            companyId={company.id}
            companyName={company.companyName}
          />

          <ServiceBookingModal
            isOpen={isBookingModalOpen}
            onClose={() => setIsBookingModalOpen(false)}
            service={selectedService}
            companyName={company.companyName}
          />

          <ReviewModal
            isOpen={isReviewModalOpen}
            onClose={() => setIsReviewModalOpen(false)}
            companyId={company.id}
            companyName={company.companyName}
            onSubmitMock={handleAddReview}
          />
        </>
      )}
    </div>
  );
};

export default CompanyProfilePage;
