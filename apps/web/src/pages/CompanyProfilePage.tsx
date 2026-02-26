import React, { useState, lazy, Suspense } from 'react';
import { deduplicateCompanies } from '@/utils/companyUtils';
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
import { LayoutGrid, Info, Star, MapPin as MapPinIcon, CheckCircle } from 'lucide-react';
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
        <div className="w-full h-72 bg-gray-200 animate-pulse mt-14" />
        <div className="container mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4"><LoadingSkeleton className="h-96 w-full rounded-3xl" /></div>
          <div className="lg:col-span-8 space-y-6"><LoadingSkeleton className="h-40 w-full rounded-2xl" /></div>
        </div>
      </div>
    );
  }

  if (!company || error) return (
    <div className="text-center py-20 bg-gray-50 min-h-screen pt-32 text-gray-500">
      {error || "Empresa não encontrada."}
    </div>
  );

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

  const tabs = [
    { id: 'services' as const, label: 'Serviços', icon: LayoutGrid, count: company.services.length },
    { id: 'about' as const, label: 'Quem Somos', icon: Info },
    { id: 'reviews' as const, label: 'Avaliações', icon: Star, count: company.reviewCount || 0 },
  ];

  return (
    <main className="bg-[#f5f6fa] min-h-screen pb-16">
      <SEO
        title={`${company.companyName} | CONTRATTO`}
        description={`Confira os serviços de ${company.companyName}.`}
        url={`/empresa/${company.slug}`}
        image={company.coverImage}
      />

      {/* ── Hero Banner ── */}
      <div className="w-full h-72 md:h-96 relative bg-gray-900 overflow-hidden">
        <OptimizedImage
          src={company.coverImage}
          alt={`Capa de ${company.companyName}`}
          className="w-full h-full object-cover opacity-80 transition-opacity duration-700 scale-105"
          fallbackSrc="https://placehold.co/1920x500/0f172a/1e293b?text=CONTRATTO"
          optimizedWidth={1440}
        />
        {/* Gradient layers */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-transparent" />

        {/* Company info overlay – bottom of hero */}
        <div className="absolute bottom-0 left-0 right-0 pb-6 pt-12 bg-gradient-to-t from-black/60 to-transparent">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <div className="flex items-end gap-4">
              <div className="flex-1 min-w-0">
                {/* Category + verified */}
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="text-[11px] font-bold text-white/60 uppercase tracking-widest">
                    {company.category}
                  </span>
                  {company.verified && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-blue-500/80 backdrop-blur-sm text-white px-2 py-0.5 rounded-full border border-blue-400/30">
                      <CheckCircle className="w-2.5 h-2.5" /> Verificado
                    </span>
                  )}
                </div>

                {/* Company name */}
                <h1 className="text-2xl md:text-4xl font-extrabold text-white drop-shadow-xl leading-tight truncate">
                  {company.companyName}
                </h1>

                {/* Rating row */}
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < Math.round(company.rating)
                            ? 'fill-amber-400 text-amber-400'
                            : 'fill-white/20 text-white/20'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-white/80 text-sm font-semibold drop-shadow">
                    {company.rating?.toFixed(1)}{' '}
                    <span className="font-normal text-white/60">
                      · {company.reviewCount || 0} avaliações
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Page Body ── */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* LEFT SIDEBAR (sticky) */}
          <aside className="lg:col-span-4 order-2 lg:order-1 lg:sticky lg:top-24">
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
          <div className="lg:col-span-8 order-1 lg:order-2 space-y-6">

            {/* ── Pill Tabs ── */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100/80 overflow-hidden">
              <div className="flex gap-1 p-1.5 bg-gray-50/80 m-2 rounded-xl">
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 text-sm font-semibold rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'bg-white text-brand-primary shadow-sm border border-gray-100/80 font-bold'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-white/60'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{tab.label}</span>
                      {tab.count !== undefined && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold tabular-nums ${
                            isActive
                              ? 'bg-brand-primary/10 text-brand-primary'
                              : 'bg-gray-200/80 text-gray-500'
                          }`}
                        >
                          {tab.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Tab content */}
              <div className="p-5 md:p-8 min-h-[400px]">

                {/* ── Services ── */}
                {activeTab === 'services' && (
                  <div className="animate-in fade-in duration-300">
                    {company.services.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {company.services.map(service => (
                          <ServiceCard
                            key={service.id}
                            service={service}
                            onRequestQuote={() => handleRequestQuote(service)}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                        <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                          <LayoutGrid className="w-6 h-6 text-gray-300" />
                        </div>
                        <p className="text-gray-500 font-medium">Nenhum serviço disponível.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* ── About ── */}
                {activeTab === 'about' && (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    <section>
                      <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <span className="w-1 h-5 bg-brand-primary rounded-full inline-block" />
                        Sobre
                      </h3>
                      <p className="text-gray-600 leading-relaxed whitespace-pre-wrap text-[15px]">
                        {company.description || "Sem descrição."}
                      </p>
                    </section>

                    {/* Languages & Skills */}
                    {(owner?.languages?.length || owner?.skills?.length) ? (
                      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-100">
                        {owner?.languages && owner.languages.length > 0 && (
                          <div>
                            <h3 className="text-xs font-bold text-gray-900 mb-3 uppercase tracking-widest flex items-center gap-2">
                              <span className="w-1 h-4 bg-brand-accent rounded-full inline-block" />
                              Idiomas
                            </h3>
                            <ul className="space-y-2">
                              {owner.languages.map((lang, idx) => (
                                <li
                                  key={idx}
                                  className="flex justify-between text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100"
                                >
                                  <span className="font-medium">{lang.language}</span>
                                  <span className="text-gray-400 text-xs font-semibold">{lang.level}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {owner?.skills && owner.skills.length > 0 && (
                          <div>
                            <h3 className="text-xs font-bold text-gray-900 mb-3 uppercase tracking-widest flex items-center gap-2">
                              <span className="w-1 h-4 bg-brand-success rounded-full inline-block" />
                              Competências
                            </h3>
                            <div className="flex flex-wrap gap-2">
                              {owner.skills.map((skill, idx) => (
                                <span
                                  key={idx}
                                  className="px-3 py-1.5 bg-gray-50 text-gray-600 text-xs rounded-full font-semibold border border-gray-200"
                                >
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
                        <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <span className="w-1 h-5 bg-brand-primary rounded-full inline-block" />
                          Portfólio
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {company.portfolio.map((item, idx) => (
                            <div
                              key={item.id || idx}
                              className="aspect-square rounded-2xl overflow-hidden bg-gray-100 hover:opacity-90 transition-all duration-300 hover:shadow-lg shadow-sm border border-gray-100 group"
                            >
                              <img
                                src={item.url}
                                alt={item.caption}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Location */}
                    <section className="pt-8 border-t border-gray-100">
                      <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <MapPinIcon className="w-5 h-5 text-brand-primary" />
                        Localização
                      </h3>

                      {company.address ? (
                        <div className="space-y-4">
                          <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded-2xl border border-gray-100 leading-relaxed">
                            {company.address.street}, {company.address.number}
                            {company.address.district && ` - ${company.address.district}`}
                            <br />
                            {company.address.city}, {company.address.state}
                            {company.address.cep && ` · CEP ${company.address.cep}`}
                          </p>

                          <div className="h-72 w-full rounded-2xl overflow-hidden border border-gray-200 shadow-sm relative z-0">
                            {company.address.lat && company.address.lng ? (
                              <MapContainer
                                center={[company.address.lat, company.address.lng]}
                                zoom={15}
                                scrollWheelZoom={false}
                                className="h-full w-full"
                              >
                                <TileLayer
                                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
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
                                <p className="text-xs text-center">
                                  Geolocalização não disponível para este endereço.
                                </p>
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

                {/* ── Reviews ── */}
                {activeTab === 'reviews' && (
                  <div className="animate-in fade-in duration-300">
                    <ReviewsList
                      reviews={company.reviews}
                      overallRating={company.rating}
                      reviewCount={company.reviewCount}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* ── Similar Companies ── */}
            {similarCompanies.length > 0 && (
              <div className="pt-4">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-1 h-7 bg-gradient-to-b from-brand-primary to-brand-accent rounded-full" />
                  <h2 className="text-xl font-extrabold text-gray-900">
                    Também em{' '}
                    <span className="text-brand-primary">{company.category}</span>
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {deduplicateCompanies(similarCompanies)
                    .slice(0, 2)
                    .map(comp => (
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
        {isMessageModalOpen && (
          <MessageModal
            isOpen={isMessageModalOpen}
            onClose={() => setIsMessageModalOpen(false)}
            companyId={company.id}
            companyName={company.companyName}
          />
        )}
        {isInquiryModalOpen && (
          <InquiryModal
            isOpen={isInquiryModalOpen}
            onClose={() => setIsInquiryModalOpen(false)}
            companyId={company.id}
            companyName={company.companyName}
            companyCategory={company.category}
            companyOwnerId={company.profileId}
          />
        )}
        {isBookingModalOpen && (
          <ServiceBookingModal
            isOpen={isBookingModalOpen}
            onClose={() => setIsBookingModalOpen(false)}
            service={selectedService}
            companyName={company.companyName}
            canCheckout={company?.stripe_charges_enabled && company?.is_active !== false}
            checkoutDisabledReason={
              company?.is_active === false
                ? "Esta empresa está temporariamente suspensa."
                : !company?.stripe_charges_enabled
                  ? "Esta empresa está finalizando a configuração de pagamentos."
                  : undefined
            }
          />
        )}
        {isReviewModalOpen && (
          <ReviewModal
            isOpen={isReviewModalOpen}
            onClose={() => setIsReviewModalOpen(false)}
            onSubmit={handleReviewSubmit}
            isLoading={submittingReview}
          />
        )}
      </Suspense>
    </main>
  );
};

export default CompanyProfilePage;
