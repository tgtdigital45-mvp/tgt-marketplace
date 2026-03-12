import React from 'react';
import {
    View,
    Text,
    ScrollView,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions,
    StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    ArrowLeft, Star, MapPin, Clock, Tag, ChevronRight, AlertCircle, Briefcase,
} from 'lucide-react-native';
import { useServiceDetails } from '@/src/hooks/useServiceDetails';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COLORS = {
    primary: '#0f172a',
    secondary: '#475569',
    accent: '#2563eb',
    background: '#f8fafc',
    surface: '#ffffff',
    border: '#e2e8f0',
    success: '#10b981',
};

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
        <View style={styles.typePill}>
            <Text style={{ marginRight: 4 }}>{label.emoji}</Text>
            <Text style={styles.typePillText}>{label.text}</Text>
        </View>
    );
}

function LoadingSkeleton() {
    return (
        <View style={styles.container}>
            <View style={{ width: SCREEN_WIDTH, height: 260, backgroundColor: '#e2e8f0' }} />
            <View style={{ paddingHorizontal: 24, paddingTop: 24 }}>
                <View style={[styles.skeletonBlock, { width: '75%', height: 28, marginBottom: 12 }]} />
                <View style={[styles.skeletonBlock, { width: '50%', height: 20, marginBottom: 24 }]} />
                <View style={[styles.skeletonBlock, { height: 80, marginBottom: 16 }]} />
                <View style={[styles.skeletonBlock, { height: 80, marginBottom: 16 }]} />
            </View>
            <View style={{ alignItems: 'center', marginTop: 24 }}>
                <ActivityIndicator size="large" color={COLORS.accent} />
                <Text style={{ color: COLORS.secondary, marginTop: 12 }}>Carregando serviço...</Text>
            </View>
        </View>
    );
}

