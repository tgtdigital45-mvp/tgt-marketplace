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
import { Service } from '@tgt/shared';
import { supabase } from '@tgt/shared';
import { useCompanyProfile } from '@/hooks/useCompanyProfile';
import { useSimilarCompanies } from '@/hooks/useSimilarCompanies';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import ProfileSidebar from '@/components/ProfileSidebar';
import ReviewsList from '@/components/ReviewsList';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { LayoutGrid, Info, Star, MapPin as MapPinIcon } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in Leaflet
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

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
  const [activeTab, setActiveTab] = useState<'services' | 'about' | 'reviews'>('services');

  const error = queryError ? (queryError as Error).message : null;

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="w-full h-64 bg-gray-200 animate-pulse mt-14" />
        <div className="container mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4"><LoadingSkeleton className="h-96 w-full rounded-xl" /></div>
          <div className="lg:col-span-8 space-y-6"><LoadingSkeleton className="h-40 w-full rounded-xl" /></div>
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
      const payload = { company_id: company.id, client_id: user.id, rating, comment };
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

  return (
    <main className="bg-gray-50 min-h-screen pb-12">
      <SEO title={`${company.companyName} | CONTRATTO`} description={`Confira os serviços de ${company.companyName}.`} url={`/empresa/${company.slug}`} image={company.coverImage} />

      {/* FULL WIDTH HERO BANNER */}
      <div className="w-full h-64 md:h-80 relative bg-gray-900 group">
        <OptimizedImage
          src={company.coverImage}
          alt={`Capa de ${company.companyName}`}
          className="w-full h-full object-cover opacity-90 transition-opacity duration-700"
          fallbackSrc="https://placehold.co/1920x400/111827/374151?text=Cover"
          optimizedWidth={1440}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 -mt-20 md:-mt-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* LEFT SIDEBAR (Sticky) */}
          <aside className="lg:col-span-4 order-2 lg:order-1 sticky top-24">
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
          <div className="lg:col-span-8 order-1 lg:order-2">
            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
              <div className="flex border-b border-gray-100">
                <button
                  onClick={() => setActiveTab('services')}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold transition-all relative ${activeTab === 'services' ? 'text-brand-primary' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                >
                  <LayoutGrid className="w-4 h-4" />
                  Serviços
                  <span className="ml-1 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">{company.services.length}</span>
                  {activeTab === 'services' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-primary" />}
                </button>
                <button
                  onClick={() => setActiveTab('about')}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold transition-all relative ${activeTab === 'about' ? 'text-brand-primary' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                >
                  <Info className="w-4 h-4" />
                  Quem Somos
                  {activeTab === 'about' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-primary" />}
                </button>
                <button
                  onClick={() => setActiveTab('reviews')}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold transition-all relative ${activeTab === 'reviews' ? 'text-brand-primary' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                >
                  <Star className="w-4 h-4" />
                  Avaliações
                  <span className="ml-1 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">{company.reviewCount || 0}</span>
                  {activeTab === 'reviews' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-primary" />}
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-6 md:p-8 min-h-[400px]">
                {activeTab === 'services' && (
                  <div className="animate-in fade-in duration-300">
                    {company.services.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {company.services.map(service => (
                          <ServiceCard key={service.id} service={service} onRequestQuote={() => handleRequestQuote(service)} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <p className="text-gray-500">Nenhum serviço disponível.</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'about' && (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    <section>
                      <h3 className="text-lg font-bold text-gray-900 mb-3">Sobre</h3>
                      <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{company.description || "Sem descrição."}</p>
                    </section>

                    {/* Languages & Skills (moved from sidebar) */}
                    {(owner?.languages?.length || owner?.skills?.length) ? (
                      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-100">
                        {owner?.languages && owner.languages.length > 0 && (
                          <div>
                            <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">Idiomas</h3>
                            <ul className="space-y-2">
                              {owner.languages.map((lang, idx) => (
                                <li key={idx} className="flex justify-between text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-lg">
                                  <span>{lang.language}</span>
                                  <span className="text-gray-400 text-xs font-medium">{lang.level}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {owner?.skills && owner.skills.length > 0 && (
                          <div>
                            <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">Competências</h3>
                            <div className="flex flex-wrap gap-2">
                              {owner.skills.map((skill, idx) => (
                                <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium border border-gray-200">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </section>
                    ) : null}

                    {/* Portfolio */}
                    {company.portfolio.length > 0 && (
                      <section className="pt-6 border-t border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Portfólio</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {company.portfolio.map((item, idx) => (
                            <div key={item.id || idx} className="aspect-square rounded-xl overflow-hidden bg-gray-100 hover:opacity-90 transition-opacity shadow-sm border border-gray-200">
                              <img src={item.url} alt={item.caption} className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Location & Map */}
                    <section className="pt-8 border-t border-gray-100 mt-8">
                      <div className="flex items-center gap-2 mb-4">
                        <MapPinIcon className="w-5 h-5 text-brand-primary" />
                        <h3 className="text-lg font-bold text-gray-900">Localização</h3>
                      </div>

                      {company.address ? (
                        <div className="space-y-4">
                          <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded-xl border border-gray-100">
                            {company.address.street}, {company.address.number} - {company.address.district}
                            <br />
                            {company.address.city}, {company.address.state} - CEP: {company.address.cep}
                          </p>

                          <div className="h-72 w-full rounded-xl overflow-hidden border border-gray-200 shadow-sm relative z-0">
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
                                <MapPinIcon className="w-8 h-8 opacity-20" />
                                <p className="text-xs">Geolocalização não disponível para este endereço.</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic">Endereço não informado.</p>
                      )}
                    </section>
                  </div>
                )}

                {activeTab === 'reviews' && (
                  <div className="animate-in fade-in duration-300">
                    <ReviewsList reviews={company.reviews} overallRating={company.rating} reviewCount={company.reviewCount} />
                  </div>
                )}
              </div>
            </div>

            {/* Similar Companies */}
            {similarCompanies.length > 0 && (
              <div className="mt-12">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Também em {company.category}</h2>
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
          canCheckout={company?.stripe_charges_enabled && company?.is_active !== false}
          checkoutDisabledReason={
            company?.is_active === false
              ? "Esta empresa está temporariamente suspensa."
              : !company?.stripe_charges_enabled
                ? "Esta empresa está finalizando a configuração de pagamentos e não pode receber agendamentos no momento."
                : undefined
          }
        />}
        {isReviewModalOpen && <ReviewModal isOpen={isReviewModalOpen} onClose={() => setIsReviewModalOpen(false)} onSubmit={handleReviewSubmit} isLoading={submittingReview} />}
      </Suspense>
    </main>
  );
};

export default CompanyProfilePage;
