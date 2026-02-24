import React from 'react';
import { motion } from 'framer-motion';
import SEO from '@/components/SEO';
import { ExternalLink } from 'lucide-react';

const NewsPage: React.FC = () => {
    const articles = [
        {
            id: 1,
            title: "CONTRATTO lança nova plataforma de contratação",
            date: "12 de Out, 2024",
            category: "Lançamento",
            excerpt: "Revolucionando a forma como serviços técnicos são contratados no Brasil.",
            image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
        },
        // Add more mock data as needed
    ];

    return (
        <div className="max-w-4xl mx-auto">
            <SEO
                title="Notícias & Mídia | CONTRATTO"
                description="Fique por dentro das últimas novidades, lançamentos e comunicados da CONTRATTO."
            />

            <div className="grid gap-8 md:grid-cols-2">
                {articles.map((article) => (
                    <motion.article
                        key={article.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all group"
                    >
                        <div className="h-48 overflow-hidden">
                            <img
                                src={article.image}
                                alt={article.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                        </div>
                        <div className="p-6">
                            <span className="text-xs font-bold text-brand-primary uppercase tracking-wider">{article.category}</span>
                            <h3 className="mt-2 text-xl font-bold text-slate-900 leading-tight group-hover:text-brand-primary transition-colors">
                                {article.title}
                            </h3>
                            <p className="mt-3 text-slate-500 text-sm leading-relaxed">
                                {article.excerpt}
                            </p>
                            <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center">
                                <span className="text-xs text-slate-400">{article.date}</span>
                                <button className="text-sm font-semibold text-brand-primary flex items-center gap-1">
                                    Ler mais <ExternalLink size={14} />
                                </button>
                            </div>
                        </div>
                    </motion.article>
                ))}
            </div>
        </div>
    );
};

export default NewsPage;
