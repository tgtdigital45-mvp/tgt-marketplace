import React from 'react';
import {
    View,
    Text,
    ScrollView,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    ArrowLeft,
    Star,
    MapPin,
    Clock,
    Tag,
    ChevronRight,
    AlertCircle,
    Briefcase,
} from 'lucide-react-native';
import { useServiceDetails } from '@/hooks/useServiceDetails';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function formatCurrency(value: number): string {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
}

function ServiceTypeLabel({ type }: { type?: string }) {
    const labels: Record<string, { text: string; emoji: string }> = {
        remote: { text: 'Remoto', emoji: '💻' },
        presential_customer_goes: { text: 'Presencial (você vai)', emoji: '🚶' },
        presential_company_goes: { text: 'Presencial (profissional vai)', emoji: '🚗' },
        hybrid: { text: 'Híbrido', emoji: '🔄' },
    };
    const label = labels[type ?? ''] ?? { text: 'A combinar', emoji: '📋' };

    return (
        <View className="flex-row items-center bg-brand-accent/10 rounded-full px-3 py-1.5">
            <Text className="mr-1">{label.emoji}</Text>
            <Text className="text-brand-accent text-xs font-semibold">{label.text}</Text>
        </View>
    );
}

// --- Loading Skeleton ---
function LoadingSkeleton() {
    return (
        <View className="flex-1 bg-brand-background">
            <View className="w-full h-64 bg-slate-200" />
            <View className="px-6 pt-6">
                <View className="w-3/4 h-7 bg-slate-200 rounded-lg mb-3" />
                <View className="w-1/2 h-5 bg-slate-200 rounded-lg mb-6" />
                <View className="w-full h-20 bg-slate-200 rounded-xl mb-4" />
                <View className="w-full h-20 bg-slate-200 rounded-xl mb-4" />
                <View className="w-2/3 h-16 bg-slate-200 rounded-xl" />
            </View>
            <View className="items-center mt-10">
                <ActivityIndicator size="large" color="#2563eb" />
                <Text className="text-brand-secondary mt-3">Carregando serviço...</Text>
            </View>
        </View>
    );
}

// --- Error State ---
function ErrorState({ message, onBack }: { message: string; onBack: () => void }) {
    return (
        <View className="flex-1 bg-brand-background justify-center items-center px-6">
            <View className="bg-red-50 p-6 rounded-full mb-6">
                <AlertCircle size={48} color="#ef4444" />
            </View>
            <Text className="text-brand-primary text-xl font-bold mb-2 text-center">
                Ops, algo deu errado
            </Text>
            <Text className="text-brand-secondary text-center mb-8">{message}</Text>
            <TouchableOpacity
                onPress={onBack}
                className="bg-brand-primary rounded-xl py-3 px-8"
            >
                <Text className="text-white font-bold">Voltar</Text>
            </TouchableOpacity>
        </View>
    );
}

