import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import SEO from '@/components/SEO';
import { MOCK_BLOGS } from '@/data/blogs';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { 
  Calendar, Clock, ArrowLeft, 
  Share2, Linkedin, Twitter, Sparkles 
} from 'lucide-react';
import { Button } from '@tgt/ui-web';
import LazyMarkdown from '@/components/ui/LazyMarkdown';
import { motion } from 'framer-motion';

const BlogDetailPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const post = MOCK_BLOGS.find(p => p.slug === slug);

    if (!post) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#050505]">
                <div className="text-center">
                    <h1 className="text-4xl font-display font-bold text-white mb-6">Artigo não encontrado</h1>
                    <Link to="/institucional/blog">
                        <Button className="rounded-2xl px-8 bg-emerald-500 text-black">Voltar para o Blog</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <main className="bg-[#050505] min-h-screen pt-44 pb-32">
            <SEO
                title={`${post.title} | CONTRATTO`}
                description={post.excerpt}
                image={post.image}
            />

            <div className="container mx-auto px-6 max-w-4xl">
                {/* Header Section */}
                <motion.header 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-16"
                >
                    <button
                        onClick={() => navigate('/institucional/blog')}
                        className="flex items-center gap-2 text-slate-500 hover:text-emerald-500 font-black text-[10px] uppercase tracking-[0.2em] mb-12 transition-all group"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-2 transition-transform" /> 
                        Back to Insights
                    </button>

                    <div className="flex flex-wrap items-center gap-6 mb-10">
                        <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                          {post.category}
                        </span>
                        <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-widest">
                            <Calendar size={14} className="text-emerald-500/50" />
                            {new Date(post.date).toLocaleDateString('pt-BR')}
                        </div>
                        <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-widest">
                            <Clock size={14} className="text-emerald-500/50" />
                            {post.readTime}
                        </div>
                    </div>

                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-black text-white mb-12 tracking-tighter leading-[0.95]">
                        {post.title}
                    </h1>

                    <div className="flex items-center gap-6 py-8 border-y border-white/5">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden border border-white/10 p-1 bg-white/5">
                            <OptimizedImage src={post.author.avatar} alt={post.author.name} className="w-full h-full object-cover rounded-xl" />
                        </div>
                        <div className="flex-1">
                            <p className="font-display font-bold text-white text-lg leading-none mb-1.5">{post.author.name}</p>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{post.author.role}</p>
                        </div>
                        <div className="flex gap-3">
                            <button className="w-11 h-11 rounded-2xl bg-white/5 flex items-center justify-center text-slate-400 hover:bg-emerald-500 hover:text-black transition-all">
                                <Linkedin size={18} />
                            </button>
                            <button className="w-11 h-11 rounded-2xl bg-white/5 flex items-center justify-center text-slate-400 hover:bg-emerald-500 hover:text-black transition-all">
                                <Share2 size={18} />
                            </button>
                        </div>
                    </div>
                </motion.header>

                {/* Featured Content Photo */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="rounded-[3rem] overflow-hidden border border-white/5 mb-20 aspect-video lg:aspect-[16/7]"
                >
                    <OptimizedImage src={post.image} alt={post.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-1000" />
                </motion.div>

                {/* Content Article */}
                <article className="prose prose-invert prose-emerald prose-lg md:prose-xl max-w-none mb-32
                    prose-headings:font-display prose-headings:font-black lg:prose-headings:tracking-tighter
                    prose-h2:text-4xl prose-h2:mt-20 prose-h2:mb-8 prose-h2:text-white
                    prose-h3:text-2xl prose-h3:mt-12 prose-h3:mb-6 prose-h3:text-slate-200
                    prose-p:text-slate-400 prose-p:leading-[1.8] prose-p:mb-8
                    prose-strong:text-white prose-strong:font-bold
                    prose-blockquote:border-l-4 prose-blockquote:border-emerald-500 prose-blockquote:bg-white/5 prose-blockquote:p-8 prose-blockquote:rounded-r-3xl prose-blockquote:text-slate-300 prose-blockquote:italic
                    prose-ul:text-slate-400
                ">
                    <LazyMarkdown content={post.content || post.excerpt} />
                </article>

                {/* Footer Engagement */}
                <footer className="pt-12 border-t border-white/5 flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-8 border border-emerald-500/20">
                      <Sparkles size={24} />
                    </div>
                    <h4 className="text-2xl font-display font-bold text-white mb-4">Gostou deste insight?</h4>
                    <p className="text-slate-500 mb-10 max-w-md">Compartilhe com sua diretoria ou rede profissional para fomentar a inovação regional.</p>
                    <div className="flex gap-4">
                        <Button className="bg-white text-black px-8 py-4 rounded-2xl font-black hover:bg-slate-200">
                          Compartilhar Artigo
                        </Button>
                        <Button variant="outline" className="border-white/10 text-white px-8 py-4 rounded-2xl font-black hover:bg-white/5">
                          Seguir CONTRATTO
                        </Button>
                    </div>
                </footer>
            </div>
        </main>
    );
};

export default BlogDetailPage;
