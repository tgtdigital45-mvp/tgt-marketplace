import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams } from 'react-router-dom';
import CompanyCard from '../components/CompanyCard';
import { CATEGORIES } from '../constants';
import { Company } from '../types';
import { supabase } from '../lib/supabase';
import { calculateDistance } from '../utils/geo';

const CompaniesListPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [locationTerm, setLocationTerm] = useState(searchParams.get('loc') || '');
  const [userCoords, setUserCoords] = useState<{ lat: number, lng: number } | null>(null);

  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('cat') || 'all');
  const [sortBy, setSortBy] = useState('rating');
  const [priceRange, setPriceRange] = useState<'all' | 'low' | 'mid' | 'high'>('all');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Dynamic SEO logic
  const getDynamicTitle = () => {
    let title = 'Empresas e Serviços Locais';
    if (searchTerm) title = `${searchTerm}`;
    else if (selectedCategory !== 'all') title = `${selectedCategory}`;

    if (locationTerm) title += ` em ${locationTerm}`;
    else if (userCoords) title += ` Perto de Você`;

    return `${title} | TGT Contratto`;
  };

  const getDynamicDescription = () => {
    let desc = 'Encontre as melhores empresas e serviços locais na sua região.';
    if (searchTerm || locationTerm || selectedCategory !== 'all') {
      desc = `Buscando por ${searchTerm || (selectedCategory !== 'all' ? selectedCategory : 'serviços')}${locationTerm ? ` em ${locationTerm}` : ''}? Explore negócios verificados, compare preços e conecte-se com profissionais no TGT Contratto.`;
    }
    return desc;
  };

  // Initial Fetch from Supabase
  const isMounted = React.useRef(true);

  useEffect(() => {
    isMounted.current = true;
    const fetchCompanies = async () => {
      setLoading(true);
      try {
        // Fetch APPROVED companies only
        const { data, error } = await supabase
          .from('companies')
          // .select('*, services(*)') // Ideally join, but for MVP flat fetch + separate logic or basic select
          // Supabase join:
          .select(`
            *,
            services (*)
          `)
          .eq('status', 'approved');

        if (error) throw error;

        // Map to UI types
        const mappedCompanies: Company[] = (data || []).map((c) => ({
          id: c.id,
          slug: c.slug,
          companyName: c.company_name,
          legalName: c.legal_name,
          cnpj: c.cnpj,
          logo: c.logo_url || 'https://placehold.co/150',
          coverImage: c.cover_image_url || 'https://placehold.co/1200x400',
          category: c.category,
          rating: 5.0, // Should be avg from reviews
          reviewCount: 0,
          description: c.description,
          address: typeof c.address === 'string' ? { city: c.city, state: c.state, full: c.address } : c.address, // Handle address format
          phone: c.phone,
          email: c.email,
          website: c.website,
          services: c.services || [],
          portfolio: [],
          reviews: []
        }));

        if (isMounted.current) setCompanies(mappedCompanies);
      } catch (err) {
        const error = err as Error;
        if (error.name === 'AbortError' || error.message?.includes('aborted')) return;
        console.error("Error fetching companies:", error);
      } finally {
        if (isMounted.current) setLoading(false);
      }
    };

    fetchCompanies();

    return () => {
      isMounted.current = false;
    };
  }, []);

  // Update Filters based on URL
  useEffect(() => {
    setSearchTerm(searchParams.get('q') || '');
    setLocationTerm(searchParams.get('loc') || '');
    setSelectedCategory(searchParams.get('cat') || 'all');

    const lat = parseFloat(searchParams.get('lat') || '');
    const lng = parseFloat(searchParams.get('lng') || '');
    if (!isNaN(lat) && !isNaN(lng)) {
      setUserCoords({ lat, lng });
      setSortBy('distance'); // Auto sort by distance if location provided
    }
    setCurrentPage(1); // Reset to first page on search/filter change
  }, [searchParams]);

  // Update companies with distance when userCoords changes OR companies load
  useEffect(() => {
    if (userCoords && companies.length > 0) {
      setCompanies(prev => prev.map(company => {
        if (company.address?.lat && company.address?.lng) {
          return {
            ...company,
            distance: calculateDistance(
              userCoords.lat,
              userCoords.lng,
              company.address.lat,
              company.address.lng
            )
          };
        }
        return company;
      }));
    }
  }, [userCoords, companies.length]); // Warning: be careful with dependency loop if strictly setting new objects, but map creates new refs.

  // Client-side Filtering
  const filteredAndSortedCompanies = companies
    .filter(company =>
    (company.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.services.some(service => service.title.toLowerCase().includes(searchTerm.toLowerCase())))
    )
    .filter(company =>
      !locationTerm || (
        company.address?.city?.toLowerCase().includes(locationTerm.toLowerCase()) ||
        company.address?.district?.toLowerCase().includes(locationTerm.toLowerCase()) ||
        // Also match if distance is small (< 50km) if we used "current location" which cleared the text
        // But here locationTerm is the text input.
        // mixing logic: if we have userCoords and NO locationTerm, we usually show nearby.
        // If locationTerm is present, we filter by text.
        // Let's stick to text filter if provided.
        company.address?.street?.toLowerCase().includes(locationTerm.toLowerCase())
      )
    )
    .filter(company =>
      selectedCategory === 'all' || company.category === selectedCategory
    )
    .filter(company => {
      if (priceRange === 'all') return true;
      const minPrice = company.services.length > 0 && company.services[0].price ? company.services[0].price : 0;
      if (priceRange === 'low') return minPrice < 100;
      if (priceRange === 'mid') return minPrice >= 100 && minPrice < 300;
      if (priceRange === 'high') return minPrice >= 300;
      return true;
    })
    .sort((a, b) => {
      // Priority for featured/promoted (mock logic: if rating > 4.8)
      // Implementation of sorting logic
      if (sortBy === 'distance') {
        if (a.distance !== undefined && b.distance !== undefined) return a.distance - b.distance;
        if (a.distance !== undefined) return -1;
        if (b.distance !== undefined) return 1;
        return 0;
      }
      if (sortBy === 'rating') {
        return b.rating - a.rating;
      }
      if (sortBy === 'name') {
        return a.companyName.localeCompare(b.companyName);
      }
      return 0;
    });

  // Pagination logic
  const totalPages = Math.ceil(filteredAndSortedCompanies.length / itemsPerPage);
  const paginatedCompanies = filteredAndSortedCompanies.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <Helmet>
        <title>{getDynamicTitle()}</title>
        <meta name="description" content={getDynamicDescription()} />
        <meta property="og:title" content={getDynamicTitle()} />
        <meta property="og:description" content={getDynamicDescription()} />
        <meta property="og:image" content="https://tgt-guia-de-negocios.vercel.app/og-image.jpg" />
        <link rel="canonical" href={`https://tgt-guia-de-negocios.vercel.app/empresas${searchTerm ? `?q=${searchTerm}` : ''}${locationTerm ? `${searchTerm ? '&' : '?'}loc=${locationTerm}` : ''}`} />

        {/* Schema.org Organization Markup */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "TGT Contratto - Guia de Negócios",
            "url": "https://tgt-guia-de-negocios.vercel.app",
            "potentialAction": {
              "@type": "SearchAction",
              "target": "https://tgt-guia-de-negocios.vercel.app/empresas?q={search_term_string}",
              "query-input": "required name=search_term_string"
            }
          })}
        </script>
      </Helmet>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
            Encontre os Melhores <span className="text-primary-600">Negócios Locais</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Explore uma seleção curada de empresas e serviços na sua região. Qualidade e confiança ao seu alcance.
          </p>
        </div>

        <div className="mt-12 p-6 bg-white rounded-lg shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700">Buscar por nome ou serviço</label>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Ex: Adega Vinho Sul"
                className="mt-1 block w-full bg-white border-none ring-1 ring-gray-100 rounded-xl shadow-md py-4 px-4 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:shadow-lg transition-all sm:text-sm placeholder-gray-400 min-h-[48px]"
              />
            </div>

            {/* New Location Filter UI (Optional, consistent with QuickSearch) */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700">Localização</label>
              <input
                type="text"
                id="location"
                value={locationTerm}
                onChange={(e) => setLocationTerm(e.target.value)}
                placeholder="Cidade ou Bairro"
                className="mt-1 block w-full bg-white border-none ring-1 ring-gray-100 rounded-xl shadow-md py-4 px-4 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:shadow-lg transition-all sm:text-sm placeholder-gray-400 min-h-[48px]"
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">Categoria</label>
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="mt-1 block w-full bg-white border-none ring-1 ring-gray-100 rounded-xl shadow-md py-4 pl-4 pr-10 text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:shadow-lg transition-all sm:text-sm min-h-[48px]"
              >
                <option value="all">Todas as Categorias</option>
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700">Faixa de Preço</label>
              <select
                id="price"
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value as 'all' | 'low' | 'mid' | 'high')}
                className="mt-1 block w-full bg-white border-none ring-1 ring-gray-100 rounded-xl shadow-md py-4 pl-4 pr-10 text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:shadow-lg transition-all sm:text-sm min-h-[48px]"
              >
                <option value="all">Todos os Preços</option>
                <option value="low">Até R$ 100</option>
                <option value="mid">R$ 100 - R$ 300</option>
                <option value="high">Acima de R$ 300</option>
              </select>
            </div>
            <div>
              <label htmlFor="sort" className="block text-sm font-medium text-gray-700">Ordenar por</label>
              <select
                id="sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="mt-1 block w-full bg-white border-none ring-1 ring-gray-100 rounded-xl shadow-md py-4 pl-4 pr-10 text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:shadow-lg transition-all sm:text-sm min-h-[48px]"
              >
                <option value="rating">Melhor Avaliação</option>
                <option value="distance">Mais Próximos</option>
                <option value="name">Nome (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Header */}
        <div className="mt-8 flex justify-between items-center">
          <p className="text-gray-600">
            Mostrando <strong className="text-brand-primary">{filteredAndSortedCompanies.length}</strong> de <strong>{companies.length}</strong> resultados
            {searchTerm && ` para "${searchTerm}"`}
          </p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-sm text-brand-primary hover:underline"
            >
              Limpar busca
            </button>
          )}
        </div>

        <div className="mt-6">
          {loading ? (
            <div className="container mx-auto px-4 py-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                    <div className="h-48 bg-gray-200 rounded-lg mb-4 animate-pulse"></div>
                    <div className="h-5 bg-gray-200 w-3/4 mb-2 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 w-1/2 mb-4 animate-pulse"></div>
                    <div className="flex gap-1">
                      <div className="h-4 w-4 rounded-full bg-gray-200 animate-pulse"></div>
                      <div className="h-4 w-4 rounded-full bg-gray-200 animate-pulse"></div>
                      <div className="h-4 w-4 rounded-full bg-gray-200 animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : filteredAndSortedCompanies.length > 0 ? (
            <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {paginatedCompanies.map(company => (
                <CompanyCard key={company.id} company={company} />
              ))}
            </div>
          ) : (

            <div className="text-center py-24 px-4 bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Nenhum resultado encontrado</h3>
              <p className="text-gray-500 max-w-md mx-auto mb-8">
                Não encontramos empresas correspondentes à sua busca por "{searchTerm}" {locationTerm && `em "${locationTerm}"`}.
                Tente termos mais genéricos ou verifique a ortografia.
              </p>

              <div className="bg-gray-50 p-6 rounded-xl max-w-2xl mx-auto">
                <p className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">Categorias Populares</p>
                <div className="flex flex-wrap gap-3 justify-center">
                  {CATEGORIES.slice(0, 8).map(cat => (
                    <button
                      key={cat}
                      onClick={() => { setSelectedCategory(cat); setSearchTerm(''); }}
                      className="px-4 py-2 bg-white border border-gray-200 hover:border-brand-primary hover:text-brand-primary rounded-full text-sm font-medium transition-all shadow-sm hover:shadow-md"
                    >
                      {cat}
                    </button>
                  ))}
                  <button
                    onClick={() => { setSelectedCategory('all'); setSearchTerm(''); setLocationTerm(''); }}
                    className="px-4 py-2 bg-brand-primary text-white rounded-full text-sm font-medium hover:bg-brand-secondary transition-colors shadow-md"
                  >
                    Ver Tudo
                  </button>
                </div>
              </div>
            </div>
          )
          }

          {/* Pagination Controls */}
          {!loading && totalPages > 1 && (
            <div className="mt-12 flex justify-center items-center space-x-2" id="pagination-controls">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Página Anterior"
              >
                Anterior
              </button>

              <div className="flex space-x-1">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => handlePageChange(i + 1)}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${currentPage === i + 1
                      ? 'bg-brand-primary text-white shadow-md'
                      : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                    aria-label={`Página ${i + 1}`}
                    aria-current={currentPage === i + 1 ? 'page' : undefined}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Próxima Página"
              >
                Próxima
              </button>
            </div>
          )}
        </div >
      </div >
    </div >
  );
};

export default CompaniesListPage;
