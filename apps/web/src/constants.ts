
import { Company } from '@tgt/shared';

export const CATEGORIES = [
  "Marketing",
  "Tecnologia",
  "Design",
  "Consultoria",
  "Contabilidade",
  "Advocacia",
  "Arquitetura",
  "Fotografia",
  "Educação",
  "Saúde",
];

export const MOCK_COMPANIES: Company[] = [
  {
    id: '1',
    profileId: 'mock-profile-1',
    slug: 'adega-vinho-sul',
    companyName: 'Adega Vinho Sul',
    legalName: 'Adega Vinho Sul Comercio Ltda',
    cnpj: '12.345.678/0001-90',
    logo: 'https://images.unsplash.com/photo-1599388147551-73934d4d1373?w=400&h=400&fit=crop',
    coverImage: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=1200&q=80',
    category: 'Vinhos',
    rating: 4.8,
    reviewCount: 125,
    description: 'Loja especializada em vinhos finos nacionais e importados. Oferecemos uma vasta seleção dos melhores rótulos para apreciadores e colecionadores. Venha nos visitar e participe de nossas degustações semanais.',
    address: {
      street: 'Av. Brasil',
      number: '1234',
      district: 'Centro',
      city: 'Cascavel',
      state: 'PR',
      cep: '85801-000',
      lat: -24.9555,
      lng: -53.4550,
    },
    phone: '+55 (45) 99999-9999',
    email: 'contato@vinhosul.com',
    website: 'www.vinhosul.com',
    services: [
      { id: 's1', title: 'Degustação Guiada', description: 'Uma experiência sensorial com 5 rótulos selecionados.', price: 150.00, duration: '2 horas' },
      { id: 's2', title: 'Consultoria de Adega', description: 'Ajudamos você a montar a adega dos seus sonhos.', price: 500.00 },
      { id: 's3', title: 'Venda de Vinhos Raros', description: 'Acesso a rótulos exclusivos e de safras antigas.' }
    ],
    portfolio: [
      { id: 'p1', type: 'image', url: 'https://images.unsplash.com/photo-1568213816046-0ee1c42bd559?w=800&h=600&fit=crop', caption: 'Nossa fachada' },
      { id: 'p2', type: 'image', url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&h=600&fit=crop', caption: 'Seleção de vinhos tintos' },
      { id: 'p3', type: 'image', url: 'https://images.unsplash.com/photo-1528823872057-9c0182e68c43?w=800&h=600&fit=crop', caption: 'Evento de degustação' },
      { id: 'p4', type: 'image', url: 'https://images.unsplash.com/photo-1464639351491-a172a2aa9919?w=800&h=600&fit=crop', caption: 'Interior da loja' },
    ],
    reviews: [
      { id: 'r1', author: 'Carlos Pereira', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop', rating: 5, comment: 'Atendimento excelente e vinhos de alta qualidade!', date: '2 dias atrás' },
      { id: 'r2', author: 'Ana Julia', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop', rating: 4, comment: 'Ótima variedade, mas os preços são um pouco altos.', date: '1 semana atrás' },
    ]
  },
  {
    id: '2',
    profileId: 'mock-profile-2',
    slug: 'tech-solutions',
    companyName: 'Tech Solutions',
    legalName: 'Soluções em Tecnologia Ltda',
    cnpj: '98.765.432/0001-10',
    logo: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=400&fit=crop',
    coverImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
    category: 'Tecnologia',
    rating: 4.5,
    reviewCount: 88,
    description: 'Consultoria e desenvolvimento de software sob medida para o seu negócio. Transformamos ideias em soluções digitais inovadoras e eficientes.',
    address: {
      street: 'Rua da Inovação',
      number: '567',
      district: 'Polo Tecnológico',
      city: 'São Paulo',
      state: 'SP',
      cep: '01000-000',
      lat: -23.5505,
      lng: -46.6333,
    },
    phone: '+55 (11) 98888-8888',
    email: 'contato@techsolutions.com',
    website: 'www.techsolutions.com',
    services: [
      { id: 's1', title: 'Desenvolvimento Web', description: 'Criação de sites e sistemas web responsivos.', price: 8000.00 },
      { id: 's2', title: 'Desenvolvimento Mobile', description: 'Aplicativos nativos para iOS e Android.', price: 15000.00 },
    ],
    portfolio: [
      { id: 'p1', type: 'image', url: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=800&h=600&fit=crop', caption: 'Nosso escritório' },
      { id: 'p2', type: 'image', url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop', caption: 'Equipe em ação' },
    ],
    reviews: [
      { id: 'r1', author: 'Mariana Costa', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop', rating: 5, comment: 'Projeto entregue no prazo com qualidade impecável. Recomendo!', date: '1 mês atrás' },
    ]
  },
];
