import React from 'react';
import SEO from '../components/SEO';
import CompanyCard from '../components/CompanyCard';
import { CATEGORIES } from '../constants';
import { useCompanySearch } from '../hooks/useCompanySearch';
import Select from '../components/ui/Select';
import EmptyState from '../components/EmptyState';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';

const PRICE_OPTIONS = [
  { label: 'Todos os Preços', value: 'all' },
  { label: 'Até R$ 100', value: 'low' },
  { label: 'R$ 100 - R$ 300', value: 'mid' },
  { label: 'Acima de R$ 300', value: 'high' },
];

const SORT_OPTIONS = [
  { label: 'Melhor Avaliação', value: 'rating' },
  { label: 'Nome (A-Z)', value: 'name' },
  { label: 'Mais Próximos', value: 'distance' },
];

const CompaniesListPage: React.FC = () => {
  const itemsPerPage = 8;
  const {
    companies,
    totalCount,
    loading,
    searchTerm,
    setSearchTerm,
    locationTerm,
    selectedCategory,
    setSelectedCategory,
    priceRange,
    setPriceRangeValue,
    sortBy,
    setSortBy,
    currentPage,
    setCurrentPage,
  } = useCompanySearch(itemsPerPage);

  // SEO Helpers
  const getDynamicTitle = () => {
    let title = 'Empresas e Serviços Locais';
    if (searchTerm) title = `${searchTerm}`;
    else if (selectedCategory !== 'all') title = `${selectedCategory}`;
    if (locationTerm) title += ` em ${locationTerm}`;
    return `${title} | TGT Contratto`;
  };

  const getDynamicDescription = () => {
    return searchTerm
      ? `Encontre ${searchTerm} no TGT Contratto. Profissionais avaliados.`
      : 'Encontre as melhores empresas e serviços locais na sua região.';
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main className="bg-gray-50 min-h-screen">
      <SEO
        title={getDynamicTitle()}
        description={getDynamicDescription()}
        url={location.pathname}
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
            Encontre os Melhores <span className="text-primary-600">Negócios Locais</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Explore uma seleção curada de empresas e serviços na sua região.
          </p>
        </div>

        {/* Filters Section */}
        <div className="mt-12 p-6 bg-white rounded-lg shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700">Buscar</label>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                placeholder="Ex: Pedreiro, Adega..."
                className="mt-1 block w-full bg-white border border-gray-300 rounded-[var(--radius-box)] shadow-sm py-3 px-4 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <Select
                label="Categoria"
                value={selectedCategory}
                onChange={(val) => { setSelectedCategory(val); setCurrentPage(1); }}
                options={[
                  { label: 'Todas', value: 'all' },
                  ...CATEGORIES.map(cat => ({ label: cat, value: cat }))
                ]}
              />
            </div>

            <div>
              <Select
                label="Faixa de Preço"
                value={priceRange}
                onChange={(val) => setPriceRangeValue(val as any)}
                options={PRICE_OPTIONS}
              />
            </div>

            <div>
              <Select
                label="Ordenar por"
                value={sortBy}
                onChange={(val) => setSortBy(val)}
                options={SORT_OPTIONS}
              />
            </div>

            {/* Clear Filters Button */}
            <div>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                  setSortBy('rating');
                  setCurrentPage(1);
                  setPriceRangeValue('all');
                }}
                className="w-full py-3 px-4 border border-gray-300 rounded-[var(--radius-box)] shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Limpar Filtros
              </button>
            </div>
          </div>
        </div>

        {/* Results Info */}
        <div className="mt-8 flex justify-between items-center">
          <p className="text-gray-600">
            Encontrados <strong className="text-brand-primary">{totalCount}</strong> resultados
          </p>
        </div>

        {/* Content */}
        <section className="mt-6" aria-label="Lista de Empresas">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-full">
                  <LoadingSkeleton className="h-64 rounded-[var(--radius-box)]" />
                </div>
              ))}
            </div>
          ) : companies.length > 0 ? (
            <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {companies.map(company => (
                <CompanyCard key={company.id} company={company} />
              ))}
            </div>
          ) : (
            <div className="py-12">
              <EmptyState
                action={
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCategory('all');
                      setSortBy('rating');
                      setCurrentPage(1);
                      setPriceRangeValue('all');
                    }}
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-brand-primary hover:bg-brand-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
                  >
                    Limpar todos os filtros
                  </button>
                }
              />
            </div>
          )}
        </section>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="mt-12 flex justify-center items-center space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 border rounded-md disabled:opacity-50 hover:bg-gray-50 bg-white"
            >
              Anterior
            </button>
            <span className="text-gray-600 px-4">
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border rounded-md disabled:opacity-50 hover:bg-gray-50 bg-white"
            >
              Próxima
            </button>
          </div>
        )}

      </div>
    </main>
  );
};

export default CompaniesListPage;
