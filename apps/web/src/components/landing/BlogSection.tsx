import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Calendar, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { MOCK_NEWS } from '@/data/news';

const BlogSection: React.FC = () => {
    return (
        <section className="py-12 sm:py-16 lg:py-24 bg-white">
            <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 sm:mb-16 lg:mb-20 gap-4 sm:gap-6">
                    <div className="max-w-2xl">
                        <span className="text-primary-600 font-bold tracking-widest text-[10px] uppercase mb-3 sm:mb-4 block">Conhecimento</span>
                        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight leading-tight">
                            Nosso <span className="text-slate-400">Blog</span> & Artigos
                        </h2>
                        <p className="mt-3 sm:mt-4 text-slate-500 font-medium text-sm sm:text-base">Fique por dentro das novidades do mercado local e dicas de crescimento.</p>
                    </div>
                    <Link to="/noticias" className="flex-shrink-0">
                        <button className="h-10 sm:h-12 lg:h-14 px-5 sm:px-6 lg:px-8 rounded-full border-2 border-slate-200 font-bold text-slate-900 hover:bg-slate-50 transition-colors flex items-center gap-2 text-sm sm:text-base whitespace-nowrap">
                            Ver todos <ArrowRight size={18} />
                        </button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
                    {MOCK_NEWS.slice(0, 3).map((post, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-40px' }}
                            transition={{ delay: index * 0.1 }}
                            className="group cursor-pointer"
                        >
                            <Link to={`/noticias/${post.slug}`}>
                                <div className="relative aspect-[16/10] rounded-xl sm:rounded-2xl lg:rounded-[32px] overflow-hidden mb-4 sm:mb-6 lg:mb-8 shadow-lg">
                                    <OptimizedImage
                                        src={post.image}
                                        alt={post.title}
                                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    <div className="absolute top-3 left-3 sm:top-6 sm:left-6">
                                        <span className="bg-white/90 backdrop-blur-md text-slate-900 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">
                                            {post.category}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 sm:gap-6 text-slate-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest mb-3 sm:mb-4">
                                    <span className="flex items-center gap-1 sm:gap-1.5">
                                        <Calendar size={12} className="text-primary-600" />
                                        {new Date(post.date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
                                    </span>
                                    <span className="flex items-center gap-1 sm:gap-1.5">
                                        <Clock size={12} className="text-primary-600" />
                                        {post.readTime}
                                    </span>
                                </div>

                                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 mb-2 sm:mb-4 tracking-tight group-hover:text-primary-600 transition-colors line-clamp-2">
                                    {post.title}
                                </h3>

                                <p className="text-slate-500 text-xs sm:text-sm leading-relaxed line-clamp-2 mb-4 sm:mb-6">
                                    {post.excerpt}
                                </p>

                                <div className="flex items-center gap-2 text-primary-600 font-bold text-xs sm:text-sm group-hover:gap-3 transition-all">
                                    Ler mais <ArrowRight size={16} />
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
