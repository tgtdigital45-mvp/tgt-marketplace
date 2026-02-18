
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import * as h3 from 'h3-js';

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

const TEST_CLIENT = {
    email: 'cliente_teste@tgt.com',
    password: 'password123',
    metadata: {
        name: 'Pedro Cliente',
        type: 'client',
        avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150&h=150'
    }
};

const TEST_COMPANY = {
    email: 'empresa_teste@tgt.com',
    password: 'password123',
    metadata: {
        name: 'Target Soluções',
        type: 'company',
        avatar_url: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&q=80&w=150&h=150'
    }
};

// Cascavel, PR Center Coords
const LAT = -24.9558;
const LNG = -53.4552;
const H3_INDEX = h3.latLngToCell(LAT, LNG, 8);

async function seed() {
    console.log('🚀 Starting seed process (with UI visibility fixes)...');
    console.log(`📍 Calculated H3 Index for Cascavel: ${H3_INDEX}`);

    // 1. Create/Ensure Client User
    console.log(`Ensuring Client: ${TEST_CLIENT.email}...`);
    await supabase.auth.signUp({
        email: TEST_CLIENT.email,
        password: TEST_CLIENT.password,
        options: { data: TEST_CLIENT.metadata }
    });
    console.log('✅ Client auth ready.');

    // 2. Create/Ensure Company User
    console.log(`Ensuring Company User: ${TEST_COMPANY.email}...`);
    await supabase.auth.signUp({
        email: TEST_COMPANY.email,
        password: TEST_COMPANY.password,
        options: { data: TEST_COMPANY.metadata }
    });

    // 3. Explicitly Sign In as Company User
    console.log('Signing in as Company User...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: TEST_COMPANY.email,
        password: TEST_COMPANY.password
    });

    if (signInError) {
        console.error('❌ Sign-in failed:', signInError.message);
        process.exit(1);
    }

    const companyUserId = signInData.user.id;
    console.log('✅ Signed in. User ID:', companyUserId);

    // 4. Create Company Record
    console.log('Inserting Company record (status="approved")...');
    const slug = 'target-solucoes';
    const { error: companyError } = await supabase.from('companies').upsert({
        profile_id: companyUserId,
        slug: slug,
        company_name: TEST_COMPANY.metadata.name,
        legal_name: 'Target Soluções Digitais LTDA',
        cnpj: '99888777000166',
        email: TEST_COMPANY.email,
        phone: '45988887777',
        category: 'Marketing', // Match CATEGORIES constant
        description: 'A Target Soluções é líder em estratégias digitais de alta performance, ajudando empresas a escalarem seus resultados através de tráfego pago, SEO e inbound marketing.',
        status: 'approved', // IMPORTANT: RPC require 'approved'
        h3_index: H3_INDEX,
        address: {
            street: 'Avenida Brasil, 5000',
            number: '5000',
            district: 'Centro',
            city: 'Cascavel',
            state: 'PR',
            cep: '85812-001',
            latitude: LAT,
            longitude: LNG
        },
        logo_url: TEST_COMPANY.metadata.avatar_url,
        cover_image_url: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=1200&h=400',
        admin_contact: {
            name: 'Pedro Gerente',
            phone: '45988887777',
            email: 'admin@target.com'
        }
    }, { onConflict: 'slug' });

    if (companyError) {
        console.error('Error upserting company:', companyError);
    } else {
        console.log('✅ Company record ready.');
    }

    const { data: companyRecord } = await supabase
        .from('companies')
        .select('id')
        .eq('slug', slug)
        .single();

    if (!companyRecord) {
        console.error('❌ Could not find company record.');
        process.exit(1);
    }

    // 5. Assign owner
    const { error: roleError } = await supabase.from('team_members').upsert({
        company_id: companyRecord.id,
        user_id: companyUserId,
        role: 'owner'
    }, { onConflict: 'company_id,user_id' });

    if (roleError) console.error('Error assigning owner role:', roleError);

    // 6. Create Services
    console.log('Inserting Services (with h3_index and is_active=true)...');
    const services = [
        {
            company_id: companyRecord.id,
            title: 'Gestão de Tráfego Pago (Google & Meta Ads)',
            description: 'Gestão completa das suas campanhas de anúncios para maximizar o ROI e atrair clientes qualificados diariamente.',
            category_tag: 'Marketing',
            service_type: 'remote',
            starting_price: 1500,
            image_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800',
            is_active: true,
            h3_index: H3_INDEX,
            packages: {
                basic: {
                    name: 'Basic',
                    price: 1500,
                    delivery_time: 30,
                    revisions: 2,
                    description: 'Gestão de 1 canal de anúncios.',
                    features: ['Setup de conta', 'Relatório mensal']
                }
            }
        },
        {
            company_id: companyRecord.id,
            title: 'SEO & Otimização de Busca',
            description: 'Coloque seu site na primeira página do Google organicamente.',
            category_tag: 'SEO',
            service_type: 'remote',
            starting_price: 2000,
            image_url: 'https://images.unsplash.com/photo-1562577309-4932fdd64cd1?auto=format&fit=crop&q=80&w=800',
            is_active: true,
            h3_index: H3_INDEX,
            packages: {
                basic: {
                    name: 'Basic',
                    price: 2000,
                    delivery_time: 45,
                    revisions: 1,
                    description: 'Auditoria técnica.',
                    features: ['Pesquisa de Keywords']
                }
            }
        }
    ];

    for (const service of services) {
        const { data: existingSrv } = await supabase.from('services')
            .select('id').eq('title', service.title).eq('company_id', companyRecord.id).maybeSingle();

        if (!existingSrv) {
            await supabase.from('services').insert(service);
        } else {
            console.log(`Service ${service.title} already exists. Updating...`);
            await supabase.from('services').update(service).eq('id', existingSrv.id);
        }
    }
    console.log('✅ Services ready.');

    // 7. Portfolio
    const portfolio = [
        {
            company_id: companyRecord.id,
            image_url: 'https://images.unsplash.com/photo-1551288049-bbbda536339a?auto=format&fit=crop&q=80&w=800',
            title: 'Dashboard de Resultados',
            description: 'Implementação de métricas.'
        }
    ];

    for (const item of portfolio) {
        const { data: existingPrt } = await supabase.from('portfolio_items')
            .select('id').eq('image_url', item.image_url).eq('company_id', companyRecord.id).maybeSingle();

        if (!existingPrt) {
            await supabase.from('portfolio_items').insert(item);
        } else {
            await supabase.from('portfolio_items').update(item).eq('id', existingPrt.id);
        }
    }
    console.log('✅ Portfolio ready.');

    console.log('\n✨ Seed process completed successfully!');
    console.log('-------------------------------------------');
    console.log('CREDENTIALS:');
    console.log(`CLIENT: ${TEST_CLIENT.email} / ${TEST_CLIENT.password}`);
    console.log(`COMPANY: ${TEST_COMPANY.email} / ${TEST_COMPANY.password}`);
    console.log('-------------------------------------------');
}

seed().catch(err => {
    console.error('Unexpected error during seed:', err);
    process.exit(1);
});
