import React from 'react';
import { deduplicateCompanies } from '../utils/companyUtils';
import SEO from '../components/SEO';
import CompanyCard from '../components/CompanyCard';
import { CATEGORIES } from '../constants';
import { useCompanySearch } from '../hooks/useCompanySearch';
import Select from '../components/ui/Select';
import EmptyState from '../components/EmptyState';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import { Search, Filter, SlidersHorizontal, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

const PRICE_OPTIONS = [
  { label: 'Todos os Preços', value: 'all' },
  { label: 'Até R$ 100', value: 'low' },
  { label: 'R$ 100 - R$ 300', value: 'mid' },
  { label: 'Acima de R$ 300', value: 'high' },
];

const SORT_OPTIONS = [
  { label: 'Melhor Avaliação', value: 'rating' },
  { label: 'Nome (A-Z)', value: 'name' },
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
    setLocationTerm,
    selectedCategory,
    setSelectedCategory,
    priceRange,
    setPriceRangeValue,
    sortBy,
    setSortBy,
    currentPage,
    setCurrentPage,
  } = useCompanySearch(itemsPerPage);

  const getDynamicTitle = () => {
    let title = 'Guia de Empresas e Serviços';
    if (searchTerm) title = `${searchTerm}`;
    else if (selectedCategory !== 'all') title = `${selectedCategory}`;
    if (locationTerm) title += ` em ${locationTerm}`;
    return `${title} | TGT Contratto`;
  };

  const getDynamicDescription = () => {
    return searchTerm
      ? `Encontre ${searchTerm} no TGT Contratto. Profissionais qualificados e avaliados na sua região.`
      : 'Explore as melhores empresas e prestadores de serviços em nossa rede corporativa verificada.';
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main className="bg-slate-50 min-h-screen">
      <SEO
        title={getDynamicTitle()}
        description={getDynamicDescription()}
        url={location.pathname}
      />

      {/* Hero Header Section */}
      <section className="bg-slate-900 pt-32 pb-24 text-white relative overflow-hidden">
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-6xl font-bold mb-6 tracking-tight"
            >
              Encontre <span className="text-primary-400 italic">Excelência</span> em cada serviço
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg text-slate-400 mb-12 max-w-2xl mx-auto"
            >
              Filtre entre milhares de empresas verificadas pela nossa curadoria e foque no que realmente importa: resultados reais.
            </motion.p>
          </div>

          {/* New Search Bar Component (Inline) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-4xl mx-auto bg-white p-2 rounded-[32px] shadow-2xl flex flex-col md:flex-row items-stretch gap-2 border border-white/10"
          >
            <div className="flex-grow relative border-b md:border-b-0 md:border-r border-slate-100 pb-2 md:pb-0">
              <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-400">
                <Search size={20} />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                placeholder="O que você precisa hoje?"
                className="w-full pl-14 pr-4 py-4 bg-transparent border-none outline-none text-slate-900 placeholder:text-slate-400 font-medium"
              />
            </div>
            <div className="md:w-1/3 relative border-b md:border-b-0 md:border-r border-slate-100 pb-2 md:pb-0">
              <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-400">
                <MapPin size={20} />
              </div>
              <input
                value={locationTerm}
                onChange={(e) => setLocationTerm(e.target.value)}
                placeholder="Localização"
                className="w-full pl-14 pr-4 py-4 bg-transparent border-none outline-none text-slate-900 placeholder:text-slate-400 font-medium"
              />
            </div>
            <button className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-[28px] font-bold shadow-xl transition-all active:scale-95">
              Pesquisar
            </button>
          </motion.div>
        </div>

        {/* Decor */}
        <div className="absolute top-[-10%] right-[-5%] w-80 h-80 bg-primary-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-slate-800/20 rounded-full blur-[80px] pointer-events-none" />
      </section>

      {/* Main Content Area */}
      <div className="container mx-auto px-6 py-12">
        <div className="flex flex-col lg:flex-row gap-10">

          {/* Sidebar Filters */}
          <aside className="lg:w-1/4">
            <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-soft sticky top-24">
              <div className="flex items-center gap-2 mb-8 pb-4 border-b border-slate-100">
                <SlidersHorizontal size={18} className="text-primary-600" />
                <h2 className="text-lg font-bold text-slate-900 uppercase tracking-widest text-[10px]">Filtros Avançados</h2>
              </div>

              <div className="space-y-8">
                <div>
                  <Select
                    label="Categoria"
                    value={selectedCategory}
                    onChange={(val) => { setSelectedCategory(val); setCurrentPage(1); }}
                    options={[
                      { label: 'Todas as Categorias', value: 'all' },
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

                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                    setSortBy('rating');
                    setCurrentPage(1);
                    setPriceRangeValue('all');
                    setLocationTerm('');
                  }}
                  className="w-full py-4 px-4 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-[20px] text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                >
                  Limpar Tudo
                </button>
              </div>
            </div>
          </aside>

          {/* Results Grid */}
          <div className="lg:w-3/4">
            <div className="flex justify-between items-center mb-10">
              <p className="text-slate-500 font-medium">
                Mostrando <span className="text-slate-900 font-bold">{totalCount}</span> resultados encontrados
              </p>
            </div>

            <section aria-label="Lista de Empresas">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-full">
                      <LoadingSkeleton className="h-[400px] rounded-[32px]" />
                    </div>
                  ))}
                </div>
              ) : companies.length > 0 ? (
                <div className="grid gap-8 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                  {deduplicateCompanies(companies).map((company, index) => (
                    <motion.div
                      key={company.id ? `${company.id}-${index}` : `company-${index}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <CompanyCard company={company} />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="py-24 bg-white rounded-[48px] border border-slate-200">
                  <EmptyState />
                </div>
              )}
            </section>

            {/* Pagination Component (Refined) */}
            {!loading && totalPages > 1 && (
              <div className="mt-16 flex justify-center items-center gap-4">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="h-14 w-14 flex items-center justify-center border border-slate-200 rounded-full disabled:opacity-30 hover:bg-white transition-colors bg-slate-50"
                >
                  <SlidersHorizontal className="rotate-90 text-slate-400 group-hover:text-slate-900" size={18} />
                </button>

                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`h-10 px-4 rounded-xl font-bold text-sm transition-all ${currentPage === page
                        ? 'bg-primary-600 text-white shadow-lg'
                        : 'text-slate-400 hover:text-slate-900'
                        }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="h-14 w-14 flex items-center justify-center border border-slate-200 rounded-full disabled:opacity-30 hover:bg-white transition-colors bg-slate-50"
                >
                  <SlidersHorizontal className="-rotate-90 text-slate-400" size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default CompaniesListPage;
