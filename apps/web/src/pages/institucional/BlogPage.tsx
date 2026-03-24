import React from 'react';
import { motion } from 'framer-motion';
import SEO from '@/components/SEO';
import { ExternalLink, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MOCK_BLOGS } from '@/data/blogs';

const BlogPage: React.FC = () => {
    return (
        <div className="max-w-4xl mx-auto pt-8 pb-16">
            <SEO
                title="Blog do Especialista | CONTRATTO"
                description="Guias técnicos, dicas de mercado, tendências de SEO para IAs e insights B2B sobre a contratação formal e homologada de serviços."
            />

            <div className="mb-12 text-center md:text-left">
                <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">O Blog B2B da CONTRATTO</h1>
                <p className="text-slate-500 max-w-2xl text-lg leading-relaxed">
                    Estratégias de negócios, metodologias B2B de sucesso e a digitalização do ecossistema brasileiro corporativo pelas lentes da Rede Verificada.
                </p>
            </div>

            <div className="grid gap-10 md:grid-cols-2">
                {MOCK_BLOGS.map((article, index) => (
                    <motion.article
                        key={article.slug}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1, duration: 0.5 }}
                        className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col"
                    >
                        <div className="h-56 overflow-hidden relative">
                            <img
                                src={article.image}
                                alt={article.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            />
                            <div className="absolute top-4 left-4">
                                <span className="bg-white/90 backdrop-blur-sm text-primary-700 text-[10px] font-black uppercase px-3 py-1.5 rounded-full shadow-sm tracking-widest">
                                    {article.category}
                                </span>
                            </div>
                        </div>

                        <div className="p-8 flex flex-col flex-grow">
                            <h3 className="text-2xl font-bold text-slate-900 leading-tight group-hover:text-primary-600 transition-colors mb-3">
                                {article.title}
                            </h3>
                            <p className="text-slate-500 text-sm leading-relaxed mb-6 flex-grow">
                                {article.excerpt}
                            </p>

                            <div className="mt-auto pt-5 border-t border-slate-100 flex justify-between items-center">
                                <div className="text-xs text-slate-400 font-medium">
                                    {new Date(article.date).toLocaleDateString('pt-BR')} • {article.readTime}
                                </div>
                                <Link 
                                    to={`/institucional/blog/${article.slug}`}
                                    className="text-sm font-bold text-primary-600 hover:text-primary-800 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity"
                                >
                                    Ler artigo <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                        </div>
                    </motion.article>
                ))}
            </div>
        </div>
    );
};

export default BlogPage;
