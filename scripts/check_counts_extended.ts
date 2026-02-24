
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkExtended() {
    console.log('Checking database extended...');

    // 1. Check services with company details
    // Mimic the query in useServicesMarketplace fallback
    console.log('\n--- Service Query Simulation (Fallback) ---');
    const { data: services, error: servicesError } = await supabase
        .from('services')
        .select(`
            id,
            title,
            is_active,
            company_id,
            companies!inner (
                slug,
                status
            )
        `)
        .eq('is_active', true)
        .limit(10);

    if (servicesError) console.error('Error fetching services:', servicesError);
    else {
        console.log(`Found ${services.length} services (limit 10). First few:`);
        services.slice(0, 3).forEach(s => console.log(`- ${s.title} (Active: ${s.is_active}). Company: ${(s.companies as any)?.slug}, Status: ${(s.companies as any)?.status}`));
    }

    // 2. Check companies with search logic simulation
    console.log('\n--- Company Query Simulation ---');
    const { data: companies, error: companiesError } = await supabase
        .from('companies')
        .select('company_name, slug, status, category, address')
        .eq('status', 'approved')
        .limit(10);

    if (companiesError) console.error('Error fetching companies:', companiesError);
    else {
        console.log(`Found ${companies.length} approved companies (limit 10). First few:`);
        companies.slice(0, 3).forEach(c => console.log(`- ${c.company_name} (${c.slug}) - Cat: ${c.category}, City: ${c.address?.city}`));
    }

    // 3. Check for specific company "Target Soluções"
    console.log('\n--- Check Target Soluções ---');
    const { data: target, error: targetError } = await supabase
        .from('companies')
        .select('*')
        .ilike('company_name', '%Target%');

    if (targetError) console.error('Error finding Target:', targetError);
    else {
        console.log('Target Soluções found:', target?.length);
        if (target && target.length > 0) console.log(target[0].slug, target[0].status);
    }
}

checkExtended();
