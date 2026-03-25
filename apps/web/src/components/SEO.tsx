import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title?: string;
    description?: string;
    keywords?: string;
    image?: string;
    url?: string;
    type?: string;
    schema?: Record<string, any>;
    preload?: { href: string; as: string; type?: string }[];
}

const SEO: React.FC<SEOProps> = ({
    title = 'Contratto | O marketplace de serviços de excelência',
    description = 'Procurando pelos melhores profissionais? O Contratto conecta você aos melhores serviços, autônomos e agências da região. Solicite orçamentos e agende agora.',
    keywords,
    image = 'https://contratto.app/og-image.jpg',
    url,
    type = 'website',
    schema,
    preload,
}) => {
    const siteUrl = 'https://www.contrattoex.com';
    // Remove query parameters from canonical URL to avoid duplicate indexing errors
    const cleanUrl = url ? (url.includes('?') ? url.split('?')[0] : url) : '';
    const fullUrl = cleanUrl.startsWith('http') ? cleanUrl : `${siteUrl}${cleanUrl}`;

    // Default keywords plus any specific ones
    const defaultKeywords = 'Contratto, Contrato, Contrato Marketplace, Contratou, Contratu, Contrato Serviços, Con trato, Contratro, Contratta, Contratoo, Conttato, Marketplace Contratto, App Contratto, Contrato Empresas, Plataforma Contratto, serviços, marketplace, profissionais, agendamento, orçamentos, segurança';
    const fullKeywords = keywords ? `${keywords}, ${defaultKeywords}` : defaultKeywords;

    return (
        <Helmet>
            {/* Visual */}
            <title>{title}</title>
            <meta name="description" content={description} />
            <meta name="keywords" content={fullKeywords} />
            {preload && preload.map((item, idx) => (
                <link key={idx} rel="preload" href={item.href} as={item.as} type={item.type} />
            ))}

            {schema && (
                <script type="application/ld+json">
                    {JSON.stringify(schema)}
                </script>
            )}

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={fullUrl} />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={image} />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:url" content={fullUrl} />
            <meta name="twitter:title" content={title} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={image} />
        </Helmet>
    );
};

export default SEO;
