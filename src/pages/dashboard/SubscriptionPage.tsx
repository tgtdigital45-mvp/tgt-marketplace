import React from 'react';
import { PricingTable } from '../../components/subscription/PricingTable';
import { Toaster } from 'react-hot-toast';

const SubscriptionPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-50">
            <Toaster position="top-center" />
            <div className="py-8">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="md:flex md:items-center md:justify-between mb-8">
                        <div className="min-w-0 flex-1">
                            <h2 className="text-2xl font-bold leading-7 text-slate-900 sm:truncate sm:text-3xl sm:tracking-tight">
                                Minha Assinatura
                            </h2>
                            <p className="mt-2 text-sm text-slate-500">
                                Gerencie seu plano e visualize as taxas aplicadas aos seus serviços.
                            </p>
                        </div>
                    </div>

                    <div className="bg-white shadow rounded-lg p-6">
                        <PricingTable />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionPage;
