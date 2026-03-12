import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { ArrowLeft, Star } from 'lucide-react-native';
import { useServices, ServiceListItem } from '@/hooks/useServices';

// react-native-maps types are incompatible with React 19 class component signature.
// Dynamic import with @ts-ignore is used to avoid TypeScript errors.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const MapView = require('react-native-maps').default as React.ComponentType<any>;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Marker, Callout, PROVIDER_GOOGLE } = require('react-native-maps') as {
    Marker: React.ComponentType<any>;
    Callout: React.ComponentType<any>;
    PROVIDER_GOOGLE: string;
};

export default function MapScreen() {
    const router = useRouter();
    const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const { data: services, isLoading } = useServices('', userLocation?.coords.latitude, userLocation?.coords.longitude);

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('Permissão de localização negada.');
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            setUserLocation(location);
        })();
    }, []);

    const initialRegion = {
        latitude: userLocation?.coords.latitude ?? -23.5505, // São Paulo default
        longitude: userLocation?.coords.longitude ?? -46.6333,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
    };

    if (!userLocation && !errorMsg) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2563eb" />
                <Text style={styles.loadingText}>Localizando você...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
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

            {/* Back Button Overlay */}
            <TouchableOpacity
                onPress={() => router.back()}
                style={styles.backButton}
            >
                <ArrowLeft size={20} color="#0f172a" />
            </TouchableOpacity>

            {/* Error Message */}
            {errorMsg && (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{errorMsg}</Text>
                    <Text style={styles.errorSubText}>Exibindo localização padrão</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        width: '100%',
        height: '100%',
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: '#f8fafc',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#64748b',
        marginTop: 12,
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
    backButton: {
        position: 'absolute',
        top: 48,
        left: 16,
        backgroundColor: '#ffffff',
        borderRadius: 999,
        padding: 12,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    errorContainer: {
        position: 'absolute',
        bottom: 40,
        left: 24,
        right: 24,
        backgroundColor: '#fef2f2',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#fee2e2',
    },
    errorText: {
        color: '#ef4444',
        fontSize: 14,
        textAlign: 'center',
        fontWeight: '500',
    },
    errorSubText: {
        color: '#f87171',
        fontSize: 12,
        textAlign: 'center',
        marginTop: 4,
    },
});