function ErrorState({ message, onBack }: { message: string; onBack: () => void }) {
    return (
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }]}>
            <View style={styles.errorIcon}>
                <AlertCircle size={48} color="#ef4444" />
            </View>
            <Text style={styles.errorTitle}>Ops, algo deu errado</Text>
            <Text style={styles.errorMessage}>{message}</Text>
            <TouchableOpacity onPress={onBack} style={styles.errorButton}>
                <Text style={styles.errorButtonText}>Voltar</Text>
            </TouchableOpacity>
        </View>
    );
}

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
        <View style={styles.container}>
            <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 100 }}>
                {/* Hero Image */}
                <View>
                    {service.image_url ? (
                        <Image
                            source={{ uri: service.image_url }}
                            style={{ width: SCREEN_WIDTH, height: 260 }}
                            resizeMode="cover"
                        />
                    ) : (
                        <View style={[{ width: SCREEN_WIDTH, height: 260 }, styles.imagePlaceholder]}>
                            <Text style={{ fontSize: 60 }}>🛠️</Text>
                        </View>
                    )}
                    <TouchableOpacity onPress={() => router.back()} style={styles.backOverlay}>
                        <ArrowLeft size={22} color={COLORS.primary} />
                    </TouchableOpacity>
                </View>

                {/* Content */}
                <View style={styles.content}>
                    {/* Category & Type */}
                    <View style={styles.tagsRow}>
                        {service.category_tag && (
                            <View style={styles.categoryPill}>
                                <Text style={styles.categoryPillText}>{service.category_tag}</Text>
                            </View>
                        )}
                        <ServiceTypeLabel type={service.service_type} />
                    </View>

                    {/* Title */}
                    <Text style={styles.serviceTitle}>{service.title}</Text>

                    {/* Price */}
                    <View style={styles.priceRow}>
                        <Text style={styles.priceFromText}>A partir de </Text>
                        <Text style={styles.priceValue}>{formatCurrency(displayPrice)}</Text>
                        {service.pricing_model === 'hourly' && (
                            <Text style={styles.priceFromText}>/hora</Text>
                        )}
                    </View>

                    {/* Quick Info Pills */}
                    <View style={styles.pillsRow}>
                        {service.duration && (
                            <View style={styles.infoPill}>
                                <Clock size={16} color="#64748b" />
                                <Text style={styles.infoPillText}>{service.duration}</Text>
                            </View>
                        )}
                        {service.requires_quote && (
                            <View style={styles.quotePill}>
                                <Tag size={16} color="#d97706" />
                                <Text style={styles.quotePillText}>Orçamento sob consulta</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.divider} />

                    {/* Company Card */}
                    {service.company && (
                        <TouchableOpacity style={styles.companyCard}>
                            {service.company.logo_url ? (
                                <Image
                                    source={{ uri: service.company.logo_url }}
                                    style={styles.companyLogo}
                                />
                            ) : (
                                <View style={styles.companyLogoPlaceholder}>
                                    <Briefcase size={24} color={COLORS.accent} />
                                </View>
                            )}
                            <View style={{ flex: 1 }}>
                                <Text style={styles.companyName}>{service.company.company_name}</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                    {(service.company.rating ?? 0) > 0 && (
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12 }}>
                                            <Star size={14} color="#f59e0b" fill="#f59e0b" />
                                            <Text style={styles.ratingText}>{service.company.rating?.toFixed(1)}</Text>
                                            <Text style={styles.reviewCount}>({service.company.review_count ?? 0})</Text>
                                        </View>
                                    )}
                                    {service.company.city && (
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <MapPin size={12} color="#94a3b8" />
                                            <Text style={styles.cityText}>
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
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Sobre o serviço</Text>
                        <Text style={styles.descriptionText}>{service.description}</Text>
                    </View>

                    {/* Packages */}
                    {service.packages && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Pacotes disponíveis</Text>
                            {(['basic', 'standard', 'premium'] as const).map((tier) => {
                                const pkg = service.packages?.[tier];
                                if (!pkg) return null;
                                return (
                                    <View
                                        key={tier}
                                        style={[styles.packageCard, tier === 'standard' ? styles.packageHighlight : styles.packageDefault]}
                                    >
                                        <View style={styles.packageHeader}>
                                            <Text style={styles.packageName}>{pkg.name || tier}</Text>
                                            <Text style={styles.packagePrice}>{formatCurrency(pkg.price)}</Text>
                                        </View>
                                        <Text style={styles.packageDesc}>{pkg.description}</Text>
                                        {pkg.features?.map((f: string, i: number) => (
                                            <View key={i} style={styles.featureRow}>
                                                <View style={styles.featureDot} />
                                                <Text style={styles.featureText}>{f}</Text>
                                            </View>
                                        ))}
                                    </View>
                                );
                            })}
                        </View>
                    )}

                    {/* FAQ */}
                    {hasFaq && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Perguntas frequentes</Text>
                            {service.faq!.map((item: { question: string; answer: string }, idx: number) => (
                                <View key={idx} style={styles.faqCard}>
                                    <Text style={styles.faqQuestion}>{item.question}</Text>
                                    <Text style={styles.faqAnswer}>{item.answer}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Fixed Bottom CTA */}
            <View style={styles.footer}>
                <View style={styles.footerInner}>
                    <View>
                        <Text style={styles.footerFromText}>A partir de</Text>
                        <Text style={styles.footerPrice}>{formatCurrency(displayPrice)}</Text>
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
                        style={styles.ctaButton}
                    >
                        <Text style={styles.ctaText}>
                            {service.requires_quote ? 'Pedir Orçamento' : 'Escolher Data'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    scroll: { flex: 1 },
    skeletonBlock: { backgroundColor: '#e2e8f0', borderRadius: 10, width: '100%' },
    // Error
    errorIcon: { backgroundColor: '#fee2e2', padding: 24, borderRadius: 9999, marginBottom: 24 },
    errorTitle: { color: COLORS.primary, fontSize: 20, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
    errorMessage: { color: COLORS.secondary, textAlign: 'center', marginBottom: 32 },
    errorButton: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 32 },
    errorButtonText: { color: '#ffffff', fontWeight: 'bold' },
    // Image
    imagePlaceholder: { backgroundColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' },
    backOverlay: { position: 'absolute', top: 48, left: 16, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 9999, padding: 8 },
    // Content
    content: { paddingHorizontal: 24, paddingTop: 20 },
    tagsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 },
    categoryPill: { backgroundColor: '#f1f5f9', borderRadius: 9999, paddingHorizontal: 12, paddingVertical: 4 },
    categoryPillText: { color: COLORS.secondary, fontSize: 12, fontWeight: '500' },
    typePill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff', borderRadius: 9999, paddingHorizontal: 12, paddingVertical: 6 },
    typePillText: { color: COLORS.accent, fontSize: 12, fontWeight: '600' },
    serviceTitle: { color: COLORS.primary, fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
    priceRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 20 },
    priceFromText: { color: COLORS.secondary, fontSize: 14 },
    priceValue: { color: COLORS.accent, fontSize: 24, fontWeight: 'bold' },
    pillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
    infoPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderColor: COLORS.border, gap: 8 },
    infoPillText: { color: COLORS.secondary, fontSize: 14, fontWeight: '500' },
    quotePill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fffbeb', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderColor: '#fde68a', gap: 8 },
    quotePillText: { color: '#b45309', fontSize: 14, fontWeight: '500' },
    divider: { height: 1, backgroundColor: '#f1f5f9', marginBottom: 24 },
    // Company
    companyCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: 24 },
    companyLogo: { width: 56, height: 56, borderRadius: 12, marginRight: 16 },
    companyLogoPlaceholder: { width: 56, height: 56, borderRadius: 12, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
    companyName: { color: COLORS.primary, fontWeight: 'bold', fontSize: 16 },
    ratingText: { color: '#d97706', fontSize: 14, fontWeight: '500', marginLeft: 4 },
    reviewCount: { color: COLORS.secondary, fontSize: 12, marginLeft: 4 },
    cityText: { color: COLORS.secondary, fontSize: 12, marginLeft: 4 },
    // Sections
    section: { marginBottom: 24 },
    sectionTitle: { color: COLORS.primary, fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
    descriptionText: { color: COLORS.secondary, fontSize: 16, lineHeight: 24 },
    // Packages
    packageCard: { borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1 },
    packageDefault: { backgroundColor: COLORS.surface, borderColor: COLORS.border },
    packageHighlight: { backgroundColor: COLORS.surface, borderColor: COLORS.accent },
    packageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    packageName: { color: COLORS.primary, fontWeight: 'bold', textTransform: 'capitalize' },
    packagePrice: { color: COLORS.accent, fontWeight: 'bold', fontSize: 18 },
    packageDesc: { color: COLORS.secondary, fontSize: 14, marginBottom: 8 },
    featureRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    featureDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.success, marginRight: 8 },
    featureText: { color: COLORS.secondary, fontSize: 12 },
    // FAQ
    faqCard: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border },
    faqQuestion: { color: COLORS.primary, fontWeight: '600', marginBottom: 4 },
    faqAnswer: { color: COLORS.secondary, fontSize: 14 },
    // Footer CTA
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.surface, borderTopWidth: 1, borderColor: COLORS.border, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32 },
    footerInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    footerFromText: { color: COLORS.secondary, fontSize: 12 },
    footerPrice: { color: COLORS.primary, fontSize: 20, fontWeight: 'bold' },
    ctaButton: { backgroundColor: COLORS.accent, borderRadius: 12, paddingVertical: 16, paddingHorizontal: 32 },
    ctaText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },
});
