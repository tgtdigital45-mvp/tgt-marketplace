import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';

interface FavoritesContextType {
  favorites: string[];
  addFavorite: (companyId: string) => void;
  removeFavorite: (companyId: string) => void;
  isFavorite: (companyId: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

const getFavoritesFromStorage = (userId: string): string[] => {
  try {
    const item = localStorage.getItem(`favorites_${userId}`);
    return item ? JSON.parse(item) : [];
  } catch (error) {
    console.error("Error reading favorites from localStorage", error);
    return [];
  }
};

const setFavoritesInStorage = (userId: string, favorites: string[]) => {
  try {
    localStorage.setItem(`favorites_${userId}`, JSON.stringify(favorites));
  } catch (error) {
    console.error("Error saving favorites to localStorage", error);
  }
};

export const FavoritesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    if (user && user.type === 'client') {
      // eslint-disable-next-line 
      setFavorites(getFavoritesFromStorage(user.id));
    } else {
      setFavorites([]);
    }
  }, [user]);

  const addFavorite = useCallback((companyId: string) => {
    if (!user || user.type !== 'client') return;
    setFavorites(prevFavorites => {
      if (prevFavorites.includes(companyId)) {
        return prevFavorites;
      }
      const newFavorites = [...prevFavorites, companyId];
      setFavoritesInStorage(user.id, newFavorites);
      return newFavorites;
    });
  }, [user]);

  const removeFavorite = useCallback((companyId: string) => {
    if (!user || user.type !== 'client') return;
    setFavorites(prevFavorites => {
      const newFavorites = prevFavorites.filter(id => id !== companyId);
      setFavoritesInStorage(user.id, newFavorites);
      return newFavorites;
    });
  }, [user]);

  const isFavorite = useCallback((companyId: string): boolean => {
    return favorites.includes(companyId);
  }, [favorites]);

  return (
    <FavoritesContext.Provider value={{ favorites, addFavorite, removeFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};
