
/**
 * Geocoding Utility
 * Should ideally use Google Maps Geocoding API for production.
 * For MVP/Dev, we can use OpenStreetMap Nominatim (Free, rate limited).
 */

export async function getCoordinatesFromAddress(
    street: string,
    number: string,
    district: string,
    city: string,
    state: string,
    country: string = 'Brasil'
): Promise<{ lat: number; lng: number } | null> {
    try {
        const query = `${street}, ${number} - ${district}, ${city} - ${state}, ${country}`;
        const encodedQuery = encodeURIComponent(query);

        // Using Nominatim (OSM)
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&limit=1`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'TGTContrattoMVP/1.0' // Nominatim requires User-Agent
            }
        });

        if (!response.ok) return null;

        const data = await response.json();

        if (data && data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon)
            };
        }

        return null;
    } catch (error) {
        console.error("Geocoding error:", error);
        return null;
    }
}
