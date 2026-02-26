import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface ServiceDetail {
    id: string;
    title: string;
    description: string;
    price: number;
    starting_price?: number;
    image_url?: string;
    gallery?: string[];
    category_tag?: string;
    service_type?: string;
    duration?: string;
    duration_minutes?: number;
    pricing_model?: string;
    requires_quote?: boolean;
    faq?: { question: string; answer: string }[];
    packages?: {
        basic: { name: string; description: string; price: number; delivery_time: number; features: string[] };
        standard?: { name: string; description: string; price: number; delivery_time: number; features: string[] };
        premium?: { name: string; description: string; price: number; delivery_time: number; features: string[] };
    };
    company?: {
        id: string;
        slug: string;
        company_name: string;
        logo_url: string;
        description: string;
        rating?: number;
        review_count?: number;
        city?: string;
        state?: string;
        stripe_charges_enabled?: boolean;
    };
}

async function fetchServiceById(id: string): Promise<ServiceDetail> {
    const { data, error } = await supabase
        .from('services')
        .select(`*, company:companies (*)`)
        .eq('id', id)
        .is('deleted_at', null)
        .single();

    if (error) throw error;
    if (!data) throw new Error('Serviço não encontrado');

    return {
        id: data.id,
        title: data.title,
        description: data.description,
        price: data.price,
        starting_price: data.starting_price,
        image_url: data.image_url,
        gallery: data.gallery,
        category_tag: data.category_tag,
        service_type: data.service_type,
        duration: data.duration,
        duration_minutes: data.duration_minutes,
        pricing_model: data.pricing_model,
        requires_quote: data.requires_quote,
        faq: data.faq,
        packages: data.packages,
        company: data.company,
    };
}

export function useServiceDetails(id: string) {
    return useQuery<ServiceDetail>({
        queryKey: ['service', id],
        queryFn: () => fetchServiceById(id),
        enabled: !!id,
        staleTime: 1000 * 60 * 5,
    });
}
