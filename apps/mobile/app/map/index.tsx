import React, { useState, useEffect, Suspense, lazy } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useServices } from '../../hooks/useServices';

// Lazy load the MapProvider to prevent top-level react-native-maps import crash
const MapProvider = lazy(() => {
    try {
        return import('../../components/map/MapProvider');
    } catch (e) {
        console.error("Critical error loading MapProvider:", e);
        return Promise.resolve({ default: () => <React.Fragment /> });
    }
});

// Basic Error Boundary for catching lazy load failures
class MapErrorBoundary extends React.Component<{ children: React.ReactNode, onError: () => void }, { hasError: boolean }> {
    constructor(props: any) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError() {
        return { hasError: true };
    }
    componentDidCatch(error: any) {
        console.error("Map Error caught by boundary:", error);
        this.props.onError();
    }
    render() {
        if (this.state.hasError) return null;
        return this.props.children;
    }
}

export default function MapScreen() {
    const router = useRouter();
    const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [mapError, setMapError] = useState(false);

    const { data: services, isLoading } = useServices('', userLocation?.coords.latitude, userLocation?.coords.longitude);

    useEffect(() => {
        (async () => {
            try {
                let { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    setErrorMsg('Permissão de localização negada.');
                    return;
                }

                let location = await Location.getCurrentPositionAsync({});
                setUserLocation(location);
            } catch (e) {
                console.error("Location error:", e);
                setErrorMsg('Erro ao obter localização.');
            }
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

    if (mapError) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.errorText}>Erro: Módulo de mapa não disponível.</Text>
                <Text style={styles.errorSubText}>Certifique-se de estar usando um Build de Desenvolvimento compatível.</Text>
                <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
                    <Text style={{ color: '#2563eb', fontWeight: 'bold' }}>Voltar</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <MapErrorBoundary onError={() => setMapError(true)}>
                <Suspense fallback={
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#2563eb" />
                        <Text style={styles.loadingText}>Carregando mapa...</Text>
                    </View>
                }>
                    {!mapError && (
                        <MapProvider 
                            services={services || []} 
                            userLocation={userLocation} 
                            initialRegion={initialRegion}
                        />
                    )}
                </Suspense>
            </MapErrorBoundary>

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
    loadingContainer: {
        flex: 1,
        backgroundColor: '#f8fafc',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    loadingText: {
        color: '#64748b',
        marginTop: 12,
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
        zIndex: 10
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
