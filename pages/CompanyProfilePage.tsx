
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';
import { MOCK_COMPANIES } from '../constants';
import ServiceCard from '../components/ServiceCard';
import MapEmbed from '../components/MapEmbed';
import ImageGallery from '../components/ImageGallery';
import Button from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { useState } from 'react';
import MessageModal from '../components/MessageModal';
import ServiceBookingModal from '../components/ServiceBookingModal';
import ReviewModal from '../components/ReviewModal';
import Badge from '../components/ui/Badge';
import StatsGrid from '../components/ui/StatsGrid';
import { Service } from '../types';
import { useMockData } from '../contexts/MockContext';

const HeartIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
  </svg>
);

const CompanyProfilePage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();
  const { addReview, companies } = useMockData(); // Use mock data to get real-time updates
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  // State for hero image error
  const [heroImageError, setHeroImageError] = useState(false);

  // Find company from context instead of constant to show updates
  const company = companies.find(c => c.slug === slug) || MOCK_COMPANIES.find(c => c.slug === slug);

  if (!company) {
    return <div className="text-center py-20">Empresa não encontrada.</div>;
  }

  const handleAddReview = (review: { rating: number; comment: string }) => {
    addReview(company.id, {
      ...review,
      author: user?.name || 'Visitante',
      avatar: user?.avatar
    });
  };

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


  return (
    <div className="bg-white">
      <Helmet>
        <title>{company.companyName} | TGT - Guia de Negócios</title>
        <meta name="description" content={`Confira os serviços, avaliações e localização de ${company.companyName} em ${company.address.city}, ${company.address.state}. Solicite um orçamento hoje mesmo!`} />

        {/* GEO / AI Search Optimization */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": company.companyName,
            "image": [company.coverImage, company.logo],
            "description": company.description,
            "address": {
              "@type": "PostalAddress",
              "streetAddress": company.address.street,
              "addressLocality": company.address.city,
              "addressRegion": company.address.state,
              "postalCode": company.address.zipCode,
              "addressCountry": "BR"
            },
            "geo": {
              "@type": "GeoCoordinates",
              "latitude": company.location?.lat,
              "longitude": company.location?.lng
            },
            "url": window.location.href,
            "priceRange": "$$",
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": company.rating,
              "reviewCount": company.reviewCount
            }
          })}
        </script>
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

        {/* Only show overlay if image loaded successfully */}
        {!heroImageError && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10" />
        )}

        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 z-20">
          <div className="container mx-auto flex flex-col md:flex-row items-center">
            <img src={company.logo} alt={`${company.companyName} logo`} className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white bg-white shadow-lg" />
            <div className="md:ml-6 text-center md:text-left mt-4 md:mt-0 flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">{company.companyName}</h1>
              <p className="text-lg text-gray-200 mb-3">{company.category}</p>
              {/* Trust Badges */}
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                <Badge variant="success" icon={<svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>}>
                  Verificado
                </Badge>
                <Badge variant="info" icon={<svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>}>
                  Responde em 1h
                </Badge>
                <Badge variant="warning" icon={<svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>}>
                  Top 10% da categoria
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-12">

            {/* Social Proof Stats */}
            <section className="bg-gradient-to-br from-brand-primary/5 to-brand-secondary/5 p-6 rounded-lg border border-brand-primary/20">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Por que escolher {company.companyName}?</h3>
              <StatsGrid
                stats={[
                  { value: company.reviewCount, label: 'Avaliações', icon: <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg> },
                  { value: `${Math.round((company.rating / 5) * 100)}%`, label: 'Satisfação', icon: <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a1 1 0 10-1.415-1.414 3 3 0 01-4.242 0 1 1 0 00-1.415 1.414 5 5 0 007.072 0z" clipRule="evenodd" /></svg> },
                  { value: '5 anos', label: 'Experiência', icon: <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg> },
                ]}
              />
            </section>

            {/* About Section */}
            <section id="sobre">
              <h2 className="text-2xl font-bold text-gray-900 border-b pb-2 mb-4">Sobre a Empresa</h2>
              <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{company.description}</p>
            </section>

            {/* Services Section */}
            <section id="servicos">
              <h2 className="text-2xl font-bold text-gray-900 border-b pb-2 mb-4">Serviços</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {company.services.map(service => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    onRequestQuote={handleRequestQuote}
                  />
                ))}
              </div>
            </section>

            {/* Portfolio Section */}
            <section id="portfolio">
              <h2 className="text-2xl font-bold text-gray-900 border-b pb-2 mb-4">Portfólio</h2>
              <ImageGallery items={company.portfolio} />
            </section>

            {/* Reviews Section */}
            <section id="avaliacoes">
              <div className="flex justify-between items-center border-b pb-2 mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Avaliações</h2>
                <Button variant="secondary" size="sm" onClick={() => setIsReviewModalOpen(true)}>
                  Escrever Avaliação
                </Button>
              </div>
              <div className="space-y-6">
                {company.reviews.map(review => (
                  <div key={review.id} className="flex space-x-4">
                    <img className="h-12 w-12 rounded-full" src={review.avatar} alt={review.author} />
                    <div>
                      <div className="flex items-center">
                        <h4 className="text-sm font-bold text-gray-900">{review.author}</h4>
                        <div className="ml-4 flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <svg key={i} className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                          ))}
                        </div>
                      </div>
                      <p className="mt-1 text-gray-600">{review.comment}</p>
                      <p className="mt-1 text-xs text-gray-400">{review.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

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
                  <Button className="w-full" onClick={() => setIsMessageModalOpen(true)}>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    Solicitar Orçamento Grátis
                  </Button>
                  {user && user.type === 'client' && (
                    <Button
                      className="w-full"
                      variant={favorited ? 'danger' : 'secondary'}
                      onClick={handleToggleFavorite}
                    >
                      <HeartIcon />
                      {favorited ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos'}
                    </Button>
                  )}
                </div>
              </div>
              {company.address.lat && company.address.lng && (
                <div className="bg-gray-50 p-6 rounded-lg border">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Localização</h3>
                  <MapEmbed lat={company.address.lat} lng={company.address.lng} address={`${company.address.street}, ${company.address.city}`} />
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
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
    </div>
  );
};

export default CompanyProfilePage;