// --- Main Screen ---
export default function ServiceDetailsScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { data: service, isLoading, isError, error } = useServiceDetails(id ?? '');

    if (isLoading) return <LoadingSkeleton />;

    if (isError || !service) {
        return (
            <ErrorState
                message={(error as Error)?.message ?? 'Serviço não encontrado.'}
                onBack={() => router.back()}
            />
        );
    }

    const displayPrice = service.starting_price ?? service.price;
    const hasFaq = service.faq && service.faq.length > 0;

    return (
        <View className="flex-1 bg-brand-background">
            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
                {/* Hero Image */}
                <View className="relative">
                    {service.image_url ? (
                        <Image
                            source={{ uri: service.image_url }}
                            style={{ width: SCREEN_WIDTH, height: 260 }}
                            resizeMode="cover"
                        />
                    ) : (
                        <View
                            style={{ width: SCREEN_WIDTH, height: 260 }}
                            className="bg-slate-200 items-center justify-center"
                        >
                            <Text className="text-6xl">🛠️</Text>
                        </View>
                    )}

                    {/* Back Button Overlay */}
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="absolute top-12 left-4 bg-white/90 rounded-full p-2 shadow-md"
                    >
                        <ArrowLeft size={22} color="#0f172a" />
                    </TouchableOpacity>
                </View>

                {/* Content */}
                <View className="px-6 pt-5">
                    {/* Category Tag */}
                    <View className="flex-row items-center mb-3 flex-wrap gap-2">
                        {service.category_tag && (
                            <View className="bg-slate-100 rounded-full px-3 py-1">
                                <Text className="text-brand-secondary text-xs font-medium">
                                    {service.category_tag}
                                </Text>
                            </View>
                        )}
                        <ServiceTypeLabel type={service.service_type} />
                    </View>

                    {/* Title */}
                    <Text className="text-brand-primary text-2xl font-bold mb-2">
                        {service.title}
                    </Text>

                    {/* Price */}
                    <View className="flex-row items-baseline mb-5">
                        <Text className="text-brand-secondary text-sm">A partir de </Text>
                        <Text className="text-brand-accent text-2xl font-bold">
                            {formatCurrency(displayPrice)}
                        </Text>
                        {service.pricing_model === 'hourly' && (
                            <Text className="text-brand-secondary text-sm">/hora</Text>
                        )}
                    </View>

                    {/* Quick Info Pills */}
                    <View className="flex-row flex-wrap gap-3 mb-6">
                        {service.duration && (
                            <View className="flex-row items-center bg-white rounded-xl px-4 py-2.5 border border-slate-100">
                                <Clock size={16} color="#64748b" />
                                <Text className="text-brand-secondary text-sm ml-2 font-medium">
                                    {service.duration}
                                </Text>
                            </View>
                        )}
                        {service.requires_quote && (
                            <View className="flex-row items-center bg-amber-50 rounded-xl px-4 py-2.5 border border-amber-100">
                                <Tag size={16} color="#d97706" />
                                <Text className="text-amber-700 text-sm ml-2 font-medium">
                                    Orçamento sob consulta
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Divider */}
                    <View className="h-px bg-slate-100 mb-6" />

                    {/* Company Card */}
                    {service.company && (
                        <TouchableOpacity className="flex-row items-center bg-white rounded-2xl p-4 border border-slate-100 shadow-sm mb-6">
                            {service.company.logo_url ? (
                                <Image
                                    source={{ uri: service.company.logo_url }}
                                    className="w-14 h-14 rounded-xl mr-4"
                                />
                            ) : (
                                <View className="w-14 h-14 rounded-xl bg-brand-accent/10 items-center justify-center mr-4">
                                    <Briefcase size={24} color="#2563eb" />
                                </View>
                            )}
                            <View className="flex-1">
                                <Text className="text-brand-primary font-bold text-base">
                                    {service.company.company_name}
                                </Text>
                                <View className="flex-row items-center mt-1">
                                    {(service.company.rating ?? 0) > 0 && (
                                        <View className="flex-row items-center mr-3">
                                            <Star size={14} color="#f59e0b" fill="#f59e0b" />
                                            <Text className="text-amber-600 text-sm font-medium ml-1">
                                                {service.company.rating?.toFixed(1)}
                                            </Text>
                                            <Text className="text-brand-secondary text-xs ml-1">
                                                ({service.company.review_count ?? 0})
                                            </Text>
                                        </View>
                                    )}
                                    {service.company.city && (
                                        <View className="flex-row items-center">
                                            <MapPin size={12} color="#94a3b8" />
                                            <Text className="text-brand-secondary text-xs ml-1">
                                                {service.company.city}, {service.company.state}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                            <ChevronRight size={20} color="#94a3b8" />
                        </TouchableOpacity>
                    )}

                    {/* Description */}
                    <View className="mb-6">
                        <Text className="text-brand-primary text-lg font-bold mb-3">
                            Sobre o serviço
                        </Text>
                        <Text className="text-brand-secondary text-base leading-6">
                            {service.description}
                        </Text>
                    </View>

                    {/* Packages */}
                    {service.packages && (
                        <View className="mb-6">
                            <Text className="text-brand-primary text-lg font-bold mb-3">
                                Pacotes disponíveis
                            </Text>
                            {(['basic', 'standard', 'premium'] as const).map((tier) => {
                                const pkg = service.packages?.[tier];
                                if (!pkg) return null;
                                return (
                                    <View
                                        key={tier}
                                        className={`bg-white rounded-2xl p-4 mb-3 border ${tier === 'standard' ? 'border-brand-accent' : 'border-slate-100'}`}
                                    >
                                        <View className="flex-row justify-between items-center mb-2">
                                            <Text className="text-brand-primary font-bold capitalize">
                                                {pkg.name || tier}
                                            </Text>
                                            <Text className="text-brand-accent font-bold text-lg">
                                                {formatCurrency(pkg.price)}
                                            </Text>
                                        </View>
                                        <Text className="text-brand-secondary text-sm mb-2">
                                            {pkg.description}
                                        </Text>
                                        {pkg.features?.map((f: string, i: number) => (
                                            <View key={i} className="flex-row items-center mt-1">
                                                <View className="w-1.5 h-1.5 rounded-full bg-brand-success mr-2" />
                                                <Text className="text-brand-secondary text-xs">{f}</Text>
                                            </View>
                                        ))}
                                    </View>
                                );
                            })}
                        </View>
                    )}

                    {/* FAQ */}
                    {hasFaq && (
                        <View className="mb-6">
                            <Text className="text-brand-primary text-lg font-bold mb-3">
                                Perguntas frequentes
                            </Text>
                            {service.faq!.map((item, idx) => (
                                <View
                                    key={idx}
                                    className="bg-white rounded-xl p-4 mb-2 border border-slate-100"
                                >
                                    <Text className="text-brand-primary font-semibold mb-1">
                                        {item.question}
                                    </Text>
                                    <Text className="text-brand-secondary text-sm">{item.answer}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Fixed Bottom CTA */}
            <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-4 pb-8">
                <View className="flex-row items-center justify-between">
                    <View>
                        <Text className="text-brand-secondary text-xs">A partir de</Text>
                        <Text className="text-brand-primary text-xl font-bold">
                            {formatCurrency(displayPrice)}
                        </Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => {
                            if (service.requires_quote) {
                                router.push({
                                    pathname: '/booking/request-quote',
                                    params: {
                                        serviceId: service.id,
                                        serviceTitle: service.title,
                                        companyName: service.company?.company_name ?? '',
                                    }
                                });
                            } else {
                                router.push({
                                    pathname: '/booking/select-date',
                                    params: {
                                        serviceId: service.id,
                                        serviceTitle: service.title,
                                        servicePrice: String(displayPrice),
                                        companyName: service.company?.company_name ?? '',
                                        durationMinutes: String(service.duration_minutes ?? 60),
                                    },
                                });
                            }
                        }}
                        className="bg-brand-accent rounded-xl py-4 px-8 shadow-md"
                    >
                        <Text className="text-white font-bold text-base">{service.requires_quote ? 'Pedir Orçamento' : 'Escolher Data'}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}
