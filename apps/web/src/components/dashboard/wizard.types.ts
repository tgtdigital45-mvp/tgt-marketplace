/**
 * Types for the ServiceWizard component and its steps.
 * Centralizes all wizard-related types to enable strict typing and safe refactoring.
 */
import type { LocationType, PriceType } from '@tgt/core';

// ─── Package Tier ────────────────────────────────────────────────────────────

export type PackageTier = 'basic' | 'standard' | 'premium';
export type DeliveryUnit = 'minutes' | 'hours' | 'days';

export interface ServicePackage {
  name: string;
  price: number;
  delivery_time: number;
  delivery_unit: DeliveryUnit;
  revisions: number;
  features: string[];
  description: string;
}

export type PackagesMap = Partial<Record<PackageTier, ServicePackage>>;

// ─── Form Data ───────────────────────────────────────────────────────────────

export interface WizardFormData {
  title: string;
  category: string;
  subcategory: string;
  priceType: PriceType;
  locationType: LocationType;
  description: string;
  tags: string;
  packages: PackagesMap;
  gallery: string[];
  questions: string[];
  attributes: Record<string, string>;
  registrationNumber?: string;
  registrationState?: string;
  meetingUrl?: string;
  addressId?: string;
  radiusKm?: number;
  travelFee?: number;
  promotionalPrice?: number;
}

// ─── Validation ──────────────────────────────────────────────────────────────

export type WizardErrors = Partial<Record<keyof WizardFormData, string>>;

// ─── Step Props ──────────────────────────────────────────────────────────────

export interface StepProps {
  data: WizardFormData;
  updateData: (partial: Partial<WizardFormData>) => void;
  errors?: WizardErrors;
}

// ─── Wizard Props ─────────────────────────────────────────────────────────────

export interface ServiceWizardProps {
  onCancel?: () => void;
  onSuccess?: () => void;
  /** Pass existing service data to enter edit mode */
  initialData?: Record<string, unknown>;
}
