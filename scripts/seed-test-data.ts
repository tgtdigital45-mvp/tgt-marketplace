
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;


if (!supabaseUrl || !supabaseKey) {
    console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedUser() {
    const email = 'example@gmail.com';
    const password = 'password123';
    const name = 'Test User';

    console.log(`Seeding user: ${email}...`);

    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name,
                    type: 'client',
                },
            },
        });

        if (error) {
            if (error.message.includes('already registered')) {
                console.log(`User ${email} already exists. Skipping.`);
                // Ideally we would ensure the password is known, but without admin API we can't force reset easily here without service role
                // Assuming test environment is relatively stable or manual reset if needed.
            } else {
                console.error("Error creating user:", error);
            }
        } else {
            if (data.user) {
                console.log(`User ${email} created successfully. ID: ${data.user.id}`);
            } else {
                console.log(`User signup request sent. Verify email if confirmation is enabled.`);
            }
        }

    } catch (err) {
        console.error("Unexpected error:", err);
    }
}

seedUser();
