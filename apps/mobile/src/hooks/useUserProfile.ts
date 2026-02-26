import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

export interface UserProfile {
    id: string;
    email: string;
    fullName: string;
    phone: string;
    avatarUrl: string | null;
}

export function useUserProfile() {
    const { user } = useAuth();

    return useQuery<UserProfile>({
        queryKey: ['user-profile', user?.id],
        queryFn: async () => {
            if (!user) throw new Error('Not authenticated');

            return {
                id: user.id,
                email: user.email ?? '',
                fullName: user.user_metadata?.full_name ?? '',
                phone: user.user_metadata?.phone ?? '',
                avatarUrl: user.user_metadata?.avatar_url ?? null,
            };
        },
        enabled: !!user,
        staleTime: 1000 * 60 * 5,
    });
}

export function useUpdateProfile() {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    return useMutation({
        mutationFn: async (updates: { fullName: string; phone: string }) => {
            const { error } = await supabase.auth.updateUser({
                data: {
                    full_name: updates.fullName,
                    phone: updates.phone,
                },
            });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-profile', user?.id] });
        },
    });
}
