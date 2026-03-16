import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '@/components/ui/Button';
import { Service } from '@tgt/core';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@tgt/core';
import { useToast } from '@/contexts/ToastContext';

import AuthModal from '@/components/auth/AuthModal';
import { useAvailability } from '@/hooks/useAvailability';
import { DAYS } from '@/utils/availability';
import { useLock } from '@tgt/core';

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
    const [serviceForm, setServiceForm] = useState<{ id: string; questions: string[] } | null>(null);
    const [responses, setResponses] = useState<Record<string, string>>({});
    const [withLock] = useLock();

    // Availability Logic
    const {
        availability,
        availableSlots,
        loading: fetchingAvailability,
        selectedDate: date,
        setSelectedDate,
        bookedSlots // For future use or consistency
    } = useAvailability(service?.companyId, service?.duration_minutes || 30);

    const [formData, setFormData] = useState({
        date: '',
        endDate: '',
        time: '',
        notes: '',
        budgetExpectation: '', // For quotes
    });

    const isDaily = service?.pricing_model === 'daily';
    const isQuote = service?.requires_quote || false;

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

    // Fetch dynamic form
    React.useEffect(() => {
        if (service?.id) {
            const fetchForm = async () => {
                const { data } = await supabase
                    .from('service_forms')
                    .select('*')
                    .eq('service_id', service.id)
                    .maybeSingle();
                setServiceForm(data);
                if (data?.questions) {
                    const initialResponses: Record<string, string> = {};
                    data.questions.forEach((q: string) => initialResponses[q] = '');
                    setResponses(initialResponses);
                }
            };
            fetchForm();
        } else {
            setServiceForm(null);
            setResponses({});
        }
    }, [service?.id]);

    if (!isOpen || !service) return null;

    const handleSubmit = withLock(async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            setShowAuthModal(true);
            return;
        }

        // Validate availability again, only if not quote
        if (!isQuote && service.use_company_availability && availability) {
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
            if (isQuote) {
                // For quotes, we insert into 'orders' with status 'pending'
                // and we set price to 0 or null (if allowed) for now, until it's negotiated
                
                const { data: newOrder, error } = await supabase.from('orders').insert({
                    buyer_id: user.id,
                    seller_id: service.companyId,
                    service_id: service.id,
                    service_title: service.title,
                    price: 0, // Quote starts at 0 or empty
                    hiring_responses: responses,
                    status: 'pending',
                    package_tier: 'basic',
                    notes: formData.notes,
                    budget_expectation: formData.budgetExpectation ? parseFloat(formData.budgetExpectation) : null,
                }).select().single();

                if (error) throw error;

                addToast("Solicitação de orçamento enviada com sucesso!", "success");
                onClose();
                navigate('/perfil/pedidos');
            } else {
                // Combine date and time for scheduled_for
                const scheduledFor = formData.date && formData.time 
                    ? `${formData.date}T${formData.time}:00` 
                    : null;

                const { error } = await supabase.from('orders').insert({
                    buyer_id: user.id, // Updated: client_id -> buyer_id
                    seller_id: service.companyId, // Updated: company_id -> seller_id
                    service_id: service.id,
                    service_title: service.title,
                    price: finalPrice, // Updated: service_price -> price
                    scheduled_for: scheduledFor, // Updated: booking_date/time -> scheduled_for
                    hiring_responses: responses,
                    status: 'pending',
                    package_tier: 'basic' // Default tier for direct bookings
                });

                if (error) throw error;

                addToast("Solicitação enviada com sucesso!", "success");
                onClose();
                navigate('/perfil/pedidos');
            }
        } catch (err) {
            console.error("Booking error:", err);
            const message = err instanceof Error ? err.message : "Erro ao solicitar agendamento.";
            addToast(message, "error");
        } finally {
            setLoading(false);
        }
    });

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
                                {/* Date & Time Selection (Hidden for Quotes) */}
                                {!isQuote && (
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
                                )}

                                {/* Service Details */}
                                {!isQuote && (
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
                                )}

                                {/* Notes / Quote Description */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {isQuote ? 'Descreva o que você precisa *' : 'Observações (Opcional)'}
                                    </label>
                                    <textarea
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none transition-all h-24 resize-none"
                                        placeholder={isQuote ? "Descreva os detalhes do projeto em detalhes para receber um orçamento ideal..." : "Descreva detalhes específicos do que você precisa..."}
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        required={isQuote}
                                    />
                                </div>

                                {/* Dynamic Questions - Improved UI */}
                                {serviceForm && serviceForm.questions.length > 0 && (
                                    <div className="space-y-6 pt-6 border-t border-gray-100 bg-brand-primary/5 -mx-6 px-6 py-6 pb-8">
                                        <div>
                                            <p className="text-sm font-black text-brand-primary uppercase tracking-widest">Questionário de Briefing</p>
                                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">Responda estas perguntas para que o profissional possa preparar seu orçamento com precisão.</p>
                                        </div>
                                        
                                        <div className="space-y-4">
                                            {serviceForm.questions.map((q, idx) => (
                                                <div key={idx} className="bg-white p-4 rounded-xl border border-brand-primary/10 shadow-sm">
                                                    <label className="block text-sm font-bold text-gray-800 mb-2">{q}</label>
                                                    <input
                                                        type="text"
                                                        required
                                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none transition-all text-sm"
                                                        value={responses[q] || ''}
                                                        onChange={(e) => setResponses({ ...responses, [q]: e.target.value })}
                                                        placeholder="Sua resposta..."
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {isQuote && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Expectativa de Orçamento (Opcional)</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <span className="text-gray-500 sm:text-sm">R$</span>
                                            </div>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none transition-all"
                                                placeholder="0.00"
                                                value={formData.budgetExpectation}
                                                onChange={(e) => setFormData({ ...formData, budgetExpectation: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                )}

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
                                        disabled={
                                            loading ||
                                            canCheckout === false ||
                                            (!isQuote && !isDaily && service.use_company_availability && !!availability && (!formData.date || isDateDisabled(formData.date) || !formData.time)) ||
                                            (!isQuote && isDaily && (!formData.date || !formData.endDate))
                                        }
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