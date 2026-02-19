/**
 * seed_h3_test_data.ts
 *
 * Popula o banco TGT com 50 empresas de teste do Paraná.
 * Valida a lógica de geolocalização H3 e a interface (abas Empresas e Serviços).
 *
 * Uso: npx tsx scripts/seed_h3_test_data.ts
 *
 * Pré-requisito: Adicionar SUPABASE_SERVICE_ROLE_KEY ao .env
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import * as h3 from 'h3-js';

// ─── Config ──────────────────────────────────────────────────────────
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Variáveis de ambiente faltando.');
    console.error('   Certifique-se de ter no .env:');
    console.error('   - VITE_SUPABASE_URL');
    console.error('   - SUPABASE_SERVICE_ROLE_KEY');
    console.error('');
    console.error('   A SERVICE_ROLE_KEY pode ser encontrada em:');
    console.error('   Supabase Dashboard → Settings → API → service_role (secret)');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
});

// ─── Constants ───────────────────────────────────────────────────────
const DEFAULT_PASSWORD = 'Teste@123456';
const H3_RESOLUTION = 8;

// ─── Paraná Cities with Real Coordinates ─────────────────────────────
interface CityCoord {
    city: string;
    lat: number;
    lng: number;
    cep: string;
}

const PR_CITIES: CityCoord[] = [
    { city: 'Curitiba', lat: -25.4284, lng: -49.2733, cep: '80010-000' },
    { city: 'Londrina', lat: -23.3105, lng: -51.1628, cep: '86010-000' },
    { city: 'Maringá', lat: -23.4205, lng: -51.9333, cep: '87010-000' },
    { city: 'Cascavel', lat: -24.9558, lng: -53.4552, cep: '85810-000' },
    { city: 'Ponta Grossa', lat: -25.0994, lng: -50.1583, cep: '84010-000' },
    { city: 'Foz do Iguaçu', lat: -25.5163, lng: -54.5854, cep: '85851-000' },
    { city: 'Guarapuava', lat: -25.3935, lng: -51.4614, cep: '85010-000' },
    { city: 'Paranaguá', lat: -25.5161, lng: -48.5225, cep: '83203-000' },
    { city: 'Toledo', lat: -24.7247, lng: -53.7433, cep: '85900-000' },
    { city: 'Francisco Beltrão', lat: -26.0822, lng: -53.0522, cep: '85601-000' },
    { city: 'Umuarama', lat: -23.7647, lng: -53.3250, cep: '87501-000' },
    { city: 'Campo Mourão', lat: -24.0461, lng: -52.3828, cep: '87302-000' },
    { city: 'Apucarana', lat: -23.5528, lng: -51.4606, cep: '86800-000' },
    { city: 'Arapongas', lat: -23.3531, lng: -51.4242, cep: '86700-000' },
    { city: 'Colombo', lat: -25.2917, lng: -49.2243, cep: '83414-000' },
    { city: 'São José dos Pinhais', lat: -25.5316, lng: -49.2078, cep: '83005-000' },
];

// ─── Company Templates ───────────────────────────────────────────────
interface CompanyTemplate {
    companyName: string;
    legalName: string;
    cnpj: string;
    category: string;
    description: string;
    cityIndex: number; // index into PR_CITIES
    phone: string;
}

const CATEGORIES = [
    'Marketing', 'Tecnologia', 'Design', 'Consultoria', 'Contabilidade',
    'Advocacia', 'Arquitetura', 'Fotografia', 'Educação', 'Saúde',
] as const;

function generateCNPJ(index: number): string {
    const base = String(10000000 + index).padStart(8, '0');
    return `${base}000199`;
}

function generatePhone(index: number): string {
    const num = String(900000000 + index * 137).slice(0, 9);
    return `41${num}`;
}

function slugify(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

const COMPANY_TEMPLATES: CompanyTemplate[] = [
    // Curitiba (8 empresas)
    { companyName: 'Agência Volt Digital', legalName: 'Volt Digital Ltda', cnpj: generateCNPJ(1), category: 'Marketing', description: 'Agência de marketing digital especializada em performance e growth hacking para startups e PMEs.', cityIndex: 0, phone: generatePhone(1) },
    { companyName: 'CodeBR Sistemas', legalName: 'CodeBR Soluções em TI Ltda', cnpj: generateCNPJ(2), category: 'Tecnologia', description: 'Desenvolvimento de sistemas web e mobile sob medida, com foco em escalabilidade.', cityIndex: 0, phone: generatePhone(2) },
    { companyName: 'Estúdio Criare', legalName: 'Criare Design EIRELI', cnpj: generateCNPJ(3), category: 'Design', description: 'Branding, identidade visual e design de experiência do usuário para empresas inovadoras.', cityIndex: 0, phone: generatePhone(3) },
    { companyName: 'ContaBem Assessoria', legalName: 'ContaBem Contabilidade SS', cnpj: generateCNPJ(4), category: 'Contabilidade', description: 'Escritório contábil completo: BPO financeiro, fiscal e departamento pessoal para PMEs.', cityIndex: 0, phone: generatePhone(4) },
    { companyName: 'Advocacia Paraná Sul', legalName: 'Teixeira & Souza Advogados', cnpj: generateCNPJ(5), category: 'Advocacia', description: 'Escritório de advocacia empresarial com expertise em direito digital e LGPD.', cityIndex: 0, phone: generatePhone(5) },
    { companyName: 'ArquiVerde Sustentável', legalName: 'ArquiVerde Projetos Ltda', cnpj: generateCNPJ(6), category: 'Arquitetura', description: 'Projetos arquitetônicos sustentáveis, certificação LEED e reformas verdes.', cityIndex: 0, phone: generatePhone(6) },
    { companyName: 'FotoArte CWB', legalName: 'FotoArte Produções Ltda', cnpj: generateCNPJ(7), category: 'Fotografia', description: 'Fotografia corporativa, de produtos e ensaios profissionais em Curitiba e região.', cityIndex: 0, phone: generatePhone(7) },
    { companyName: 'EduTech Paraná', legalName: 'EduTech Soluções Educacionais SA', cnpj: generateCNPJ(8), category: 'Educação', description: 'Plataformas de ensino online e treinamentos corporativos com gamificação.', cityIndex: 0, phone: generatePhone(8) },

    // Londrina (6 empresas)
    { companyName: 'Norte Digital Agency', legalName: 'Norte Digital Marketing Ltda', cnpj: generateCNPJ(9), category: 'Marketing', description: 'Marketing de conteúdo, SEO e gestão de redes sociais para negócios do norte do Paraná.', cityIndex: 1, phone: generatePhone(9) },
    { companyName: 'Pixel Labs', legalName: 'Pixel Labs Tecnologia Ltda', cnpj: generateCNPJ(10), category: 'Tecnologia', description: 'Desenvolvimento de apps mobile (React Native e Flutter) e integrações com APIs.', cityIndex: 1, phone: generatePhone(10) },
    { companyName: 'Saúde Conecta', legalName: 'Saúde Conecta Serviços Ltda', cnpj: generateCNPJ(11), category: 'Saúde', description: 'Telemedicina, prontuário eletrônico e soluções de TI para clínicas e hospitais.', cityIndex: 1, phone: generatePhone(11) },
    { companyName: 'Consultoria Ágil Norte', legalName: 'Ágil Norte Consultoria Ltda', cnpj: generateCNPJ(12), category: 'Consultoria', description: 'Implementação de metodologias ágeis, Scrum e Kanban para times de desenvolvimento.', cityIndex: 1, phone: generatePhone(12) },
    { companyName: 'Londrina Design Studio', legalName: 'LDS Comunicação Visual Ltda', cnpj: generateCNPJ(13), category: 'Design', description: 'UI/UX design, prototipagem e design systems para produtos digitais.', cityIndex: 1, phone: generatePhone(13) },
    { companyName: 'ContaFácil Londrina', legalName: 'ContaFácil Serv Contábeis Ltda', cnpj: generateCNPJ(14), category: 'Contabilidade', description: 'Contabilidade digital para MEI, ME e EPP. Abertura de empresas e planejamento tributário.', cityIndex: 1, phone: generatePhone(14) },

    // Maringá (5 empresas)
    { companyName: 'Maringá Tech Hub', legalName: 'Tech Hub Maringá SA', cnpj: generateCNPJ(15), category: 'Tecnologia', description: 'Fábrica de software e outsourcing de desenvolvimento com equipes especializadas em Node.js e React.', cityIndex: 2, phone: generatePhone(15) },
    { companyName: 'Impulso Marketing', legalName: 'Impulso Comunicação Ltda', cnpj: generateCNPJ(16), category: 'Marketing', description: 'Gestão de tráfego pago (Google Ads e Meta Ads) e automação de marketing para e-commerces.', cityIndex: 2, phone: generatePhone(16) },
    { companyName: 'Lens Studio Fotografia', legalName: 'Lens Studio Produções EIRELI', cnpj: generateCNPJ(17), category: 'Fotografia', description: 'Fotografia de eventos corporativos, casamentos e ensaios em todo o Paraná.', cityIndex: 2, phone: generatePhone(17) },
    { companyName: 'Advocacia Digital MGA', legalName: 'Santos & Lima Advogados Assoc.', cnpj: generateCNPJ(18), category: 'Advocacia', description: 'Direito empresarial, contratos de tecnologia e startups. 100% digital.', cityIndex: 2, phone: generatePhone(18) },
    { companyName: 'Espaço Construir', legalName: 'Espaço Construir Engenharia Ltda', cnpj: generateCNPJ(19), category: 'Arquitetura', description: 'Projetos residenciais e comerciais, laudo técnico e acompanhamento de obra.', cityIndex: 2, phone: generatePhone(19) },

    // Cascavel (5 empresas)
    { companyName: 'Oeste Web Solutions', legalName: 'Oeste Web Tecnologia Ltda', cnpj: generateCNPJ(20), category: 'Tecnologia', description: 'Criação de sites, e-commerces e sistemas ERP para o agronegócio da região oeste.', cityIndex: 3, phone: generatePhone(20) },
    { companyName: 'Agro Marketing PR', legalName: 'Agro Marketing Comunicação Ltda', cnpj: generateCNPJ(21), category: 'Marketing', description: 'Marketing especializado para o agronegócio: feiras, catálogos e presença digital.', cityIndex: 3, phone: generatePhone(21) },
    { companyName: 'Cascavel Contábil', legalName: 'Cascavel Assessoria Contábil SS', cnpj: generateCNPJ(22), category: 'Contabilidade', description: 'Contabilidade rural e empresarial. Especialista em ITR e nota fiscal de produtor.', cityIndex: 3, phone: generatePhone(22) },
    { companyName: 'MedTech Cascavel', legalName: 'MedTech Soluções em Saúde Ltda', cnpj: generateCNPJ(23), category: 'Saúde', description: 'Equipamentos médicos, manutenção hospitalar e consultoria em biossegurança.', cityIndex: 3, phone: generatePhone(23) },
    { companyName: 'Criativa Design Oeste', legalName: 'Criativa Comunicação Visual Ltda', cnpj: generateCNPJ(24), category: 'Design', description: 'Identidade visual, embalagens e material gráfico para indústrias da região.', cityIndex: 3, phone: generatePhone(24) },

    // Ponta Grossa (4 empresas)
    { companyName: 'Campos Gerais Digital', legalName: 'CG Digital Soluções Ltda', cnpj: generateCNPJ(25), category: 'Tecnologia', description: 'Automação industrial, IoT e dashboards de monitoramento para fábricas e logística.', cityIndex: 4, phone: generatePhone(25) },
    { companyName: 'PG Marketing 360', legalName: 'PG Marketing Completo Ltda', cnpj: generateCNPJ(26), category: 'Marketing', description: 'Estratégias 360°: branding, social media, eventos e relações públicas.', cityIndex: 4, phone: generatePhone(26) },
    { companyName: 'EduSaber Cursos', legalName: 'EduSaber Treinamentos Ltda', cnpj: generateCNPJ(27), category: 'Educação', description: 'Cursos técnicos presenciais e online: programação, design e marketing digital.', cityIndex: 4, phone: generatePhone(27) },
    { companyName: 'ConsultPG Empresarial', legalName: 'ConsultPG Gestão Ltda', cnpj: generateCNPJ(28), category: 'Consultoria', description: 'Consultoria em gestão empresarial, reestruturação e planejamento estratégico.', cityIndex: 4, phone: generatePhone(28) },

    // Foz do Iguaçu (4 empresas)
    { companyName: 'Fronteira Digital', legalName: 'Fronteira TI Serviços Ltda', cnpj: generateCNPJ(29), category: 'Tecnologia', description: 'Desenvolvimento de software para turismo, hotelaria e comércio de fronteira.', cityIndex: 5, phone: generatePhone(29) },
    { companyName: 'Cataratas Marketing', legalName: 'Cataratas Comunicação Ltda', cnpj: generateCNPJ(30), category: 'Marketing', description: 'Marketing turístico, gestão de reputação online e produção de conteúdo audiovisual.', cityIndex: 5, phone: generatePhone(30) },
    { companyName: 'FotoVista Iguaçu', legalName: 'FotoVista Produções Ltda', cnpj: generateCNPJ(31), category: 'Fotografia', description: 'Fotografia aérea com drones, vídeos institucionais e cobertura de eventos turísticos.', cityIndex: 5, phone: generatePhone(31) },
    { companyName: 'Tri Border Consulting', legalName: 'Tri Border Consultoria Ltda', cnpj: generateCNPJ(32), category: 'Consultoria', description: 'Consultoria em comércio exterior, importação/exportação e logística trinacional.', cityIndex: 5, phone: generatePhone(32) },

    // Guarapuava (3 empresas)
    { companyName: 'Serra Digital', legalName: 'Serra Digital Tecnologia Ltda', cnpj: generateCNPJ(33), category: 'Tecnologia', description: 'Soluções web e infraestrutura de TI para empresas da região centro-sul do Paraná.', cityIndex: 6, phone: generatePhone(33) },
    { companyName: 'ContaSerrana', legalName: 'ContaSerrana Serv Contábeis SS', cnpj: generateCNPJ(34), category: 'Contabilidade', description: 'Contabilidade para produtores rurais e cooperativas. Especialista em SPED e EFD.', cityIndex: 6, phone: generatePhone(34) },
    { companyName: 'ArquiCentro Projetos', legalName: 'ArquiCentro Engenharia Ltda', cnpj: generateCNPJ(35), category: 'Arquitetura', description: 'Projetos arquitetônicos, design de interiores e regularização de imóveis.', cityIndex: 6, phone: generatePhone(35) },

    // Paranaguá (2 empresas)
    { companyName: 'Porto Digital', legalName: 'Porto Digital Soluções Ltda', cnpj: generateCNPJ(36), category: 'Tecnologia', description: 'Sistemas de gestão portuária, rastreamento de cargas e automação logística.', cityIndex: 7, phone: generatePhone(36) },
    { companyName: 'Litoral Marketing', legalName: 'Litoral Comunicação Ltda', cnpj: generateCNPJ(37), category: 'Marketing', description: 'Marketing para turismo litorâneo, pousadas e restaurantes. Gestão de Google Meu Negócio.', cityIndex: 7, phone: generatePhone(37) },

    // Toledo (2 empresas)
    { companyName: 'AgroSoft Toledo', legalName: 'AgroSoft Sistemas Ltda', cnpj: generateCNPJ(38), category: 'Tecnologia', description: 'Software para gestão de propriedades rurais, controle de safra e rastreabilidade animal.', cityIndex: 8, phone: generatePhone(38) },
    { companyName: 'Toledo Saúde Ocupacional', legalName: 'Toledo Saúde SESMT Ltda', cnpj: generateCNPJ(39), category: 'Saúde', description: 'Medicina do trabalho, PCMSO, PPRA e treinamentos de segurança para indústrias.', cityIndex: 8, phone: generatePhone(39) },

    // Francisco Beltrão (2 empresas)
    { companyName: 'Sudoeste Web', legalName: 'Sudoeste Web Design Ltda', cnpj: generateCNPJ(40), category: 'Design', description: 'Criação de sites responsivos, lojas virtuais e identidade visual para PMEs do sudoeste.', cityIndex: 9, phone: generatePhone(40) },
    { companyName: 'Beltrão Jurídico', legalName: 'Beltrão Jurídico Advogados SS', cnpj: generateCNPJ(41), category: 'Advocacia', description: 'Advocacia trabalhista e previdenciária. Atuação presencial e online no sudoeste paranaense.', cityIndex: 9, phone: generatePhone(41) },

    // Umuarama (2 empresas)
    { companyName: 'Noroeste Tech', legalName: 'Noroeste Tech Informática Ltda', cnpj: generateCNPJ(42), category: 'Tecnologia', description: 'Manutenção de redes, servidores e cloud computing para empresas do noroeste do PR.', cityIndex: 10, phone: generatePhone(42) },
    { companyName: 'CriaUmu Design', legalName: 'CriaUmu Criações Visuais EIRELI', cnpj: generateCNPJ(43), category: 'Design', description: 'Design gráfico, social media e produção de vídeos animados para redes sociais.', cityIndex: 10, phone: generatePhone(43) },

    // Campo Mourão (2 empresas)
    { companyName: 'Mourão Digital', legalName: 'Mourão Digital Marketing Ltda', cnpj: generateCNPJ(44), category: 'Marketing', description: 'Inbound marketing, funis de vendas e automação de email marketing para cooperativas.', cityIndex: 11, phone: generatePhone(44) },
    { companyName: 'CampoSaúde Clínicas', legalName: 'CampoSaúde Gestão em Saúde Ltda', cnpj: generateCNPJ(45), category: 'Saúde', description: 'Gestão de clínicas médicas, agenda online e prontuário eletrônico integrado.', cityIndex: 11, phone: generatePhone(45) },

    // Apucarana (2 empresas)
    { companyName: 'Boné Tech', legalName: 'Boné Tech Soluções Ltda', cnpj: generateCNPJ(46), category: 'Tecnologia', description: 'Sistemas para a indústria de confecção: controle de produção, estoque e pedidos.', cityIndex: 12, phone: generatePhone(46) },
    { companyName: 'Apucarana Educação Online', legalName: 'Apucarana EaD Ltda', cnpj: generateCNPJ(47), category: 'Educação', description: 'Plataforma EaD para escolas e universidades. LMS customizado com videoaulas e provas.', cityIndex: 12, phone: generatePhone(47) },

    // Arapongas (2 empresas)
    { companyName: 'Moveltech Sistemas', legalName: 'Moveltech TI para Indústria Ltda', cnpj: generateCNPJ(48), category: 'Tecnologia', description: 'ERP e MES para indústrias moveleiras. Controle de chão de fábrica e qualidade.', cityIndex: 13, phone: generatePhone(48) },
    { companyName: 'Arapongas Consultoria', legalName: 'Arapongas Gestão Empresarial Ltda', cnpj: generateCNPJ(49), category: 'Consultoria', description: 'Consultoria em lean manufacturing, 5S e melhoria contínua para o polo moveleiro.', cityIndex: 13, phone: generatePhone(49) },

    // Colombo (1 empresa)
    { companyName: 'Colombo Digital Mídia', legalName: 'Colombo Mídia Digital Ltda', cnpj: generateCNPJ(50), category: 'Marketing', description: 'Gestão de mídias sociais, produção de conteúdo e assessoria de imprensa digital.', cityIndex: 14, phone: generatePhone(50) },

    // São José dos Pinhais (1 empresa)
    { companyName: 'SJP Engenharia Digital', legalName: 'SJP Engenharia de Software Ltda', cnpj: generateCNPJ(51), category: 'Tecnologia', description: 'Desenvolvimento de sistemas para logística aeroportuária e cadeia de suprimentos.', cityIndex: 15, phone: generatePhone(51) },
];

// ─── Service Templates ───────────────────────────────────────────────
interface ServiceTemplate {
    title: string;
    description: string;
    categoryTag: string;
    serviceType: 'remote' | 'presential' | 'hybrid';
    startingPrice: number;
    duration: string;
}

const SERVICE_POOL: Record<string, ServiceTemplate[]> = {
    Marketing: [
        { title: 'Gestão de Tráfego Pago (Google & Meta Ads)', description: 'Gestão completa de campanhas de anúncios com foco em ROI e aquisição de clientes.', categoryTag: 'Marketing', serviceType: 'remote', startingPrice: 1500, duration: '30 dias' },
        { title: 'Estratégia de Conteúdo & SEO', description: 'Planejamento de conteúdo, otimização on-page e link building para posicionamento orgânico.', categoryTag: 'SEO', serviceType: 'remote', startingPrice: 2000, duration: '45 dias' },
        { title: 'Gestão de Redes Sociais', description: 'Criação de posts, stories, reels e monitoramento de engajamento em todas as plataformas.', categoryTag: 'Marketing', serviceType: 'remote', startingPrice: 1200, duration: '30 dias' },
    ],
    Tecnologia: [
        { title: 'Desenvolvimento de Site Institucional', description: 'Site responsivo, moderno e otimizado para SEO, com painel administrativo.', categoryTag: 'Tecnologia', serviceType: 'remote', startingPrice: 3500, duration: '21 dias' },
        { title: 'Desenvolvimento de App Mobile', description: 'Aplicativo nativo ou híbrido (React Native) para iOS e Android.', categoryTag: 'Tecnologia', serviceType: 'remote', startingPrice: 8000, duration: '60 dias' },
        { title: 'Consultoria de Infraestrutura Cloud', description: 'Migração para nuvem (AWS/GCP/Azure), DevOps e monitoramento 24/7.', categoryTag: 'Tecnologia', serviceType: 'remote', startingPrice: 5000, duration: '15 dias' },
    ],
    Design: [
        { title: 'Identidade Visual Completa', description: 'Logo, paleta de cores, tipografia, manual de marca e papelaria.', categoryTag: 'Design', serviceType: 'remote', startingPrice: 2500, duration: '14 dias' },
        { title: 'UI/UX Design de Aplicativo', description: 'Wireframes, protótipos interativos e design system completo no Figma.', categoryTag: 'Design', serviceType: 'remote', startingPrice: 4000, duration: '21 dias' },
        { title: 'Design de Embalagem', description: 'Criação de embalagens atrativas e funcionais para produtos físicos.', categoryTag: 'Design', serviceType: 'hybrid', startingPrice: 1800, duration: '10 dias' },
    ],
    Consultoria: [
        { title: 'Diagnóstico Empresarial', description: 'Análise completa da situação da empresa com plano de ação estratégico.', categoryTag: 'Consultoria', serviceType: 'hybrid', startingPrice: 3000, duration: '10 dias' },
        { title: 'Implementação de Metodologias Ágeis', description: 'Treinamento e coaching em Scrum, Kanban e OKRs para times de alta performance.', categoryTag: 'Consultoria', serviceType: 'presential', startingPrice: 5000, duration: '30 dias' },
        { title: 'Planejamento Estratégico Anual', description: 'Definição de metas, KPIs e roadmap estratégico para o próximo ciclo.', categoryTag: 'Consultoria', serviceType: 'hybrid', startingPrice: 4000, duration: '15 dias' },
    ],
    Contabilidade: [
        { title: 'BPO Financeiro Completo', description: 'Terceirização do departamento financeiro: contas a pagar, receber e conciliação.', categoryTag: 'Contabilidade', serviceType: 'remote', startingPrice: 1500, duration: '30 dias' },
        { title: 'Abertura de Empresa + MEI/ME', description: 'Processo completo de abertura, contrato social, CNPJ e alvarás.', categoryTag: 'Contabilidade', serviceType: 'hybrid', startingPrice: 800, duration: '7 dias' },
        { title: 'Planejamento Tributário', description: 'Estudo fiscal para redução de impostos com enquadramento ideal (Simples, LP, LR).', categoryTag: 'Contabilidade', serviceType: 'remote', startingPrice: 2000, duration: '10 dias' },
    ],
    Advocacia: [
        { title: 'Consultoria Jurídica Empresarial', description: 'Assessoria contínua em contratos, compliance e governança corporativa.', categoryTag: 'Advocacia', serviceType: 'hybrid', startingPrice: 2500, duration: '30 dias' },
        { title: 'Adequação à LGPD', description: 'Mapeamento de dados, políticas de privacidade e treinamento de equipe.', categoryTag: 'Advocacia', serviceType: 'remote', startingPrice: 4000, duration: '30 dias' },
        { title: 'Registro de Marca (INPI)', description: 'Busca de anterioridade, depósito e acompanhamento do registro de marca.', categoryTag: 'Advocacia', serviceType: 'remote', startingPrice: 1500, duration: '90 dias' },
    ],
    Arquitetura: [
        { title: 'Projeto Arquitetônico Residencial', description: 'Projeto completo com planta baixa, cortes, fachada e memorial descritivo.', categoryTag: 'Arquitetura', serviceType: 'hybrid', startingPrice: 5000, duration: '30 dias' },
        { title: 'Design de Interiores', description: 'Projeto de ambientes internos com seleção de materiais, mobiliário e iluminação.', categoryTag: 'Arquitetura', serviceType: 'presential', startingPrice: 3000, duration: '21 dias' },
        { title: 'Laudo Técnico e Vistoria', description: 'Inspeção predial, laudo de vizinhança e relatório técnico conforme ABNT.', categoryTag: 'Arquitetura', serviceType: 'presential', startingPrice: 2000, duration: '7 dias' },
    ],
    Fotografia: [
        { title: 'Ensaio Fotográfico Corporativo', description: 'Retrato profissional de equipe, fotos de ambiente e headshots para LinkedIn.', categoryTag: 'Fotografia', serviceType: 'presential', startingPrice: 800, duration: '1 dia' },
        { title: 'Fotografia de Produtos', description: 'Fotos still e lifestyle de produtos para e-commerce e catálogos.', categoryTag: 'Fotografia', serviceType: 'presential', startingPrice: 1200, duration: '2 dias' },
        { title: 'Cobertura de Eventos', description: 'Registro fotográfico e videográfico de eventos corporativos e sociais.', categoryTag: 'Fotografia', serviceType: 'presential', startingPrice: 1500, duration: '1 dia' },
    ],
    Educação: [
        { title: 'Curso Online Customizado', description: 'Criação de curso EaD com videoaulas, apostilas e certificado de conclusão.', categoryTag: 'Educação', serviceType: 'remote', startingPrice: 6000, duration: '45 dias' },
        { title: 'Treinamento Corporativo In-Company', description: 'Workshops presenciais de capacitação técnica e soft skills.', categoryTag: 'Educação', serviceType: 'presential', startingPrice: 3000, duration: '3 dias' },
        { title: 'Mentoria Individual de Carreira', description: 'Programa de mentoria personalizado com acompanhamento quinzenal.', categoryTag: 'Educação', serviceType: 'remote', startingPrice: 1500, duration: '90 dias' },
    ],
    Saúde: [
        { title: 'Consultoria em Telemedicina', description: 'Implantação de plataforma de telemedicina com prontuário eletrônico integrado.', categoryTag: 'Saúde', serviceType: 'remote', startingPrice: 5000, duration: '30 dias' },
        { title: 'PCMSO & PPRA', description: 'Elaboração de Programa de Controle Médico e Programa de Prevenção de Riscos.', categoryTag: 'Saúde', serviceType: 'hybrid', startingPrice: 2500, duration: '15 dias' },
        { title: 'Treinamento de Primeiros Socorros', description: 'Capacitação prática em primeiros socorros e uso de DEA para equipes.', categoryTag: 'Saúde', serviceType: 'presential', startingPrice: 1000, duration: '1 dia' },
    ],
};

const SERVICE_ATTRIBUTES: Record<string, any> = {
    Marketing: { 'Plataformas': 'Google, Meta, LinkedIn', 'Entregáveis': 'Relatórios Mensais' },
    Tecnologia: { 'Frameworks': 'React, Node.js', 'Banco de Dados': 'PostgreSQL' },
    Design: { 'Ferramentas': 'Figma, Adobe XD', 'Arquivos': 'PNG, SVG, PDF' },
    Consultoria: { 'Formato': 'Online/Presencial', 'Duração': 'Personalizada' },
    Contabilidade: { 'Regime': 'Simples, Lucro Presumido', 'Atendimento': 'WhatsApp, Email' },
    Advocacia: { 'Área': 'Civil, Trabalhista', 'Cobertura': 'Nacional' },
    Arquitetura: { 'Softwares': 'AutoCAD, SketchUp', 'Render': 'V-Ray' },
    Fotografia: { 'Equipamento': 'Canon R5', 'Edição': 'Lightroom, Photoshop' },
    Educação: { 'Certificado': 'Sim', 'Material': 'PDF, Vídeo' },
    Saúde: { 'Especialidade': 'Clínica Geral', 'Atendimento': 'Agendado' },
};

// ─── Unsplash Image Pool (reusable, royalty-free) ────────────────────
const LOGO_IMAGES = [
    'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&q=80&w=150&h=150',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=150&h=150',
    'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=150&h=150',
    'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&q=80&w=150&h=150',
    'https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&q=80&w=150&h=150',
];

const COVER_IMAGES = [
    'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=1200&h=400',
    'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=1200&h=400',
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=1200&h=400',
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1200&h=400',
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=1200&h=400',
];

// ─── Helpers ─────────────────────────────────────────────────────────
function randomOffset(): number {
    return (Math.random() - 0.5) * 0.02; // ±0.01 degrees (~1km)
}

function pickRandom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getServicesForCategory(category: string): ServiceTemplate[] {
    const pool = SERVICE_POOL[category] || SERVICE_POOL['Tecnologia'];
    // Pick 2 or 3 services randomly (without repeats)
    const count = Math.random() > 0.5 ? 3 : 2;
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── Main Seed ───────────────────────────────────────────────────────
interface SeedResult {
    'Empresa': string;
    'Email': string;
    'Senha': string;
    'Cidade': string;
    'H3 Index': string;
}

async function seed(): Promise<void> {
    console.log('🚀 Iniciando seed de 50 empresas de teste do Paraná...');
    console.log(`🔑 Senha padrão: ${DEFAULT_PASSWORD}`);
    console.log(`📐 Resolução H3: ${H3_RESOLUTION}\n`);

    const results: SeedResult[] = [];
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < COMPANY_TEMPLATES.length; i++) {
        const template = COMPANY_TEMPLATES[i];
        const index = i + 1;
        const email = `empresa${index}@teste.com`;
        const cityData = PR_CITIES[template.cityIndex];

        // Add small random offset to coordinates
        const lat = cityData.lat + randomOffset();
        const lng = cityData.lng + randomOffset();
        const h3Index = h3.latLngToCell(lat, lng, H3_RESOLUTION);
        const slug = slugify(template.companyName);

        console.log(`\n── [${index}/50] ${template.companyName} (${cityData.city}) ──`);

        try {
            // 1. Create Auth User (admin API - no email confirmation needed)
            console.log(`  📧 Criando usuário ${email}...`);
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email,
                password: DEFAULT_PASSWORD,
                email_confirm: true,
                user_metadata: {
                    name: template.companyName,
                    type: 'company',
                },
            });

            if (authError) {
                if (authError.message.includes('already been registered') || authError.message.includes('already exists')) {
                    console.log(`  ⚠️  Usuário já existe. Buscando ID...`);
                    const { data: { users } } = await supabase.auth.admin.listUsers();
                    const existingUser = users?.find(u => u.email === email);
                    if (!existingUser) {
                        console.error(`  ❌ Não foi possível encontrar o usuário existente. Pulando.`);
                        errorCount++;
                        continue;
                    }
                    // Continue with existing user
                    await processCompany(existingUser.id, email, template, cityData, lat, lng, h3Index, slug);
                } else {
                    console.error(`  ❌ Erro ao criar usuário: ${authError.message}`);
                    errorCount++;
                    continue;
                }
            } else if (authData.user) {
                await processCompany(authData.user.id, email, template, cityData, lat, lng, h3Index, slug);
            }

            results.push({
                'Empresa': template.companyName,
                'Email': email,
                'Senha': DEFAULT_PASSWORD,
                'Cidade': cityData.city,
                'H3 Index': h3Index,
            });
            successCount++;

            // Small delay to avoid rate limiting
            await sleep(200);

        } catch (err) {
            console.error(`  ❌ Erro inesperado: ${(err as Error).message}`);
            errorCount++;
        }
    }

    // ─── Summary ─────────────────────────────────────────────────────
    console.log('\n\n' + '═'.repeat(80));
    console.log('📊 RESUMO DA SEED');
    console.log('═'.repeat(80));
    console.log(`✅ Sucesso: ${successCount}`);
    console.log(`❌ Erros:   ${errorCount}`);
    console.log(`📋 Total:   ${COMPANY_TEMPLATES.length}`);
    console.log(`🔑 Senha:   ${DEFAULT_PASSWORD}`);
    console.log('═'.repeat(80));

    if (results.length > 0) {
        console.log('\n📋 Empresas criadas:');
        console.table(results);
    }
}

async function processCompany(
    userId: string,
    email: string,
    template: CompanyTemplate,
    cityData: CityCoord,
    lat: number,
    lng: number,
    h3Index: string,
    slug: string,
): Promise<void> {
    console.log(`  ✅ User ID: ${userId}`);

    // 2. Upsert Profile
    console.log(`  👤 Inserindo profile...`);
    const { error: profileError } = await supabase.from('profiles').upsert({
        id: userId,
        full_name: template.companyName,
        email: email,
        user_type: 'company',
        phone: template.phone,
        address_city: cityData.city,
        address_state: 'PR',
        address_zip: cityData.cep,
        h3_index: h3Index,
    }, { onConflict: 'id' });

    if (profileError) {
        console.error(`  ⚠️  Erro profile: ${profileError.message}`);
    }

    // 3. Upsert Company
    console.log(`  🏢 Inserindo company (${slug})...`);
    const { error: companyError } = await supabase.from('companies').upsert({
        profile_id: userId,
        slug: slug,
        company_name: template.companyName,
        legal_name: template.legalName,
        cnpj: template.cnpj,
        email: email,
        phone: template.phone,
        category: template.category,
        description: template.description,
        status: 'approved',
        h3_index: h3Index,
        city: cityData.city,
        state: 'PR',
        address: {
            street: `Rua ${template.companyName.split(' ')[0]}, ${100 + Math.floor(Math.random() * 900)}`,
            district: 'Centro',
            city: cityData.city,
            state: 'PR',
            cep: cityData.cep,
            latitude: lat,
            longitude: lng,
        },
        logo_url: pickRandom(LOGO_IMAGES),
        cover_image_url: pickRandom(COVER_IMAGES),
        rating: parseFloat((3.5 + Math.random() * 1.5).toFixed(1)),
        total_reviews: Math.floor(Math.random() * 50) + 5,
        clients_count: Math.floor(Math.random() * 500) + 10,
        recurring_clients_percent: Math.floor(Math.random() * 40) + 20, // 20-60%
        verified: Math.random() > 0.7, // 30% verified
        admin_contact: {
            name: `Responsável ${template.companyName}`,
            phone: template.phone,
            email: email,
        },
    }, { onConflict: 'slug' });

    if (companyError) {
        console.error(`  ⚠️  Erro company: ${companyError.message}`);
        return;
    }

    // 4. Get company ID
    const { data: companyRecord } = await supabase
        .from('companies')
        .select('id')
        .eq('slug', slug)
        .single();

    if (!companyRecord) {
        console.error(`  ❌ Não encontrou company record.`);
        return;
    }

    // 5. Upsert Team Member (owner)
    const { error: teamError } = await supabase.from('team_members').upsert({
        company_id: companyRecord.id,
        user_id: userId,
        role: 'owner',
    }, { onConflict: 'company_id,user_id' });

    if (teamError) {
        console.error(`  ⚠️  Erro team_member: ${teamError.message}`);
    }

    // 6. Create Services
    const serviceTemplates = getServicesForCategory(template.category);
    console.log(`  🛠️  Inserindo ${serviceTemplates.length} serviços...`);

    for (const svc of serviceTemplates) {
        const serviceSlug = slugify(`${template.companyName}-${svc.title}`);
        const { error: serviceError } = await supabase.from('services').upsert({
            company_id: companyRecord.id,
            title: svc.title,
            slug: serviceSlug,
            description: svc.description,
            category_tag: svc.categoryTag,
            service_type: svc.serviceType,
            starting_price: svc.startingPrice,
            duration: svc.duration,
            is_active: true,
            h3_index: h3Index,
            image_url: pickRandom(COVER_IMAGES),
            rating: parseFloat((3.0 + Math.random() * 2.0).toFixed(1)),
            total_reviews: Math.floor(Math.random() * 30),
            attributes: SERVICE_ATTRIBUTES[template.category] || {},
            details: {
                methodology: 'Nossa metodologia foca em resultados rápidos e comunicação transparente.',
                target_audience: 'Pequenas e médias empresas buscando crescimento.',
                requirements: 'Briefing inicial detalhado e acesso às plataformas necessárias.'
            },
            packages: {
                basic: {
                    name: 'Básico',
                    price: svc.startingPrice,
                    delivery_time: parseInt(svc.duration) || 30,
                    revisions: 1,
                    description: `Pacote básico de ${svc.title.toLowerCase()}.`,
                    features: ['Entrega padrão', 'Suporte por email'],
                },
                standard: {
                    name: 'Padrão',
                    price: Math.round(svc.startingPrice * 1.6),
                    delivery_time: Math.max(parseInt(svc.duration) || 30, 15),
                    revisions: 3,
                    description: `Pacote padrão para quem precisa de mais agilidade.`,
                    features: ['Entrega prioritária', 'Suporte por WhatsApp', 'Relatório simples'],
                },
                premium: {
                    name: 'Premium',
                    price: Math.round(svc.startingPrice * 2.5),
                    delivery_time: Math.max((parseInt(svc.duration) || 30) - 5, 10),
                    revisions: -1, // ilimitado
                    description: `Acompanhamento VIP e entregas exclusivas.`,
                    features: ['Entrega expressa', 'Suporte prioritário 24/7', 'Relatório detalhado', 'Reunião mensal'],
                },
            },
        }, { onConflict: 'slug' });

        if (serviceError) {
            console.error(`  ⚠️  Erro service "${svc.title}": ${serviceError.message}`);
        }
    }

    console.log(`  ✅ Empresa completa!`);
}

// ─── Run ─────────────────────────────────────────────────────────────
seed()
    .then(() => {
        console.log('\n✨ Seed finalizada com sucesso!');
        process.exit(0);
    })
    .catch(err => {
        console.error('\n💥 Erro fatal durante a seed:', err);
        process.exit(1);
    });
