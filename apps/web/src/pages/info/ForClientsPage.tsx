import React from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  CheckCircle2,
  ShieldCheck,
  Clock,
  CreditCard,
  ArrowRight,
  SearchCode,
  MessageCircle,
  Star
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { motion } from 'framer-motion';

const ForClientsPage: React.FC = () => {
  return (
    <div className="bg-white text-slate-900">
      {/* Hero Section */}
      <section className="relative pt-32 pb-24 overflow-hidden bg-slate-50/50">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-primary-600/5 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2" />

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-block py-1.5 px-4 rounded-full bg-primary-50 text-primary-600 text-xs font-bold uppercase tracking-widest mb-6 border border-primary-100">
                PARA QUEM BUSCA EXCELÊNCIA
              </span>
              <h1 className="text-5xl md:text-6xl font-bold text-slate-900 leading-[1.1] mb-8 tracking-tight">
                O marketplace de serviços para <br />
                <span className="text-primary-600 underline decoration-primary-200">quem não aceita menos que o melhor.</span>
              </h1>
              <p className="text-xl text-slate-500 mb-10 leading-relaxed">
                Encontre, compare e contrate profissionais e empresas verificadas em poucos cliques. Simples, seguro e totalmente gratuito para você.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <Link to="/empresas">
                  <Button size="lg" className="px-8 shadow-soft hover:scale-105 transition-all">
                    Explorar Profissionais
                  </Button>
                </Link>
                <Link to="/ajuda">
                  <Button size="lg" variant="ghost" className="px-8 text-slate-600 hover:text-primary-600">
                    Como funciona?
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How it works Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight">Três passos para o sucesso</h2>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto">Sua jornada de contratação redesenhada para ser ágil e segura.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            <div className="text-center group">
              <div className="w-20 h-20 bg-slate-900 text-white rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:bg-primary-600 transition-colors duration-300">
                <Search size={32} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">1. Explore</h3>
              <p className="text-slate-500 leading-relaxed">
                Utilize nossos filtros inteligentes para encontrar especialistas por categoria, região ou avaliação.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 bg-slate-900 text-white rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:bg-primary-600 transition-colors duration-300">
                <SearchCode size={32} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">2. Analise</h3>
              <p className="text-slate-500 leading-relaxed">
                Verifique portfólios, preços e reviews reais. Tome decisões baseadas em dados e autoridade.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 bg-slate-900 text-white rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:bg-primary-600 transition-colors duration-300">
                <ShieldCheck size={32} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">3. Contrate</h3>
              <p className="text-slate-500 leading-relaxed">
                Feche o negócio com segurança. Use nossa plataforma para gerenciar a entrega e o pagamento.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Advantages Section */}
      <section className="py-24 bg-slate-50/50">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-slate-900 mb-8 tracking-tight leading-tight">
                Por que contratar <br />
                <span className="text-primary-600">pela TGT?</span>
              </h2>
              <div className="space-y-6">
                <div className="flex gap-4 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
                  <div className="mt-1"><CheckCircle2 className="text-emerald-500" size={24} /></div>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">Empresas Verificadas</h4>
                    <p className="text-slate-500 text-sm">Auditamos a documentação para garantir que você lide com profissionais sérios.</p>
                  </div>
                </div>
                <div className="flex gap-4 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
                  <div className="mt-1"><Star className="text-amber-500" size={24} /></div>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">Reviews de Qualidade</h4>
                    <p className="text-slate-500 text-sm">Apenas clientes reais que contrataram o serviço podem avaliar.</p>
                  </div>
                </div>
                <div className="flex gap-4 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
                  <div className="mt-1"><MessageCircle className="text-blue-500" size={24} /></div>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">Chat Integrado</h4>
                    <p className="text-slate-500 text-sm">Mantenha todo o histórico de negociação em um só lugar seguro.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-slate-900 p-8 rounded-3xl text-white transform translate-y-8 shadow-xl">
                <div className="mb-4 opacity-50"><Clock size={40} strokeWidth={1} /></div>
                <h4 className="text-xl font-bold mb-2">Agilidade</h4>
                <p className="text-slate-400 text-sm leading-relaxed">Receba retornos rápidos de empresas ativas na plataforma.</p>
              </div>
              <div className="bg-primary-600 p-8 rounded-3xl text-white shadow-xl">
                <div className="mb-4 opacity-50"><CreditCard size={40} strokeWidth={1} /></div>
                <h4 className="text-xl font-bold mb-2">Pagamento Seguro</h4>
                <p className="text-primary-100 text-sm leading-relaxed">Libere os fundos apenas quando o serviço for concluído conforme o combinado.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-white border-t border-slate-100">
        <div className="container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-slate-900 mb-6 tracking-tight">O profissional ideal está a um clique de distância.</h2>
            <p className="text-lg text-slate-500 mb-10 max-w-2xl mx-auto">
              Transforme sua necessidade em solução. Junte-se a milhares de clientes que confiam na TGT Contratto para gerenciar seus projetos.
            </p>
            <Link to="/empresas">
              <Button size="lg" className="px-12 py-4 h-auto shadow-xl group">
                Encontrar agora <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default ForClientsPage;
