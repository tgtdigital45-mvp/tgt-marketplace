import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CATEGORIES } from '../constants';
import Button from './ui/Button';

const QuickSearch: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('all');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const queryParams = new URLSearchParams();
    if (searchTerm.trim()) {
      queryParams.set('q', searchTerm.trim());
    }
    if (category !== 'all') {
      queryParams.set('cat', category);
    }
    navigate(`/empresas?${queryParams.toString()}`);
  };

  return (
    <div className="w-full">
      <form
        onSubmit={handleSearch}
        className="p-2 sm:p-2 bg-white rounded-2xl shadow-lg flex flex-col sm:flex-row items-center gap-2 border border-gray-100"
      >
        <div className="flex-grow w-full">
          <label htmlFor="quick-search-term" className="sr-only">
            Nome da empresa ou serviço
          </label>
          <input
            type="text"
            id="quick-search-term"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="O que você procura?"
            className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:bg-white transition-all"
          />
        </div>
        <div className="w-full sm:w-[240px]">
          <label htmlFor="quick-search-category" className="sr-only">
            Categoria
          </label>
          <div className="relative">
            <select
              id="quick-search-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full appearance-none bg-gray-50 border-none rounded-xl py-3 pl-4 pr-10 text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:bg-white transition-all cursor-pointer"
            >
              <option value="all" className="text-gray-900 font-medium">Todas as Categorias</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat} className="text-gray-900">
                  {cat}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
              <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>
        </div>
        <Button
          type="submit"
          size="lg"
          className="w-full sm:w-auto rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-white font-bold shadow-md hover:shadow-lg transition-transform active:scale-95 px-8"
        >
          Buscar
        </Button>
      </form>
    </div>
  );
};

export default QuickSearch;
