import React from 'react';
import { Link } from 'react-router-dom';

const RECENT_ORDERS = [
    {
        id: '1',
        companyName: 'Tech Solutions',
        serviceName: 'Troca de Tela',
        image: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80',
    },
    {
        id: '2',
        companyName: 'Ana Silva',
        serviceName: 'Consultoria',
        image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80',
    },
    {
        id: '3',
        companyName: 'Limpeza Express',
        serviceName: 'Faxina Geral',
        image: 'https://images.unsplash.com/photo-1581578731117-104f2a8d23b7?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80',
    }
];

const ReorderCarousel: React.FC = () => {
    return (
        <section className="py-8">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Pedir de novo</h2>
                    <Link to="/perfil/pedidos" className="text-sm text-brand-primary font-medium hover:underline">
                        Ver histórico
                    </Link>
                </div>

                <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x">
                    {RECENT_ORDERS.map(order => (
                        <div key={order.id} className="snap-start shrink-0 w-32 flex flex-col items-center group cursor-pointer">
                            <div className="relative w-20 h-20 mb-2 rounded-full overflow-hidden border-2 border-transparent group-hover:border-brand-primary transition-all shadow-sm group-hover:shadow-md">
                                <img src={order.image} alt={order.companyName} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                            </div>
                            <p className="text-sm font-bold text-gray-900 text-center truncate w-full">{order.companyName}</p>
                            <p className="text-xs text-gray-500 text-center truncate w-full">{order.serviceName}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default ReorderCarousel;
