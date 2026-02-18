import React, { useState } from 'react';
import Button from '@/components/ui/Button';

const WEEKDAYS = [
    { id: 'mon', label: 'Segunda-feira' },
    { id: 'tue', label: 'Terça-feira' },
    { id: 'wed', label: 'Quarta-feira' },
    { id: 'thu', label: 'Quinta-feira' },
    { id: 'fri', label: 'Sexta-feira' },
    { id: 'sat', label: 'Sábado' },
    { id: 'sun', label: 'Domingo' },
];

const DashboardAgendaPage: React.FC = () => {
    const [schedule, setSchedule] = useState({
        mon: { active: true, start: '09:00', end: '18:00' },
        tue: { active: true, start: '09:00', end: '18:00' },
        wed: { active: true, start: '09:00', end: '18:00' },
        thu: { active: true, start: '09:00', end: '18:00' },
        fri: { active: true, start: '09:00', end: '18:00' },
        sat: { active: false, start: '09:00', end: '13:00' },
        sun: { active: false, start: '09:00', end: '13:00' },
    });

    const [bufferTime, setBufferTime] = useState('30');
    const [blockedDates, setBlockedDates] = useState<string[]>([]);
    const [newBlockedDate, setNewBlockedDate] = useState('');

    const handleDayToggle = (day: string) => {
        setSchedule(prev => ({
            ...prev,
            [day]: { ...prev[day as keyof typeof schedule], active: !prev[day as keyof typeof schedule].active }
        }));
    };

    const handleTimeChange = (day: string, field: 'start' | 'end', value: string) => {
        setSchedule(prev => ({
            ...prev,
            [day]: { ...prev[day as keyof typeof schedule], [field]: value }
        }));
    };

    const addBlockedDate = () => {
        if (newBlockedDate && !blockedDates.includes(newBlockedDate)) {
            setBlockedDates([...blockedDates, newBlockedDate]);
            setNewBlockedDate('');
        }
    };

    const removeBlockedDate = (date: string) => {
        setBlockedDates(blockedDates.filter(d => d !== date));
    };

    const handleSave = () => {
        // Simulate API save
        console.log('Salvando configurações:', { schedule, bufferTime, blockedDates });
        alert('Configurações salvas com sucesso!');
    };

    return (
        <div className="space-y-8 max-w-4xl">
            <header>
                <h1 className="text-2xl font-bold text-gray-900">Configuração de Agenda</h1>
                <p className="text-gray-500">Defina seus horários de atendimento para que os clientes saibam quando agendar.</p>
            </header>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Horários de Funcionamento</h2>
                    <div className="space-y-4">
                        {WEEKDAYS.map(day => {
                            const config = schedule[day.id as keyof typeof schedule];
                            return (
                                <div key={day.id} className="flex items-center gap-4 py-2 border-b border-gray-50 last:border-0">
                                    <div className="w-32 flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={config.active}
                                            onChange={() => handleDayToggle(day.id)}
                                            className="w-4 h-4 text-brand-primary rounded focus:ring-brand-primary"
                                        />
                                        <span className={`text-sm font-medium ${config.active ? 'text-gray-900' : 'text-gray-400'}`}>
                                            {day.label}
                                        </span>
                                    </div>

                                    {config.active ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="time"
                                                value={config.start}
                                                onChange={(e) => handleTimeChange(day.id, 'start', e.target.value)}
                                                className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-brand-primary outline-none"
                                            />
                                            <span className="text-gray-400 text-sm">até</span>
                                            <input
                                                type="time"
                                                value={config.end}
                                                onChange={(e) => handleTimeChange(day.id, 'end', e.target.value)}
                                                className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-brand-primary outline-none"
                                            />
                                        </div>
                                    ) : (
                                        <span className="text-sm text-gray-400 italic px-2">Fechado</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Buffer Settings */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-full">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Intervalo entre Serviços</h2>
                    <p className="text-sm text-gray-500 mb-4">
                        Defina um tempo de "respiro" entre um agendamento e outro para deslocamento ou organização.
                    </p>
                    <select
                        value={bufferTime}
                        onChange={(e) => setBufferTime(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-primary outline-none"
                    >
                        <option value="0">Sem intervalo</option>
                        <option value="15">15 minutos</option>
                        <option value="30">30 minutos (Recomendado)</option>
                        <option value="45">45 minutos</option>
                        <option value="60">1 hora</option>
                    </select>
                </div>

                {/* Blocked Dates */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-full">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Bloquear Datas (Férias/Feriados)</h2>
                    <div className="flex gap-2 mb-4">
                        <input
                            type="date"
                            value={newBlockedDate}
                            onChange={(e) => setNewBlockedDate(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-primary outline-none"
                        />
                        <Button variant="secondary" onClick={addBlockedDate} size="sm">
                            Bloquear
                        </Button>
                    </div>

                    {blockedDates.length > 0 ? (
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                            {blockedDates.map(date => (
                                <div key={date} className="flex justify-between items-center bg-red-50 px-3 py-2 rounded-lg border border-red-100">
                                    <span className="text-sm text-red-700 font-medium">
                                        {new Date(date).toLocaleDateString('pt-BR')}
                                    </span>
                                    <button onClick={() => removeBlockedDate(date)} className="text-red-400 hover:text-red-700">
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-sm text-gray-400 italic py-4">
                            Nenhuma data bloqueada.
                        </p>
                    )}
                </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-200">
                <Button size="lg" onClick={handleSave}>
                    Salvar Alterações
                </Button>
            </div>
        </div>
    );
};

export default DashboardAgendaPage;
