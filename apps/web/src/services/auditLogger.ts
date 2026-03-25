import { supabase } from '@tgt/core';

interface AuditLogParams {
    action: string;
    entity: string;
    entityId?: string;
    details?: Record<string, unknown>;
    /** Pass the authenticated user's ID to avoid an extra round-trip to Supabase Auth. */
    userId: string;
}

/**
 * Logs an administrative action to the audit_logs table.
 *
 * @param params AuditLogParams — userId is required to avoid calling getSession() on every log entry.
 */
export const logAdminAction = async ({ action, entity, entityId, details, userId }: AuditLogParams) => {
    try {
        const { error } = await supabase.from('audit_logs').insert({
            admin_id: userId,
            action,
            entity,
            entity_id: entityId,
            details,
            created_at: new Date().toISOString(),
        });

        if (error) throw error;
    } catch (error) {
        // Intentionally silent — logging failure must never block the main action flow
        console.error('[AuditLogger] Failed to log action:', error);
    }
};
