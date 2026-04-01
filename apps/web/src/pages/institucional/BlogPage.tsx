import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SEO from '@/components/SEO';
import { ArrowRight, BookOpen, Clock, Calendar, Sparkles, Search, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MOCK_BLOGS, BlogPost } from '@/data/blogs';

const BlogPage: React.FC = () => {
    const [activeCategory, setActiveCategory] = useState<string>('Tudo');

    // Extrair categorias únicas
    const categories = useMemo(() => {
        const cats = ['Tudo', ...new Set(MOCK_BLOGS.map(blog => blog.category))];
        return cats;
    }, []);

    // Filtrar posts
    const filteredPosts = useMemo(() => {
        if (activeCategory === 'Tudo') return MOCK_BLOGS;
        return MOCK_BLOGS.filter(blog => blog.category === activeCategory);
    }, [activeCategory]);

    // Destaque (Featured) - Sempre o primeiro do MOCK ou do filtrado? 
    // No Marqo é o primeiro da lista geral ou do momento. Usaremos o index 0 dos filtrados.
    const featuredPost = filteredPosts[0];
    const latestPosts = filteredPosts.slice(1);

    return (
        <div className="bg-white min-h-screen pt-44 pb-32 font-sans selection:bg-emerald-100 selection:text-emerald-900">
            <SEO
                title="CONTRATTO Insights | Inteligência em Serviços"
                description="Explore artigos técnicos, tendências de mercado e guias de contratação na rede CONTRATTO. O futuro do B2B em modo Light Premium."
            />

            <div className="container mx-auto px-6 max-w-7xl">
                {/* Header Section */}
                <div className="max-w-4xl mx-auto mb-20 text-center">
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-emerald-600 font-black uppercase tracking-[0.3em] text-[10px] mb-6"
                    >
                        Knowledge Base
                    </motion.p>
                    <h1 className="text-5xl md:text-7xl font-display font-extrabold text-slate-900 tracking-tighter mb-8 leading-[0.95]">
                        CONTRATTO <br />
                        <span className="text-emerald-500 italic">Insights.</span>
                    </h1>
                    <p className="text-xl text-slate-500 leading-relaxed max-w-2xl mx-auto font-medium">
                        Mergulhe em estratégias práticas, tendências emergentes e a ciência da confiança no ecossistema de serviços.
                    </p>
                </div>

                {/* Featured Post (Hero) */}
                <AnimatePresence mode="wait">
                    {featuredPost && activeCategory === 'Tudo' && (
                        <motion.div
                            key="featured-post"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative mb-32 group"
                        >
                            <Link to={`/institucional/blog/${featuredPost.slug}`} className="block">
                                <div className="grid lg:grid-cols-2 gap-12 items-center bg-slate-50 rounded-[3.5rem] p-8 lg:p-12 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 overflow-hidden">
                                    <div className="space-y-8 order-2 lg:order-1">
                                        <div className="flex items-center gap-3">
                                            <span className="px-4 py-1.5 rounded-full bg-white border border-slate-200 text-emerald-600 text-[10px] font-black uppercase tracking-widest shadow-sm">
                                                {featuredPost.category}
                                            </span>
                                            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-widest flex items-center gap-1">
                                                <Sparkles size={12} className="text-emerald-500" /> Destaque
                                            </span>
                                        </div>
                                        <h2 className="text-3xl md:text-5xl font-display font-bold text-slate-900 leading-tight tracking-tight group-hover:text-emerald-600 transition-colors">
                                            {featuredPost.title}
                                        </h2>
                                        <p className="text-lg text-slate-500 leading-relaxed line-clamp-3 font-medium">
                                            {featuredPost.excerpt}
                                        </p>
                                        <div className="flex items-center gap-6 text-sm font-bold text-slate-400 uppercase tracking-widest">
                                            <span className="flex items-center gap-2 font-black text-slate-900">
                                                {new Date(featuredPost.date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                            </span>
                                            <span className="flex items-center gap-2">
                                                <Clock size={16} className="text-emerald-500" /> {featuredPost.readTime}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="relative h-[300px] lg:h-[450px] rounded-[2.5rem] overflow-hidden order-1 lg:order-2 shadow-2xl">
                                        <img
                                            src={featuredPost.image}
                                            alt={featuredPost.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Filter & Latest Section */}
                <div className="mb-12">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
                        <h2 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Conteúdo Recente</h2>
                        
                        <div className="flex flex-wrap gap-3">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 border ${
                                        activeCategory === cat
                                            ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                                            : 'bg-white border-slate-200 text-slate-400 hover:border-emerald-300 hover:text-emerald-600'
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Blog Grid */}
                    <motion.div 
                        layout
                        className="grid gap-x-8 gap-y-16 md:grid-cols-2 lg:grid-cols-3"
                    >
                        <AnimatePresence>
                            {(activeCategory === 'Tudo' ? latestPosts : filteredPosts).map((article, index) => (
                                <motion.article
                                    key={article.slug}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.4 }}
                                    className="flex flex-col group"
                                >
                                    <Link to={`/institucional/blog/${article.slug}`} className="flex flex-col h-full">
                                        <div className="relative aspect-[16/10] rounded-[2.5rem] overflow-hidden mb-8 shadow-sm group-hover:shadow-xl transition-all duration-500">
                                            <img
                                                src={article.image}
                                                alt={article.title}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                            />
                                            <div className="absolute top-6 left-6">
                                                <span className="bg-white/95 backdrop-blur-md text-emerald-600 text-[9px] font-black uppercase px-3 py-1.5 rounded-full border border-slate-100 tracking-widest shadow-lg">
                                                    {article.category}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex-grow space-y-4">
                                            <h3 className="text-2xl font-bold text-slate-900 leading-snug group-hover:text-emerald-600 transition-colors">
                                                {article.title}
                                            </h3>
                                            <p className="text-slate-500 text-sm leading-relaxed line-clamp-3 font-medium">
                                                {article.excerpt}
                                            </p>
                                        </div>

                                        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                {new Date(article.date).toLocaleDateString('pt-BR', { month: 'long', day: 'numeric' })}
                                            </span>
                                            <div className="flex items-center gap-2 text-[10px] font-black text-slate-900 group-hover:text-emerald-600 transition-colors uppercase tracking-widest">
                                                Ler mais <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        </div>
                                    </Link>
                                </motion.article>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                </div>

                {/* Newsletter Section */}
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mt-40 p-12 lg:p-24 rounded-[4rem] bg-slate-950 text-center relative overflow-hidden group"
                >
                    <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 blur-[100px] -z-10 rounded-full group-hover:bg-emerald-500/20 transition-all duration-1000" />
                    
                    <div className="max-w-3xl mx-auto space-y-10 relative z-10">
                        <p className="text-emerald-500 font-bold uppercase tracking-[0.3em] text-[10px]">
                            Insights por e-mail
                        </p>
                        <h2 className="text-4xl md:text-6xl font-display font-black text-white tracking-tighter leading-[1.1]">
                            Grandes ideias precisam de <br />
                            <span className="text-emerald-500 italic">uma newsletter.</span>
                        </h2>
                        <div className="flex flex-col md:flex-row gap-4 max-w-md mx-auto pt-4">
                            <input 
                                type="email" 
                                placeholder="seu@profissional.com" 
                                className="bg-white/10 border border-white/10 rounded-2xl px-6 py-5 flex-1 text-white focus:outline-none focus:border-emerald-500 transition-all font-medium placeholder:text-slate-600"
                            />
                            <button className="h-16 px-10 rounded-2xl bg-emerald-500 text-black font-black hover:bg-emerald-400 hover:scale-[1.02] shadow-2xl shadow-emerald-500/20 active:scale-95 transition-all">
                                Inscrever-se
                            </button>
                        </div>
                        <p className="text-slate-500 text-[10px] font-medium uppercase tracking-widest">
                            Zero spam. Apenas inteligência regional e B2B.
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default BlogPage;
