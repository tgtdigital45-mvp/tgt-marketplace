import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { ArrowLeft, Navigation, Star } from 'lucide-react-native';
import { useServices, ServiceListItem } from '@/hooks/useServices';

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
            <View className="flex-1 bg-brand-background justify-center items-center">
                <ActivityIndicator size="large" color="#2563eb" />
                <Text className="text-brand-secondary mt-3">Localizando você...</Text>
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
                {services?.filter(s => s.latitude && s.longitude).map((service) => (
                    <Marker
                        key={service.id}
                        coordinate={{
                            latitude: service.latitude!,
                            longitude: service.longitude!,
                        }}
                    >
                        <View className="bg-brand-accent p-2 rounded-full border-2 border-white shadow-md">
                            <Text className="text-white text-[10px] font-bold">R${service.price}</Text>
                        </View>
                        <Callout tooltip onPress={() => router.push(`/service/${service.id}`)}>
                            <View className="bg-white rounded-2xl p-3 border border-slate-100 shadow-lg w-52">
                                <Text className="text-brand-primary font-bold text-sm mb-1">{service.title}</Text>
                                <View className="flex-row items-center mb-1">
                                    <Star size={10} color="#f59e0b" fill="#f59e0b" />
                                    <Text className="text-amber-600 text-[10px] ml-1 font-medium">{service.rating?.toFixed(1) || 'N/A'}</Text>
                                    <Text className="text-brand-secondary text-[10px] ml-1 border-l border-slate-200 pl-1">{service.company_name}</Text>
                                </View>
                                <Text className="text-brand-accent font-bold text-xs mt-1">Ver Detalhes</Text>
                            </View>
                        </Callout>
                    </Marker>
                ))}
            </MapView>

            {/* Back Button Overlay */}
            <TouchableOpacity
                onPress={() => router.back()}
                className="absolute top-12 left-4 bg-white rounded-full p-3 shadow-lg border border-slate-100"
            >
                <ArrowLeft size={20} color="#0f172a" />
            </TouchableOpacity>

            {/* Locate Me Info */}
            {errorMsg && (
                <View className="absolute bottom-10 left-6 right-6 bg-red-50 p-4 rounded-xl border border-red-100">
                    <Text className="text-red-500 text-sm text-center font-medium">{errorMsg}</Text>
                    <Text className="text-red-400 text-xs text-center mt-1">Exibindo localização padrão</Text>
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
});
