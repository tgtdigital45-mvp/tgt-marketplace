import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    question: 'Como funciona a verificacao de prestadores?',
    answer: 'Cada empresa passa por analise documental, checagem de CNPJ ativo e validacao de portfolio antes de ser aprovada na plataforma. Monitoramos continuamente a reputacao de todos os parceiros.',
  },
  {
    question: 'Quanto custa para clientes?',
    answer: 'A busca e 100% gratuita. Voce navega, compara e so paga pelo servico contratado diretamente com o prestador. Sem taxas ocultas, sem surpresas.',
  },
  {
    question: 'Como cadastro minha empresa?',
    answer: 'O cadastro leva menos de 5 minutos. Preencha o formulario com os dados da empresa, envie os documentos necessarios e nossa equipe realiza a verificacao em ate 24 horas.',
  },
  {
    question: 'A plataforma oferece garantia?',
    answer: 'Sim. Se o servico nao for entregue conforme o acordado, a CONTRATTO intermedia a resolucao entre as partes. Nossa prioridade e garantir uma experiencia segura para todos.',
  },
  {
    question: 'Quais categorias de servicos estao disponiveis?',
    answer: 'Contabilidade, Engenharia, Tecnologia, Saude, Beleza e Estetica, Eventos, Fotografia, Varejo, Consultoria, Advocacia, Arquitetura, Educacao e muito mais. Novas categorias sao adicionadas frequentemente.',
  },
  {
    question: 'Como funciona o sistema de avaliacoes?',
    answer: 'Apenas clientes que efetivamente contrataram um servico podem deixar uma avaliacao. Todas as notas sao publicas, verificadas e nao podem ser editadas pelo prestador.',
  },
];

const FAQItem: React.FC<{ item: typeof faqs[0]; index: number; isOpen: boolean; onToggle: () => void }> = ({
  item, index, isOpen, onToggle,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-20px' }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
      className="border-b border-slate-200 last:border-b-0"
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-5 sm:py-6 text-left group"
      >
        <span className="text-sm sm:text-base lg:text-lg font-bold text-slate-900 pr-4 group-hover:text-primary-600 transition-colors">
          {item.question}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 group-hover:bg-primary-50 flex items-center justify-center transition-colors"
        >
          <ChevronDown size={16} className={`transition-colors ${isOpen ? 'text-primary-600' : 'text-slate-400'}`} />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p className="pb-5 sm:pb-6 text-slate-500 text-sm sm:text-base leading-relaxed pr-12">
              {item.answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-16 sm:py-20 lg:py-28 bg-white">
      <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-10 sm:mb-14"
          >
            <span className="text-primary-600 font-bold tracking-[0.2em] text-[10px] sm:text-xs uppercase mb-3 sm:mb-4 block">
              Duvidas
            </span>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">
              Perguntas <span className="text-slate-400">Frequentes</span>
            </h2>
          </motion.div>

          <div className="divide-slate-200">
            {faqs.map((item, i) => (
              <FAQItem
                key={i}
                item={item}
                index={i}
                isOpen={openIndex === i}
                onToggle={() => setOpenIndex(openIndex === i ? null : i)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
