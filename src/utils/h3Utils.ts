/**
 * H3 Geolocation Utilities — Uber H3 Hexagonal Indexing
 *
 * Strategy: Convert lat/lng to H3 cell index on the frontend,
 * then query Supabase with a simple IN clause (no math in SQL).
 *
 * Resolution guide:
 *   8 = ~460m radius  → Urban services (default)
 *   7 = ~1.4km radius → Smaller cities / regional
 *   6 = ~4km radius   → Rural / wide-area services
 */

import { latLngToCell, gridDisk, cellToLatLng } from 'h3-js';

export const H3_RESOLUTION_URBAN = 8;   // ~460m — default for cities
export const H3_RESOLUTION_REGIONAL = 7; // ~1.4km — smaller cities

/**
 * Convert lat/lng coordinates to an H3 cell index.
 * @param lat Latitude
 * @param lng Longitude
 * @param resolution H3 resolution (default: 8 = urban ~460m)
 */
export function coordsToH3(
    lat: number,
    lng: number,
    resolution: number = H3_RESOLUTION_URBAN
): string {
    return latLngToCell(lat, lng, resolution);
}

/**
 * Get all H3 cell indexes within k rings of a center cell.
 * k=0 → just the center (1 cell)
 * k=1 → center + 6 neighbors (7 cells)
 * k=2 → center + 18 neighbors (19 cells) ← default ~1.4km coverage at res 8
 * k=3 → center + 36 neighbors (37 cells) ← ~2.3km coverage at res 8
 *
 * @param h3Index Center H3 cell index
 * @param k Number of rings (default: 2)
 */
export function getNeighborIndexes(h3Index: string, k: number = 2): string[] {
    return gridDisk(h3Index, k);
}

/**
 * Get the center lat/lng of an H3 cell (for displaying on map).
 */
export function h3ToCoords(h3Index: string): { lat: number; lng: number } {
    const [lat, lng] = cellToLatLng(h3Index);
    return { lat, lng };
}

/**
 * Full pipeline: from user's GPS position to array of H3 neighbor indexes
 * ready to be used in a Supabase query.
 *
 * @param lat User's latitude
 * @param lng User's longitude
 * @param radiusRings Number of H3 rings (2 = ~1.4km at res 8)
 * @param resolution H3 resolution (8 = urban, 7 = regional)
 */
export function getSearchIndexes(
    lat: number,
    lng: number,
    radiusRings: number = 2,
    resolution: number = H3_RESOLUTION_URBAN
): string[] {
    const centerIndex = coordsToH3(lat, lng, resolution);
    return getNeighborIndexes(centerIndex, radiusRings);
}

/**
 * Get the user's current position via browser Geolocation API.
 * Returns null if permission denied or not available.
 */
export function getUserLocation(): Promise<{ lat: number; lng: number } | null> {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            resolve(null);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => resolve(null),
            { timeout: 5000, maximumAge: 60000 }
        );
    });
}

/**
 * Full pipeline: get user location → compute H3 search indexes.
 * Returns null if location is unavailable (user denied permission).
 */
export async function getH3SearchIndexes(
    radiusRings: number = 2,
    resolution: number = H3_RESOLUTION_URBAN
): Promise<string[] | null> {
    const location = await getUserLocation();
    if (!location) return null;
    return getSearchIndexes(location.lat, location.lng, radiusRings, resolution);
}
