import { Company } from '@tgt/shared';

export const MOCK_COMPANIES: Company[] = [
    {
        id: "1",
        slug: "eco-clean-services",
        companyName: "EcoClean Services",
        legalName: "EcoClean Limpeza Ltda",
        cnpj: "12.345.678/0001-90",
        category: "Limpeza",
        logo: "https://api.dicebear.com/7.x/initials/svg?seed=EC",
        coverImage: "https://images.unsplash.com/photo-1581578731117-104f2a9d4549?auto=format&fit=crop&q=80&w=1000",
        rating: 4.8,
        reviewCount: 156,
        description: "Especialistas em limpeza residencial e comercial ecológica.",
        address: {
            street: "Rua das Flores",
            number: "123",
            district: "Centro",
            city: "São Paulo",
            state: "SP",
            cep: "01000-000"
        },
        email: "contato@ecoclean.com",
        phone: "(11) 99999-9999",
        services: [
            {
                id: "s1",
                title: "Limpeza Padrão",
                description: "Limpeza geral de manutenção",
                price: 150,
                starting_price: 150,
                duration: "4h",
                packages: {
                    basic: { name: 'Basic', price: 150, delivery_time: 1, revisions: 0, features: ['Limpeza chão', 'Pó'], description: 'Básico' }
                }
            }
        ],
        portfolio: [],
        reviews: []
    },
    {
        id: "2",
        slug: "tech-solutions",
        companyName: "Tech Solutions",
        legalName: "Tech Soluções de TI Ltda",
        cnpj: "98.765.432/0001-10",
        category: "Tecnologia",
        logo: "https://api.dicebear.com/7.x/initials/svg?seed=TS",
        coverImage: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1000",
        rating: 4.9,
        reviewCount: 89,
        description: "Suporte técnico e desenvolvimento de software.",
        address: {
            street: "Av. Paulista",
            number: "1000",
            district: "Bela Vista",
            city: "São Paulo",
            state: "SP",
            cep: "01310-100"
        },
        email: "suporte@techsolutions.com",
        phone: "(11) 3333-3333",
        services: [],
        portfolio: [],
        reviews: []
    }
];

export const CATEGORIES = [
    { id: 'limpeza', name: 'Limpeza', icon: 'Sparkles' },
    { id: 'tecnologia', name: 'Tecnologia', icon: 'Laptop' },
    { id: 'marketing', name: 'Marketing', icon: 'Megaphone' },
    { id: 'financas', name: 'Finanças', icon: 'DollarSign' }
];

export const PLANS = [
    {
        name: 'Básico',
        price: 0,
        features: ['Perfil básico', '3 orçamentos/mês', 'Suporte por email']
    },
    {
        name: 'Profissional',
        price: 49.90,
        features: ['Perfil destacado', 'Orçamentos ilimitados', 'Selo de verificado', 'Suporte prioritário']
    }
];
