// Shared Types for CONTRATTO Marketplace

export interface Address {
  cep: string;
  street: string;
  number: string;
  district: string;
  city: string;
  state: string;
  complement?: string;
  lat?: number;
  lng?: number;
}

export interface ServicePackage {
  name: string;
  description: string;
  price: number;
  delivery_time: number;
  revisions: number;
  features: string[];
}

export interface ServicePackages {
  basic: ServicePackage;
  standard?: ServicePackage;
  premium?: ServicePackage;
}

export interface Company {
  id: string;
  profileId: string;
  slug: string;
  companyName: string;
  legalName?: string;
  cnpj?: string;
  displayName?: string;
  logo: string;
  coverImage?: string;
  category: string;
  rating: number;
  distance?: number;
  reviewCount: number;
  verified?: boolean;
  level: string;
  description: string;
  location?: string;
  memberSince?: string;
  responseTime?: string;
  services: Service[];
  reviews: Review[];
  portfolio: PortfolioItem[];
  current_plan_tier?: 'basic' | 'pro' | 'agency';
  stripe_account_id?: string;
  stripe_charges_enabled?: boolean;
  is_active?: boolean;
  social_links?: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
  };
  address?: Address;
  owner?: {
    fullName: string;
    avatar: string;
    location: string;
    memberSince: string;
    responseTime: string;
    skills?: string[];
    languages?: { language: string; level: string }[];
  };
  website?: string;
  phone?: string;
  email?: string;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
  starting_price?: number;
  image: string;
  category: string;
  rating: number;
  reviewCount: number;
  author: {
    name: string;
    avatar: string;
  };
  deliveryTime?: string;
  companyId?: string;
  companyName?: string;
  companySlug?: string;
  duration?: string;
  duration_minutes?: number;
  packages?: ServicePackages;
  gallery?: string[];
  attributes?: Record<string, string>;
  details?: Record<string, any>;
  faq?: { question: string; answer: string; }[];
  service_type?: 'remote' | 'presential_customer_goes' | 'presential_company_goes' | 'hybrid' | string;
  is_single_package?: boolean;
  requires_quote?: boolean;
  category_tag?: string;
  image_url?: string;
  is_active?: boolean;
  tags?: string[];
  h3_index?: string;
  use_company_availability?: boolean;
  pricing_model?: 'hourly' | 'daily' | 'fixed';
  subcategory?: string;
  registration_number?: string;
  registration_state?: string;
  registration_image?: string;
  certification_id?: string;
  company?: DbCompany;
}

export interface DbCompany {
  id: string;
  slug: string;
  company_name: string;
  logo_url: string;
  cover_image?: string;
  category: string;
  description: string;
  verified: boolean;
  address: Address;
  rating?: number;
  review_count?: number;
  owner_id: string;
  member_since?: string;
  response_time?: string;
  current_plan_tier?: 'basic' | 'pro' | 'agency';
  stripe_account_id?: string;
  stripe_charges_enabled?: boolean;
  is_active?: boolean;
  social_links?: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
  };
  level?: string;
  clients_count?: number;
  recurring_clients_percent?: number;
  profile_id: string;
  legal_name?: string;
  cnpj?: string;
  phone?: string;
  email?: string;
  website?: string;
  cover_image_url?: string;
  city?: string;
  state?: string;
  created_at?: string;
}

export interface DbProfile {
  id: string;
  full_name: string;
  avatar_url?: string;
  user_type?: 'client' | 'company';
  role?: string;
}

export interface DbService {
  id: string;
  company_id: string;
  title: string;
  description: string;
  price: number;
  starting_price?: number;
  duration?: string;
  duration_minutes?: number; // New field for precise scheduling
  packages?: ServicePackages;
  gallery?: string[];
  attributes?: Record<string, string>; // e.g. { "Style": "Minimalist", "File Format": "PNG, SVG" }
  details?: Record<string, any>; // e.g. { "methodology": "...", "target_audience": "..." }
  faq?: { question: string; answer: string; }[];
  // H3 + Marketplace fields
  service_type?: 'remote' | 'presential_customer_goes' | 'presential_company_goes' | 'hybrid' | string;
  is_single_package?: boolean;
  requires_quote?: boolean;
  category_tag?: string;
  image_url?: string;
  is_active?: boolean;
  tags?: string[];
  h3_index?: string;
  use_company_availability?: boolean;
  pricing_model?: 'hourly' | 'daily' | 'fixed';
  subcategory?: string;
  registration_number?: string;
  registration_state?: string;
  registration_image?: string;
  certification_id?: string;
  // Joined company data
  company_name?: string;
  company_logo?: string;
  company_rating?: number;
  company_slug?: string;
  company?: DbCompany;
}

export interface PortfolioItem {
  id: string;
  title: string;
  description?: string;
  image_url: string;
  company_id?: string;
  created_at?: string;
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
  role?: 'user' | 'admin' | 'moderator'; // RBAC role
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
  order_id?: string;
  booking_date: string;
  booking_time: string;
  service_duration_minutes?: number;
  proposed_date?: string;
  proposed_time?: string;
  proposal_expires_at?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'pending_client_approval';
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
  order_id?: string;
  booking_date: string;
  booking_time: string;
  service_duration_minutes?: number;
  proposed_date?: string;
  proposal_expires_at?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'pending_client_approval';
  created_at: string;
  // Joins
  companies?: DbCompany;
  hiring_responses?: Record<string, any>;
}

export interface DbOrder {
  id: string;
  buyer_id: string;
  seller_id: string;
  service_id: string;
  service_title: string;
  package_tier: 'basic' | 'standard' | 'premium';
  price: number;
  status: 'pending_payment' | 'active' | 'delivered' | 'completed' | 'cancelled' | 'in_progress';
  saga_status: 'PENDING' | 'COMPLETED' | 'FAILED';
  delivery_deadline: string;
  hiring_responses?: Record<string, any>;
  package_snapshot?: any;
  revision_count?: number;
  created_at: string;
  updated_at: string;
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

export interface SellerStats {
  seller_id: string;
  total_completed_orders: number;
  average_rating: number;
  on_time_delivery_rate: number;
  current_level: 'Beginner' | 'Level 1' | 'Level 2' | 'Pro';
  next_level: 'Level 1' | 'Level 2' | 'Pro' | null;
  orders_to_next_level: number;
}
