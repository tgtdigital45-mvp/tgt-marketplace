
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

async function checkSpecificCompany() {
    console.log('Checking specific company services...');

    // Get company ID for 'agencia-volt-digital'
    const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('id, slug')
        .eq('slug', 'agencia-volt-digital')
        .single();

    if (companyError) {
        console.error('Error fetching company:', companyError);
        return;
    }

    console.log(`Company found: ${company.slug} (${company.id})`);

    // Check services for this company (active and inactive)
    const { data: services, error: servicesError } = await supabase
        .from('services')
        .select('id, title, is_active')
        .eq('company_id', company.id);

    if (servicesError) console.error('Error fetching services:', servicesError);
    else {
        console.log(`Services found: ${services.length}`);
        services.forEach(s => console.log(`- ${s.title} [Active: ${s.is_active}]`));
    }
}

checkSpecificCompany();
