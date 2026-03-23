import React, { useState, lazy, Suspense } from 'react';
import { deduplicateCompanies } from '@/utils/companyUtils';
import { Helmet } from 'react-helmet-async';
import SEO from '@/components/SEO';
import { useParams, useNavigate } from 'react-router-dom';
import ServiceCard from '@/components/ServiceCard';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useToast } from '@/contexts/ToastContext';

// Lazy load modals
const MessageModal = lazy(() => import('../components/MessageModal'));
const ServiceBookingModal = lazy(() => import('../components/ServiceBookingModal'));
const ReviewModal = lazy(() => import('../components/ReviewModal'));
const InquiryModal = lazy(() => import('../components/InquiryModal'));
import CompanyCard from '@/components/CompanyCard';
import { Service } from '@tgt/core';
import { supabase } from '@tgt/core';
import { useCompanyProfile } from '@/hooks/useCompanyProfile';
import { useSimilarCompanies } from '@/hooks/useSimilarCompanies';

import ProfileSidebar from '@/components/ProfileSidebar';
import ReviewsList from '@/components/ReviewsList';
import OptimizedImage from '@/components/ui/OptimizedImage';
import PortfolioLightbox from '@/components/PortfolioLightbox';
import { LayoutGrid, Info, Star, MapPin as MapPinIcon, Youtube } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in Leaflet
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { LoadingSkeleton } from '@tgt/ui-web';


delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const CompanyProfilePage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();
  const { addToast } = useToast();
  const { data: company, isLoading: loading, error: queryError } = useCompanyProfile(slug);
  const { data: similarCompanies = [] } = useSimilarCompanies(company?.category, company?.id);

  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [lightboxState, setLightboxState] = useState<{ isOpen: boolean; index: number }>({ isOpen: false, index: 0 });

  const error = queryError ? (queryError as Error).message : null;

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        {/* Full width banner skeleton */}
        <div className="w-full h-64 md:h-80 bg-gray-200 animate-pulse" />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 -mt-20 md:-mt-8 relative z-10 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Sidebar skeleton */}
            <div className="lg:col-span-4 order-2 lg:order-1 sticky top-24">
              <LoadingSkeleton className="h-[600px] w-full rounded-2xl shadow-sm" />
            </div>
            {/* Main content skeleton */}
            <div className="lg:col-span-8 order-1 lg:order-2 space-y-6">
              <LoadingSkeleton className="h-16 w-full rounded-xl shadow-sm" />
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <LoadingSkeleton className="aspect-video w-full rounded-xl" />
                  <LoadingSkeleton className="aspect-video w-full rounded-xl" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!company || error) return <div className="text-center py-20 bg-gray-50 min-h-screen pt-32">{error || "Empresa não encontrada."}</div>;

  const favorited = isFavorite(company.id);

  const handleToggleFavorite = () => {
    if (favorited) removeFavorite(company.id);
    else addFavorite(company.id);
  };

  const handleRequestQuote = (service?: Service) => {
    if (service) setSelectedService(service);
    else setSelectedService(null);
    setIsBookingModalOpen(true);
  };

  const handleReviewSubmit = async (rating: number, comment: string) => {
    if (!user || user.type !== 'client') {
      addToast("Você precisa estar logado como cliente para avaliar.", 'error');
      setIsReviewModalOpen(false);
      return;
    }
    if (!user.id) {
      addToast("Erro de autenticação.", 'error');
      return;
    }
    if (!company?.id) {
      addToast("Erro empresa.", 'error');
      return;
    }

    setSubmittingReview(true);
    try {
      const payload = { company_id: company.id, reviewer_id: user.id, reviewed_id: company.profileId, rating, comment };
      const { error } = await supabase.from('reviews').insert(payload);
      if (error) throw error;
      addToast("Avaliação enviada com sucesso!", 'success');
      setIsReviewModalOpen(false);
      setTimeout(() => window.location.reload(), 1000);
    } catch (err: any) {
      if (err.code === '23505') addToast("Você já avaliou esta empresa.", 'error');
      else addToast(`Erro: ${err.message}`, 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  const isClient = user?.type === 'client';
  const { owner } = company;

  const organizationSchema = company ? {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": company.companyName,
    "image": company.coverImage || (company as any).logo_url || 'https://contratto.app/og-image.jpg',
    "@id": `https://contratto.app/empresa/${company.slug}`,
    "url": `https://contratto.app/empresa/${company.slug}`,
    "telephone": company.phone || "",
    "address": company.address ? {
      "@type": "PostalAddress",
      "streetAddress": `${company.address.street || ''}, ${company.address.number || ''}`.trim(),
      "addressLocality": company.address.city || "",
      "addressRegion": company.address.state || "",
      "postalCode": company.address.cep || "",
      "addressCountry": "BR"
    } : undefined,
    "aggregateRating": (company.reviewCount && company.reviewCount > 0) ? {
      "@type": "AggregateRating",
      "ratingValue": company.rating,
      "reviewCount": company.reviewCount
    } : undefined
  } : undefined;

  return (
    <main className="bg-gray-50 min-h-screen pb-12">
      <SEO title={`${company.companyName} | CONTRATTO`} description={`Confira os serviços de ${company.companyName}.`} url={`/empresa/${company.slug}`} image={company.coverImage} schema={organizationSchema} />

      {/* FULL WIDTH HERO BANNER */}
      <div className="w-full h-64 md:h-80 relative bg-gray-900 group">
        <OptimizedImage
          src={company.coverImage}
          alt={`Capa de ${company.companyName}`}
          className="w-full h-full object-cover opacity-90 transition-opacity duration-700"
          fallbackSrc="https://placehold.co/1920x400/111827/374151?text=Cover"
          optimizedWidth={1440}
          priority={true}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 -mt-20 md:-mt-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* LEFT SIDEBAR (Sticky) */}
          <aside className="lg:col-span-4 sticky top-24">
            <ProfileSidebar
              company={company}
              onContactClick={async () => {
                if (!user) { addToast("Faça login para enviar mensagens", "info"); return; }
                const targetId = company.profileId;
                if (!targetId) { addToast("Erro: Perfil não encontrado.", "error"); return; }
                if (isClient) setIsInquiryModalOpen(true);
                else addToast("Apenas clientes podem iniciar chat.", "info");
              }}
              onRequestQuote={() => handleRequestQuote()}
              isFavorited={favorited}
              onToggleFavorite={handleToggleFavorite}
              isClient={isClient}
            />
          </aside>

          {/* RIGHT MAIN CONTENT */}
          <div className="lg:col-span-8">
            {/* MAIN CONTENT START */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
              <div className="p-6 md:p-8">

                {/* 2. Serviços */}
                <div className="mb-14">
                  <h3 className="font-display text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <LayoutGrid className="w-6 h-6 text-brand-primary" />
                    Serviços
                  </h3>
                  {company.services.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {company.services.map(service => (
                        <ServiceCard key={service.id} service={service} onRequestQuote={() => handleRequestQuote(service)} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                      <p className="text-gray-500">Nenhum serviço disponível.</p>
                    </div>
                  )}
                </div>
                {/* 3. Portfólio */}
                {company.portfolio.length > 0 && (
                  <div className="mb-14">
                    <h3 className="font-display text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <LayoutGrid className="w-6 h-6 text-brand-primary" />
                      Portfólio
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {company.portfolio.map((item, idx) => (
                        <button 
                          key={item.id || idx} 
                          onClick={() => setLightboxState({ isOpen: true, index: idx })}
                          className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100 hover:opacity-90 transition-opacity shadow-sm border border-gray-200"
                        >
                          <OptimizedImage
                            src={item.image_url}
                            alt={item.title || 'Portfolio Item'}
                            className="w-full h-full object-cover relative z-0 group-hover:scale-105 transition-transform duration-500"
                            optimizedWidth={400}
                          />
                          {(item as any).video_url && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div className="bg-black/40 backdrop-blur-sm rounded-full p-3 text-white">
                                <Youtube size={24} />
                              </div>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Avaliações */}
                <div className="mb-14">
                  <div className="flex items-center justify-between gap-3 mb-8">
                    <div className="flex items-center gap-3">
                      <Star className="w-6 h-6 text-brand-primary" />
                      <h3 className="font-display text-xl font-bold text-gray-900">
                        Avaliações
                      </h3>
                      <span className="px-3 py-1 rounded-full bg-gray-100 text-sm font-bold text-gray-700">
                        {company.reviewCount || 0}
                      </span>
                    </div>
                    {isClient && (
                      <button 
                        onClick={() => setIsReviewModalOpen(true)}
                        className="px-4 py-2 bg-brand-primary text-white text-sm font-bold rounded-xl hover:bg-brand-primary-hover transition-colors shadow-sm"
                      >
                        Avaliar Empresa
                      </button>
                    )}
                  </div>
                  <ReviewsList reviews={company.reviews} overallRating={company.rating} reviewCount={company.reviewCount} />
                </div>

                {/* 5. Localização */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-6">
                    <MapPinIcon className="w-6 h-6 text-brand-primary" />
                    <h3 className="font-display text-xl font-bold text-gray-900">Localização</h3>
                  </div>

                  {company.address ? (
                    <div className="space-y-4">
                      <p className="text-base text-gray-700 bg-gray-50/80 p-5 rounded-xl border border-gray-100 shadow-sm">
                        <span className="font-medium">{company.address.street}, {company.address.number}</span> - {company.address.district}
                        <br />
                        <span className="text-gray-500 mt-1 block text-sm">{company.address.city}, {company.address.state} - CEP: {company.address.cep}</span>
                      </p>

                      <div className="h-80 w-full rounded-xl overflow-hidden border border-gray-200 shadow-sm relative z-0">
                        {company.address.lat && company.address.lng ? (
                          <MapContainer
                            center={[company.address.lat, company.address.lng]}
                            zoom={15}
                            scrollWheelZoom={false}
                            className="h-full w-full"
                          >
                            <TileLayer
                              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <Marker position={[company.address.lat, company.address.lng]}>
                              <Popup>
                                <div className="text-center font-semibold p-1">
                                  {company.companyName}
                                </div>
                              </Popup>
                            </Marker>
                          </MapContainer>
                        ) : (
                          <div className="h-full w-full bg-gray-50 flex flex-col items-center justify-center text-gray-400 gap-2">
                            <MapPinIcon className="w-10 h-10 opacity-20" />
                            <p className="text-sm font-medium">Geolocalização não disponível para este endereço.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic bg-gray-50 p-4 rounded-xl border border-gray-100">Endereço não informado pela empresa.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Similar Companies */}
            {similarCompanies.length > 0 && (
              <div className="mt-12">
                <h2 className="font-display text-xl font-bold text-gray-900 mb-6">Também em {company.category}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {deduplicateCompanies(similarCompanies).slice(0, 2).map(comp => (
                    <CompanyCard key={comp.id} company={comp} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <Suspense fallback={null}>
        {isMessageModalOpen && <MessageModal isOpen={isMessageModalOpen} onClose={() => setIsMessageModalOpen(false)} companyId={company.id} companyName={company.companyName} />}
        {isInquiryModalOpen && <InquiryModal isOpen={isInquiryModalOpen} onClose={() => setIsInquiryModalOpen(false)} companyId={company.id} companyName={company.companyName} companyCategory={company.category} companyOwnerId={company.profileId} />}
        {isBookingModalOpen && <ServiceBookingModal
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
          service={selectedService}
          companyName={company.companyName}
          sellerId={company.profileId || ""}
          canCheckout={company?.is_active !== false && (!selectedService || selectedService.requires_quote || company?.stripe_charges_enabled !== false)}
          checkoutDisabledReason={
            company?.is_active === false
              ? "Esta empresa está temporariamente suspensa."
              : (selectedService && !selectedService.requires_quote && company?.stripe_charges_enabled === false)
                ? "Esta empresa está finalizando a configuração de pagamentos e não pode receber agendamentos no momento."
                : undefined
          }
        />}
        {isReviewModalOpen && <ReviewModal isOpen={isReviewModalOpen} onClose={() => setIsReviewModalOpen(false)} onSubmit={handleReviewSubmit} isLoading={submittingReview} />}
        
        <PortfolioLightbox 
          items={company.portfolio as any}
          initialIndex={lightboxState.index}
          isOpen={lightboxState.isOpen}
          onClose={() => setLightboxState({ isOpen: false, index: 0 })}
        />
      </Suspense>
    </main>
  );
};

export default CompanyProfilePage;
