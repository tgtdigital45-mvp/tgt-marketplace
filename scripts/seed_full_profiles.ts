
import { createClient } from '@supabase/supabase-js';
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

async function seed() {
    console.log('🚀 Starting seed process...');

    // 1. Create Client User
    console.log(`Creating Client: ${TEST_CLIENT.email}...`);
    const { data: clientAuth, error: clientAuthError } = await supabase.auth.signUp({
        email: TEST_CLIENT.email,
        password: TEST_CLIENT.password,
        options: { data: TEST_CLIENT.metadata }
    });

    if (clientAuthError && !clientAuthError.message.includes('already registered')) {
        console.error('Error creating client auth:', clientAuthError.message);
    } else {
        console.log('✅ Client auth ready.');
    }

    // 2. Create Company User
    console.log(`Creating Company User: ${TEST_COMPANY.email}...`);
    const { data: companyAuth, error: companyAuthError } = await supabase.auth.signUp({
        email: TEST_COMPANY.email,
        password: TEST_COMPANY.password,
        options: { data: TEST_COMPANY.metadata }
    });

    let companyUserId = companyAuth.user?.id;

    if (companyAuthError) {
        if (companyAuthError.message.includes('already registered')) {
            console.log('Company user already exists. Fetching ID...');
            // We can't easily get the ID without admin API or searching profiles if auth.signUp fails
            // Let's try to get it from profiles table
            const { data: profile } = await supabase
                .from('profiles')
                .select('id')
                .eq('full_name', TEST_COMPANY.metadata.name)
                .maybeSingle();
            companyUserId = profile?.id;
        } else {
            console.error('Error creating company auth:', companyAuthError.message);
        }
    }

    if (!companyUserId) {
        console.error('❌ Could not determine Company User ID. Seed aborted.');
        process.exit(1);
    }

    console.log('✅ Company auth ready. ID:', companyUserId);

    // 3. Create Company Record
    console.log('Inserting Company record...');
    const slug = 'target-solucoes';
    const { error: companyError } = await supabase.from('companies').upsert({
        profile_id: companyUserId,
        slug: slug,
        company_name: TEST_COMPANY.metadata.name,
        legal_name: 'Target Soluções Digitais LTDA',
        cnpj: '99888777000166',
        email: TEST_COMPANY.email,
        phone: '45988887777',
        category: 'Marketing Digital',
        description: 'A Target Soluções é líder em estratégias digitais de alta performance, ajudando empresas a escalarem seus resultados através de tráfego pago, SEO e inbound marketing.',
        status: 'active',
        verified: true,
        level: 'Pro',
        address: {
            street: 'Avenida Brasil, 5000',
            number: '5000',
            district: 'Centro',
            city: 'Cascavel',
            state: 'PR',
            cep: '85812-001'
        },
        logo_url: TEST_COMPANY.metadata.avatar_url,
        cover_image_url: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=1200&h=400'
    }, { onConflict: 'slug' });

    if (companyError) {
        console.error('Error upserting company:', companyError.message);
    } else {
        console.log('✅ Company record ready.');
    }

    // Get company ID for foreign keys
    const { data: companyRecord } = await supabase
        .from('companies')
        .select('id')
        .eq('slug', slug)
        .single();

    if (!companyRecord) {
        console.error('❌ Could not find company record.');
        process.exit(1);
    }

    // 4. Create Services
    console.log('Inserting Services...');
    const services = [
        {
            company_id: companyRecord.id,
            title: 'Gestão de Tráfego Pago (Google & Meta Ads)',
            description: 'Gestão completa das suas campanhas de anúncios para maximizar o ROI e atrair clientes qualificados diariamente.',
            category_tag: 'Marketing',
            service_type: 'remote',
            starting_price: 1500,
            image_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800',
            packages: {
                basic: {
                    name: 'Basic',
                    price: 1500,
                    delivery_time: 30,
                    revisions: 2,
                    description: 'Gestão de 1 canal de anúncios (apenas Google ou Meta).',
                    features: ['Setup de conta', 'Relatório mensal', 'Monitoramento diário']
                },
                standard: {
                    name: 'Standard',
                    price: 2500,
                    delivery_time: 30,
                    revisions: -1,
                    description: 'Gestão de 2 canais de anúncios + Dashboard em tempo real.',
                    features: ['Setup de conta', 'Relatório quinzenal', 'Dashboard Looker Studio', 'A/B Testing']
                }
            }
        },
        {
            company_id: companyRecord.id,
            title: 'SEO & Otimização de Busca',
            description: 'Coloque seu site na primeira página do Google organicamente e atraia tráfego gratuito e constante.',
            category_tag: 'SEO',
            service_type: 'remote',
            starting_price: 2000,
            image_url: 'https://images.unsplash.com/photo-1562577309-4932fdd64cd1?auto=format&fit=crop&q=80&w=800',
            packages: {
                basic: {
                    name: 'Basic',
                    price: 2000,
                    delivery_time: 45,
                    revisions: 1,
                    description: 'Auditoria técnica + Otimização On-page de 5 páginas.',
                    features: ['Pesquisa de Keywords', 'Otimização de Meta Tags', 'Auditoria Técnica']
                }
            }
        }
    ];

    for (const service of services) {
        const { error: srvError } = await supabase.from('services').upsert(service, { onConflict: 'title,company_id' });
        if (srvError) console.error(`Error inserting service ${service.title}:`, srvError.message);
    }
    console.log('✅ Services ready.');

    // 5. Create Portfolio Items
    console.log('Inserting Portfolio Items...');
    const portfolio = [
        {
            company_id: companyRecord.id,
            image_url: 'https://images.unsplash.com/photo-1551288049-bbbda536339a?auto=format&fit=crop&q=80&w=800',
            caption: 'Dashboard de Resultados - Cliente E-commerce'
        },
        {
            company_id: companyRecord.id,
            image_url: 'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&q=80&w=800',
            caption: 'Equipe de Estratégia em Planejamento'
        }
    ];

    for (const item of portfolio) {
        await supabase.from('portfolio_items').upsert(item, { onConflict: 'image_url,company_id' });
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
