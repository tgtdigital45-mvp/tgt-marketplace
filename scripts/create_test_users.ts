
import { createClient, User } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env or .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const COMPANY_USER = {
    email: 'empresa_teste_01@tgt.com',
    password: 'password123',
    metadata: {
        name: 'Empresa Teste LTDA',
        type: 'company',
        avatar_url: 'https://via.placeholder.com/150'
    }
};

const CLIENT_USER = {
    email: 'cliente_teste_01@tgt.com',
    password: 'password123',
    metadata: {
        name: 'Cliente Teste Silva',
        type: 'client',
        avatar_url: 'https://via.placeholder.com/150'
    }
};

async function createCompany() {
    console.log('Creating Company User...');
    const { data, error } = await supabase.auth.signUp({
        email: COMPANY_USER.email,
        password: COMPANY_USER.password,
        options: {
            data: COMPANY_USER.metadata
        }
    });

    if (error) {
        if (error.message.includes('already registered')) {
            console.log('Company user already exists. Trying to log in to update data...');
            const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
                email: COMPANY_USER.email,
                password: COMPANY_USER.password
            });
            if (loginError) {
                console.error('Login failed:', loginError.message);
                return;
            }
            return updateCompanyData(loginData.user);
        }
        console.error('Error creating company user:', error.message);
        return;
    }

    if (data.user) {
        console.log('Company user created:', data.user.id);
        await updateCompanyData(data.user);
    } else {
        console.log('User creation pending (check email confirmation).');
    }
}

async function updateCompanyData(user: User) {
    if (!user) return;

    console.log('Inserting Company Data...');

    // Check if company record exists
    const { data: existing } = await supabase
        .from('companies')
        .select('id')
        .eq('profile_id', user.id)
        .single();

    if (existing) {
        console.log('Company record already exists.');
        return;
    }

    const { error } = await supabase.from('companies').insert({
        profile_id: user.id,
        company_name: COMPANY_USER.metadata.name,
        legal_name: COMPANY_USER.metadata.name,
        cnpj: '12345678000199',
        slug: 'empresa-teste-ltda',
        category: 'Consultoria',
        description: 'Uma empresa de teste completa para validação do marketplace. Especializada em soluções digitais e consultoria estratégica.',
        phone: '45999999999',
        website: 'https://tgt.com',
        status: 'approved',
        address: {
            street: 'Rua Teste, 123',
            city: 'Cascavel',
            state: 'PR',
            zip: '85800000'
        },
        admin_contact: {
            name: 'Admin Teste',
            phone: '45999999999',
            email: 'admin@tgt.com'
        },
        logo_url: 'https://via.placeholder.com/150',
        cover_image_url: 'https://via.placeholder.com/800x200'
    });

    if (error) {
        console.error('Error inserting company data:', error.message);
    } else {
        console.log('Company data inserted successfully.');
    }
}

async function createClientUser() {
    console.log('Creating Client User...');
    const { data, error } = await supabase.auth.signUp({
        email: CLIENT_USER.email,
        password: CLIENT_USER.password,
        options: {
            data: CLIENT_USER.metadata
        }
    });

    if (error) {
        if (error.message.includes('already registered')) {
            console.log('Client user already exists.');
            return;
        }
        console.error('Error creating client user:', error.message);
        return;
    }

    if (data.user) {
        console.log('Client user created:', data.user.id);
    } else {
        console.log('Client user creation pending.');
    }
}

async function main() {
    await createCompany();
    console.log('-------------------');
    await createClientUser();
    console.log('Done.');
}

main();
