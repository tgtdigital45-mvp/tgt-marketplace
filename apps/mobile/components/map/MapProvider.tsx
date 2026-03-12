import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Star } from 'lucide-react-native';
// @ts-ignore - react-native-maps types are incompatible with React 19 class component signature.
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import { ServiceListItem } from '../../hooks/useServices';

type MapProviderProps = {
    services: ServiceListItem[];
    userLocation: any;
    initialRegion: any;
};

export default function MapProvider({ services, userLocation, initialRegion }: MapProviderProps) {
    const router = useRouter();

    return (
        <MapView
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={initialRegion}
            showsUserLocation
            showsMyLocationButton
        >
            {services?.filter((s: ServiceListItem) => s.latitude && s.longitude).map((service: ServiceListItem) => (
                <Marker
                    key={service.id}
                    coordinate={{
                        latitude: service.latitude!,
                        longitude: service.longitude!,
                    }}
                >
                    <View style={styles.markerContainer}>
                        <Text style={styles.markerText}>R${service.price}</Text>
                    </View>
                    <Callout tooltip onPress={() => router.push(`/service/${service.id}`)}>
                        <View style={styles.calloutContainer}>
                            <Text style={styles.calloutTitle}>{service.title}</Text>
                            <View style={styles.calloutRow}>
                                <Star width={10} height={10} color="#f59e0b" fill="#f59e0b" />
                                <Text style={styles.calloutRating}>{service.rating?.toFixed(1) || 'N/A'}</Text>
                                <Text style={styles.calloutCompany}>{service.company_name}</Text>
                            </View>
                            <Text style={styles.calloutCta}>Ver Detalhes</Text>
                        </View>
                    </Callout>
                </Marker>
            ))}
        </MapView>
    );
}

const styles = StyleSheet.create({
    map: {
        width: '100%',
        height: '100%',
    },
    markerContainer: {
        backgroundColor: '#2563eb',
        padding: 8,
        borderRadius: 999,
        borderWidth: 2,
        borderColor: '#ffffff',
    },
    markerText: {
        color: '#ffffff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    calloutContainer: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 12,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        width: 208,
    },
    calloutTitle: {
        color: '#0f172a',
        fontWeight: 'bold',
        fontSize: 14,
        marginBottom: 4,
    },
    calloutRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    calloutRating: {
        color: '#d97706',
        fontSize: 10,
        marginLeft: 4,
        fontWeight: '500',
    },
    calloutCompany: {
        color: '#64748b',
        fontSize: 10,
        marginLeft: 4,
        paddingLeft: 4,
        borderLeftWidth: 1,
        borderLeftColor: '#e2e8f0',
    },
    calloutCta: {
        color: '#2563eb',
        fontWeight: 'bold',
        fontSize: 12,
        marginTop: 4,
    },
});
