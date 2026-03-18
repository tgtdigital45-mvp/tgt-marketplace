import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Check, Clock, Calendar, Plus, Trash2, CalendarDays } from 'lucide-react';
import Button from '../ui/Button';
import { DAYS, DAY_LABELS, DaySchedule } from '@/utils/availability';

interface AvailabilityModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentAvailability: Record<string, DaySchedule>;
    onSave: (availability: any) => Promise<void>;
    isLoading?: boolean;
}

const UI_DAYS_ORDER: (keyof typeof DAY_LABELS)[] = [
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
];

const AvailabilityModal: React.FC<AvailabilityModalProps> = ({
    isOpen,
    onClose,
    currentAvailability,
    onSave,
    isLoading = false
}) => {
    const [availability, setAvailability] = useState<Record<string, DaySchedule>>({});
    const [worksOnHolidays, setWorksOnHolidays] = useState(false);

    useEffect(() => {
        if (currentAvailability) {
            setAvailability(currentAvailability);
            setWorksOnHolidays((currentAvailability as any).worksOnHolidays ?? false);
        }
    }, [currentAvailability, isOpen]);

    const DEFAULT_DAY: DaySchedule = {
        active: false,
        start: '09:00',
        end: '18:00',
        hasBreak: false,
        breakStart: '12:00',
        breakEnd: '13:00'
    };

    const toggleDay = (day: string) => {
        setAvailability(prev => {
            const currentDay = prev[day] || DEFAULT_DAY;
            return {
                ...prev,
                [day]: { ...currentDay, active: !currentDay.active }
            };
        });
    };

    const toggleBreak = (day: string) => {
        setAvailability(prev => {
            const currentDay = prev[day] || DEFAULT_DAY;
            return {
                ...prev,
                [day]: { ...currentDay, hasBreak: !currentDay.hasBreak }
            };
        });
    };

    const handleTimeChange = (day: string, field: keyof DaySchedule, value: string) => {
        setAvailability(prev => {
            const currentDay = prev[day] || DEFAULT_DAY;
            return {
                ...prev,
                [day]: { ...currentDay, [field]: value }
            };
        });
    };

    const handleSubmit = async () => {
        const payload = {
            ...availability,
            worksOnHolidays
        };
        await onSave(payload);
        onClose();
    };

    return (
        <Transition show={isOpen} as={React.Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={React.Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={React.Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-3xl bg-white p-6 text-left align-middle shadow-2xl transition-all">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <Dialog.Title as="h3" className="text-xl font-bold text-gray-900">
                                            Configurar Horários
                                        </Dialog.Title>
                                        <p className="text-sm text-gray-500">Gerencie quando você está disponível para atendimentos</p>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200">
                                    {/* Google Calendar Integration */}
                                    <div className="bg-primary-50 p-4 rounded-2xl border border-primary-100 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-primary-200 shadow-sm text-primary-600">
                                                <CalendarDays size={20} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">Sincronizar com Google</p>
                                                <p className="text-xs text-gray-500">Importe seus compromissos automaticamente</p>
                                            </div>
                                        </div>
                                        <button className="px-4 py-2 bg-white text-primary-600 border border-primary-200 rounded-xl text-xs font-bold hover:bg-primary-50 transition-colors shadow-sm">
                                            Conectar
                                        </button>
                                    </div>

                                    {/* Holiday Toggle */}
                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <Clock size={18} className="text-gray-400" />
                                            <span className="text-sm font-bold text-gray-700">Trabalha em Feriados?</span>
                                        </div>
                                        <button
                                            onClick={() => setWorksOnHolidays(!worksOnHolidays)}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${worksOnHolidays ? 'bg-primary-500' : 'bg-gray-200'}`}
                                        >
                                            <span className={`${worksOnHolidays ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
                                        </button>
                                    </div>

                                    {/* Daily Schedule */}
                                    <div className="space-y-3">
                                        {UI_DAYS_ORDER.map(day => (
                                            <div key={day} className={`p-4 rounded-2xl border transition-all ${availability[day]?.active ? 'bg-white border-gray-200 shadow-sm' : 'bg-gray-50 border-transparent opacity-80'}`}>
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <div 
                                                            onClick={() => toggleDay(day)}
                                                            className={`w-5 h-5 rounded-md flex items-center justify-center border cursor-pointer transition-colors ${availability[day]?.active ? 'bg-primary-500 border-primary-500 text-white' : 'bg-white border-gray-300 text-transparent'}`}
                                                        >
                                                            <Check size={12} strokeWidth={4} />
                                                        </div>
                                                        <span className="font-bold text-gray-800">{DAY_LABELS[day]}</span>
                                                    </div>

                                                    {availability[day]?.active && (
                                                        <button 
                                                            onClick={() => toggleBreak(day)}
                                                            className={`text-xs font-bold px-3 py-1 rounded-full transition-colors ${availability[day]?.hasBreak ? 'bg-orange-50 text-orange-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                                        >
                                                            {availability[day]?.hasBreak ? 'Com Intervalo' : '+ Adicionar Intervalo'}
                                                        </button>
                                                    )}
                                                </div>

                                                {availability[day]?.active ? (
                                                    <div className="flex flex-wrap items-center gap-3 animate-in fade-in slide-in-from-top-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-medium text-gray-400">Início</span>
                                                            <input
                                                                type="time"
                                                                value={availability[day]?.start}
                                                                onChange={(e) => handleTimeChange(day, 'start', e.target.value)}
                                                                className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-sm w-28 focus:ring-2 focus:ring-primary-100 outline-none"
                                                            />
                                                        </div>

                                                        {availability[day]?.hasBreak && (
                                                            <div className="flex items-center gap-3 bg-orange-50/50 p-2 rounded-xl border border-orange-100/50">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-xs font-medium text-orange-400">Pausa</span>
                                                                    <input
                                                                        type="time"
                                                                        value={availability[day]?.breakStart}
                                                                        onChange={(e) => handleTimeChange(day, 'breakStart', e.target.value)}
                                                                        className="px-3 py-1.5 bg-white border border-orange-100 rounded-xl text-sm w-28 focus:ring-2 focus:ring-orange-100 outline-none"
                                                                    />
                                                                </div>
                                                                <span className="text-orange-200 font-medium">até</span>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-xs font-medium text-orange-400">Volta</span>
                                                                    <input
                                                                        type="time"
                                                                        value={availability[day]?.breakEnd}
                                                                        onChange={(e) => handleTimeChange(day, 'breakEnd', e.target.value)}
                                                                        className="px-3 py-1.5 bg-white border border-orange-100 rounded-xl text-sm w-28 focus:ring-2 focus:ring-orange-100 outline-none"
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-medium text-gray-400">Fim</span>
                                                            <input
                                                                type="time"
                                                                value={availability[day]?.end}
                                                                onChange={(e) => handleTimeChange(day, 'end', e.target.value)}
                                                                className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-sm w-28 focus:ring-2 focus:ring-primary-100 outline-none"
                                                            />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400 italic">Folga remunerada (esperamos!)</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="mt-8 flex gap-3">
                                    <Button
                                        className="flex-1 rounded-2xl h-12 text-sm font-bold"
                                        onClick={handleSubmit}
                                        isLoading={isLoading}
                                    >
                                        Salvar Alterações
                                    </Button>
                                    <button
                                        onClick={onClose}
                                        className="px-6 h-12 border border-gray-200 rounded-2xl text-sm font-bold text-gray-500 hover:bg-gray-50 transition-colors"
                                    >
                                        Descartar
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default AvailabilityModal;
