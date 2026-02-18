import React, { createContext, useContext, ReactNode, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@tgt/shared';
import { useToast } from '@/contexts/ToastContext';

interface FavoritesContextType {
  favorites: string[];
  addFavorite: (companyId: string) => Promise<void>;
  removeFavorite: (companyId: string) => Promise<void>;
  isFavorite: (companyId: string) => boolean;
  loading: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const userId = user?.id;
  const isClient = user?.type === 'client';

  // Fetch Favorites
  const { data: favorites = [], isLoading: loading } = useQuery({
    queryKey: ['favorites', userId],
    queryFn: async () => {
      if (!userId || !isClient) return [];

      const { data, error } = await supabase
        .from('favorites')
        .select('company_id')
        .eq('user_id', userId);

      if (error) {
        console.error("Error fetching favorites:", error);
        throw error;
      }

      return data.map(f => f.company_id);
    },
    enabled: !!userId && isClient,
    staleTime: 1000 * 60 * 30, // 30 mins
  });

  // Add Mutation
  const addMutation = useMutation({
    mutationFn: async (companyId: string) => {
      if (!userId) throw new Error("User not logged in");

      const { error } = await supabase
        .from('favorites')
        .insert({ user_id: userId, company_id: companyId });

      if (error) throw error;
    },
    onMutate: async (companyId) => {
      await queryClient.cancelQueries({ queryKey: ['favorites', userId] });
      const previousFavorites = queryClient.getQueryData<string[]>(['favorites', userId]);

      // Optimistic update
      queryClient.setQueryData<string[]>(['favorites', userId], (old = []) => [...old, companyId]);

      return { previousFavorites };
    },
    onError: (_err, _companyId, context) => {
      if (context?.previousFavorites) {
        queryClient.setQueryData(['favorites', userId], context.previousFavorites);
      }
      addToast("Erro ao adicionar favorito.", "error");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites', userId] });
    },
    onSuccess: () => {
      addToast("Adicionado aos favoritos!", "success");
    }
  });

  // Remove Mutation
  const removeMutation = useMutation({
    mutationFn: async (companyId: string) => {
      if (!userId) throw new Error("User not logged in");

      const { error } = await supabase
        .from('favorites')
        .delete()
        .match({ user_id: userId, company_id: companyId });

      if (error) throw error;
    },
    onMutate: async (companyId) => {
      await queryClient.cancelQueries({ queryKey: ['favorites', userId] });
      const previousFavorites = queryClient.getQueryData<string[]>(['favorites', userId]);

      // Optimistic update
      queryClient.setQueryData<string[]>(['favorites', userId], (old = []) => old.filter(id => id !== companyId));

      return { previousFavorites };
    },
    onError: (_err, _companyId, context) => {
      if (context?.previousFavorites) {
        queryClient.setQueryData(['favorites', userId], context.previousFavorites);
      }
      addToast("Erro ao remover favorito.", "error");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites', userId] });
    },
    onSuccess: () => {
      addToast("Removido dos favoritos.", "info");
    }
  });

  const addFavorite = useCallback(async (companyId: string) => {
    if (!isClient) {
      addToast("Faça login como cliente para favoritar.", "info");
      return;
    }
    await addMutation.mutateAsync(companyId);
  }, [isClient, addToast, addMutation]);

  const removeFavorite = useCallback(async (companyId: string) => {
    if (!isClient) return;
    await removeMutation.mutateAsync(companyId);
  }, [isClient, removeMutation]);

  const isFavorite = useCallback((companyId: string): boolean => {
    return favorites.includes(companyId);
  }, [favorites]);

  return (
    <FavoritesContext.Provider value={{ favorites, addFavorite, removeFavorite, isFavorite, loading }}>
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
