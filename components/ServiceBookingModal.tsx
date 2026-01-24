import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from './ui/Button';
import { Service, Company } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';

interface ServiceBookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    service: Service | null;
    companyName: string;
}

const ServiceBookingModal: React.FC<ServiceBookingModalProps> = ({
    isOpen,
    onClose,
    service,
    companyName,
}) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        date: '',
        time: '',
        notes: '',
    });

    if (!isOpen || !service) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            addToast("Você precisa estar logado para agendar.", "info");
            navigate('/auth/login');
            return;
        }

        if (user.type !== 'client') {
            addToast("Apenas clientes podem solicitar agendamentos.", "warning");
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase.from('bookings').insert({
                client_id: user.id,
                company_id: service.company_id, // Ensure this exists in Service type!
                service_title: service.title,
                service_price: service.price,
                booking_date: formData.date,
                booking_time: formData.time,
                notes: formData.notes,
                status: 'pending'
            });

            if (error) throw error;

            addToast("Solicitação enviada com sucesso!", "success");
            onClose();
            // Optional: Navigate to a "My Bookings" page or success page
            // navigate('/client/agendamentos'); 

        } catch (err: any) {
            console.error("Booking error:", err);
            addToast("Erro ao solicitar agendamento.", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
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
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Data Preferencial</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none transition-all"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Horário</label>
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
                                </div>
                            </div>

                            {/* Service Details */}
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-gray-600">Valor Estimado</span>
                                    <span className="font-bold text-brand-primary text-lg">
                                        {service.price ? `R$ ${service.price.toFixed(2)}` : 'A combinar'}
                                    </span>
                                </div>
                                {service.duration && (
                                    <div className="flex items-center text-sm text-gray-500">
                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Duração aprox: {service.duration}
                                    </div>
                                )}
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
                                >
                                    Confirmar Solicitação
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ServiceBookingModal;
