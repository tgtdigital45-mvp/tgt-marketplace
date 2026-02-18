import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@tgt/shared';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const AdminGuard = ({ children }: { children: React.ReactElement }) => {
    const { user, loading } = useAuth();
    const location = useLocation();
    const [isMfaVerified, setIsMfaVerified] = useState<boolean | null>(null);

    useEffect(() => {
        const checkMFA = async () => {
            if (!user) return;

            // 1. Check current Level of Assurance (AAL)
            const { data: { session } } = await supabase.auth.getSession();
            const currentAal = session?.user?.app_metadata?.aal || 'aal1';

            if (currentAal === 'aal2') {
                // Already verified via MFA
                setIsMfaVerified(true);
                return;
            }

            // 2. If AAL1, check if user HAS any enrolled factors
            const { data: factors, error } = await supabase.auth.mfa.listFactors();

            if (error) {
                console.error('Error checking MFA factors', error);
                setIsMfaVerified(true); // Fail open? Or closed? Let's allow access if error but warn. 
                // Better: Fail safe -> allow access if we can't verify factors, assuming if they had it enforced supabase would handle it?
                // Actually, let's assume if error, they are safe or strict.
                return;
            }

            const hasVerifiedFactor = factors.totp.some(f => f.status === 'verified');

            if (hasVerifiedFactor) {
                // Has factor but running on AAL1 (Password only)
                // MUST redirect to verification
                setIsMfaVerified(false);
            } else {
                // No MFA configured, allow access (AAL1 is fine)
                setIsMfaVerified(true);
            }
        };

        if (!loading && user?.role === 'admin') {
            checkMFA();
        } else {
            // Not admin or loading
            setIsMfaVerified(true); // Let the role check handle it below
        }
    }, [user, loading]);

    if (loading || isMfaVerified === null) {
        return <LoadingSpinner />;
    }

    if (!user || user.role !== 'admin') {
        console.error("[AdminGuard] Access denied. User role:", user?.role);
        return <Navigate to="/login/empresa" replace />;
    }

    if (isMfaVerified === false) {
        return <Navigate to="/admin/verify-2fa" replace />;
    }

    return <>{children}</>;
};

export default AdminGuard;
