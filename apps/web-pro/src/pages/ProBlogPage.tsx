import React from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { ArrowRight, BookOpen, Clock, Calendar, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

// Usarei mocks similares aos do client, mas com títulos voltados para o Pro
const PRO_BLOGS = [
  {
    slug: 'como-escalar-sua-operacao-regional',
    title: 'Como escalar sua operação regional com a Rede Verificada',
    excerpt: 'Descubra as estratégias das empresas que mais crescem no ecossistema CONTRATTO e como a homologação acelera o fechamento de contratos.',
    category: 'Gestão B2B',
    date: '2024-05-15',
    readTime: '6 min',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format&fit=crop'
  },
  {
    slug: 'ia-para-empresas-de-servicos',
    title: 'O impacto da IA Generativa na qualificação de leads de serviço',
    excerpt: 'Análise técnica de como nosso motor de briefings reduz o ruído comercial e aumenta a assertiva dos orçamentos enviados pelos nossos parceiros.',
    category: 'Tecnologia',
    date: '2024-05-10',
    readTime: '8 min',
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=2664&auto=format&fit=crop'
  },
  {
    slug: 'vendas-segmento-pro',
    title: 'Vendas consultivas: O guia definitivo para profissionais Pro',
    excerpt: 'Aprenda a utilizar o selo de verificação e os relatórios de performance para fechar contratos de alto ticket com clientes corporativos.',
    category: 'Vendas',
    date: '2024-05-02',
    readTime: '5 min',
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2670&auto=format&fit=crop'
  }
];

const ProBlogPage: React.FC = () => {
    return (
        <div className="bg-[#F8FAFC] min-h-screen pt-40 pb-32">
            <Helmet>
                <title>Blog do Parceiro | Crescimento e Gestão | CONTRATTO</title>
                <meta name="description" content="Insights exclusivos para empresas e profissionais Pro que buscam escala e excelência operacional." />
            </Helmet>

            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                <div className="max-w-3xl mb-24">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-[10px] font-black uppercase tracking-widest mb-8"
                    >
                        <TrendingUp size={12} />
                        Escala & Performance
                    </motion.div>
                    <h1 className="text-5xl md:text-6xl font-display font-extrabold text-slate-900 tracking-tighter mb-8 leading-[1.1]">
                        Conhecimento para quem <br />
                        <span className="text-blue-600">transforma o mercado.</span>
                    </h1>
                    <p className="text-xl text-slate-500 leading-relaxed max-w-2xl">
                        Explore nosso repositório de inteligência B2B, guias de gestão e tendências tecnológicas para o setor de serviços.
                    </p>
                </div>

                <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
                    {PRO_BLOGS.map((article, index) => (
                        <motion.article
                            key={article.slug}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1, duration: 0.5 }}
                            className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-200/60 hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] transition-all duration-500 group flex flex-col"
                        >
                            <div className="h-64 overflow-hidden relative">
                                <img
                                    src={article.image}
                                    alt={article.title}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                />
                                <div className="absolute top-6 left-6">
                                    <span className="bg-white/90 backdrop-blur-md text-slate-900 text-[10px] font-bold uppercase px-4 py-2 rounded-full border border-slate-200/50 tracking-widest shadow-sm">
                                        {article.category}
                                    </span>
                                </div>
                            </div>

                            <div className="p-10 flex flex-col flex-grow">
                                <div className="flex items-center gap-4 text-xs font-bold text-slate-400 mb-6 uppercase tracking-widest">
                                    <span className="flex items-center gap-1.5"><Calendar size={14} className="text-blue-600" /> {new Date(article.date).toLocaleDateString('pt-BR')}</span>
                                    <span className="flex items-center gap-1.5"><Clock size={14} className="text-blue-600" /> {article.readTime}</span>
                                </div>

                                <h3 className="text-2xl font-bold text-slate-900 leading-tight group-hover:text-blue-600 transition-colors mb-4">
                                    {article.title}
                                </h3>
                                <p className="text-slate-500 text-sm leading-relaxed mb-10 flex-grow line-clamp-3">
                                    {article.excerpt}
                                </p>

                                <div className="mt-auto pt-8 border-t border-slate-100 flex justify-end items-center">
                                    <Link 
                                        to={`/blog/${article.slug}`}
                                        className="text-sm font-black text-slate-900 hover:text-blue-600 flex items-center gap-2 group/link transition-colors uppercase tracking-widest"
                                    >
                                        Ler artigo <ArrowRight size={18} className="group-hover/link:translate-x-2 transition-transform text-blue-600" />
                                    </Link>
                                </div>
                            </div>
                        </motion.article>
                    ))}
                </div>

                <div className="mt-32 text-center p-20 rounded-[4rem] bg-white border border-slate-200/60 shadow-sm max-w-5xl mx-auto">
                    <p className="text-blue-600 font-bold uppercase tracking-[0.3em] text-[10px] mb-6">Mantenha-se à frente</p>
                    <h2 className="text-4xl font-display font-bold text-slate-900 mb-10">Receba notícias da rede Pro.</h2>
                    <div className="flex flex-col md:flex-row gap-4 max-w-md mx-auto">
                        <input 
                            type="text" 
                            placeholder="seu@profissional.com" 
                            className="bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 flex-1 text-slate-900 focus:outline-none focus:border-blue-500 transition-colors"
                        />
                        <button className="h-14 px-8 rounded-2xl bg-blue-600 text-white font-black hover:bg-blue-700 transition-all">
                            Inscrever
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProBlogPage;
