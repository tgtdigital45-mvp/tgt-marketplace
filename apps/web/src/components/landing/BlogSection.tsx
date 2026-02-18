import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Calendar, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { MOCK_NEWS } from '@/data/news';

const BlogSection: React.FC = () => {
    return (
        <section className="py-24 bg-white">
            <div className="container mx-auto px-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-6">
                    <div className="max-w-2xl">
                        <span className="text-primary-600 font-bold tracking-widest text-[10px] uppercase mb-4 block">Conhecimento</span>
                        <h2 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight leading-tight">
                            Nosso <span className="text-slate-400">Blog</span> & Artigos
                        </h2>
                        <p className="mt-4 text-slate-500 font-medium">Fique por dentro das novidades do mercado local e dicas de crescimento.</p>
                    </div>
                    <Link to="/noticias">
                        <button className="h-14 px-8 rounded-full border-2 border-slate-200 font-bold text-slate-900 hover:bg-slate-50 transition-colors flex items-center gap-2">
                            Ver todos <ArrowRight size={20} />
                        </button>
                    </Link>
                </div>

                <div className="grid md:grid-cols-3 gap-10">
                    {MOCK_NEWS.slice(0, 3).map((post, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="group cursor-pointer"
                        >
                            <Link to={`/noticias/${post.slug}`}>
                                <div className="relative aspect-[16/10] rounded-[32px] overflow-hidden mb-8 shadow-lg">
                                    <OptimizedImage
                                        src={post.image}
                                        alt={post.title}
                                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    <div className="absolute top-6 left-6">
                                        <span className="bg-white/90 backdrop-blur-md text-slate-900 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                            {post.category}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6 text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-4">
                                    <span className="flex items-center gap-1.5">
                                        <Calendar size={14} className="text-primary-600" />
                                        {new Date(post.date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Clock size={14} className="text-primary-600" />
                                        {post.readTime}
                                    </span>
                                </div>

                                <h3 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight group-hover:text-primary-600 transition-colors line-clamp-2">
                                    {post.title}
                                </h3>

                                <p className="text-slate-500 text-sm leading-relaxed line-clamp-2 mb-6">
                                    {post.excerpt}
                                </p>

                                <div className="flex items-center gap-2 text-primary-600 font-bold text-sm group-hover:gap-3 transition-all">
                                    Ler mais <ArrowRight size={18} />
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default BlogSection;
