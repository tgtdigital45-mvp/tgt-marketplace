
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUser() {
    const email = 'gabiilorenzii@gmail.com';
    console.log(`Checking user: ${email}`);

    // 1. Get User ID from Profile (since we can't query auth.users directly with client key usually, but let's try or query profiles)
    // Profiles table usually has id and email if exposed, or we just trust the email filter if column exists.
    // Actually, profiles usually key off 'id'. We need to search by email if possible.
    // If profiles doesn't have email, we might be stuck without service role key.
    // Let's assume 'profiles' has 'email' or we can't do step 1 easily without service role.
    // HOWEVER, the user asked to "search ID of user in table 'profiles'".

    // Let's try to find in profiles by email (if column exists)
    const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email);

    if (profileError) {
        console.error('Error fetching profile:', profileError);
    } else {
        console.log('Profiles found:', profiles);
    }

    if (!profiles || profiles.length === 0) {
        console.log("No profile found with that email. Attempts with companies might fail if we don't have the ID.");
        return;
    }

    const userId = profiles[0].id;
    console.log(`User ID: ${userId}`);

    // 2. Check Company
    const { data: companies, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('profile_id', userId);

    if (companyError) {
        console.error('Error fetching company:', companyError);
    } else {
        console.log('Companies found:', companies);
    }
}

checkUser();
