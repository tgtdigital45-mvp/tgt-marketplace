import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import { useToast } from './ToastContext';

interface FavoritesContextType {
  favorites: string[];
  addFavorite: (companyId: string) => Promise<void>;
  removeFavorite: (companyId: string) => Promise<void>;
  isFavorite: (companyId: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [favorites, setFavorites] = useState<string[]>([]);
  // const [loading, setLoading] = useState(false); // Removed unused loading state

  useEffect(() => {
    const fetchFavorites = async () => {
      if (user && user.type === 'client') {
        const { data, error } = await supabase
          .from('favorites')
          .select('company_id')
          .eq('user_id', user.id);

        if (!error && data) {
          setFavorites(data.map(f => f.company_id));
        } else if (error) {
          console.error("Error fetching favorites:", error);
        }
      } else {
        setFavorites([]);
      }
    };

    fetchFavorites();
  }, [user]);

  const addFavorite = useCallback(async (companyId: string) => {
    if (!user || user.type !== 'client') {
      addToast("Faça login como cliente para favoritar.", "info");
      return;
    }

    // Optimistic update
    setFavorites(prev => [...prev, companyId]);

    try {
      const { error } = await supabase
        .from('favorites')
        .insert({ user_id: user.id, company_id: companyId });

      if (error) {
        // Rollback
        setFavorites(prev => prev.filter(id => id !== companyId));
        console.error("Error adding favorite:", error);
        addToast("Erro ao adicionar favorito.", "error");
      } else {
        addToast("Adicionado aos favoritos!", "success");
      }
    } catch (err) {
      setFavorites(prev => prev.filter(id => id !== companyId));
      console.error("Exception adding favorite:", err);
    }
  }, [user, addToast]);

  const removeFavorite = useCallback(async (companyId: string) => {
    if (!user || user.type !== 'client') return;

    // Optimistic update
    setFavorites(prev => prev.filter(id => id !== companyId));

    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .match({ user_id: user.id, company_id: companyId }); // match is cleaner for multiple keys

      if (error) {
        // Rollback
        setFavorites(prev => [...prev, companyId]);
        console.error("Error removing favorite:", error);
        addToast("Erro ao remover favorito.", "error");
      } else {
        addToast("Removido dos favoritos.", "info");
      }
    } catch (err) {
      setFavorites(prev => [...prev, companyId]);
      console.error("Exception removing favorite:", err);
    }
  }, [user, addToast]);

  const isFavorite = useCallback((companyId: string): boolean => {
    return favorites.includes(companyId);
  }, [favorites]);

  return (
    <FavoritesContext.Provider value={{ favorites, addFavorite, removeFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};
