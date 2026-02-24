export interface HiringQuestion {
    id: string;
    question: string;
    type: 'text' | 'select' | 'checkbox' | 'number' | 'textarea';
    options?: string[];
    placeholder?: string;
    required: boolean;
}

export interface ServiceSubcategory {
    id: string;
    label: string;
    registrationRules?: string[];
    hiringQuestions?: HiringQuestion[];
    requiresBoard?: {
        name: string; // e.g., CRM, OAB, CREA
        mandatory: boolean;
        showUf?: boolean;
    };
    requiresCertification?: {
        name: string; // e.g., NR-10, CNH EAR
        mandatory: boolean;
    };
}

export interface ServiceCategory {
    id: string;
    label: string;
    icon?: string;
    subcategories: ServiceSubcategory[];
}

export const SERVICE_CATEGORIES: ServiceCategory[] = [
    {
        id: 'healthcare',
        label: 'Área da Saúde',
        subcategories: [
            { id: 'general_doctor', label: 'Médico (clínico geral e especialistas)', requiresBoard: { name: 'CRM', mandatory: true, showUf: true } },
            { id: 'dentist', label: 'Dentista (clínico geral e especialistas)', requiresBoard: { name: 'CRO', mandatory: true, showUf: true } },
            { id: 'nurse', label: 'Enfermeiro', requiresBoard: { name: 'COREN', mandatory: true, showUf: true } },
            { id: 'nursing_technician', label: 'Técnico de enfermagem', requiresBoard: { name: 'COREN', mandatory: true, showUf: true } },
            {
                id: 'psychologist', label: 'Psicólogo',
                requiresBoard: { name: 'CRP', mandatory: true, showUf: true },
                registrationRules: [
                    'Modalidade: Online (Vídeochamada) ou Presencial (Endereço do consultório).',
                    'Precificação: Valor avulso da sessão e valor de pacote mensal (4 sessões).',
                    'Duração: Tempo fixo (ex: 50 minutos).',
                    'Abordagem: TCC, Psicanálise, Gestalt, etc.'
                ],
                hiringQuestions: [
                    { id: 'reason', question: 'Qual é o motivo principal da sua busca por terapia neste momento?', type: 'textarea', placeholder: 'Ansiedade, depression, luto, autoconhecimento, etc.', required: true },
                    { id: 'first_time', question: 'É a sua primeira vez fazendo terapia?', type: 'select', options: ['Sim', 'Não'], required: true },
                    { id: 'previous_diagnosis', question: 'Você já possui algum diagnóstico ou laudo psiquiátrico prévio?', type: 'textarea', required: false },
                    { id: 'preference', question: 'Prefere o atendimento online ou presencial?', type: 'select', options: ['Online', 'Presencial'], required: true }
                ]
            },
            { id: 'psychiatrist', label: 'Psiquiatra', requiresBoard: { name: 'CRM', mandatory: true, showUf: true } },
            { id: 'physiotherapist', label: 'Fisioterapeuta', requiresBoard: { name: 'CREFITO', mandatory: true, showUf: true } },
            { id: 'speech_therapist', label: 'Fonoaudiólogo', requiresBoard: { name: 'CREFONO', mandatory: true, showUf: true } },
            { id: 'nutritionist', label: 'Nutricionista', requiresBoard: { name: 'CRN', mandatory: true, showUf: true } },
            { id: 'pharmacist', label: 'Farmacêutico', requiresBoard: { name: 'CRF', mandatory: true, showUf: true } },
            { id: 'biomedical', label: 'Biomédico', requiresBoard: { name: 'CRBM', mandatory: true, showUf: true } },
            { id: 'occupational_therapist', label: 'Terapeuta ocupacional', requiresBoard: { name: 'CREFITO', mandatory: true, showUf: true } },
            { id: 'beautician', label: 'Esteticista', requiresCertification: { name: 'Certificado de Formação', mandatory: true } },
            { id: 'chiropractor', label: 'Quiropraxista', requiresCertification: { name: 'Certificado de Formação', mandatory: true } },
            { id: 'acupuncturist', label: 'Acupunturista', requiresCertification: { name: 'Certificado de Formação', mandatory: true } },
            { id: 'massage_therapist', label: 'Massoterapeuta', requiresCertification: { name: 'Certificado de Formação', mandatory: true } },
            { id: 'elderly_caregiver', label: 'Cuidador de idosos', requiresCertification: { name: 'Certificado de Formação', mandatory: true } },
            { id: 'personal_trainer', label: 'Educador físico / Personal trainer', requiresBoard: { name: 'CREF', mandatory: true, showUf: true } },
            { id: 'veterinarian', label: 'Veterinário', requiresBoard: { name: 'CRMV', mandatory: true, showUf: true } }
        ]
    },
    {
        id: 'legal',
        label: 'Área Jurídica',
        subcategories: [
            {
                id: 'lawyer', label: 'Advogado',
                requiresBoard: { name: 'OAB', mandatory: true, showUf: true },
                registrationRules: [
                    'Consulta Inicial: Gratuita ou Paga (informar valor).',
                    'Atuação: Amigável (Extrajudicial) ou Litigioso.',
                    'Atendimento: Presencial no escritório ou Online (Brasil inteiro).'
                ],
                hiringQuestions: [
                    { id: 'divorce_type', question: 'O divórcio é consensual (ambos concordam) ou litigioso (há conflito)?', type: 'select', options: ['Consensual', 'Litigioso'], required: true },
                    { id: 'has_children', question: 'O casal possui filhos menores de idade ou incapazes?', type: 'select', options: ['Sim', 'Não'], required: true },
                    { id: 'has_assets', question: 'Existe patrimônio (imóveis, carros, empresas) a ser partilhado?', type: 'select', options: ['Sim', 'Não'], required: true },
                    { id: 'situation_summary', question: 'Resuma a situação atual em um parágrafo.', type: 'textarea', required: true }
                ]
            },
            { id: 'legal_correspondent', label: 'Correspondente jurídico', requiresBoard: { name: 'OAB', mandatory: true, showUf: true } },
            { id: 'legal_consultant', label: 'Consultor jurídico', requiresBoard: { name: 'OAB', mandatory: true, showUf: true } },
            { id: 'mediator', label: 'Mediador / Conciliador', requiresCertification: { name: 'Certificado de Formação', mandatory: true } },
            { id: 'judicial_expert', label: 'Perito judicial', requiresBoard: { name: 'Conselho Profissional (CREA/CRC/etc)', mandatory: true, showUf: true } }
        ]
    },
    {
        id: 'engineering',
        label: 'Engenharia & Construção',
        subcategories: [
            { id: 'civil_engineer', label: 'Engenheiro civil', requiresBoard: { name: 'CREA', mandatory: true, showUf: true } },
            { id: 'electrical_engineer', label: 'Engenheiro elétrico', requiresBoard: { name: 'CREA', mandatory: true, showUf: true } },
            { id: 'mechanical_engineer', label: 'Engenheiro mecânico', requiresBoard: { name: 'CREA', mandatory: true, showUf: true } },
            { id: 'environmental_engineer', label: 'Engenheiro ambiental', requiresBoard: { name: 'CREA', mandatory: true, showUf: true } },
            { id: 'architect', label: 'Arquiteto', requiresBoard: { name: 'CAU', mandatory: true, showUf: true } },
            { id: 'foreman', label: 'Mestre de obras', requiresCertification: { name: 'Certificado de Formação', mandatory: true } },
            {
                id: 'mason', label: 'Pedreiro',
                requiresCertification: { name: 'Certidão de Antecedentes Criminais', mandatory: true },
                registrationRules: [
                    'Precificação: Por metro quadrado (m²) ou por diária de trabalho.',
                    'Especialidade: Tamanho máximo da peça que instala (ex: grandes formatos 120x120cm).',
                    'Ajudante: O valor já inclui ajudante de pedreiro? (Sim/Não).'
                ],
                hiringQuestions: [
                    { id: 'area_size', question: 'Qual a área total em metros quadrados (m²) do ambiente?', type: 'number', required: true },
                    { id: 'environment', question: 'Qual é o ambiente?', type: 'text', placeholder: 'Sala, banheiro, parede...', required: true },
                    { id: 'base_ready', question: 'O contrapiso já está pronto e nivelado ou precisará ser feito?', type: 'select', options: ['Pronto/Nivelado', 'Precisará ser feito'], required: true },
                    { id: 'removal_needed', question: 'O piso atual precisará ser removido e descartado?', type: 'select', options: ['Sim', 'Não'], required: true },
                    { id: 'materials_purchased', question: 'O material (piso, argamassa, rejunte) já está comprado no local?', type: 'select', options: ['Sim', 'Não'], required: true }
                ]
            },
            {
                id: 'electrician', label: 'Eletricista',
                requiresCertification: { name: 'NR-10', mandatory: true },
                registrationRules: [
                    'Precificação: Valor fixo por ponto instalado ou taxa de visita técnica.',
                    'Horário de Atendimento: Atende emergências (24h) com taxa extra?',
                    'Garantia: Quantidade de dias de garantia do serviço.'
                ],
                hiringQuestions: [
                    { id: 'wiring_exists', question: 'A fiação e o disjuntor para o chuveiro já existem ou será necessário puxar fiação nova?', type: 'select', options: ['Já existem', 'Necessário puxar nova'], required: true },
                    { id: 'voltage', question: 'Qual a voltagem do local (110V ou 220V)?', type: 'select', options: ['110V', '220V'], required: true },
                    { id: 'shower_model', question: 'Qual a marca e modelo do chuveiro que será instalado?', type: 'text', required: true },
                    { id: 'is_repair', question: 'O problema atual envolve cheiro de queimado ou disjuntor desarmando toda hora?', type: 'select', options: ['Sim', 'Não'], required: false }
                ]
            },
            { id: 'plumber', label: 'Encanador', requiresCertification: { name: 'Certidão de Antecedentes Criminais', mandatory: true } },
            { id: 'painter', label: 'Pintor', requiresCertification: { name: 'Certidão de Antecedentes Criminais', mandatory: true } },
            { id: 'plasterer', label: 'Gesseiro', requiresCertification: { name: 'Certidão de Antecedentes Criminais', mandatory: true } },
            { id: 'carpenter', label: 'Marceneiro', requiresCertification: { name: 'Certidão de Antecedentes Criminais', mandatory: true } },
            { id: 'blacksmith', label: 'Serralheiro', requiresCertification: { name: 'Certidão de Antecedentes Criminais', mandatory: true } },
            { id: 'buildings_technician', label: 'Técnico em edificações', requiresBoard: { name: 'CFT', mandatory: true, showUf: true } },
            { id: 'topographer', label: 'Topógrafo', requiresBoard: { name: 'CREA', mandatory: true, showUf: true } }
        ]
    },
    {
        id: 'technology',
        label: 'Tecnologia & Digital',
        subcategories: [
            {
                id: 'frontend_dev', label: 'Desenvolvedor Front-end',
                registrationRules: [
                    'Pacote: Número máximo de seções da página.',
                    'Tecnologia: WordPress, React, HTML/CSS.',
                    'Prazos: Tempo de entrega em dias úteis.',
                    'Inclusões: Inclui design? Inclui registro de domínio? (Sim/Não).'
                ],
                hiringQuestions: [
                    { id: 'assets_ready', question: 'Você já possui a identidade visual (logotipo, cores) e os textos (copy) da página?', type: 'select', options: ['Sim', 'Não'], required: true },
                    { id: 'domain_hosting', question: 'Você já tem domínio (ex: seunome.com.br) e hospedagem contratados?', type: 'select', options: ['Sim', 'Não'], required: true },
                    { id: 'objective', question: 'Qual o objetivo da página?', type: 'text', placeholder: 'Capturar leads, vender um curso...', required: true },
                    { id: 'references', question: 'Liste 2 a 3 sites que você gosta para usarmos de referência de design.', type: 'textarea', required: false }
                ]
            },
            { id: 'backend_dev', label: 'Desenvolvedor Back-end' },
            { id: 'fullstack_dev', label: 'Desenvolvedor Full Stack' },
            { id: 'mobile_dev', label: 'Desenvolvedor Mobile' },
            { id: 'ux_ui_designer', label: 'UX/UI Designer' },
            { id: 'graphic_designer', label: 'Designer gráfico' },
            {
                id: 'social_media', label: 'Social Media',
                registrationRules: [
                    'Entregáveis: Quantidade de Posts no feed por semana e Stories por dia.',
                    'Adicionais: Inclui edição de Reels? Inclui respostas no Direct?',
                    'Pagamento: Mensalidade recorrente.'
                ],
                hiringQuestions: [
                    { id: 'niche_handle', question: 'Qual é o nicho do seu negócio e qual é o arroba (@) atual?', type: 'text', required: true },
                    { id: 'main_goal', question: 'Qual o seu principal objetivo?', type: 'select', options: ['Atrair seguidores', 'Vender mais', 'Melhorar a vitrine'], required: true },
                    { id: 'video_comfort', question: 'Você tem facilidade em gravar vídeos/aparecer nos stories ou prefere focar em artes gráficas?', type: 'select', options: ['Gravar vídeos', 'Artes gráficas'], required: true },
                    { id: 'photos_provided', question: 'Você fornecerá as fotos dos produtos/serviços ou precisaremos usar banco de imagens?', type: 'select', options: ['Eu forneço', 'Usar banco de imagens'], required: true }
                ]
            },
            { id: 'traffic_manager', label: 'Gestor de tráfego pago' },
            { id: 'seo_specialist', label: 'Especialista em SEO' },
            { id: 'copywriter', label: 'Copywriter' },
            { id: 'video_editor', label: 'Editor de vídeo' },
            { id: 'audiovisual_producer', label: 'Produtor audiovisual' },
            { id: 'automation_specialist', label: 'Especialista em automação (ex: n8n)' },
            { id: 'data_analyst', label: 'Analista de dados' },
            { id: 'ai_specialist', label: 'Especialista em IA' },
            { id: 'it_technician', label: 'Técnico de informática' },
            { id: 'tech_support', label: 'Suporte técnico' },
            { id: 'cybersecurity', label: 'Cibersegurança' }
        ]
    },
    {
        id: 'automotive',
        label: 'Automotivo & Transporte',
        subcategories: [
            { id: 'tow_truck', label: 'Guincho', requiresCertification: { name: 'CNH EAR', mandatory: true } },
            {
                id: 'mechanic', label: 'Mecânico automotivo',
                registrationRules: [
                    'Local do Serviço: Na oficina, a domicílio, ou possui serviço de guincho/leva-e-traz.',
                    'Especialidades: Marcas que atende (ex: só nacionais, premium, diesel).',
                    'Garantia: Meses de garantia de mão de obra.'
                ],
                hiringQuestions: [
                    { id: 'car_details', question: 'Qual a marca, modelo, ano e motorização do veículo?', type: 'text', placeholder: 'Ex: VW Gol 2018 1.0', required: true },
                    { id: 'mileage', question: 'Qual a quilometragem atual do carro?', type: 'number', required: true },
                    { id: 'symptoms', question: 'Você tem notado algum barulho estranho, vazamento de óleo ou luz acesa no painel?', type: 'textarea', required: true },
                    { id: 'is_drivable', question: 'O carro está andando normalmente ou precisa ser guinchado?', type: 'select', options: ['Andando normalmente', 'Precisa ser guinchado'], required: true }
                ]
            },
            { id: 'auto_electrician', label: 'Eletricista automotivo' },
            { id: 'body_shop', label: 'Funileiro' },
            { id: 'auto_painter', label: 'Pintor automotivo' },
            { id: 'car_wash', label: 'Lava-car' },
            { id: 'private_driver', label: 'Motorista particular', requiresCertification: { name: 'CNH EAR', mandatory: true } },
            { id: 'escort_driver', label: 'Motorista executivo', requiresCertification: { name: 'CNH EAR', mandatory: true } },
            { id: 'cargo_transport', label: 'Transporte de cargas', requiresCertification: { name: 'CNH EAR', mandatory: true } },
            { id: 'carrier', label: 'Transportadora', requiresCertification: { name: 'CNH EAR', mandatory: true } },
            { id: 'dispatcher', label: 'Despachante' }
        ]
    },
    {
        id: 'domestic',
        label: 'Serviços Domésticos',
        subcategories: [
            {
                id: 'cleaning_lady', label: 'Diarista / Faxineira',
                registrationRules: [
                    'Tipo de faxina: Padrão, Pesada, Pós-obra ou Pré-mudança.',
                    'Precificação: Valor base por m² ou quantidade de cômodos.',
                    'Insumos: "Eu levo os produtos" ou "O cliente fornece os produtos".',
                    'Duração estimada: Meia diária (4h) ou Diária inteira (8h).'
                ],
                hiringQuestions: [
                    { id: 'property_size', question: 'Qual o tamanho aproximado do imóvel (em m²) e a quantidade de quartos/banheiros?', type: 'text', required: true },
                    { id: 'is_furnished', question: 'O imóvel está mobiliado ou vazio?', type: 'select', options: ['Mobiliado', 'Vazio'], required: true },
                    { id: 'has_pets', question: 'Existem animais de estimação na casa?', type: 'text', placeholder: 'Se sim, quais?', required: true },
                    { id: 'dirt_level', question: 'Qual o nível atual de sujeira?', type: 'select', options: ['Manutenção diária', 'Muita sujeira', 'Pós-obra'], required: true },
                    { id: 'supplies_provided', question: 'Você fornecerá os produtos e equipamentos (vassoura, rodo, aspirador)?', type: 'select', options: ['Sim', 'Não'], required: true }
                ]
            },
            { id: 'maid', label: 'Empregada doméstica' },
            { id: 'nanny', label: 'Babá' },
            { id: 'child_caregiver', label: 'Cuidador infantil' },
            { id: 'ironing_lady', label: 'Passadeira' },
            { id: 'gardener', label: 'Jardineiro' },
            { id: 'pool_cleaner', label: 'Piscineiro' }
        ]
    },
    {
        id: 'events',
        label: 'Eventos',
        subcategories: [
            { id: 'photographer', label: 'Fotógrafo' },
            { id: 'videomaker', label: 'Videomaker' },
            { id: 'dj', label: 'DJ' },
            { id: 'event_planner', label: 'Cerimonialista' },
            { id: 'buffet', label: 'Buffet' },
            { id: 'event_decorator', label: 'Decorador de eventos' },
            { id: 'event_security', label: 'Segurança para eventos' },
            { id: 'freelance_waiter', label: 'Garçom freelancer' },
            { id: 'barman', label: 'Barman' },
            { id: 'sound_light_rental', label: 'Locação de som e iluminação' }
        ]
    },
    {
        id: 'business',
        label: 'Empresarial & Administrativo',
        subcategories: [
            { id: 'accountant', label: 'Contador', requiresBoard: { name: 'CRC', mandatory: true, showUf: true } },
            { id: 'financial_consultant', label: 'Consultor financeiro' },
            { id: 'financial_bpo', label: 'BPO financeiro' },
            { id: 'business_consultant', label: 'Consultor empresarial' },
            { id: 'coach', label: 'Coach' },
            { id: 'business_mentor', label: 'Mentor de negócios' },
            { id: 'outsourced_hr', label: 'RH terceirizado' },
            { id: 'recruiter', label: 'Recrutador' },
            { id: 'sales_agent', label: 'Agente comercial' }
        ]
    },
    {
        id: 'maintenance',
        label: 'Serviços Técnicos & Manutenção',
        subcategories: [
            {
                id: 'ac_technician', label: 'Técnico em Ar-condicionado',
                registrationRules: [
                    'Precificação: Valor base até X BTUs e limite de distância da tubulação de cobre.',
                    'Limitações: Necessidade de andaime ou rapel tem custo extra? (Sim/Não/Não faz).'
                ],
                hiringQuestions: [
                    { id: 'btu_capacity', question: 'Qual a marca e a capacidade em BTUs do equipamento?', type: 'text', placeholder: 'Ex: LG, 9.000 BTUs', required: true },
                    { id: 'infrastructure_ready', question: 'A infraestrutura (tubulação embutida na parede e ponto de energia) já está pronta?', type: 'select', options: ['Já está pronta', 'Técnico precisará preparar'], required: true },
                    { id: 'ac_access', question: 'A condensadora (motor externo) ficará em local de fácil acesso?', type: 'select', options: ['Fácil acesso (varanda/chão)', 'Local alto (exige escada/rapel)'], required: true },
                    { id: 'property_type', question: 'O imóvel é casa ou apartamento?', type: 'select', options: ['Casa', 'Apartamento'], required: true }
                ]
            },
            { id: 'fridge_technician', label: 'Técnico em geladeira' },
            { id: 'washer_technician', label: 'Técnico em máquina de lavar' },
            { id: 'solar_installer', label: 'Instalador de energia solar', requiresCertification: { name: 'NR-10', mandatory: true } },
            { id: 'camera_installer', label: 'Instalador de câmeras' },
            { id: 'internet_technician', label: 'Técnico em internet/fibra' },
            { id: 'locksmith', label: 'Chaveiro' }
        ]
    },
    {
        id: 'wellness',
        label: 'Bem-estar & Estética',
        subcategories: [
            { id: 'hairdresser', label: 'Cabeleireiro' },
            { id: 'barber', label: 'Barbeiro' },
            {
                id: 'manicure_pedicure', label: 'Manicure / Pedicure',
                registrationRules: [
                    'Local de Atendimento: Salão próprio ou à domicílio.',
                    'Taxas: Taxa de deslocamento (por km ou fixa) se for à domicílio.',
                    'Duração: Tempo bloqueado na agenda (ex: 2h30).'
                ],
                hiringQuestions: [
                    { id: 'service_type', question: 'É a primeira colocação de alongamento ou é manutenção?', type: 'select', options: ['Primeira colocação', 'Manutenção'], required: true },
                    { id: 'existing_removal', question: 'Você tem algum alongamento atual de outro profissional que precisará ser removido?', type: 'select', options: ['Sim', 'Não'], required: true },
                    { id: 'nail_art', question: 'Deseja decorações (Nail Art, Francesinha, Pedrarias)?', type: 'select', options: ['Sim', 'Não'], required: true },
                    { id: 'allergies', question: 'Você tem alergia a algum componente químico?', type: 'text', placeholder: 'Se sim, especificar', required: false }
                ]
            },
            { id: 'eyebrow_designer', label: 'Designer de sobrancelha' },
            { id: 'makeup_artist', label: 'Maquiador' },
            { id: 'beautician_aesthetic', label: 'Esteticista' },
            { id: 'lash_designer', label: 'Lash designer' },
            { id: 'masseur', label: 'Massagista' }
        ]
    }
];
