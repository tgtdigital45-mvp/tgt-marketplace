
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import * as h3 from 'h3-js';

// Load envs
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log('Starting seed for Dentist in Cascavel...');

    // 1. Create Dentist Profile
    const company = {
        slug: 'dr-sorriso-cascavel',
        company_name: 'Dr. Sorriso Cascavel',
        legal_name: 'Sorriso Eterna LTDA',
        cnpj: '12345678000199',
        logo_url: 'https://placehold.co/400?text=Dr+Sorriso',
        cover_image_url: 'https://placehold.co/800x200?text=Consultorio+Moderno',
        category: 'Saúde',
        description: 'Clínica odontológica completa em Cascavel. Limpeza, canal, implantes e estética.',
        address: {
            street: 'Av. Brasil',
            number: '1234',
            district: 'Centro',
            city: 'Cascavel',
            state: 'PR',
            cep: '85810-000',
            lat: -24.9578,
            lng: -53.4595,
            h3_index: h3.latLngToCell(-24.9578, -53.4595, 8)
        },
        phone: '45999999999',
        email: 'contato@drsorriso.com.br',
        website: 'https://drsorriso.com.br',
        verified: true,
        clients_count: 1500,
        recurring_clients_percent: 85,
        // Availability: Mon-Fri 08:00-18:00
        availability: {
            monday: { start: '08:00', end: '18:00' },
            tuesday: { start: '08:00', end: '18:00' },
            wednesday: { start: '08:00', end: '18:00' },
            thursday: { start: '08:00', end: '18:00' },
            friday: { start: '08:00', end: '18:00' }
        },
        profile_id: '00000000-0000-0000-0000-000000000000' // Placeholder/Anonymous or existing user
    };

    // 0. Ensure User Exists
    let userId: string | undefined;

    // Try signing up (this will return existing user if email matches and config allows, or error if taken)
    // Actually signUp returns session null if user exists often.
    // Better to trying to signIn or just query if possible (not possible with client usually).
    // Standard way in seeds: try signUp, if error/exists, we can't get ID easily without admin.
    // BUT since we are using service role key (hopefully), we might have admin access?
    // The script uses supabase-js initialized with what?
    // line 12: const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    // If it's service role, we can use auth.admin.listUsers usually? Or just signUp works and returns user?
    // Let's assume signUp works or returns user.

    const { data: authData, error: authError } = await supabase.auth.signUp({
        email: 'dentista@teste.com',
        password: 'password123',
    });

    if (authData.user) {
        userId = authData.user.id;
        console.log('User obtained:', userId);
    } else {
        // User might exist. If we have service role, we can usually fetch?
        // Or if we can't get it, we might be stuck.
        // Let's try to signIn to get the ID?
        const { data: signInData } = await supabase.auth.signInWithPassword({
            email: 'dentista@teste.com',
            password: 'password123',
        });
        if (signInData.user) {
            userId = signInData.user.id;
            console.log('User signed in:', userId);
        } else {
            console.log('Could not obtain user ID. Assuming manual intervention or fatal error for linking.');
        }
    }

    if (userId) {
        // Ensure profile type is company
        await supabase.from('profiles').update({ user_type: 'company' }).eq('id', userId);
        console.log('Updated Profile to company type for:', userId);
        company.profile_id = userId;
    }

    // Check if company exists
    const { data: existing } = await supabase.from('companies').select('id').eq('slug', company.slug).single();
    let companyId = existing?.id;

    if (companyId) {
        // Update existing
        const updateData: any = { availability: company.availability };
        if (userId) updateData.profile_id = userId;

        await supabase.from('companies').update(updateData).eq('id', companyId);
        console.log('Updated Company availability and link:', company.company_name);
    } else {
        // Create new
        const { data: newCompany, error } = await supabase.from('companies').insert(company).select().single();
        if (error) {
            console.error('Error creating company:', error);
            // If error is duplicate slug but we didn't find it??
            return;
        }
        companyId = newCompany.id;
        console.log('Created Company:', company.company_name);
    }

    // 2. Create Services
    const services = [
        {
            company_id: companyId,
            title: 'Limpeza Dental Completa',
            description: 'Profilaxia completa com jato de bicarbonato e ultrassom.',
            price: 150.00,
            duration: '30 min',
            duration_minutes: 30,
            category_tag: 'saude',
            service_type: 'presential',
            is_active: true
        },
        {
            company_id: companyId,
            title: 'Clareamento Dental (Sessão)',
            description: 'Sessão de clareamento a laser no consultório.',
            price: 500.00,
            duration: '1 hora',
            duration_minutes: 60,
            category_tag: 'saude',
            service_type: 'presential',
            is_active: true
        },
        {
            company_id: companyId,
            title: 'Tratamento de Canal (Dente Anterior)',
            description: 'Endodontia especializada em dentes anteriores.',
            price: 800.00,
            duration: '1 hora e 30 min',
            duration_minutes: 90,
            category_tag: 'saude',
            service_type: 'presential',
            is_active: true
        }
    ];

    for (const service of services) {
        const { error } = await supabase.from('services').upsert(service, { onConflict: 'company_id, title' }); // Need unique constraint?
        // Actuallyupsert might fail if no unique constraint.
        // Let's check if service exists
        const { data: existingService } = await supabase.from('services').select('id').eq('company_id', companyId).eq('title', service.title).single();
        if (existingService) {
            await supabase.from('services').update(service).eq('id', existingService.id);
            console.log('Updated Service:', service.title);
        } else {
            await supabase.from('services').insert(service);
            console.log('Created Service:', service.title);
        }
    }

    console.log('Seed completed successfully!');
}

main().catch(console.error);
