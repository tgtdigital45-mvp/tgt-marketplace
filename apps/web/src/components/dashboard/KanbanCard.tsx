import React from 'react';
import { motion } from 'framer-motion';
import Button from '@/components/ui/Button';

interface Appointment {
    id: string;
    clientName: string;
    clientAvatar: string;
    service: string;
    date: string;
    time: string;
    status: string;
    price: number;
}

interface KanbanCardProps {
    appointment: Appointment;
    onMove: (id: string, nextStatus: string) => void;
    onCancel: (id: string) => void;
}

const KanbanCard: React.FC<KanbanCardProps> = ({ appointment, onMove, onCancel }) => {
    const getNextStatus = (current: string) => {
        switch (current) {
            case 'pending': return 'confirmed';
            case 'confirmed': return 'in_progress';
            case 'in_progress': return 'completed';
            default: return null;
        }
    };

    const getActionLabel = (current: string) => {
        switch (current) {
            case 'pending': return 'Aceitar';
            case 'confirmed': return 'Iniciar';
            case 'in_progress': return 'Finalizar';
            default: return null;
        }
    };

    const nextStatus = getNextStatus(appointment.status);
    const actionLabel = getActionLabel(appointment.status);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow mb-3 flex flex-col gap-3 group"
        >
            {/* Header */}
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                    <img src={appointment.clientAvatar} alt={appointment.clientName} className="w-10 h-10 rounded-full object-cover border border-gray-100" />
                    <div>
                        <h4 className="font-bold text-gray-900 text-sm">{appointment.clientName}</h4>
                        <p className="text-xs text-gray-500">{appointment.service}</p>
                    </div>
                </div>
            </div>

            {/* Details */}
            <div className="bg-gray-50 p-2 rounded-lg grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center text-gray-600 gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    {new Date(appointment.date).toLocaleDateString()}
                </div>
                <div className="flex items-center text-gray-600 gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {appointment.time}
                </div>
                <div className="col-span-2 font-bold text-brand-primary mt-1">
                    R$ {appointment.price.toFixed(2)}
                </div>
            </div>

            {/* Actions */}
            <div className="pt-2 border-t border-gray-100 flex gap-2">
                {nextStatus && (
                    <Button
                        size="sm"
                        className="w-full text-xs font-semibold"
                        variant={appointment.status === 'in_progress' ? 'secondary' : 'primary'}
                        onClick={() => onMove(appointment.id, nextStatus)}
                    >
                        {actionLabel}
                    </Button>
                )}

                {appointment.status === 'pending' && (
                    <Button
                        size="sm"
                        variant="danger"
                        className="w-1/3 text-xs"
                        onClick={() => onCancel(appointment.id)}
                    >
                        ✕
                    </Button>
                )}
            </div>
        </motion.div>
    );
};

export default KanbanCard;
