import React, { useState, useEffect } from 'react';
import { supabase } from '@tgt/core';
import { Service, DbCompany } from '@tgt/core';
import { LoadingSpinner, Button } from '@tgt/ui-web';
import { BookingCalendar } from './BookingCalendar';
import { X } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';

interface ScheduleModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: any;
    onSuccess: () => void;
}

export const ScheduleModal: React.FC<ScheduleModalProps> = ({ isOpen, onClose, order, onSuccess }) => {
    const [service, setService] = useState<Service | null>(null);
    const [company, setCompany] = useState<DbCompany | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const { addToast } = useToast();

    useEffect(() => {
        if (!isOpen || !order) return;
        
        const fetchDetails = async () => {
            setLoading(true);
            try {
                if (order.service_id) {
                    const { data, error } = await supabase
                        .from('services')
                        .select('*, company:companies(*)')
                        .eq('id', order.service_id)
                        .single();
                        
                    if (error) throw error;
                    setService(data);
                    setCompany(data.company);
                } else if (order.company_id) {
                    const { data, error } = await supabase
                        .from('companies')
                        .select('*')
                        .eq('id', order.company_id)
                        .single();
                    if (error) throw error;
                    setCompany(data);
                    // Mock a service since it's a custom job
                    setService({ id: 'custom', duration_minutes: 60, pricing_model: 'fixed' } as any);
                }
            } catch (err) {
                console.error("Error fetching order details", err);
                setError('Erro ao carregar detalhes do serviço.');
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [isOpen, order]);

    const handleSelect = async (date: string, time: string, endDate?: string) => {
        setSubmitting(true);
        setError('');
        try {
            // Update the order in supabase
            const { error: updateError } = await supabase
                .from('orders')
                .update({ date, time, status: 'confirmed' })
                .eq('id', order.id);

            if (updateError) throw updateError;
            
            // Send a system message to the chat
            await supabase.from('messages').insert({
                order_id: order.id,
                content: `🗓 Agendamento confirmado para o dia ${new Date(date + 'T12:00:00').toLocaleDateString('pt-BR')} às ${time}.`,
                sender_id: order.buyer_id, // acting on behalf of the client
                type: 'system'
            });

            addToast('Agendamento confirmado com sucesso!', 'success');
            onSuccess();
            onClose();
        } catch (err) {
            console.error("Error scheduling", err);
            setError('Erro ao salvar o agendamento.');
            addToast('Erro ao salvar o agendamento.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col relative">
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900">Agendar Horário do Serviço</h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto font-sans flex-1">
                    {loading ? (
                        <div className="flex justify-center items-center h-48">
                            <LoadingSpinner />
                        </div>
                    ) : error ? (
                        <div className="text-center text-red-500 py-8">{error}</div>
                    ) : service && company ? (
                        <div className="space-y-6 relative">
                            <p className="text-sm text-gray-500 mb-4 text-center">
                                Escolha o melhor horário para o atendimento com <b>{company.company_name}</b>.
                            </p>
                            <BookingCalendar 
                                service={service} 
                                company={company} 
                                onSelect={handleSelect} 
                            />
                            {submitting && (
                                <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center rounded-xl">
                                    <LoadingSpinner />
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 py-8">Não foi possível carregar o calendário.</div>
                    )}
                </div>
            </div>
        </div>
    );
};
