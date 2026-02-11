import React, { useState, lazy, Suspense } from 'react';
import { Helmet } from 'react-helmet-async';
import SEO from '../components/SEO';
import { useParams, useNavigate } from 'react-router-dom';
import ServiceCard from '../components/ServiceCard';
import Button from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { useToast } from '../contexts/ToastContext';

// Lazy load modals (only load when user opens them)
const MessageModal = lazy(() => import('../components/MessageModal'));
const ServiceBookingModal = lazy(() => import('../components/ServiceBookingModal'));
const ReviewModal = lazy(() => import('../components/ReviewModal'));
const InquiryModal = lazy(() => import('../components/InquiryModal'));
import CompanyCard from '../components/CompanyCard';
import { Service } from '../types';
import { supabase } from '../lib/supabase';
import { useCompanyProfile } from '../hooks/useCompanyProfile';
import { useSimilarCompanies } from '../hooks/useSimilarCompanies';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import ProfileSidebar from '../components/ProfileSidebar';
import ReviewsList from '../components/ReviewsList';
import SellerBadge, { SellerLevel } from '../components/SellerBadge';
import OptimizedImage from '../components/ui/OptimizedImage';

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

  // Handle errors from query
  const error = queryError ? (queryError as Error).message : null;

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar Skeleton */}
          <div className="lg:col-span-4">
            <LoadingSkeleton className="h-96 w-full rounded-xl" />
          </div>
          {/* Main Content Skeleton */}
          <div className="lg:col-span-8 space-y-6">
            <LoadingSkeleton className="h-40 w-full rounded-xl" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <LoadingSkeleton className="h-60 rounded-xl" />
              <LoadingSkeleton className="h-60 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!company || error) return <div className="text-center py-20 bg-gray-50 min-h-screen pt-32">{error || "Empresa não encontrada."}</div>;

  const favorited = isFavorite(company.id);

  const handleToggleFavorite = () => {
    if (favorited) {
      removeFavorite(company.id);
    } else {
      addFavorite(company.id);
    }
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
      addToast("Erro de autenticação. Por favor, faça login novamente.", 'error');
      setIsReviewModalOpen(false);
      return;
    }

    if (!company?.id) {
      addToast("Erro ao identificar a empresa.", 'error');
      setIsReviewModalOpen(false);
      return;
    }

    setSubmittingReview(true);

    try {
      const payload = {
        company_id: company.id,
        client_id: user.id,
        rating,
        comment
      };

      const { error } = await supabase.from('reviews').insert(payload);

      if (error) {
        if (error.code === '42501') {
          addToast("Erro de permissão.", 'error');
        } else if (error.code === '23505') {
          addToast("Você já avaliou esta empresa.", 'error');
        } else {
          addToast(`Erro ao enviar avaliação: ${error.message}`, 'error');
        }
        throw error;
      }

      addToast("Avaliação enviada com sucesso!", 'success');
      setIsReviewModalOpen(false);
      setTimeout(() => window.location.reload(), 1000);

    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingReview(false);
    }
  };

  const isClient = user?.type === 'client';

  return (
    <main className="bg-gray-50 min-h-screen pb-12">
      <SEO
        title={`${company.companyName} | TGT`}
        description={`Confira os serviços de ${company.companyName}.`}
        url={`/empresa/${company.slug}`}
        image={company.coverImage}
      />

      {/* Schema.org omitted for brevity but should be kept if critical */}

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Breadcrumb / Top Bar could go here */}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* LEFT SIDEBAR (Sticky) - Authority */}
          <aside className="lg:col-span-4 order-2 lg:order-1">
            <ProfileSidebar
              company={company}
              onContactClick={async () => {
                if (!user) {
                  addToast("Faça login para enviar mensagens", "info");
                  return;
                }

                const targetId = company.profileId;
                if (!targetId) {
                  addToast("Erro ao iniciar chat: Perfil da empresa não encontrado.", "error");
                  return;
                }

                if (isClient) {
                  // Check for existing open job/conversation not yet implemented fully to check specifics
                  // But InquiryModal creates a new Job.
                  // Ideally we check if there's an ACTIVE job with this company to allow continuing it?
                  // For now, let's open InquiryModal which acts as "New Request".
                  // If they want to continue an old one, they should use "Minhas Mensagens".
                  setIsInquiryModalOpen(true);
                } else {
                  addToast("Apenas clientes podem iniciar chat por aqui.", "info");
                }
              }}
              onRequestQuote={() => handleRequestQuote()}
              isFavorited={favorited}
              onToggleFavorite={handleToggleFavorite}
              isClient={isClient}
            />
          </aside>

          {/* RIGHT MAIN CONTENT - Product Showcase */}
          <div className="lg:col-span-8 order-1 lg:order-2 space-y-8">



            {/* Cover Image Banner */}
            <div className="rounded-[var(--radius-box)] overflow-hidden h-48 md:h-64 shadow-md relative group bg-gray-200">
              <OptimizedImage
                src={company.coverImage}
                alt={`Capa de ${company.companyName}`}
                className="w-full h-full object-cover"
                fallbackSrc="https://placehold.co/1200x400/f1f5f9/94a3b8?text=Capa+da+Empresa"
                optimizedWidth={1200}
                quality={85}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
            </div>

            <section className="bg-white p-6 md:p-8 rounded-[var(--radius-box)] border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{company.companyName}</h1>
                {company.level && <SellerBadge level={company.level as SellerLevel} showLabel={true} className="text-sm px-2 py-1" />}
              </div>
              <p className="text-gray-600 whitespace-pre-wrap leading-relaxed text-lg">
                {company.description}
              </p>
            </section>

            {/* Services Grid (Gigs) */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                Meus Serviços
                <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full font-medium">{company.services.length}</span>
              </h2>

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
                <div className="text-center py-12 bg-white rounded-[var(--radius-box)] border border-dashed border-gray-200">
                  <p className="text-gray-500">Nenhum serviço ativo no momento.</p>
                </div>
              )}
            </section>

            {/* Portfolio Preview (Optional) */}
            {company.portfolio.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Portfólio</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {company.portfolio.map((item, idx) => (
                    <div key={item.id || idx} className="aspect-square rounded-[var(--radius-box)] overflow-hidden bg-gray-200 cursor-pointer hover:opacity-90 transition-opacity">
                      <img src={item.url} alt={item.caption} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Reviews List */}
            <ReviewsList
              reviews={company.reviews}
              overallRating={company.rating}
              reviewCount={company.reviewCount}
            />

            {/* Similar Companies */}
            {similarCompanies.length > 0 && (
              <section className="pt-8 border-t border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Outros profissionais em {company.category}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {similarCompanies.slice(0, 2).map(comp => (
                    <CompanyCard key={comp.id} company={comp} />
                  ))}
                </div>
              </section>
            )}

          </div>

        </div>
      </div>

      {/* Lazy load modals with Suspense */}
      {isMessageModalOpen && (
        <Suspense fallback={
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <LoadingSkeleton className="w-96 h-64 rounded-xl" />
          </div>
        }>
          <MessageModal
            isOpen={isMessageModalOpen}
            onClose={() => setIsMessageModalOpen(false)}
            companyId={company.id}
            companyName={company.companyName}
          />
        </Suspense>
      )}

      {isInquiryModalOpen && (
        <Suspense fallback={
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <LoadingSkeleton className="w-96 h-64 rounded-xl" />
          </div>
        }>
          <InquiryModal
            isOpen={isInquiryModalOpen}
            onClose={() => setIsInquiryModalOpen(false)}
            companyId={company.id}
            companyName={company.companyName}
            companyCategory={company.category}
            companyOwnerId={company.profileId}
          />
        </Suspense>
      )}

      {isBookingModalOpen && (
        <Suspense fallback={
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <LoadingSkeleton className="w-96 h-96 rounded-xl" />
          </div>
        }>
          <ServiceBookingModal
            isOpen={isBookingModalOpen}
            onClose={() => setIsBookingModalOpen(false)}
            service={selectedService}
            companyName={company.companyName}
          />
        </Suspense>
      )}

      {isReviewModalOpen && (
        <Suspense fallback={
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <LoadingSkeleton className="w-96 h-64 rounded-xl" />
          </div>
        }>
          <ReviewModal
            isOpen={isReviewModalOpen}
            onClose={() => setIsReviewModalOpen(false)}
            onSubmit={handleReviewSubmit}
            isLoading={submittingReview}
          />
        </Suspense>
      )}
    </main>
  );
};

export default CompanyProfilePage;
