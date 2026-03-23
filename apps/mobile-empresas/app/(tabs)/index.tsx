import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { Colors } from '../../utils/theme';
import { Skeleton } from '../../components/ui/SkeletonLoader';
import { useCompany } from '../../hooks/useCompany';

import CustomerHome from '../components/home/CustomerHome';
import ProviderDashboard from '../components/home/ProviderDashboard';
import ProviderOnboarding from '../components/home/ProviderOnboarding';

export default function HomeScreen() {
    const { user, profile } = useAuth();
    const { company, isLoading: isLoadingCompany, refresh: refreshCompany } = useCompany(
        profile?.user_type === 'company' ? user?.id : undefined
    );

    if (!profile || isLoadingCompany) {
        return (
            <View style={styles.loadingContainer}>
                <View style={{ padding: 24, gap: 16, width: '100%' }}>
                    <Skeleton width="60%" height={32} />
                    <Skeleton width="100%" height={60} borderRadius={32} />
                    <View style={{ marginTop: 16 }}>
                        <Skeleton width="40%" height={22} />
                        <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
                            <Skeleton width={160} height={180} borderRadius={20} />
                            <Skeleton width={160} height={180} borderRadius={20} />
                        </View>
                    </View>
                    <View style={{ marginTop: 16 }}>
                        <Skeleton width="50%" height={22} />
                        <View style={{ flexDirection: 'row', gap: 16, marginTop: 12 }}>
                            <Skeleton width={80} height={80} borderRadius={20} />
                            <Skeleton width={80} height={80} borderRadius={20} />
                            <Skeleton width={80} height={80} borderRadius={20} />
                        </View>
                    </View>
                </View>
            </View>
        );
    }

    if (profile.user_type === 'company' && !company) {
        return <ProviderOnboarding userId={user!.id} onComplete={refreshCompany} />;
    }

    if (profile.user_type === 'company' && company) {
        return <ProviderDashboard profile={profile} company={company} />;
    }

    return <CustomerHome profile={profile} />;
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'flex-start',
        paddingTop: 80,
        backgroundColor: Colors.white,
    },
});
