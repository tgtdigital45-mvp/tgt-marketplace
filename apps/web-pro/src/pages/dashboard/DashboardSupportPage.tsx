import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useToast } from '@/contexts/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  ChevronDown,
  HelpCircle,
  MessageCircle,
  Mail,
  ExternalLink,
  BookOpen,
  Phone,
} from 'lucide-react';

const FAQS = [
  { q: 'Como altero minha senha?', a: 'Voce pode alterar sua senha na aba "Configuracoes" > "Seguranca". Basta digitar a nova senha e confirmar.' },
  { q: 'Como recebo pelos meus servicos?', a: 'Os pagamentos sao processados via Stripe e transferidos para sua conta cadastrada apos a conclusao do servico (D+2). Acompanhe tudo na aba "Faturamento".' },
  { q: 'Posso cancelar minha assinatura?', a: 'Sim, voce pode gerenciar sua assinatura na aba "Assinatura" a qualquer momento. Nao ha fidelidade.' },
  { q: 'Como editar meu perfil publico?', a: 'Va ate a aba "Perfil" para editar suas informacoes, foto de capa, logo, descricao e redes sociais.' },
  { q: 'Como adicionar servicos ao meu catalogo?', a: 'Na aba "Servicos", clique em "Adicionar Servico" e siga o assistente passo a passo para configurar preco, descricao e pacotes.' },
  { q: 'Quanto tempo leva para meu perfil aparecer nas buscas?', a: 'Apos completar seu perfil (100%), ele aparece nas buscas em ate 24 horas. Perfis completos tem prioridade no ranking.' },
];

const DashboardSupportPage: React.FC = () => {
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [openFaq, setOpenFaq] = useState<number>(0);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      addToast('Sua mensagem foi enviada! Entraremos em contato em breve.', 'success');
      setIsLoading(false);
      (e.target as HTMLFormElement).reset();
    }, 1500);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5 sm:space-y-6">

      {/* ─── Page Header ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
          <span>Dashboard</span><ChevronRight size={12} />
          <span className="text-gray-600 font-medium">Suporte</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Suporte e Ajuda</h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
          Precisa de ajuda? Confira as perguntas frequentes ou fale conosco
        </p>
      </motion.div>

      {/* ─── Quick Links ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-3"
      >
        {[
          { icon: <Phone size={18} />, label: 'WhatsApp', desc: 'Resposta em ate 2h', color: 'bg-emerald-50 text-emerald-600 border-emerald-100', href: 'https://wa.me/5545999999999' },
          { icon: <Mail size={18} />, label: 'E-mail', desc: 'suporte@contratto.com', color: 'bg-blue-50 text-blue-600 border-blue-100', href: 'mailto:suporte@contratto.com' },
          { icon: <BookOpen size={18} />, label: 'Central de Ajuda', desc: 'Guias e tutoriais', color: 'bg-purple-50 text-purple-600 border-purple-100', href: '/ajuda' },
        ].map((item, idx) => (
          <a
            key={idx}
            href={item.href}
            target={item.href.startsWith('http') ? '_blank' : undefined}
            rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
            className={`${item.color} border rounded-2xl p-4 flex items-center gap-3 hover:shadow-sm transition-all group`}
          >
            <div className="flex-shrink-0">{item.icon}</div>
            <div className="min-w-0">
              <p className="text-sm font-bold">{item.label}</p>
              <p className="text-[10px] opacity-70">{item.desc}</p>
            </div>
            <ExternalLink size={12} className="ml-auto opacity-0 group-hover:opacity-60 transition-opacity flex-shrink-0" />
          </a>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* ─── FAQ Accordion ──────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <HelpCircle size={16} className="text-primary-500" />
            <h2 className="text-sm font-bold text-gray-900">Perguntas Frequentes</h2>
          </div>

          <div className="space-y-2">
            {FAQS.map((faq, index) => (
              <div key={index} className="border border-gray-100 rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? -1 : index)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="text-xs sm:text-sm font-medium text-gray-700 pr-4">{faq.q}</span>
                  <ChevronDown
                    size={14}
                    className={`text-gray-400 flex-shrink-0 transition-transform duration-200 ${
                      openFaq === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {openFaq === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <p className="px-4 pb-3 text-xs text-gray-500 leading-relaxed">{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ─── Contact Form ──────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 h-fit"
        >
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle size={16} className="text-primary-500" />
            <h2 className="text-sm font-bold text-gray-900">Fale Conosco</h2>
          </div>

          <form onSubmit={handleContactSubmit} className="space-y-4">
            <Input
              label="Assunto"
              name="subject"
              placeholder="Sobre o que voce quer falar?"
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mensagem</label>
              <textarea
                rows={5}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none"
                placeholder="Descreva seu problema ou duvida com o maximo de detalhes..."
                required
              />
            </div>
            <Button type="submit" isLoading={isLoading} size="sm" className="!rounded-xl w-full justify-center">
              Enviar Mensagem
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardSupportPage;
