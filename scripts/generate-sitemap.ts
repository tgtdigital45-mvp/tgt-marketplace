import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load env vars
dotenv.config();

// Create standalone client for Node environment
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials missing! Check .env file.');
}

const supabase = createClient(
    supabaseUrl || '',
    supabaseAnonKey || ''
);

// Fix __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface SitemapUrl {
    loc: string;
    lastmod?: string;
    changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
    priority?: number;
}

async function generateSitemap() {
    try {
        console.log('Fetching companies from Supabase...');

        // Fetch all active companies
        const { data: companies, error } = await supabase
            .from('companies')
            .select('slug, created_at')
            .eq('status', 'approved');

        if (error) {
            throw new Error(`Error fetching companies: ${error.message}`);
        }

        console.log(`Found ${companies?.length || 0} companies`);

        // Fetch all active services
        const { data: services, error: servicesError } = await supabase
            .from('services')
            .select('id, created_at')
            .eq('is_active', true);

        if (servicesError) {
            throw new Error(`Error fetching services: ${servicesError.message}`);
        }

        console.log(`Found ${services?.length || 0} services`);

        // Base URLs - Prefer environment variable, fallback to production domain
        const baseUrl = process.env.VITE_SITE_URL || 'https://contrattoex.com';
        const urls: SitemapUrl[] = [
            {
                loc: `${baseUrl}/`,
                changefreq: 'daily',
                priority: 1.0,
                lastmod: new Date().toISOString().split('T')[0]
            },
            {
                loc: `${baseUrl}/empresas`,
                changefreq: 'daily',
                priority: 0.9
            },
            {
                loc: `${baseUrl}/para-empresas`,
                changefreq: 'weekly',
                priority: 0.7
            },
            {
                loc: `${baseUrl}/sobre`,
                changefreq: 'monthly',
                priority: 0.6
            },
            {
                loc: `${baseUrl}/contato`,
                changefreq: 'monthly',
                priority: 0.6
            },
            {
                loc: `${baseUrl}/ajuda`,
                changefreq: 'monthly',
                priority: 0.5
            },
            {
                loc: `${baseUrl}/privacidade`,
                changefreq: 'yearly',
                priority: 0.3
            },
            {
                loc: `${baseUrl}/termos`,
                changefreq: 'yearly',
                priority: 0.3
            },
            {
                loc: `${baseUrl}/auth/login`,
                changefreq: 'monthly',
                priority: 0.4
            },
            {
                loc: `${baseUrl}/auth/register`,
                changefreq: 'monthly',
                priority: 0.4
            },
            {
                loc: `${baseUrl}/empresa/cadastro`,
                changefreq: 'monthly',
                priority: 0.8
            }
        ];

        // Add company pages
        if (companies) {
            companies.forEach((company) => {
                urls.push({
                    loc: `${baseUrl}/empresa/${company.slug}`,
                    lastmod: company.created_at ? new Date(company.created_at).toISOString().split('T')[0] : undefined,
                    changefreq: 'weekly',
                    priority: 0.9
                });
            });
        }

        // Add service pages
        if (services) {
            services.forEach((service) => {
                const dateToUse = service.created_at;
                urls.push({
                    loc: `${baseUrl}/servico/${service.id}`,
                    lastmod: dateToUse ? new Date(dateToUse).toISOString().split('T')[0] : undefined,
                    changefreq: 'weekly',
                    priority: 0.8
                });
            });
        }

        // Generate XML
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url.loc}</loc>${url.lastmod ? `
    <lastmod>${url.lastmod}</lastmod>` : ''}${url.changefreq ? `
    <changefreq>${url.changefreq}</changefreq>` : ''}${url.priority !== undefined ? `
    <priority>${url.priority}</priority>` : ''}
  </url>`).join('\n')}
</urlset>`;

        // Write to public folder inside apps/web
        const sitemapPath = path.join(__dirname, '..', 'apps', 'web', 'public', 'sitemap.xml');
        fs.writeFileSync(sitemapPath, xml, 'utf-8');

        console.log(`✅ Sitemap generated successfully with ${urls.length} URLs`);
        console.log(`📁 Saved to: ${sitemapPath}`);

        return xml;
    } catch (error) {
        console.error('❌ Error generating sitemap:', error);
        throw error;
    }
}

// Run if called directly
const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);

if (isMainModule) {
    generateSitemap()
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

export { generateSitemap };
