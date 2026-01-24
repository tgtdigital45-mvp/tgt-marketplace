import React, { useState } from 'react';
import Button from '../../components/ui/Button';
import KanbanCard from '../../components/dashboard/KanbanCard';
import { AnimatePresence } from 'framer-motion';

// Mock data for appointments
const MOCK_APPOINTMENTS = [
    {
        id: '1',
        clientName: 'Ana Silva',
        clientAvatar: 'https://i.pravatar.cc/150?u=ana',
        service: 'Consultoria de Estilo',
        date: '2026-01-25',
        time: '14:00',
        status: 'pending',
        price: 350,
    },
    {
        id: '2',
        clientName: 'Carlos Oliveira',
        clientAvatar: 'https://i.pravatar.cc/150?u=carlos',
        service: 'Coloração Pessoal',
        date: '2026-01-26',
        time: '10:00',
        status: 'confirmed',
        price: 400,
    },
    {
        id: '3',
        clientName: 'Mariana Costa',
        clientAvatar: 'https://i.pravatar.cc/150?u=mariana',
        service: 'Workshop de Moda',
        date: '2026-01-22',
        time: '19:00',
        status: 'completed',
        price: 800,
    },
    {
        id: '4',
        clientName: 'Roberto Dias',
        clientAvatar: 'https://i.pravatar.cc/150?u=roberto',
        service: 'Análise de Guarda-Roupa',
        date: '2026-01-27',
        time: '09:00',
        status: 'in_progress',
        price: 1200,
    },
];

const COLUMNS = [
    { id: 'pending', title: 'Novos', color: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800' },
    { id: 'confirmed', title: 'Agendados', color: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800' },
    { id: 'in_progress', title: 'Em Execução', color: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-800' },
    { id: 'completed', title: 'Concluídos', color: 'bg-green-50', border: 'border-green-200', text: 'text-green-800' },
];

const DashboardAgendamentosPage: React.FC = () => {
    const [appointments, setAppointments] = useState(MOCK_APPOINTMENTS);

    const handleUpdateStatus = (id: string, newStatus: string) => {
        setAppointments(prev => prev.map(app =>
            app.id === id ? { ...app, status: newStatus } : app
        ));
    };

    const handleCancel = (id: string) => {
        if (confirm('Tem certeza que deseja cancelar este agendamento?')) {
            handleUpdateStatus(id, 'cancelled');
        }
    };

    return (
        <div className="space-y-6 h-full flex flex-col">
            <header className="flex justify-between items-center shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gestão de Pedidos</h1>
                    <p className="text-gray-500 text-sm">Gerencie seu fluxo de trabalho em tempo real</p>
                </div>
                <Button variant="primary">Novo Agendamento Manual</Button>
            </header>

            {/* Kanban Board Container */}
            <div className="flex-1 overflow-x-auto pb-4">
                <div className="flex gap-4 min-w-[1000px] h-full">
                    {COLUMNS.map(column => {
                        const columnItems = appointments.filter(app => app.status === column.id);
                        return (
                            <div key={column.id} className="flex-1 min-w-[280px] flex flex-col h-full rounded-2xl bg-gray-50/50 border border-gray-100">
                                {/* Column Header */}
                                <div className={`p-4 border-b ${column.border} ${column.color} rounded-t-2xl flex justify-between items-center`}>
                                    <h3 className={`font-bold ${column.text}`}>{column.title}</h3>
                                    <span className={`px-2 py-0.5 rounded-full bg-white/50 text-xs font-bold ${column.text}`}>
                                        {columnItems.length}
                                    </span>
                                </div>

                                {/* Cards List */}
                                <div className="p-3 flex-1 overflow-y-auto custom-scrollbar">
                                    <AnimatePresence>
                                        {columnItems.length > 0 ? (
                                            columnItems.map(appointment => (
                                                <KanbanCard
                                                    key={appointment.id}
                                                    appointment={appointment}
                                                    onMove={handleUpdateStatus}
                                                    onCancel={handleCancel}
                                                />
                                            ))
                                        ) : (
                                            <div className="h-24 flex items-center justify-center text-gray-400 text-xs italic border-2 border-dashed border-gray-200 rounded-xl">
                                                Vazio
                                            </div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default DashboardAgendamentosPage;
