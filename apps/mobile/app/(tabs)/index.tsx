import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Image,
    RefreshControl,
} from 'react-native';
import { Search, MapPin, Bell, Star } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useServices, ServiceListItem } from '@/hooks/useServices';
import { useNotifications } from '@/providers/NotificationProvider';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { useEffect } from 'react';

const CATEGORIES = [
    { name: 'Limpeza', emoji: '🧹' },
    { name: 'Reformas', emoji: '🔨' },
    { name: 'Elétrica', emoji: '⚡' },
    { name: 'Design', emoji: '🎨' },
    { name: 'Tech', emoji: '💻' },
    { name: 'Consultoria', emoji: '📊' },
];

function ServiceCard({ service }: { service: ServiceListItem }) {
    const router = useRouter();
    const displayPrice = service.starting_price ?? service.price;

    return (
        <TouchableOpacity
            className="bg-white rounded-2xl mb-4 border border-slate-100 shadow-sm overflow-hidden"
            onPress={() => router.push(`/service/${service.id}`)}
        >
            {service.image_url ? (
                <Image
                    source={{ uri: service.image_url }}
                    className="w-full h-36"
                    resizeMode="cover"
                />
            ) : (
                <View className="w-full h-36 bg-slate-100 items-center justify-center">
                    <Text className="text-slate-400 text-4xl">🛠️</Text>
                </View>
            )}

            <View className="p-4">
                {/* Company Info */}
                <View className="flex-row items-center mb-2">
                    {service.company_logo ? (
                        <Image
                            source={{ uri: service.company_logo }}
                            className="w-6 h-6 rounded-full mr-2"
                        />
                    ) : (
                        <View className="w-6 h-6 rounded-full bg-brand-accent/10 items-center justify-center mr-2">
                            <Text className="text-xs">👤</Text>
                        </View>
                    )}
                    <Text className="text-brand-secondary text-xs font-medium" numberOfLines={1}>
                        {service.company_name}
                    </Text>
                    {(service.rating ?? 0) > 0 && (
                        <View className="flex-row items-center ml-auto">
                            <Star size={12} color="#f59e0b" fill="#f59e0b" />
                            <Text className="text-xs text-amber-600 ml-1 font-medium">
                                {service.rating?.toFixed(1)}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Title */}
                <Text className="text-brand-primary font-bold text-base mb-1" numberOfLines={2}>
                    {service.title}
                </Text>

                {/* Category Tag */}
                {service.category_tag && (
                    <View className="self-start bg-brand-accent/10 rounded-full px-3 py-1 mb-2">
                        <Text className="text-brand-accent text-xs font-medium">
                            {service.category_tag}
                        </Text>
                    </View>
                )}

                {/* Price */}
                <View className="flex-row items-baseline">
                    <Text className="text-brand-secondary text-xs">A partir de </Text>
                    <Text className="text-brand-primary text-lg font-bold">
                        R$ {displayPrice.toFixed(2).replace('.', ',')}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );
}

export default function HomeScreen() {
    const [searchText, setSearchText] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const { data: services, isLoading, isError, refetch } = useServices(
        debouncedSearch,
        location?.coords.latitude,
        location?.coords.longitude
    );
    const { unreadCount } = useNotifications();
    const [refreshing, setRefreshing] = useState(false);

    // Initial Location
    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                return;
            }
            try {
                let loc = await Location.getCurrentPositionAsync({});
                setLocation(loc);
            } catch (err) {
                console.log("Could not get location:", err);
            }
        })();
    }, []);

    // Simple debounce on search submit
    const handleSearchSubmit = useCallback(() => {
        setDebouncedSearch(searchText);
    }, [searchText]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    }, [refetch]);

    return (
        <ScrollView
            className="flex-1 bg-brand-background"
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
        >
            {/* Header */}
            <View className="px-6 pt-12 pb-6 bg-brand-primary rounded-b-3xl">
                <View className="flex-row justify-between items-center mb-6">
                    <View className="flex-row items-center">
                        <MapPin size={20} color="#ffffff" />
                        <Text className="text-white ml-2 font-medium">São Paulo, SP</Text>
                    </View>
                    <TouchableOpacity className="relative p-1">
                        <Bell size={24} color="#ffffff" />
                        {unreadCount > 0 && (
                            <View className="absolute top-0 right-0 bg-red-500 rounded-full w-4 h-4 items-center justify-center border border-white">
                                <Text className="text-white text-[10px] font-bold">{unreadCount > 9 ? '9+' : unreadCount}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                <Text className="text-white text-2xl font-bold mb-4">
                    O que você precisa hoje?
                </Text>

                <View className="flex-row items-center bg-white rounded-xl px-4 py-2">
                    <Search size={20} color="#94a3b8" />
                    <TextInput
                        placeholder="Buscar serviços..."
                        className="flex-1 ml-2 text-brand-primary"
                        placeholderTextColor="#94a3b8"
                        value={searchText}
                        onChangeText={setSearchText}
                        onSubmitEditing={handleSearchSubmit}
                        returnKeyType="search"
                    />
                </View>
            </View>

            {/* Map Preview */}
            <View className="px-6 mt-6">
                <View className="h-64 rounded-3xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
                    <MapView
                        style={{ width: '100%', height: '100%' }}
                        initialRegion={{
                            latitude: location?.coords.latitude ?? -24.9573,    // Default to Cascavel if not found
                            longitude: location?.coords.longitude ?? -53.4590,
                            latitudeDelta: 0.0922,
                            longitudeDelta: 0.0421,
                        }}
                        showsUserLocation={true}
                    >
                        {services?.map((service) => {
                            if (service.latitude && service.longitude) {
                                return (
                                    <Marker
                                        key={service.id}
                                        coordinate={{ latitude: service.latitude, longitude: service.longitude }}
                                        title={service.company_name}
                                        description={service.title}
                                    />
                                );
                            }
                            return null;
                        })}
                    </MapView>
                </View>
            </View>

            {/* Categories */}
            <View className="px-6 mt-8">
                <Text className="text-brand-primary text-xl font-bold mb-4">Categorias</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {CATEGORIES.map((cat) => (
                        <TouchableOpacity
                            key={cat.name}
                            onPress={() => {
                                setSearchText(cat.name);
                                setDebouncedSearch(cat.name);
                            }}
                            className="bg-white px-5 py-3 rounded-xl mr-3 items-center shadow-sm border border-slate-100"
                        >
                            <Text className="text-2xl mb-1">{cat.emoji}</Text>
                            <Text className="text-brand-secondary text-xs font-medium">{cat.name}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Services List */}
            <View className="px-6 mt-6 pb-20">
                <Text className="text-brand-primary text-xl font-bold mb-4">
                    {debouncedSearch ? `Resultados para "${debouncedSearch}"` : 'Serviços em Destaque'}
                </Text>

                {isLoading && (
                    <View className="items-center py-12">
                        <ActivityIndicator size="large" color="#2563eb" />
                        <Text className="text-brand-secondary mt-4">Buscando serviços...</Text>
                    </View>
                )}

                {isError && (
                    <View className="items-center py-12 bg-red-50 rounded-2xl">
                        <Text className="text-red-500 text-lg font-bold mb-2">Ops!</Text>
                        <Text className="text-red-400 text-center px-4">
                            Não foi possível carregar os serviços. Puxe para baixo para tentar novamente.
                        </Text>
                    </View>
                )}

                {!isLoading && !isError && services?.length === 0 && (
                    <View className="items-center py-12">
                        <Text className="text-4xl mb-4">🔍</Text>
                        <Text className="text-brand-primary text-lg font-bold mb-2">
                            Nenhum serviço encontrado
                        </Text>
                        <Text className="text-brand-secondary text-center">
                            Tente outra busca ou explore as categorias acima.
                        </Text>
                    </View>
                )}

                {services?.map((service) => (
                    <ServiceCard key={service.id} service={service} />
                ))}
            </View>
        </ScrollView>
    );
}
