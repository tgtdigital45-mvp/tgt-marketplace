export interface NewsPost {
    slug: string;
    image: string;
    category: string;
    date: string; // ISO 8601
    readTime: string;
    title: string;
    excerpt: string;
    content?: string; // markdown or html
    author: {
        name: string;
        role: string;
        avatar: string;
    };
}

export const MOCK_NEWS: NewsPost[] = [
    {
        slug: 'tendencias-mercado-servicos-2024',
        image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=2426&h=1600',
        category: 'Mercado',
        date: '2024-03-15T09:00:00Z',
        readTime: '5 min',
        title: 'As 5 maiores tendências para o mercado de serviços em 2024',
        excerpt: 'Descubra como a digitalização e a personalização estão transformando a maneira como contratamos e prestamos serviços locais.',
        author: {
            name: 'Ana Silva',
            role: 'Editora Chefe',
            avatar: 'https://i.pravatar.cc/150?u=ana'
        }
    },
    {
        slug: 'marketing-digital-para-autonomos',
        image: 'https://images.unsplash.com/photo-1557838465-39130cf1d088?auto=format&fit=crop&q=80&w=2000&h=1400',
        category: 'Marketing',
        date: '2024-03-10T14:30:00Z',
        readTime: '8 min',
        title: 'Guia definitivo de Marketing Digital para Profissionais Autônomos',
        excerpt: 'Estratégias práticas para aumentar sua visibilidade online e atrair mais clientes qualificados sem gastar uma fortuna.',
        author: {
            name: 'Carlos Oliveira',
            role: 'Especialista em Marketing',
            avatar: 'https://i.pravatar.cc/150?u=carlos'
        }
    },
    {
        slug: 'gestao-financeira-pequenas-empresas',
        image: 'https://images.unsplash.com/photo-1554224155-7926b551f0f5?auto=format&fit=crop&q=80&w=2000&h=1400',
        category: 'Finanças',
        date: '2024-03-05T10:00:00Z',
        readTime: '6 min',
        title: 'Gestão Financeira: Erros comuns que impedem sua empresa de crescer',
        excerpt: 'Saiba como organizar o fluxo de caixa, separar contas pessoais e empresariais e planejar investimentos futuros.',
        author: {
            name: 'Mariana Santos',
            role: 'Consultora Financeira',
            avatar: 'https://i.pravatar.cc/150?u=mariana'
        }
    }
];
