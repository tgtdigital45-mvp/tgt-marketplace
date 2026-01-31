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
import CompanyCard from '../components/CompanyCard';
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
  const [similarCompanies, setSimilarCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [heroImageError, setHeroImageError] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);

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

        // Fetch reviews for this company
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('reviews')
          .select('*')
          .eq('company_id', companyData.id);

        if (reviewsError) throw reviewsError;

        // Fetch profiles for the reviews to get author names/avatars
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let enrichedReviews: any[] = [];
        if (reviewsData && reviewsData.length > 0) {
          const userIds = [...new Set(reviewsData.map(r => r.client_id))];
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .in('id', userIds);

          if (!profilesError && profilesData) {
            const profilesMap = new Map(profilesData.map(p => [p.id, p]));
            enrichedReviews = reviewsData.map(r => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const profile = profilesMap.get(r.client_id) as any;
              return {
                id: r.id,
                author: profile?.full_name || 'Usuário',
                avatar: profile?.avatar_url || 'https://i.pravatar.cc/150?u=default',
                rating: r.rating,
                comment: r.comment,
                date: new Date(r.created_at).toLocaleDateString('pt-BR')
              };
            });
          }
        }

        // Fetch Portfolio
        const { data: portfolioData, error: portfolioError } = await supabase
          .from('portfolio_items')
          .select('*')
          .eq('company_id', companyData.id)
          .order('created_at', { ascending: false });

        if (portfolioError && portfolioError.code !== 'PGRST116') {
          console.warn("Error fetching portfolio:", portfolioError);
        }

        // Calculate Average Rating
        const totalRating = enrichedReviews.reduce((acc: number, r: { rating: number }) => acc + r.rating, 0);
        const avgRating = enrichedReviews.length > 0 ? (totalRating / enrichedReviews.length) : 0; // Default to 0 if no reviews

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
          logo: companyData.logo_url || 'https://placehold.co/150',
          coverImage: companyData.cover_image_url || 'https://placehold.co/1200x400',
          category: companyData.category,
          rating: parseFloat(avgRating.toFixed(1)),
          reviewCount: enrichedReviews.length,
          description: companyData.description || '',
          address: {
            street: address.street || '',
            number: address.number || '',
            district: address.district || '',
            city: address.city || '',
            state: address.state || '',
            cep: address.cep || '',
            lat: address.lat || -23.55052,
            lng: address.lng || -46.63330
          },
          phone: companyData.phone,
          email: companyData.email,
          website: companyData.website,
          services: servicesData || [],
          portfolio: portfolioData?.map(p => p.image_url) || [],
          reviews: enrichedReviews
        };

        setCompany(constructedCompany);

        // Fetch Similar Companies
        if (companyData.category) {
          const { data: similarData, error: similarError } = await supabase
            .from('companies')
            .select('*, reviews(rating)')
            .eq('category', companyData.category)
            .neq('id', companyData.id)
            .limit(3);

          if (!similarError && similarData) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const constructedSimilar = similarData.map((comp: any) => {
              const compAddress = comp.address || {};
              const compReviews = comp.reviews || [];
              const totalRating = compReviews.reduce((acc: number, r: { rating: number }) => acc + r.rating, 0);
              const avgRating = compReviews.length > 0 ? (totalRating / compReviews.length) : 0;

              return {
                id: comp.id,
                slug: comp.slug,
                companyName: comp.company_name,
                legalName: comp.legal_name,
                cnpj: comp.cnpj,
                logo: comp.logo_url || 'https://placehold.co/150',
                coverImage: comp.cover_image_url || 'https://placehold.co/1200x400',
                category: comp.category,
                rating: parseFloat(avgRating.toFixed(1)),
                reviewCount: compReviews.length,
                description: comp.description || '',
                address: {
                  street: compAddress.street || '',
                  number: compAddress.number || '',
                  district: compAddress.district || '',
                  city: compAddress.city || '',
                  state: compAddress.state || '',
                  cep: compAddress.cep || '',
                  lat: compAddress.lat || -23.55052,
                  lng: compAddress.lng || -46.63330
                },
                phone: comp.phone,
                email: comp.email,
                website: comp.website,
                services: [], // Not needed for card
                portfolio: [], // Not needed for card
                reviews: [] // Not needed for card details
              };
            });
            setSimilarCompanies(constructedSimilar);
          }
        }
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

  // Handler functions
  // Handler functions

  const handleReviewSubmit = async (rating: number, comment: string) => {
    if (!user || user.type !== 'client') {
      alert("Você precisa estar logado como cliente para avaliar.");
      return;
    }
    setSubmittingReview(true);
    try {
      const { error } = await supabase.from('reviews').insert({
        company_id: company?.id,
        client_id: user.id,
        rating,
        comment
      });

      if (error) throw error;

      alert("Avaliação enviada com sucesso!");
      setIsReviewModalOpen(false);
      // Ideally refresh reviews here
      window.location.reload();
    } catch (err) {
      console.error("Error submitting review:", err);
      alert("Erro ao enviar avaliação. Tente novamente.");
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="bg-white">
      <Helmet>
        <title>{company.companyName} | TGT - Guia de Negócios</title>
        <meta name="description" content={`Confira os serviços e avaliações de ${company.companyName} em ${company.address.city}, ${company.address.state}.`} />
        <link rel="canonical" href={`https://tgt-guia-de-negocios.vercel.app/empresa/${company.slug}`} />

        {/* Schema.org LocalBusiness Markup */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": company.companyName,
            "image": company.logo,
            "description": company.description,
            "@id": `https://tgt-guia-de-negocios.vercel.app/empresa/${company.slug}`,
            "url": company.website || `https://tgt-guia-de-negocios.vercel.app/empresa/${company.slug}`,
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
              {company.portfolio.length === 0 ? (
                <p className="text-gray-500">Em breve...</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {company.portfolio.map((img, idx) => (
                    <div key={idx} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                      <img src={img} alt={`Portfolio ${idx}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Reviews Section */}
            <section id="avaliacoes">
              <div className="flex items-center justify-between border-b pb-2 mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Avaliações</h2>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold text-gray-900">{company.rating.toFixed(1)}</span>
                  <div className="flex flex-col">
                    <div className="flex text-yellow-400 text-sm">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className={`w-4 h-4 ${i < Math.round(company.rating) ? 'fill-current' : 'text-gray-200'}`} viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">{company.reviewCount} avaliações</span>
                  </div>
                </div>
              </div>

              {company.reviews.length > 0 ? (
                <div className="space-y-6">
                  {company.reviews.map((review) => (
                    <div key={review.id} className="bg-gray-50 rounded-xl p-6">
                      <div className="flex items-start gap-4">
                        <img
                          src={review.avatar || 'https://via.placeholder.com/40'}
                          alt={review.author}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-bold text-gray-900">{review.author}</h4>
                            <span className="text-sm text-gray-500">{review.date}</span>
                          </div>
                          <div className="flex text-yellow-400 mb-2">
                            {[...Array(5)].map((_, i) => (
                              <svg key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-current' : 'text-gray-300'}`} viewBox="0 0 20 20" fill="currentColor">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <p className="text-gray-700 text-sm leading-relaxed">{review.comment}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                  <p className="text-gray-500 mb-4">Esta empresa ainda não possui avaliações.</p>
                  {user && user.type === 'client' && (
                    <Button variant="outline" size="sm" onClick={() => setIsReviewModalOpen(true)}>
                      Seja o primeiro a avaliar
                    </Button>
                  )}
                </div>
              )}
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


            {/* Similar Companies Section */}
            {similarCompanies.length > 0 && (
              <section id="similares" className="mt-12 pt-12 border-t">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Quem viu esta empresa também viu</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {similarCompanies.map((similarCompany) => (
                    <CompanyCard key={similarCompany.id} company={similarCompany} />
                  ))}
                </div>
              </section>
            )}

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
                  <Button className="w-full min-h-[48px]" onClick={() => setIsBookingModalOpen(true)}>
                    Solicitar Orçamento Grátis
                  </Button>
                  <Button className="w-full min-h-[48px]" variant="outline" onClick={() => setIsMessageModalOpen(true)}>
                    Enviar Mensagem
                  </Button>
                  {user && user.type === 'client' && (
                    <>
                      <Button
                        className="w-full min-h-[48px]"
                        variant={favorited ? 'danger' : 'secondary'}
                        onClick={handleToggleFavorite}
                      >
                        <HeartIcon />
                        {favorited ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos'}
                      </Button>
                      <Button
                        className="w-full min-h-[48px]"
                        variant="secondary"
                        onClick={() => setIsReviewModalOpen(true)}
                      >
                        Avaliar Empresa
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Localização</h3>
                <div className="aspect-w-16 aspect-h-9 bg-gray-200 flex items-center justify-center rounded-md">
                  <p className="text-gray-500">Mapa indisponível temporariamente.</p>
                </div>
              </div>
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
        onSubmit={handleReviewSubmit}
        isLoading={submittingReview}
      />
    </div>
  );
};

export default CompanyProfilePage;
