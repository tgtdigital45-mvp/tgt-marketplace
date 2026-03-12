import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Fetch all companies and services
    const { data: companies, error: companiesError } = await supabaseClient
      .from('companies')
      .select('slug, updated_at')
      .eq('is_active', true);

    const { data: services, error: servicesError } = await supabaseClient
      .from('services')
      .select('id, updated_at')
      .is('deleted_at', null);

    if (companiesError) throw companiesError;
    if (servicesError) throw servicesError;

    const baseUrl = 'https://contratto.app';
    const lastModDate = new Date().toISOString();

    let urls = `
      <url>
        <loc>${baseUrl}/</loc>
        <lastmod>${lastModDate}</lastmod>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
      </url>
      <url>
        <loc>${baseUrl}/servicos</loc>
        <lastmod>${lastModDate}</lastmod>
        <changefreq>daily</changefreq>
        <priority>0.8</priority>
      </url>
      <url>
        <loc>${baseUrl}/empresas</loc>
        <lastmod>${lastModDate}</lastmod>
        <changefreq>daily</changefreq>
        <priority>0.8</priority>
      </url>
      <url>
        <loc>${baseUrl}/painel-vendedor</loc>
        <lastmod>${lastModDate}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.3</priority>
      </url>
    `;

    if (companies) {
      for (const comp of companies) {
        const modDate = comp.updated_at ? new Date(comp.updated_at).toISOString() : lastModDate;
        urls += `
          <url>
            <loc>${baseUrl}/empresa/${comp.slug}</loc>
            <lastmod>${modDate}</lastmod>
            <changefreq>weekly</changefreq>
            <priority>0.6</priority>
          </url>
        `;
      }
    }

    if (services) {
      for (const serv of services) {
        const modDate = serv.updated_at ? new Date(serv.updated_at).toISOString() : lastModDate;
        urls += `
          <url>
            <loc>${baseUrl}/servico/${serv.id}</loc>
            <lastmod>${modDate}</lastmod>
            <changefreq>weekly</changefreq>
            <priority>0.7</priority>
          </url>
        `;
      }
    }

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

    return new Response(sitemap, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600'
      },
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
