import React from 'react';
import { HelpCircle, MessageSquare, ShieldAlert, LifeBuoy, ChevronDown } from 'lucide-react';
import Button from '@/components/ui/Button';

const faqs = [
    {
        question: "Como funciona o estorno?",
        answer: "O estorno é processado automaticamente caso o serviço seja cancelado dentro das regras de cancelamento da empresa. O valor costuma aparecer na sua fatura em até duas faturas dependendo do seu banco."
    },
    {
        question: "O que acontece se a empresa não aparecer?",
        answer: "Você pode abrir uma disputa diretamente aqui no painel. Nossa equipe entrará em contato com a empresa para resolver o problema ou processar o reembolso total."
    },
    {
        question: "Como posso reagendar um serviço?",
        answer: "Acesse 'Meus Agendamentos', selecione o pedido ativo e clique em 'Reagendar'. Note que algumas empresas podem aplicar taxas se o reagendamento for feito em cima da hora."
    },
    {
        question: "Os pagamentos são seguros?",
        answer: "Sim, todos os pagamentos são processados via Stripe em ambiente criptografado. Não armazenamos seus dados de cartão de crédito em nossos servidores."
    }
];

const ClientHelp: React.FC = () => {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-gradient-to-br from-[#00b09b] to-[#96c93d] rounded-3xl p-8 text-white shadow-xl">
                <h2 className="text-2xl font-bold mb-2">Central de Ajuda</h2>
                <p className="text-white/80">Estamos aqui para garantir a melhor experiência possível.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-brand-primary/10 text-brand-primary rounded-2xl flex items-center justify-center mb-4">
                        <MessageSquare size={24} />
                    </div>
                    <h3 className="font-bold text-slate-800 mb-1">Chat de Suporte</h3>
                    <p className="text-xs text-slate-500 mb-4 font-medium">Fale diretamente com nossa equipe de atendimento.</p>
                    <Button variant="outline" size="sm" className="w-full">Iniciar Chat</Button>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-4">
                        <ShieldAlert size={24} />
                    </div>
                    <h3 className="font-bold text-slate-800 mb-1">Abrir Disputa</h3>
                    <p className="text-xs text-slate-500 mb-4 font-medium">Relate um problema grave com um serviço contratado.</p>
                    <Button variant="outline" size="sm" className="w-full text-red-500 hover:bg-red-50 hover:border-red-200">Denunciar / Disputar</Button>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-4">
                        <LifeBuoy size={24} />
                    </div>
                    <h3 className="font-bold text-slate-800 mb-1">Manuais de Uso</h3>
                    <p className="text-xs text-slate-500 mb-4 font-medium">Aprenda a tirar o máximo proveito da Contratto.</p>
                    <Button variant="outline" size="sm" className="w-full">Ver Manuais</Button>
                </div>
            </div>

            <section>
                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <HelpCircle size={20} className="text-brand-primary" />
                    Perguntas Frequentes (FAQ)
                </h3>
                <div className="space-y-4">
                    {faqs.map((faq, idx) => (
                        <details key={idx} className="group bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all">
                            <summary className="flex items-center justify-between p-5 cursor-pointer list-none font-bold text-slate-700">
                                {faq.question}
                                <ChevronDown size={18} className="text-slate-400 group-open:rotate-180 transition-transform" />
                            </summary>
                            <div className="px-5 pb-5 text-sm text-slate-500 font-medium leading-relaxed">
                                {faq.answer}
                            </div>
                        </details>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default ClientHelp;
