import React, { useState } from 'react';
import InfoPageLayout from '@/components/layout/InfoPageLayout';
import {
  ChevronDown,
  Search,
  ShieldCheck,
  Users,
  Building2,
  MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '@/components/ui/Button';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  title: string;
  icon: React.ReactNode;
  items: FAQItem[];
}

const faqs: FAQCategory[] = [
  {
    title: "Para Clientes",
    icon: <Users size={20} />,
    items: [
      {
        question: "Como encontro um profissional na TGT?",
        answer: "Basta utilizar a barra de busca na home ou navegar pela página de empresas. Você pode filtrar por categoria, localização e avaliações."
      },
      {
        question: "É gratuito para clientes?",
        answer: "Sim, a busca e a solicitação de orçamentos são totalmente gratuitas para os clientes."
      },
      {
        question: "Como o pagamento é processado?",
        answer: "Os pagamentos são feitos via nossa plataforma segura. O valor só é liberado para o profissional após a confirmação de que o serviço foi entregue."
      }
    ]
  },
  {
    title: "Para Empresas",
    icon: <Building2 size={20} />,
    items: [
      {
        question: "Como cadastro minha empresa?",
        answer: "Acesse a página 'Para Empresas' e clique em 'Cadastrar agora'. Siga os passos de preenchimento do perfil e verificação."
      },
      {
        question: "Quais são as taxas de venda?",
        answer: "O cadastro básico é gratuito. Cobramos uma pequena porcentagem sobre os serviços fechados através da plataforma para garantir a manutenção da infraestrutura e segurança."
      },
      {
        question: "Como recebo meus pagamentos?",
        answer: "Após a conclusão do serviço e aprovação do cliente, o valor fica disponível em sua carteira digital TGT e pode ser transferido para sua conta bancária."
      }
    ]
  },
  {
    title: "Segurança e Suporte",
    icon: <ShieldCheck size={20} />,
    items: [
      {
        question: "A TGT é segura?",
        answer: "Sim, utilizamos criptografia de ponta a ponta e auditoria de empresas para garantir um ecossistema confiável."
      },
      {
        question: "Como falo com o suporte?",
        answer: "Você pode abrir um ticket diretamente no seu dashboard ou nos enviar uma mensagem através da página de contato."
      }
    ]
  }
];

const HelpPage: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<string | null>(null);

  const toggleFAQ = (id: string) => {
    setOpenIndex(openIndex === id ? null : id);
  };

  return (
    <InfoPageLayout
      title="Central de Ajuda"
      subtitle="Encontre respostas rápidas para as dúvidas mais comuns sobre o ecossistema TGT Contratto."
    >
      <div className="max-w-4xl mx-auto mb-24">
        {/* Search Bar Placeholder */}
        <div className="relative mb-16">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-400">
            <Search size={20} />
          </div>
          <input
            type="text"
            placeholder="Qual sua dúvida hoje?"
            className="w-full pl-14 pr-6 py-5 bg-white border border-slate-200 rounded-3xl shadow-soft focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
          />
        </div>

        <div className="space-y-12">
          {faqs.map((category, catIdx) => (
            <div key={catIdx}>
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3 tracking-tight">
                <div className="w-8 h-8 bg-primary-50 text-primary-600 rounded-lg flex items-center justify-center">
                  {category.icon}
                </div>
                {category.title}
              </h2>
              <div className="space-y-4">
                {category.items.map((faq, itemIdx) => {
                  const id = `${catIdx} -${itemIdx} `;
                  const isOpen = openIndex === id;
                  return (
                    <div key={id} className="border border-slate-200 rounded-2xl overflow-hidden bg-white hover:border-slate-300 transition-colors">
                      <button
                        onClick={() => toggleFAQ(id)}
                        className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
                      >
                        <span className="font-bold text-slate-700 tracking-tight">{faq.question}</span>
                        <div className={`text - slate - 400 transition - transform duration - 300 ${isOpen ? 'rotate-180' : ''} `}>
                          <ChevronDown size={20} />
                        </div>
                      </button>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <div className="px-6 pb-6 text-slate-500 text-sm leading-relaxed border-t border-slate-50 pt-4">
                              {faq.answer}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Still need help */}
        <div className="mt-20 bg-primary-600 rounded-[32px] p-10 text-white text-center shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-2xl font-bold mb-4 tracking-tight">Ainda precisa de ajuda?</h3>
            <p className="text-primary-100 mb-8 max-w-md mx-auto">Nossa equipe de suporte corporativo está pronta para te atender.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="outline" className="bg-white text-primary-600 border-none px-8 font-bold">
                Abrir Ticket
              </Button>
              <Button variant="ghost" className="text-white hover:bg-white/10 px-8 font-bold flex items-center gap-2">
                <MessageCircle size={18} /> Falar no Chat
              </Button>
            </div>
          </div>
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
        </div>
      </div>
    </InfoPageLayout>
  );
};

export default HelpPage;
