import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Service, DbCompany } from '@tgt/core';
import { BookingCalendar } from './BookingCalendar';

interface ServiceAgendaModalProps {
    isOpen: boolean;
    onClose: () => void;
    service: Service;
    company: DbCompany;
    selectedTier?: string | null;
    onSelect: (date: string, time: string, endDate?: string) => void;
}

export const ServiceAgendaModal: React.FC<ServiceAgendaModalProps> = ({
    isOpen,
    onClose,
    service,
    company,
    selectedTier,
    onSelect
}) => {
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
                        className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        {/* Header */}
                        <div className="bg-brand-primary p-6 text-white shrink-0">
                            <h2 className="text-xl font-bold">Agenda de Atendimento</h2>
                            <p className="opacity-90 mt-1 text-sm">
                                Escolha uma data e horário disponível
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

                        {/* Selected Tier Info */}
                        {selectedTier && (
                            <div className="bg-gray-50 border-b border-gray-100 p-4 shrink-0 flex items-center justify-between">
                                <span className="text-sm text-gray-600 font-medium">Pacote Selecionado:</span>
                                <span className="text-sm font-bold text-gray-900 capitalize">{selectedTier}</span>
                            </div>
                        )}

                        {/* Calendar */}
                        <div className="overflow-y-auto w-full p-4 sm:p-6 bg-white">
                            <BookingCalendar
                                service={service}
                                company={company}
                                onSelect={onSelect}
                            />
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
