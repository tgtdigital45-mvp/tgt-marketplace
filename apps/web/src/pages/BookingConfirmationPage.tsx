import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import Button from '@/components/ui/Button';

const BookingConfirmationPage: React.FC = () => {
    const location = useLocation();
    const state = location.state as {
        serviceName: string;
        companyName: string;
        date: string;
        time: string;
    } | undefined;

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
                <div className="mb-6">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                        <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Solicitação Enviada!</h1>
                    <p className="text-gray-600">
                        Sua solicitação de orçamento foi enviada com sucesso para <span className="font-semibold">{state?.companyName || 'o profissional'}</span>.
                    </p>
                </div>

                {state && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-8 text-left border border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Detalhes do Pedido</h3>
                        <div className="space-y-2 text-sm text-gray-800">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Serviço:</span>
                                <span className="font-medium">{state.serviceName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Data sugerida:</span>
                                <span className="font-medium">{new Date(state.date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Período:</span>
                                <span className="font-medium">
                                    {state.time === 'morning' ? 'Manhã' : state.time === 'afternoon' ? 'Tarde' : 'Noite'}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="space-y-3">
                    <p className="text-sm text-gray-500 mb-4">
                        O profissional entrará em contato em breve para confirmar os detalhes e o valor final.
                    </p>
                    <Link to="/dashboard/client/mensagens" className="block w-full">
                        <Button variant="primary" className="w-full">
                            Acompanhar nas Mensagens
                        </Button>
                    </Link>
                    <Link to="/" className="block w-full">
                        <Button variant="secondary" className="w-full">
                            Voltar para o Início
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default BookingConfirmationPage;
