import React, { useState } from 'react';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

// Mock Data
const MY_ORDERS = [
    {
        id: '1234',
        companyName: 'Tech Solutions Reparos',
        serviceName: 'Troca de Tela iPhone 13',
        date: '2026-01-24', // Tomorrow
        time: '14:00',
        status: 'confirmed', // pending, confirmed, in_progress, completed, cancelled
        price: 450.00,
        timeline: [
            { label: 'Solicitado', done: true, time: '23/01 10:30' },
            { label: 'Confirmado', done: true, time: '23/01 11:15' },
            { label: 'Em Execução', done: false, time: null },
            { label: 'Finalizado', done: false, time: null },
        ]
    },
    {
        id: '5678',
        companyName: 'Ana Silva Consultoria',
        serviceName: 'Análise de Coloração',
        date: '2025-12-10',
        time: '10:00',
        status: 'completed',
        price: 350.00,
        timeline: [], // Past order
    }
];

const ClientOrdersPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

    const activeOrders = MY_ORDERS.filter(o => ['pending', 'confirmed', 'in_progress'].includes(o.status));
    const historyOrders = MY_ORDERS.filter(o => ['completed', 'cancelled'].includes(o.status));

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Meus Pedidos</h1>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-8">
                <button
                    onClick={() => setActiveTab('active')}
                    className={`pb-4 px-6 font-medium text-sm transition-colors relative ${activeTab === 'active' ? 'text-brand-primary' : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Em Andamento
                    {activeTab === 'active' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-primary rounded-t-full"></span>}
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`pb-4 px-6 font-medium text-sm transition-colors relative ${activeTab === 'history' ? 'text-brand-primary' : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Histórico
                    {activeTab === 'history' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-primary rounded-t-full"></span>}
                </button>
            </div>

            {/* List */}
            <div className="space-y-6">
                {(activeTab === 'active' ? activeOrders : historyOrders).map(order => (
                    <div key={order.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-bold text-lg text-gray-900">{order.companyName}</h3>
                                <p className="text-gray-600">{order.serviceName}</p>
                            </div>
                            <div className="text-right">
                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${order.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                                        order.status === 'completed' ? 'bg-green-100 text-green-700' :
                                            'bg-gray-100 text-gray-700'
                                    }`}>
                                    {order.status === 'confirmed' ? 'Agendado' : order.status}
                                </span>
                                <p className="text-sm font-bold mt-1">R$ {order.price.toFixed(2)}</p>
                            </div>
                        </div>

                        {/* Date Info */}
                        <div className="flex gap-6 text-sm text-gray-500 mb-6">
                            <div className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                {new Date(order.date).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                {order.time}
                            </div>
                        </div>

                        {/* Timeline (Only for Active) */}
                        {activeTab === 'active' && order.timeline && (
                            <div className="relative mb-6">
                                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -translate-y-1/2 z-0"></div>
                                <div className="relative z-10 flex justify-between">
                                    {order.timeline.map((step, idx) => (
                                        <div key={idx} className="flex flex-col items-center group">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${step.done ? 'bg-brand-primary border-brand-primary text-white' : 'bg-white border-gray-200 text-gray-300'
                                                }`}>
                                                {step.done && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                            </div>
                                            <span className={`text-xs mt-2 font-medium ${step.done ? 'text-brand-primary' : 'text-gray-400'}`}>{step.label}</span>
                                            {step.time && <span className="text-[10px] text-gray-400">{step.time}</span>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
                            {activeTab === 'active' ? (
                                <>
                                    <Button variant="secondary" size="sm">Ajuda</Button>
                                    <Button size="sm">Chat com Empresa</Button>
                                </>
                            ) : (
                                <Button size="sm">Pedir de Novo</Button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ClientOrdersPage;
