
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing env vars: VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkCounts() {
    console.log('Checking database counts...');

    const { count: companiesCount, error: companiesError } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true });

    if (companiesError) console.error('Error counting companies:', companiesError);
    else console.log(`Companies count: ${companiesCount}`);

    const { count: servicesCount, error: servicesError } = await supabase
        .from('services')
        .select('*', { count: 'exact', head: true });

    if (servicesError) console.error('Error counting services:', servicesError);
    else console.log(`Services count: ${servicesCount}`);

    // Check specific company names if any
    const { data: companies, error: listError } = await supabase
        .from('companies')
        .select('company_name, slug, status')
        .limit(10);

    if (listError) console.error('Error listing companies:', listError);
    else {
        console.log('Sample companies:', companies);
    }
}

checkCounts();
