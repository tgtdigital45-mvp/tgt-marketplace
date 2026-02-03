import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CATEGORIES } from '../constants';
import Button from './ui/Button';

const QuickSearch: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('all');
  const [location, setLocation] = useState('');
  const [coords, setCoords] = useState<{ lat: number, lng: number } | null>(null);
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError] = useState(false);
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
    if (location.trim()) {
      queryParams.set('loc', location.trim());
    }
    if (coords) {
      queryParams.set('lat', coords.lat.toString());
      queryParams.set('lng', coords.lng.toString());
    }
    navigate(`/empresas?${queryParams.toString()}`);
  };

  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      setLocError(true);
      setTimeout(() => setLocError(false), 3000);
      return;
    }
    setLocLoading(true);
    setLocError(false);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLocation("Minha Localização Atual");
        setLocLoading(false);
      },
      (error) => {
        console.error("Error getting location", error);
        setLocError(true);
        setLocLoading(false);
        setTimeout(() => setLocError(false), 3000);
      }
    );
  };

  return (
    <div className="w-full">
      <form
        onSubmit={handleSearch}
        className="p-3 sm:p-2 bg-white rounded-2xl shadow-lg flex flex-col md:flex-row items-stretch gap-3 md:gap-2 border border-gray-100"
      >
        {/* Search Term */}
        <div className="w-full md:flex-grow relative border-b md:border-b-0 md:border-r border-gray-100 pb-3 md:pb-0 md:pr-2">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="O que você procura?"
            aria-label="Campo de busca por serviço ou profissional"
            className="w-full min-h-[48px] bg-transparent border-none rounded-xl py-3 pl-10 pr-4 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-0 truncate"
          />
        </div>

        {/* Location Input */}
        <div className="w-full md:w-[30%] relative border-b md:border-b-0 md:border-r border-gray-100 pb-3 md:pb-0 md:pr-2">
          <button
            type="button"
            onClick={handleGeolocation}
            className={`absolute inset-y-0 left-0 w-12 flex items-center justify-center transition-all cursor-pointer ${locLoading ? 'text-blue-500' :
              coords ? 'text-green-600 hover:text-green-700' :
                locError ? 'text-red-500' :
                  'text-gray-400 hover:text-brand-primary'
              }`}
            title="Usar minha localização atual"
            aria-label="Obter localização atual via GPS"
            disabled={locLoading}
          >
            {locLoading ? (
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg
                className="h-5 w-5 transition-colors"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
          </button>
          <input
            type="text"
            value={location}
            onChange={(e) => {
              setLocation(e.target.value);
              if (coords && e.target.value !== "Minha Localização Atual") setCoords(null);
            }}
            placeholder="Cidade ou Bairro"
            aria-label="Campo de localização"
            className={`w-full min-h-[48px] bg-transparent border-none rounded-xl py-3 pl-12 pr-4 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-0 transition-colors truncate ${coords ? 'text-green-700 font-medium' : ''
              }`}
          />

          {/* Error feedback */}
          {locError && (
            <div
              className="absolute -bottom-6 left-0 text-xs text-red-600 animate-fade-in"
              role="alert"
              aria-live="polite"
            >
              Não foi possível obter localização
            </div>
          )}
        </div>

        {/* Category Select */}
        <div className="w-full md:w-[25%] relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Selecionar categoria de serviço"
            className="w-full min-h-[48px] appearance-none bg-transparent border-none rounded-xl py-3 pl-10 pr-8 text-gray-700 focus:outline-none focus:ring-0 cursor-pointer"
          >
            <option value="all">Todas</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
            <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </div>
        </div>

        <Button
          type="submit"
          size="lg"
          aria-label="Buscar serviços"
          className="w-full md:w-auto min-h-[48px] rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-white font-bold shadow-md hover:shadow-lg transition-all active:scale-95 px-8 py-3"
        >
          Buscar
        </Button>
      </form>
    </div>
  );
};

export default QuickSearch;
