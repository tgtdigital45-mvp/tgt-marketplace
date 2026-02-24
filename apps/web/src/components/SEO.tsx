import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title?: string;
    description?: string;
    keywords?: string;
    image?: string;
    url?: string;
    type?: string;
}

const SEO: React.FC<SEOProps> = ({
    title = 'CONTRATTO | Guia de Negócios e Serviços',
    description = 'Encontre os melhores negócios e serviços locais na sua região. Conecte-se com profissionais verificados no CONTRATTO e expanda sua rede em Cascavel e região.',
    keywords,
    image = 'https://tgt-guia-de-negocios.vercel.app/og-image.jpg',
    url,
    type = 'website',
}) => {
    const siteUrl = 'https://tgt-guia-de-negocios.vercel.app';
    const fullUrl = url ? (url.startsWith('http') ? url : `${siteUrl}${url}`) : siteUrl;

    // Default keywords plus any specific ones
    const defaultKeywords = 'CONTRATTO, Contabilidade, serviços locais, guia de negócios, Cascavel';
    const fullKeywords = keywords ? `${keywords}, ${defaultKeywords}` : defaultKeywords;

    return (
        <Helmet>
            {/* Visual */}
            <title>{title}</title>
            <meta name="description" content={description} />
            <meta name="keywords" content={fullKeywords} />
            <link rel="canonical" href={fullUrl} />

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
