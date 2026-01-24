import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import CompanyCard from '../../components/CompanyCard';
import Button from '../../components/ui/Button';
import { Company } from '../../types';

const FavoritesPage: React.FC = () => {
  const { user } = useAuth();
  const [favoriteCompanies, setFavoriteCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchFavorites = async () => {
      setLoading(true);
      try {
        // Fetch favorites joined with companies
        const { data, error } = await supabase
          .from('favorites')
          .select(`
            company_id,
            companies:companies (*)
          `)
          .eq('user_id', user.id);

        if (error) throw error;

        // Transform Supabase response to Company type
        // Note: We need to ensure the joined data matches Company structure or map it
        const companies = data.map((item: any) => {
          const c = item.companies;
          // Map flat Supabase structure to nested Company type
          return {
            id: c.id,
            slug: c.slug,
            companyName: c.company_name,
            legalName: c.legal_name,
            cnpj: c.cnpj,
            logo: c.logo_url || 'https://via.placeholder.com/150',
            coverImage: c.cover_image_url || 'https://via.placeholder.com/1200x400',
            category: c.category,
            rating: 5.0, // Should ideally be fetched properly
            reviewCount: 0,
            description: c.description,
            address: c.address, // Correctly mapped if it's JSONB
            phone: c.phone,
            email: c.email,
            website: c.website,
            services: [], // Placeholder
            portfolio: [],
            reviews: []
          } as Company;
        });

        setFavoriteCompanies(companies);
      } catch (err) {
        console.error("Error fetching favorites:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [user]);

  return (
    <div className="bg-gray-50 min-h-full">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 border-b pb-4 mb-8">
          Minhas Empresas Favoritas
        </h1>

        {loading ? (
          <div className="text-center py-12">Carregando...</div>
        ) : favoriteCompanies.length > 0 ? (
          <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {favoriteCompanies.map(company => (
              <CompanyCard key={company.id} company={company} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 px-4 bg-white rounded-lg shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <h3 className="mt-2 text-xl font-semibold text-gray-800">Sua lista de favoritos está vazia</h3>
            <p className="text-gray-500 mt-2">Adicione empresas aos seus favoritos para encontrá-las facilmente aqui.</p>
            <div className="mt-6">
              <Link to="/empresas">
                <Button>Buscar Empresas</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FavoritesPage;
