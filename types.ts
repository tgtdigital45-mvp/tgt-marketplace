
export interface Company {
  id: string;
  slug: string; // Used for URL routing (e.g. /empresa/nome-da-empresa)
  companyName: string;
  legalName: string;
  cnpj: string;
  logo: string;
  coverImage: string;
  category: string;
  rating: number;
  reviewCount: number;
  description: string;
  address: {
    street: string;
    number: string;
    district: string;
    city: string;
    state: string;
    cep: string;
    lat?: number;
    lng?: number;
  };
  phone?: string;
  email: string;
  website?: string;
  services: Service[];
  portfolio: PortfolioItem[];
  reviews: Review[];
}

export interface Service {
  id: string;
  company_id?: string; // Foreign key to company
  title: string;
  description: string;
  price?: number;
  duration?: string;
}

export interface PortfolioItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnailUrl?: string;
  caption: string;
}

export interface Review {
  id: string;
  author: string;
  avatar: string;
  rating: number;
  comment: string;
  date: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  type: 'client' | 'company';
  avatar?: string;
}

export interface UserProfile extends User {
  cpf?: string;
  date_of_birth?: string;
  phone?: string;
  address_street?: string;
  address_number?: string;
  address_complement?: string;
  address_neighborhood?: string;
  address_city?: string;
  address_state?: string;
  address_zip?: string;
}
