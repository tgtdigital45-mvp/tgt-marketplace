import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://zdtowekfpreedvhxyydo.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkdG93ZWtmcHJlZWR2aHh5eWRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NTQ3NzQsImV4cCI6MjA4ODIzMDc3NH0.KTYOjq7kKqUOSKznEqHwgvkYYlmhrntjUqE90nf6eQs';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const companiesToCreate = [
    { city: 'Foz do Iguaçu', name: 'Serviços Iguaçu', email: 'foz1@contratto.app', lat: -25.5401, lng: -54.5822 },
    { city: 'Foz do Iguaçu', name: 'Manutenção Cataratas', email: 'foz2@contratto.app', lat: -25.5451, lng: -54.5852 },
    { city: 'Cascavel', name: 'Cascavel Tech', email: 'cascavel1@contratto.app', lat: -24.9573, lng: -53.4590 },
    { city: 'Cascavel', name: 'Oeste Reparos', email: 'cascavel2@contratto.app', lat: -24.9623, lng: -53.4640 },
    { city: 'Londrina', name: 'Londrina Clean', email: 'londrina1@contratto.app', lat: -23.3103, lng: -51.1628 },
    { city: 'Londrina', name: 'Pé Vermelho Construções', email: 'londrina2@contratto.app', lat: -23.3153, lng: -51.1678 },
    { city: 'Maringá', name: 'Maringá Jardins', email: 'maringa1@contratto.app', lat: -23.4205, lng: -51.9333 },
    { city: 'Maringá', name: 'Cidade Canção Pinturas', email: 'maringa2@contratto.app', lat: -23.4255, lng: -51.9383 },
    { city: 'Toledo', name: 'Toledo Reformas', email: 'toledo1@contratto.app', lat: -24.7291, lng: -53.7431 },
    { city: 'Toledo', name: 'Oeste Serviços', email: 'toledo2@contratto.app', lat: -24.7341, lng: -53.7481 },
];

async function seed() {
    console.log('Iniciando seed de empresas...');

    for (const comp of companiesToCreate) {
        const password = 'SenhaForte123!';
        console.log(`\nCriando: ${comp.name} (${comp.email})`);

        // Logout previous explicitely just in case
        await supabase.auth.signOut();

        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: comp.email,
            password: password,
            options: {
                data: { full_name: comp.name }
            }
        });

        if (authError) {
            console.error('Erro ao registrar usuário:', authError.message);
            continue;
        }

        if (!authData.session) {
            console.error('Aviso: E-mail confirmation requirido. A sessão é nula. Não é possível inserir a empresa devido ao RLS.');
            console.error('Por favor, desabilite "Confirm Email" temporariamente no dashboard do Supabase, ou crie via dashboard as empresas.');
            return;
        }

        // Insert company
        const { error: companyError } = await supabase.from('companies').insert({
            owner_id: authData.user.id,
            business_name: comp.name,
            address_city: comp.city,
            address_state: 'PR',
            lat: comp.lat,
            lng: comp.lng,
            logo_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(comp.name)}&background=random`,
            cover_url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800'
        });

        if (companyError) {
            console.error('Erro ao criar empresa:', companyError.message);
        } else {
            console.log('✅ Empresa criada com sucesso.');
        }
    }

    console.log('\nSeed finalizado!');
    console.log('As senhas das empresas criadas são: SenhaForte123!');
}

seed();
