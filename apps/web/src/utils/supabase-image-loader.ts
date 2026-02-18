/**
 * Supabase Image Loader
 * 
 * Utilitário para otimização de imagens usando Supabase Image Transformation API
 * 
 * Recursos:
 * - Redimensionamento automático
 * - Conversão para WebP (menor tamanho, mesma qualidade)
 * - Controle de qualidade
 * - CDN global (baixa latência)
 * 
 * @see https://supabase.com/docs/guides/storage/serving/image-transformations
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

/**
 * Gera URL otimizada do Supabase Storage com transformação de imagem
 * 
 * @param path - Caminho da imagem no bucket (ex: 'companies/logo.png' ou URL completa)
 * @param width - Largura desejada em pixels (padrão: 800)
 * @param quality - Qualidade da imagem 1-100 (padrão: 75)
 * @returns URL transformada com WebP
 * 
 * @example
 * ```tsx
 * // Uso básico
 * <img src={getOptimizedImageUrl('companies/logo.png', 300)} alt="Logo" />
 * 
 * // Com qualidade customizada
 * <img src={getOptimizedImageUrl('services/hero.jpg', 1200, 90)} alt="Hero" />
 * 
 * // Com URL completa do Supabase
 * <img src={getOptimizedImageUrl(company.logo_url, 300)} alt="Logo" />
 * ```
 */
export function getOptimizedImageUrl(
    path: string,
    width: number = 800,
    quality: number = 75
): string {
    // Se for uma URL completa do Supabase, extrair o path
    if (path.includes('supabase.co/storage/v1/object/public/')) {
        const urlParts = path.split('/storage/v1/object/public/');
        if (urlParts.length === 2) {
            path = urlParts[1];
        }
    }

    // Se for placeholder ou URL externa, retornar sem transformação
    if (path.startsWith('http') && !path.includes('supabase.co')) {
        return path;
    }

    // Construir URL com transformação
    return `${SUPABASE_URL}/storage/v1/render/image/public/${path}?width=${width}&quality=${quality}&format=webp`;
}

/**
 * Gera URL otimizada com altura fixa (mantém aspect ratio)
 * 
 * @param path - Caminho da imagem no bucket
 * @param height - Altura desejada em pixels
 * @param quality - Qualidade da imagem 1-100 (padrão: 75)
 * @returns URL transformada com WebP
 */
export function getOptimizedImageUrlByHeight(
    path: string,
    height: number,
    quality: number = 75
): string {
    if (path.startsWith('http') && !path.includes('supabase.co')) {
        return path;
    }

    return `${SUPABASE_URL}/storage/v1/render/image/public/${path}?height=${height}&quality=${quality}&format=webp`;
}

/**
 * Gera URL otimizada com dimensões exatas (pode distorcer)
 * 
 * @param path - Caminho da imagem no bucket
 * @param width - Largura desejada em pixels
 * @param height - Altura desejada em pixels
 * @param quality - Qualidade da imagem 1-100 (padrão: 75)
 * @returns URL transformada com WebP
 */
export function getOptimizedImageUrlExact(
    path: string,
    width: number,
    height: number,
    quality: number = 75
): string {
    if (path.startsWith('http') && !path.includes('supabase.co')) {
        return path;
    }

    return `${SUPABASE_URL}/storage/v1/render/image/public/${path}?width=${width}&height=${height}&quality=${quality}&format=webp`;
}

/**
 * Presets comuns para diferentes casos de uso
 */
export const ImagePresets = {
    /** Thumbnail pequeno (150x150) - ideal para avatares */
    thumbnail: (path: string) => getOptimizedImageUrlExact(path, 150, 150, 80),

    /** Card de empresa (400px largura) - ideal para listagens */
    companyCard: (path: string) => getOptimizedImageUrl(path, 400, 75),

    /** Logo de empresa (300px largura) - ideal para headers */
    logo: (path: string) => getOptimizedImageUrl(path, 300, 80),

    /** Cover/Banner (1200px largura) - ideal para hero sections */
    cover: (path: string) => getOptimizedImageUrl(path, 1200, 75),

    /** Galeria (800px largura) - ideal para galerias de serviços */
    gallery: (path: string) => getOptimizedImageUrl(path, 800, 75),

    /** Full HD (1920px largura) - ideal para imagens de destaque */
    fullHD: (path: string) => getOptimizedImageUrl(path, 1920, 85),
} as const;
