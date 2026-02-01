

export type OrderStatus = 'pending_payment' | 'active' | 'in_review' | 'completed' | 'cancelled';

export interface DbOrder {
  id: string;
  created_at: string;
  buyer_id: string;
  seller_id: string;
  service_title: string;
  service_id: string;
  package_tier: 'basic' | 'standard' | 'premium';
  price: number;
  status: OrderStatus;
  delivery_deadline: string;
}

export interface DbMessage {
  id: string;
  order_id: string;
  sender_id: string;
  content: string;
  file_url?: string;
  created_at: string;
}

export interface DbReview {
  id: string;
  order_id: string;
  reviewer_id: string;
  rating: number;
  comment?: string;
  created_at: string;
  profiles?: DbProfile; // For joins
}

export interface DbWallet {
  id: string;
  user_id: string;
  balance: number;
  pending_balance: number;
}

export interface DbTransaction {
  id: string;
  wallet_id: string;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  order_id?: string;
  created_at: string;
}

export interface Address {
  street: string;
  number: string;
  district: string;
  city: string;
  state: string;
  cep: string;
  lat?: number;
  lng?: number;
}

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
  address: Address;
  phone?: string;
  email: string;
  website?: string;
  services: Service[];
  portfolio: PortfolioItem[];
  reviews: Review[];
  distance?: number; // Distance in km from user
}

// Database Interfaces (Reflecting Supabase raw response)
export interface DbProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}



export interface ServicePackage {
  name: 'Basic' | 'Standard' | 'Premium';
  price: number;
  delivery_time: number; // in days
  revisions: number; // -1 for unlimited
  features: string[];
  description: string;
}

export interface ServicePackages {
  basic?: ServicePackage;
  standard?: ServicePackage;
  premium?: ServicePackage;
}

export interface DbService {
  id: string;
  title: string;
  description: string;
  price?: number; // kept for backward compatibility (basic price)
  starting_price?: number; // New field for improved sorting
  duration?: string;
  company_id: string;
  packages?: ServicePackages; // JSONB
  gallery?: string[]; // Array of image URLs
}

export interface DbPortfolioItem {
  id: string;
  type: 'image' | 'video';
  image_url: string;
  caption?: string;
  company_id: string;
  created_at: string;
}

export interface DbCompany {
  id: string;
  slug: string;
  company_name: string;
  legal_name: string;
  cnpj: string;
  logo_url: string | null;
  cover_image_url: string | null;
  category: string;
  description: string | null;
  address: Address; // JSONB
  phone: string;
  email: string;
  website: string | null;
  rating?: number;
  review_count?: number;
  status?: string;
  verified?: boolean;

  // Joins
  services?: DbService[];
  reviews?: DbReview[];
  portfolio_items?: DbPortfolioItem[];
}

export interface Service {
  id: string;
  company_id?: string;
  title: string;
  description: string;
  price?: number;
  starting_price?: number;
  duration?: string;
  packages?: ServicePackages;
  gallery?: string[];
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
  companySlug?: string; // For company users, used in URL routing
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

export interface Booking {
  id: string;
  client_id: string;
  company_id: string;
  service_title: string;
  service_price?: number;
  booking_date: string;
  booking_time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  companies?: {
    company_name: string;
  };
}

// Extended UI Types for Client Orders
export interface BookingWithCompany extends Booking {
  companyName: string;
  serviceName: string;
  price: number;
  date: string;
  time: string;
}

export interface Proposal {
  id: string;
  company_id: string;
  price: number;
  cover_letter: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  company: {
    name: string;
    avatar_url?: string;
  }
}

export interface JobRequest {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  budget_min?: number;
  budget_max?: number;
  proposals: Proposal[];
  category?: { name: string };
}

// Database Types for Joins
export interface DbBooking {
  id: string;
  client_id: string;
  company_id: string;
  service_title: string;
  service_price?: number;
  booking_date: string;
  booking_time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  created_at: string;
  // Joins
  companies?: DbCompany;
}

export interface DbProposal {
  id: string;
  job_id: string;
  company_id: string;
  price: number;
  cover_letter: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  companies?: DbCompany; // Joined
}

export interface DbJobRequest {
  id: string;
  user_id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  budget_min?: number;
  budget_max?: number;
  category_id?: string;

  // Joins
  categories?: { name: string };
  proposals?: DbProposal[];
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'booking_created' | 'booking_confirmed' | 'booking_completed' | 'booking_cancelled' | 'message_received' | 'review_received' | 'company_approved' | 'company_rejected' | 'proposal_received' | 'proposal_accepted';
  title: string;
  message: string;
  link?: string;
  read: boolean;
  created_at: string;
}

// Client Profile Types
export interface Favorite {
  id: string;
  company: {
    id: string;
    name: string;
    logo_url?: string;
    description: string;
    category: string;
    rating: number;
    review_count: number;
    city: string;
    state: string;
  }
}

export interface Conversation {
  contactId: string;
  lastMessage: string;
  date: string;
  unread: boolean;
  name: string;
}
