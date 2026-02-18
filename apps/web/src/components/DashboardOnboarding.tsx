import React, { useState } from 'react';
import { supabase } from '@tgt/shared';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useToast } from '@/contexts/ToastContext';

interface DashboardOnboardingProps {
    companyId: string;
    onComplete: () => void;
}

const DashboardOnboarding: React.FC<DashboardOnboardingProps> = ({ companyId, onComplete }) => {
    const [step, setStep] = useState(1);
    const { addToast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    // Initial Service Form Data
    const [serviceData, setServiceData] = useState({
        title: '',
        price: '',
        duration: ''
    });

    const handleCreateService = async () => {
        if (!serviceData.title || !serviceData.price) {
            addToast("Preencha título e preço do serviço.", "error");
            return;
        }

        setIsLoading(true);
        try {
            const { error } = await supabase.from('services').insert({
                company_id: companyId,
                title: serviceData.title,
                price: parseFloat(serviceData.price),
                duration: serviceData.duration,
                description: 'Serviço inicial criado durante o setup.'
            });

            if (error) throw error;

            addToast("Serviço criado com sucesso!", "success");
            setStep(2);
        } catch (err) {
            console.error(err);
            addToast("Erro ao criar serviço.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handlePublishProfile = async () => {
        setIsLoading(true);
        try {
            const { error } = await supabase
                .from('companies')
                .update({ status: 'active' })
                .eq('id', companyId);

            if (error) throw error;

            addToast("Perfil publicado com sucesso! 🚀", "success");
            onComplete();
        } catch (err) {
            console.error(err);
            addToast("Erro ao publicar perfil.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-brand-primary p-6 text-white text-center">
                    <h2 className="text-2xl font-bold">Bem-vindo ao TGT! 🎉</h2>
                    <p className="opacity-90 mt-1">Vamos configurar seu perfil para começar a atrair clientes.</p>
                </div>

                {/* Steps */}
                <div className="p-8">
                    {/* Progress */}
                    <div className="flex justify-center mb-8">
                        <div className={`h-2 w-16 rounded-full ${step >= 1 ? 'bg-brand-primary' : 'bg-gray-200'} mr-2`}></div>
                        <div className={`h-2 w-16 rounded-full ${step >= 2 ? 'bg-brand-primary' : 'bg-gray-200'}`}></div>
                    </div>

                    {step === 1 && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <h3 className="text-xl font-bold text-gray-900">Passo 1: Crie seu Primeiro Serviço</h3>
                                <p className="text-gray-500 text-sm">Adicione um serviço principal para que os clientes possam te contratar.</p>
                            </div>

                            <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
                                <Input
                                    label="Nome do Serviço"
                                    placeholder="Ex: Consultoria, Limpeza, Manutenção..."
                                    value={serviceData.title}
                                    onChange={(e) => setServiceData({ ...serviceData, title: e.target.value })}
                                />
                                <div className="grid grid-cols-2 gap-4 mt-4">
                                    <Input
                                        label="Preço (R$)"
                                        type="number"
                                        placeholder="0.00"
                                        value={serviceData.price}
                                        onChange={(e) => setServiceData({ ...serviceData, price: e.target.value })}
                                    />
                                    <Input
                                        label="Duração (Ex: 1h)"
                                        placeholder="1h"
                                        value={serviceData.duration}
                                        onChange={(e) => setServiceData({ ...serviceData, duration: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <Button onClick={handleCreateService} isLoading={isLoading}>
                                    Salvar e Continuar
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 text-center">
                            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">Tudo Pronto!</h3>
                            <p className="text-gray-600">
                                Seu perfil foi configurado. Agora você pode publicar sua empresa no nosso Guia para começar a receber pedidos.
                            </p>

                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left text-sm text-yellow-800">
                                <strong>Dica:</strong> Mantenha suas fotos e endereço atualizados para ganhar mais relevância nas buscas.
                            </div>

                            <Button onClick={handlePublishProfile} isLoading={isLoading} className="w-full">
                                Publicar Minha Empresa Agora 🚀
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DashboardOnboarding;
