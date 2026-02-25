import React, { useState } from 'react';
import SEO from '@/components/SEO';
import { useCompanySearch } from '@/hooks/useCompanySearch';
import Select from '@/components/ui/Select';
import { Search, SlidersHorizontal, MapPin, ChevronLeft, ChevronRight, X, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import CompanyGrid from '@/components/CompanyGrid';

// ─── Constants (matching DB values) ──────────────────────────────────────────
const CATEGORY_OPTIONS = [
  { label: 'Todas as Categorias', value: 'all' },
  { label: 'Marketing', value: 'Marketing' },
  { label: 'Tecnologia', value: 'Tecnologia' },
  { label: 'Design', value: 'Design' },
  { label: 'Consultoria', value: 'Consultoria' },
  { label: 'Contabilidade', value: 'Contabilidade' },
  { label: 'Advocacia', value: 'Advocacia' },
  { label: 'Arquitetura', value: 'Arquitetura' },
  { label: 'Fotografia', value: 'Fotografia' },
  { label: 'Educacao', value: 'Educação' },
  { label: 'Saude', value: 'Saúde' },
];

const CITY_OPTIONS = [
  { label: 'Todas as Cidades', value: '' },
  { label: 'Curitiba', value: 'Curitiba' },
  { label: 'Londrina', value: 'Londrina' },
  { label: 'Maringa', value: 'Maringá' },
  { label: 'Cascavel', value: 'Cascavel' },
  { label: 'Ponta Grossa', value: 'Ponta Grossa' },
  { label: 'Foz do Iguacu', value: 'Foz do Iguaçu' },
  { label: 'Guarapuava', value: 'Guarapuava' },
  { label: 'Paranagua', value: 'Paranaguá' },
  { label: 'Toledo', value: 'Toledo' },
  { label: 'Francisco Beltrao', value: 'Francisco Beltrão' },
  { label: 'Umuarama', value: 'Umuarama' },
  { label: 'Campo Mourao', value: 'Campo Mourão' },
  { label: 'Apucarana', value: 'Apucarana' },
  { label: 'Arapongas', value: 'Arapongas' },
  { label: 'Colombo', value: 'Colombo' },
  { label: 'Sao Jose dos Pinhais', value: 'São José dos Pinhais' },
];

const PRICE_OPTIONS = [
  { label: 'Todos os Precos', value: 'all' },
  { label: 'Ate R$ 100', value: 'low' },
  { label: 'R$ 100 - R$ 300', value: 'mid' },
  { label: 'Acima de R$ 300', value: 'high' },
];

const SORT_OPTIONS = [
  { label: 'Melhor Avaliacao', value: 'rating' },
  { label: 'Nome (A-Z)', value: 'name' },
];

const ITEMS_PER_PAGE_OPTIONS = [
  { label: '8 por pagina', value: '8' },
  { label: '16 por pagina', value: '16' },
  { label: '24 por pagina', value: '24' },
  { label: '48 por pagina', value: '48' },
];

const CompaniesListPage: React.FC = () => {
  const [itemsPerPage, setItemsPerPage] = useState(16);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
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
    let title = 'Guia de Empresas e Servicos';
    if (searchTerm) title = `${searchTerm}`;
    else if (selectedCategory !== 'all') title = `${selectedCategory}`;
    if (locationTerm) title += ` em ${locationTerm}`;
    return `${title} | CONTRATTO`;
  };

  const getDynamicDescription = () => {
    return searchTerm
      ? `Encontre ${searchTerm} no CONTRATTO. Profissionais qualificados e avaliados na sua regiao.`
      : 'Explore as melhores empresas e prestadores de servicos em nossa rede corporativa verificada.';
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (val: string) => {
    setItemsPerPage(Number(val));
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSortBy('rating');
    setCurrentPage(1);
    setPriceRangeValue('all');
    setLocationTerm('');
  };

  const hasActiveFilters = searchTerm || selectedCategory !== 'all' || priceRange !== 'all' || locationTerm;

  // Generate page numbers with ellipsis for large page counts
  const getPageNumbers = () => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  const FiltersContent = () => (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <Select
          label="Categoria"
          value={selectedCategory}
          onChange={(val) => { setSelectedCategory(val); setCurrentPage(1); }}
          options={CATEGORY_OPTIONS}
        />
      </div>

      <div>
        <Select
          label="Cidade"
          value={locationTerm}
          onChange={(val) => { setLocationTerm(val); setCurrentPage(1); }}
          options={CITY_OPTIONS}
        />
      </div>

      <div>
        <Select
          label="Faixa de Preco"
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

      <div>
        <Select
          label="Empresas por Pagina"
          value={String(itemsPerPage)}
          onChange={handleItemsPerPageChange}
          options={ITEMS_PER_PAGE_OPTIONS}
        />
      </div>

      {hasActiveFilters && (
        <button
          onClick={() => { clearAllFilters(); setShowMobileFilters(false); }}
          className="w-full py-3 sm:py-4 px-4 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl sm:rounded-[20px] text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
        >
          <X size={14} />
          Limpar Tudo
        </button>
      )}
    </div>
  );

  return (
    <main className="bg-slate-50 min-h-screen">
      <SEO
        title={getDynamicTitle()}
        description={getDynamicDescription()}
        url={location.pathname}
      />

      {/* Hero Header Section */}
      <section className="bg-slate-900 pt-20 sm:pt-28 lg:pt-32 pb-16 sm:pb-20 lg:pb-24 text-white relative overflow-hidden">
        <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-6 tracking-tight px-2 sm:px-0"
            >
              Encontre <span className="text-primary-400 italic">Excelencia</span> em cada servico
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-sm sm:text-base lg:text-lg text-slate-400 mb-8 sm:mb-12 max-w-2xl mx-auto px-2 sm:px-0"
            >
              Filtre entre milhares de empresas verificadas pela nossa curadoria e foque no que realmente importa: resultados reais.
            </motion.p>
          </div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-4xl mx-auto bg-white p-1.5 sm:p-2 rounded-2xl sm:rounded-[32px] shadow-2xl flex flex-col md:flex-row items-stretch gap-1.5 sm:gap-2 border border-white/10"
          >
            <div className="flex-grow relative border-b md:border-b-0 md:border-r border-slate-100 pb-1.5 md:pb-0">
              <div className="absolute inset-y-0 left-3 sm:left-5 flex items-center pointer-events-none text-slate-400">
                <Search size={18} />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                placeholder="O que voce precisa hoje?"
                className="w-full pl-10 sm:pl-14 pr-3 sm:pr-4 py-3 sm:py-4 bg-transparent border-none outline-none text-slate-900 placeholder:text-slate-400 font-medium text-sm sm:text-base"
              />
            </div>
            <div className="md:w-1/3 relative border-b md:border-b-0 md:border-r border-slate-100 pb-1.5 md:pb-0">
              <div className="absolute inset-y-0 left-3 sm:left-5 flex items-center pointer-events-none text-slate-400">
                <MapPin size={18} />
              </div>
              <input
                value={locationTerm}
                onChange={(e) => setLocationTerm(e.target.value)}
                placeholder="Localizacao"
                className="w-full pl-10 sm:pl-14 pr-3 sm:pr-4 py-3 sm:py-4 bg-transparent border-none outline-none text-slate-900 placeholder:text-slate-400 font-medium text-sm sm:text-base"
              />
            </div>
            <button className="bg-primary-600 hover:bg-primary-700 text-white px-5 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-[28px] font-bold shadow-xl transition-all active:scale-95 text-sm sm:text-base whitespace-nowrap">
              Pesquisar
            </button>
          </motion.div>
        </div>

        {/* Decor */}
        <div className="absolute top-[-10%] right-[-5%] w-60 sm:w-80 h-60 sm:h-80 bg-primary-600/10 rounded-full blur-[80px] sm:blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-slate-800/20 rounded-full blur-[60px] sm:blur-[80px] pointer-events-none" />
      </section>

      {/* Main Content Area */}
      <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Mobile Filter Toggle */}
        <div className="lg:hidden mb-6">
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 text-sm hover:bg-slate-50 transition-colors"
          >
            <SlidersHorizontal size={16} />
            {showMobileFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
            {hasActiveFilters && <span className="w-2 h-2 bg-primary-600 rounded-full" />}
          </button>

          {showMobileFilters && (
            <div className="mt-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
              <FiltersContent />
            </div>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 lg:gap-10">
          {/* Sidebar Filters - Desktop */}
          <aside className="hidden lg:block lg:w-1/4">
            <div className="bg-white p-6 xl:p-8 rounded-2xl xl:rounded-[32px] border border-slate-200 shadow-sm sticky top-20">
              <div className="flex items-center gap-2 mb-6 xl:mb-8 pb-3 xl:pb-4 border-b border-slate-100">
                <SlidersHorizontal size={16} className="text-primary-600" />
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Filtros Avancados</h2>
              </div>
              <FiltersContent />
            </div>
          </aside>

          {/* Results Grid */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-10 gap-2">
              <p className="text-slate-500 font-medium text-sm">
                Mostrando <span className="text-slate-900 font-bold">{companies.length}</span> de{' '}
                <span className="text-slate-900 font-bold">{totalCount}</span> resultados
              </p>
              {totalPages > 1 && (
                <p className="text-xs text-slate-400">
                  Pagina {currentPage} de {totalPages}
                </p>
              )}
            </div>

            <section aria-label="Lista de Empresas">
              <CompanyGrid companies={companies} loading={loading} />
            </section>

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div className="mt-10 sm:mt-16 flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="h-10 w-10 sm:h-12 sm:w-12 flex items-center justify-center border border-slate-200 rounded-full disabled:opacity-30 hover:bg-white transition-colors bg-slate-50"
                  aria-label="Pagina Anterior"
                >
                  <ChevronLeft className="text-slate-500" size={16} />
                </button>

                <div className="flex items-center gap-1">
                  {getPageNumbers().map((page, i) =>
                    page === '...' ? (
                      <span key={`ellipsis-${i}`} className="px-1.5 sm:px-2 text-slate-400 text-sm">...</span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`h-8 sm:h-10 min-w-[32px] sm:min-w-[40px] px-2 sm:px-3 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm transition-all ${currentPage === page
                          ? 'bg-primary-600 text-white shadow-lg'
                          : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'
                          }`}
                      >
                        {page}
                      </button>
                    )
                  )}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="h-10 w-10 sm:h-12 sm:w-12 flex items-center justify-center border border-slate-200 rounded-full disabled:opacity-30 hover:bg-white transition-colors bg-slate-50"
                  aria-label="Proxima Pagina"
                >
                  <ChevronRight className="text-slate-500" size={16} />
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
