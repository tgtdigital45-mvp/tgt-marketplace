import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '@/components/ui/Button';
import { Service } from '@tgt/shared';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@tgt/shared';
import { useToast } from '@/contexts/ToastContext';

import AuthModal from '@/components/auth/AuthModal';
import { useAvailability } from '@/hooks/useAvailability';
import { DAYS } from '@/utils/availability';

interface ServiceBookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    service: Service | null; // Keep null as possible based on original file usage
    companyName: string;
    canCheckout?: boolean;
    checkoutDisabledReason?: string;
}



const ServiceBookingModal: React.FC<ServiceBookingModalProps> = ({
    isOpen,
    onClose,
    service,
    companyName,
    canCheckout,
    checkoutDisabledReason,
}) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);

    // Availability Logic
    const {
        availability,
        availableSlots,
        loading: fetchingAvailability,
        selectedDate: date,
        setSelectedDate,
        bookedSlots // For future use or consistency
    } = useAvailability(service?.company_id, service?.duration_minutes || 30);

    const [formData, setFormData] = useState({
        date: '',
        endDate: '',
        time: '',
        notes: '',
    });

    const isDaily = service?.pricing_model === 'daily';

    let totalDays = 1;
    if (isDaily && formData.date && formData.endDate) {
        const start = new Date(formData.date);
        const end = new Date(formData.endDate);
        if (end >= start) {
            totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        }
    }
    const finalPrice = service ? (service.price || 0) * totalDays : 0;

    // Sync formData.date with hook's selectedDate
    React.useEffect(() => {
        if (formData.date) {
            setSelectedDate(formData.date);
        }
    }, [formData.date]);

    if (!isOpen || !service) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            setShowAuthModal(true);
            return;
        }

        // Validate availability again
        if (service.use_company_availability && availability) {
            const dateObj = new Date(formData.date + 'T00:00:00');
            const dayName = DAYS[dateObj.getDay()];
            if (!availability[dayName]?.active) {
                addToast("A empresa não atende neste dia.", "error");
                return;
            }
        }

        if (user.type !== 'client') {
            addToast("Apenas clientes podem solicitar agendamentos.", "error");
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase.from('bookings').insert({
                client_id: user.id,
                company_id: service.company_id,
                service_title: service.title,
                service_price: finalPrice,
                booking_date: formData.date,
                booking_time: isDaily ? '00:00:00' : formData.time,
                service_duration_minutes: isDaily ? totalDays * 1440 : service.duration_minutes,
                notes: formData.notes,
                status: 'pending'
            });

            if (error) throw error;

            addToast("Solicitação enviada com sucesso!", "success");
            onClose();
            navigate('/perfil/pedidos');

        } catch (err) {
            console.error("Booking error:", err);
            const message = err instanceof Error ? err.message : "Erro ao solicitar agendamento.";
            addToast(message, "error");
        } finally {
            setLoading(false);
        }
    };

    const isDateDisabled = (dateString: string) => {
        if (!availability || !service.use_company_availability) return false;
        const date = new Date(dateString + 'T00:00:00');
        const dayName = DAYS[date.getDay()];
        return !availability[dayName]?.active;
    };

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={onClose}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden"
                        >
                            {/* Header */}
                            <div className="bg-brand-primary p-6 text-white">
                                <h2 className="text-xl font-bold">Solicitar Orçamento</h2>
                                <p className="opacity-90 mt-1 text-sm">
                                    {service.title} com {companyName}
                                </p>
                                <button
                                    onClick={onClose}
                                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/20 transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Body */}
                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                {/* Date & Time Selection */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            {isDaily ? 'Data de Início' : 'Data Preferencial'}
                                        </label>
                                        <input
                                            type="date"
                                            required
                                            min={new Date().toISOString().split('T')[0]}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none transition-all"
                                            value={formData.date}
                                            onChange={(e) => {
                                                setFormData({ ...formData, date: e.target.value, time: isDaily ? '00:00:00' : '' }); // Reset time on date change
                                            }}
                                        />
                                        {/* Warning if selected day is closed */}
                                        {formData.date && !isDaily && isDateDisabled(formData.date) && (
                                            <p className="text-xs text-red-500 mt-1">Empresa fechada neste dia.</p>
                                        )}
                                    </div>

                                    {isDaily ? (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Data de Término</label>
                                            <input
                                                type="date"
                                                required
                                                min={formData.date || new Date().toISOString().split('T')[0]}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none transition-all"
                                                value={formData.endDate}
                                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                                disabled={!formData.date}
                                            />
                                        </div>
                                    ) : (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Horário</label>

                                            {fetchingAvailability ? (
                                                <div className="h-10 w-full bg-gray-100 rounded animate-pulse" />
                                            ) : (
                                                service.use_company_availability && availability ? (
                                                    <select
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none transition-all"
                                                        value={formData.time}
                                                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                                        disabled={!formData.date || isDateDisabled(formData.date) || availableSlots.length === 0}
                                                    >
                                                        <option value="">Selecione...</option>
                                                        {availableSlots.map(slot => (
                                                            <option key={slot} value={slot}>{slot}</option>
                                                        ))}
                                                        {availableSlots.length === 0 && formData.date && !isDateDisabled(formData.date) && (
                                                            <option disabled>Sem horários</option>
                                                        )}
                                                    </select>
                                                ) : (
                                                    // Legacy / Remote Behavior
                                                    <select
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none transition-all"
                                                        value={formData.time}
                                                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                                    >
                                                        <option value="">Selecione...</option>
                                                        <option value="morning">Manhã (08:00 - 12:00)</option>
                                                        <option value="afternoon">Tarde (13:00 - 18:00)</option>
                                                        <option value="evening">Noite (18:00 - 20:00)</option>
                                                    </select>
                                                )
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Service Details */}
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm text-gray-600">Valor Estimado {' '}
                                            {isDaily && totalDays > 1 && <span className="font-normal">({totalDays} dias)</span>}
                                        </span>
                                        <span className="font-bold text-brand-primary text-lg">
                                            {finalPrice > 0 ? `R$ ${finalPrice.toFixed(2)}` : 'A combinar'}
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        {service.duration && (
                                            <div className="flex items-center text-sm text-gray-500">
                                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                Duração: {service.duration}
                                            </div>
                                        )}
                                        {service.duration_minutes && (
                                            <div className="flex items-center text-xs text-gray-400 ml-5">
                                                ({service.duration_minutes} minutos estimados)
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Notes */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Observações (Opcional)</label>
                                    <textarea
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none transition-all h-24 resize-none"
                                        placeholder="Descreva detalhes específicos do que você precisa..."
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    />
                                </div>

                                {/* Footer */}
                                {canCheckout === false && checkoutDisabledReason && (
                                    <div className="bg-orange-50 text-orange-800 text-xs p-3 rounded-lg font-medium text-center border border-orange-200 mb-2 mt-4">
                                        {checkoutDisabledReason}
                                    </div>
                                )}
                                <div className="flex gap-3 pt-2">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        className="flex-1"
                                        onClick={onClose}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        className="flex-2 w-full"
                                        isLoading={loading}
                                        disabled={loading || canCheckout === false || (!isDaily && service.use_company_availability && !!availability && (!formData.date || isDateDisabled(formData.date) || !formData.time)) || (isDaily && (!formData.date || !formData.endDate))}
                                    >
                                        {user ? 'Confirmar Solicitação' : 'Faça login para solicitar'}
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence >
            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                onSuccess={() => {
                    setShowAuthModal(false);
                    addToast("Agora você pode confirmar sua solicitação.", "success");
                }}
            />
        </>
    );
};

export default ServiceBookingModal;