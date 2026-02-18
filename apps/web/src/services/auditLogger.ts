import { supabase } from '@tgt/shared';

interface AuditLogParams {
    action: string;
    entity: string;
    entityId?: string;
    details?: any;
}

/**
 * Logs an administrative action to the audit_logs table.
 * @param params AuditLogParams
 */
export const logAdminAction = async ({ action, entity, entityId, details }: AuditLogParams) => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        // Optional: Fetch IP address if needed, but usually done server-side.
        // We will just log the action.

        const { error } = await supabase.from('audit_logs').insert({
            admin_id: session.user.id,
            action,
            entity,
            entity_id: entityId,
            details,
            created_at: new Date().toISOString(),
        });

        if (error) throw error;

    } catch (error) {
        console.error('[AuditLogger] Failed to log action:', error);
        // We intentionally do not throw here to prevent blocking the main action flow
        // if logging service is down, although for strict compliance this might change.
    }
};
