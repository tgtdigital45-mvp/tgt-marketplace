/**
 * Service type resolution utilities.
 * Single source of truth for mapping wizard form data → database enums.
 *
 * Extracted from ServiceWizard.tsx to be shared across apps (web, web-pro, web-portal).
 */

/** How the service is delivered to the client */
export type LocationType = 'in_store' | 'at_home' | 'remote';

/** How the service is priced */
export type PriceType = 'fixed' | 'packages' | 'budget';

/**
 * Internal DB enum stored in services.service_type.
 * Controls marketplace filtering and display logic.
 */
export type ServiceType =
  | 'remote_fixed'
  | 'local_provider_fixed'
  | 'local_client_fixed'
  | 'requires_quote';

const LOCATION_TO_SERVICE_TYPE: Record<LocationType, ServiceType> = {
  remote: 'remote_fixed',
  at_home: 'local_client_fixed',
  in_store: 'local_provider_fixed',
};

/**
 * Resolves the DB service_type from wizard form fields.
 *
 * @example
 * resolveServiceType('budget', 'remote') // → 'requires_quote'
 * resolveServiceType('fixed', 'at_home') // → 'local_client_fixed'
 */
export function resolveServiceType(
  priceType: PriceType,
  locationType: LocationType,
): ServiceType {
  if (priceType === 'budget') return 'requires_quote';
  return LOCATION_TO_SERVICE_TYPE[locationType] ?? 'local_provider_fixed';
}
