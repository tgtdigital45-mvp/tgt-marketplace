import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useToast } from '@/contexts/ToastContext';

const DashboardSupportPage: React.FC = () => {
    const { addToast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const handleContactSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        // Mock API call
        setTimeout(() => {
            addToast('Sua mensagem foi enviada! Entraremos em contato em breve.', 'success');
            setIsLoading(false);
            (e.target as HTMLFormElement).reset();
        }, 1500);
    };

    const faqs = [
        { q: 'Como altero minha senha?', a: 'Você pode alterar sua senha na aba "Configurações" > "Segurança".' },
        { q: 'Como recebo pelos meus serviços?', a: 'Os pagamentos são processados via Stripe e transferidos para sua conta cadastrada após a conclusão do serviço (D+2).' },
        { q: 'Posso cancelar minha assinatura?', a: 'Sim, você pode gerenciar sua assinatura na aba "Assinatura" a qualquer momento.' },
        { q: 'Como editar meu perfil público?', a: 'Vá até a aba "Perfil" para editar suas informações, foto de capa e logo.' },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Suporte e Ajuda</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Precisa de ajuda? Confira as perguntas frequentes ou entre em contato conosco.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* FAQ Section */}
                <div className="space-y-6">
                    <h2 className="text-lg font-medium text-gray-900">Perguntas Frequentes (FAQ)</h2>
                    <div className="space-y-4">
                        {faqs.map((faq, index) => (
                            <div key={index} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                <h3 className="text-sm font-semibold text-gray-800 mb-2">{faq.q}</h3>
                                <p className="text-sm text-gray-600">{faq.a}</p>
                            </div>
                        ))}
                    </div>

                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                        <h3 className="text-sm font-semibold text-blue-800 mb-1">Documentação Oficial</h3>
                        <p className="text-xs text-blue-600 mb-3">
                            Acesse nossos guias detalhados para tirar o máximo proveito da plataforma.
                        </p>
                        <a href="/ajuda" target="_blank" className="text-xs font-bold text-blue-700 hover:text-blue-900 underline">
                            Ver Central de Ajuda &rarr;
                        </a>
                    </div>
                </div>

                {/* Contact Form */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm h-fit">
                    <h2 className="text-lg font-medium text-gray-900 mb-6">Entre em Contato</h2>
                    <form onSubmit={handleContactSubmit} className="space-y-4">
                        <Input
                            label="Assunto"
                            name="subject"
                            placeholder="Sobre o que você quer falar?"
                            required
                        />

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Mensagem</label>
                            <textarea
                                rows={4}
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
                                placeholder="Descreva seu problema ou dúvida..."
                                required
                            />
                        </div>

                        <div className="pt-2">
                            <Button type="submit" variant="primary" className="w-full justify-center" isLoading={isLoading}>
                                Enviar Mensagem
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default DashboardSupportPage;
