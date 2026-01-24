import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import CompanyCard from '../components/CompanyCard';
import Section from '../components/ui/Section';
import Skeleton from '../components/ui/Skeleton';
import { CATEGORIES } from '../constants';
import { Company } from '../types';
import { useMockData } from '../contexts/MockContext';

const CompaniesListPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { companies, loading: contextLoading } = useMockData();

  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('cat') || 'all');
  const [sortBy, setSortBy] = useState('rating');
  const [priceRange, setPriceRange] = useState<'all' | 'low' | 'mid' | 'high'>('all');

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSearchTerm(searchParams.get('q') || '');
    setSelectedCategory(searchParams.get('cat') || 'all');

    // Simulate loading
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, [searchParams]);

  const filteredAndSortedCompanies = companies
    .filter(company =>
      company.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.services.some(service => service.title.toLowerCase().includes(searchTerm.toLowerCase()))
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
      if (sortBy === 'rating') {
        return b.rating - a.rating;
      }
      if (sortBy === 'name') {
        return a.companyName.localeCompare(b.companyName);
      }
      return 0;
    });

  return (
    <div className="bg-gray-50">
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
                className="mt-1 block w-full bg-white border-none ring-1 ring-gray-100 rounded-xl shadow-md py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:shadow-lg transition-all sm:text-sm placeholder-gray-400"
              />
            </div>
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">Categoria</label>
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="mt-1 block w-full bg-white border-none ring-1 ring-gray-100 rounded-xl shadow-md py-3 pl-4 pr-10 text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:shadow-lg transition-all sm:text-sm"
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
                onChange={(e) => setPriceRange(e.target.value as any)}
                className="mt-1 block w-full bg-white border-none ring-1 ring-gray-100 rounded-xl shadow-md py-3 pl-4 pr-10 text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:shadow-lg transition-all sm:text-sm"
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
                className="mt-1 block w-full bg-white border-none ring-1 ring-gray-100 rounded-xl shadow-md py-3 pl-4 pr-10 text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:shadow-lg transition-all sm:text-sm"
              >
                <option value="rating">Melhor Avaliação</option>
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
          {loading || contextLoading ? (
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
              {filteredAndSortedCompanies.map(company => (
                <CompanyCard key={company.id} company={company} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 px-4 bg-white rounded-lg shadow-md">
              <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="mt-4 text-xl font-semibold text-gray-800">Nenhum resultado encontrado</h3>
              <p className="text-gray-500 mt-2 mb-6">Tente ajustar seus filtros de busca ou procurar por outro termo.</p>

              <div className="mt-6">
                <p className="text-sm font-medium text-gray-700 mb-3">Categorias Populares:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {CATEGORIES.slice(0, 5).map(cat => (
                    <button
                      key={cat}
                      onClick={() => { setSelectedCategory(cat); setSearchTerm(''); }}
                      className="px-4 py-2 bg-gray-100 hover:bg-brand-primary hover:text-white rounded-md text-sm transition-colors"
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompaniesListPage;
