
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Fix dotenv path if needed, assuming running from root
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCompanyVisibility() {
    const email = 'gabiilorenzii@gmail.com'; // User from previous context
    console.log(`Checking status for user: ${email}`);

    // 1. Get Profile ID
    const { data: profiles } = await supabase.from('profiles').select('id, user_type').eq('email', email);

    if (!profiles || profiles.length === 0) {
        console.error("Profile not found");
        return;
    }

    const userId = profiles[0].id;
    console.log("User ID:", userId);

    // 2. Check Company Record
    const { data: companies, error } = await supabase
        .from('companies')
        .select('*')
        .eq('profile_id', userId);

    if (error) {
        console.error("Error fetching company:", error);
        return;
    }

    if (companies.length === 0) {
        console.log("No company record found for this profile.");
    } else {
        const company = companies[0];
        console.log("Company Found:", {
            id: company.id,
            name: company.company_name,
            status: company.status,
            is_verified: company.is_verified,
            plan_tier: company.plan_tier,
            profile_id: company.profile_id
        });

        if (company.status !== 'active') {
            console.warn("WARNING: Company status is not 'active'. It checks for 'active' usually.");
        }
    }
}

checkCompanyVisibility();
