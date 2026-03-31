
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
        // Query 1: Mais específica (Rua, Número, Bairro, Cidade)
        const query1 = `${street}, ${number} - ${district}, ${city} - ${state}, ${country}`;
        const encodedQuery1 = encodeURIComponent(query1);

        // Using Nominatim (OSM)
        const url1 = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery1}&limit=1`;

        const response1 = await fetch(url1, {
            headers: {
                'User-Agent': 'CONTRATTO/1.0'
            }
        });

        if (response1.ok) {
            const data1 = await response1.json();
            if (data1 && data1.length > 0) {
                return {
                    lat: parseFloat(data1[0].lat),
                    lng: parseFloat(data1[0].lon)
                };
            }
        }

        // Query 2: Menos específica se a primeira falhar (Sem bairro, as vezes Nominatim se perde no bairro)
        const query2 = `${street}, ${number}, ${city} - ${state}, ${country}`;
        const encodedQuery2 = encodeURIComponent(query2);
        const url2 = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery2}&limit=1`;

        const response2 = await fetch(url2, {
            headers: {
                'User-Agent': 'CONTRATTO/1.0'
            }
        });

        if (response2.ok) {
            const data2 = await response2.json();
            if (data2 && data2.length > 0) {
                return {
                    lat: parseFloat(data2[0].lat),
                    lng: parseFloat(data2[0].lon)
                };
            }
        }

        return null;
    } catch (error) {
        console.error("Geocoding error:", error);
        return null;
    }
}
