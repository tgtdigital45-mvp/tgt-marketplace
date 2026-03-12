import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, TextInput,
    Alert, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../contexts/AuthContext';
import * as Haptics from 'expo-haptics';
import { Colors, BorderRadius, Shadows } from '../../utils/theme';
import { logger } from '../../utils/logger';

export default function ReviewScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const { orderId, companyId, companyName } = useLocalSearchParams<{
        orderId: string;
        companyId: string;
        companyName: string;
    }>();

    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const ratingLabels = ['', 'Péssimo', 'Ruim', 'Regular', 'Bom', 'Excelente'];

    const handleStarPress = (star: number) => {
        Haptics.selectionAsync();
        setRating(star);
    };

    const handleSubmit = async () => {
        if (!user || !orderId || !companyId) return;
        if (rating === 0) {
            Alert.alert('Avaliação', 'Selecione uma nota para continuar.');
            return;
        }

        setSubmitting(true);
        try {
            const { error } = await supabase
                .from('reviews')
                .insert({
                    order_id: orderId,
                    reviewer_id: user.id,
                    company_id: companyId,
                    rating,
                    comment: comment.trim() || null,
                });

            if (error) {
                if (error.code === '23505') {
                    Alert.alert('Aviso', 'Você já avaliou este serviço.');
                } else {
                    throw error;
                }
            } else {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert('Obrigado!', 'Sua avaliação foi enviada.', [
                    { text: 'OK', onPress: () => router.replace('/(tabs)/orders') }
                ]);
            }
        } catch (e) {
            logger.error(e);
            Alert.alert('Erro', 'Não foi possível enviar a avaliação.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={22} color={Colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Avaliar Serviço</Text>
                    <View style={{ width: 40 }} />
                </View>

                <View style={styles.content}>
                    <Text style={styles.companyLabel}>Como foi seu serviço com</Text>
                    <Text style={styles.companyName}>{companyName || 'a empresa'}?</Text>

                    <View style={styles.starsRow}>
                        {[1, 2, 3, 4, 5].map(star => (
                            <TouchableOpacity key={star} onPress={() => handleStarPress(star)} activeOpacity={0.7}>
                                <Ionicons
                                    name={star <= rating ? 'star' : 'star-outline'}
                                    size={44}
                                    color={star <= rating ? Colors.warning : Colors.border}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>
                    {rating > 0 && (
                        <Text style={styles.ratingLabel}>{ratingLabels[rating]}</Text>
                    )}

                    <Text style={styles.inputLabel}>Comentário (opcional)</Text>
                    <TextInput
                        style={styles.commentInput}
                        value={comment}
                        onChangeText={setComment}
                        placeholder="Conte como foi sua experiência..."
                        placeholderTextColor={Colors.textTertiary}
                        multiline
                        maxLength={500}
                        textAlignVertical="top"
                    />
                    <Text style={styles.charCount}>{comment.length}/500</Text>
                </View>

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.submitBtn, (rating === 0 || submitting) && styles.submitDisabled]}
                        onPress={handleSubmit}
                        disabled={rating === 0 || submitting}
                    >
                        {submitting
                            ? <ActivityIndicator color={Colors.white} />
                            : <Text style={styles.submitText}>Enviar Avaliação</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => router.back()} style={styles.skipBtn}>
                        <Text style={styles.skipText}>Pular</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.surface },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.borderLight, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.text, letterSpacing: -0.3 },

    content: { flex: 1, paddingHorizontal: 28, paddingTop: 32, alignItems: 'center' },
    companyLabel: { fontSize: 16, color: Colors.textSecondary, fontWeight: '500', marginBottom: 4 },
    companyName: { fontSize: 24, fontWeight: '900', color: Colors.text, letterSpacing: -0.5, marginBottom: 36, textAlign: 'center' },

    starsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
    ratingLabel: { fontSize: 16, fontWeight: '700', color: Colors.warning, marginBottom: 32 },

    inputLabel: { fontSize: 13, fontWeight: '700', color: Colors.text, alignSelf: 'flex-start', marginBottom: 8 },
    commentInput: { width: '100%', height: 120, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: Colors.text, lineHeight: 22 },
    charCount: { alignSelf: 'flex-end', fontSize: 12, color: Colors.textTertiary, marginTop: 4 },

    footer: { paddingHorizontal: 28, paddingBottom: 16, gap: 10 },
    submitBtn: { backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
    submitDisabled: { opacity: 0.4 },
    submitText: { color: Colors.white, fontSize: 16, fontWeight: '800' },
    skipBtn: { alignItems: 'center', paddingVertical: 10 },
    skipText: { color: Colors.textTertiary, fontSize: 14, fontWeight: '600' },
});
