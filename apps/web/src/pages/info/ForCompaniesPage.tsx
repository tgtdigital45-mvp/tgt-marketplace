import React from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Star,
  MessageSquare,
  BarChart3,
  Check
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { motion } from 'framer-motion';


const ForCompaniesPage: React.FC = () => {
  return (
    <div className="bg-white text-slate-900">
      {/* Hero Section */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary-600/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-slate-900/5 rounded-full blur-[100px]" />
        </div>

        <div className="container mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block py-1.5 px-4 rounded-full bg-primary-50 text-primary-600 text-xs font-bold uppercase tracking-widest mb-6 border border-primary-100">
              SOLUÇÕES CORPORATIVAS
            </span>
            <h1 className="text-5xl md:text-7xl font-bold text-slate-900 leading-[1.1] mb-8 tracking-tight max-w-4xl mx-auto">
              Sua vitrine profissional no <br />
              <span className="text-primary-600 font-extrabold italic">Marketplace CONTRATTO.</span>
            </h1>
            <p className="text-xl text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed">
              Expanda seu alcance, gerencie sua reputação e conecte-se com clientes que buscam excelência. A plataforma completa para o crescimento do seu negócio.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/empresa/cadastro">
                <Button size="lg" className="px-8 shadow-soft hover:scale-105 transition-all">
                  Cadastrar minha Empresa
                </Button>
              </Link>
              <Link to="/planos">
                <Button size="lg" variant="outline" className="px-8">
                  Ver Planos e Preços
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-slate-50/50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight">O motor de crescimento da sua empresa</h2>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
              Ferramentas de ponta desenhadas para simplificar sua gestão e maximizar sua conversão de leads.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <motion.div
              whileHover={{ y: -5 }}
              className="bg-white p-8 rounded-3xl shadow-soft border border-slate-200"
            >
              <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mb-6 text-primary-600">
                <Building2 size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3 tracking-tight">Presença Digital</h3>
              <p className="text-slate-500 leading-relaxed text-sm">Perfil otimizado com portfólio, serviços e geolocalização estratégica.</p>
            </motion.div>
            <motion.div
              whileHover={{ y: -5 }}
              className="bg-white p-8 rounded-3xl shadow-soft border border-slate-200"
            >
              <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mb-6 text-primary-600">
                <Star size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3 tracking-tight">Autoridade Social</h3>
              <p className="text-slate-500 leading-relaxed text-sm">Sistema de avaliações verificado para transformar sua reputação em vendas.</p>
            </motion.div>
            <motion.div
              whileHover={{ y: -5 }}
              className="bg-white p-8 rounded-3xl shadow-soft border border-slate-200"
            >
              <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mb-6 text-primary-600">
                <MessageSquare size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3 tracking-tight">Vendas Diretas</h3>
              <p className="text-slate-500 leading-relaxed text-sm">Canal direto de negociação e fechamento sem intermediários complexos.</p>
            </motion.div>
            <motion.div
              whileHover={{ y: -5 }}
              className="bg-white p-8 rounded-3xl shadow-soft border border-slate-200"
            >
              <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mb-6 text-primary-600">
                <BarChart3 size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3 tracking-tight">Insights de Gestão</h3>
              <p className="text-slate-500 leading-relaxed text-sm">Dados reais sobre visualizações e desempenho do seu perfil na região.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight">Planos para todas as fases</h2>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
              De profissionais independentes a grandes empresas, temos a estrutura certa.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Plan 1: Starter */}
            <motion.div
              whileHover={{ y: -5 }}
              className="border border-slate-200 rounded-3xl p-10 bg-white shadow-soft flex flex-col"
            >
              <h3 className="text-2xl font-bold text-slate-900">Starter</h3>
              <p className="text-slate-500 mt-2 font-medium">Para quem está começando</p>
              <div className="my-8">
                <div className="flex items-baseline gap-1">
                  <p className="text-4xl font-bold text-slate-900">R$ 49,90</p>
                  <p className="text-slate-500 text-sm font-medium">/mês</p>
                </div>
                <p className="text-green-600 text-sm mt-2 font-bold">1º Mês Grátis</p>
              </div>
              <ul className="space-y-4 text-left text-slate-600 mb-10 flex-grow">
                <li className="flex items-center gap-3"><Check className="text-primary-600" size={20} /><span className="text-sm font-medium">Taxa de Serviço: 20%</span></li>
                <li className="flex items-center gap-3"><Check className="text-primary-600" size={20} /><span className="text-sm font-medium">Listagem na busca</span></li>
                <li className="flex items-center gap-3"><Check className="text-primary-600" size={20} /><span className="text-sm font-medium">5 serviços ativos</span></li>
                <li className="flex items-center gap-3"><Check className="text-primary-600" size={20} /><span className="text-sm font-medium">Acesso a orçamentos</span></li>
              </ul>
              <Link to="/empresa/cadastro">
                <Button variant="outline" className="w-full py-4 text-sm font-bold">Começar Grátis</Button>
              </Link>
            </motion.div>

            {/* Plan 2: Pro */}
            <motion.div
              whileHover={{ y: -5 }}
              className="border-2 border-primary-600 rounded-3xl p-10 bg-slate-900 shadow-xl relative flex flex-col md:scale-105"
            >
              <span className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-primary-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">Recomendado</span>
              <h3 className="text-2xl font-bold text-white">CONTRATTO Pro</h3>
              <p className="text-slate-400 mt-2 font-medium">Tração e destaque total</p>
              <div className="my-8">
                <div className="flex items-baseline gap-1">
                  <p className="text-4xl font-bold text-white">R$ 99,90</p>
                  <p className="text-slate-400 text-sm font-medium">/mês</p>
                </div>
                <p className="text-primary-400 text-[10px] font-bold uppercase mt-2">1º Mês Grátis</p>
              </div>
              <ul className="space-y-4 text-left text-slate-300 mb-10 flex-grow">
                <li className="flex items-center gap-3"><Check className="text-primary-400" size={20} /><span className="text-sm font-medium">Taxa de Serviço: 12%</span></li>
                <li className="flex items-center gap-3"><Check className="text-primary-400" size={20} /><span className="text-sm font-medium">Emissor de NF-e Automático</span></li>
                <li className="flex items-center gap-3"><Check className="text-primary-400" size={20} /><span className="text-sm font-medium">Selo de Verificado</span></li>
                <li className="flex items-center gap-3"><Check className="text-primary-400" size={20} /><span className="text-sm font-medium">Serviços Ilimitados</span></li>
              </ul>
              <Link to="/empresa/cadastro">
                <Button className="w-full py-4 text-sm font-bold bg-primary-600 hover:bg-primary-700">Escolher Plano Pro</Button>
              </Link>
            </motion.div>

            {/* Plan 3: Agency */}
            <motion.div
              whileHover={{ y: -5 }}
              className="border border-slate-200 rounded-3xl p-10 bg-white shadow-soft flex flex-col"
            >
              <h3 className="text-2xl font-bold text-slate-900">Agency</h3>
              <p className="text-slate-500 mt-2 font-medium">Escala e exclusividade</p>
              <div className="my-8">
                <div className="flex items-baseline gap-1">
                  <p className="text-4xl font-bold text-slate-900">R$ 299,90</p>
                  <p className="text-slate-400 text-sm font-medium">/mês</p>
                </div>
                <p className="text-green-600 text-sm mt-2 font-bold">1º Mês Grátis</p>
              </div>
              <ul className="space-y-4 text-left text-slate-600 mb-10 flex-grow">
                <li className="flex items-center gap-3"><Check className="text-primary-600" size={20} /><span className="text-sm font-medium">Taxa de Serviço: 8%</span></li>
                <li className="flex items-center gap-3"><Check className="text-primary-600" size={20} /><span className="text-sm font-medium">Menor taxa do mercado</span></li>
                <li className="flex items-center gap-3"><Check className="text-primary-600" size={20} /><span className="text-sm font-medium">Multi-usuários</span></li>
                <li className="flex items-center gap-3"><Check className="text-primary-600" size={20} /><span className="text-sm font-medium">Relatórios de Inteligência</span></li>
              </ul>
              <Link to="/empresa/cadastro">
                <Button variant="outline" className="w-full py-4 text-sm font-bold">Criar Conta Agency</Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-slate-50/50 border-y border-slate-100">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight">Confiança de quem já cresce conosco</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">Mais do que uma plataforma, somos o parceiro estratégico do seu negócio.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white p-10 rounded-3xl border border-slate-200 shadow-soft"
            >
              <p className="text-slate-600 italic text-lg leading-relaxed mb-8">
                "Desde que cadastramos nossa operação na CONTRATTO, vimos um aumento de 30% nas consultas diretas. A plataforma é intuitiva e o suporte é verdadeiramente corporativo."
              </p>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-slate-100 p-1 border border-slate-200">
                  <img src="https://picsum.photos/seed/adega/100/100" className="w-full h-full rounded-full object-cover" alt="Roberto Mendes" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Roberto Mendes</p>
                  <p className="text-sm text-slate-500 font-medium tracking-wide">Diretor, Adega Vinho Sul</p>
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white p-10 rounded-3xl border border-slate-200 shadow-soft"
            >
              <p className="text-slate-600 italic text-lg leading-relaxed mb-8">
                "A CONTRATTO nos conectou com clientes qualificados que buscam valor, não apenas preço. É a melhor ferramenta de marketing para prestadores de serviço de alto nível."
              </p>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-slate-100 p-1 border border-slate-200">
                  <img src="https://picsum.photos/seed/tech/100/100" className="w-full h-full rounded-full object-cover" alt="Carla Dias" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Carla Dias</p>
                  <p className="text-sm text-slate-500 font-medium tracking-wide">Managing Partner, Tech Solutions</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute inset-0 bg-primary-600/10" />
        <div className="container mx-auto px-6 py-24 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold mb-6 tracking-tight">O futuro do seu negócio começa aqui.</h2>
            <p className="mt-2 text-slate-300 max-w-2xl mx-auto mb-10 text-lg">
              Deixe a CONTRATTO cuidar da sua vitrine tecnológica enquanto você foca no que faz de melhor: entregar resultados.
            </p>
            <Link to="/empresa/cadastro">
              <Button size="lg" className="px-10 bg-primary-600 hover:bg-primary-700 text-white border-none shadow-xl transform hover:-translate-y-1 transition-all">
                Criar minha Conta Profissional
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default ForCompaniesPage;