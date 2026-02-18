import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import SEO from '@/components/SEO';
import { MOCK_NEWS } from '@/data/news';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { Calendar, User, Clock, ArrowLeft, Share2, Facebook, Twitter, Linkedin } from 'lucide-react';
import Button from '@/components/ui/Button';

const NewsDetailPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const post = MOCK_NEWS.find(p => p.slug === slug);

    if (!post) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-slate-900 mb-6">Artigo não encontrado</h1>
                    <Link to="/noticias">
                        <Button className="rounded-full px-8">Voltar para Notícias</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <main className="bg-white min-h-screen pt-32 pb-24">
            <SEO
                title={`${post.title} | TGT Contratto`}
                description={post.excerpt}
                image={post.image}
            />

            <div className="container mx-auto px-6">
                <div className="max-w-4xl mx-auto">
                    {/* Back Button */}
                    <button
                        onClick={() => navigate('/noticias')}
                        className="flex items-center gap-2 text-slate-400 hover:text-primary-600 font-bold text-xs uppercase tracking-widest mb-12 transition-colors group"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Voltar para Notícias
                    </button>

                    {/* Post Header */}
                    <header className="mb-16">
                        <div className="flex flex-wrap items-center gap-6 text-slate-400 text-xs font-bold uppercase tracking-widest mb-8">
                            <span className="bg-primary-50 text-primary-600 px-4 py-1.5 rounded-full">{post.category}</span>
                            <div className="flex items-center gap-2">
                                <Calendar size={14} />
                                {new Date(post.date).toLocaleDateString('pt-BR')}
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock size={14} />
                                {post.readTime} de leitura
                            </div>
                        </div>

                        <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-10 tracking-tight leading-[1.1]">
                            {post.title}
                        </h1>

                        <div className="flex items-center gap-4 py-8 border-y border-slate-100">
                            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-primary-100 p-0.5">
                                <OptimizedImage src={post.author.avatar} alt={post.author.name} className="w-full h-full object-cover rounded-full" />
                            </div>
                            <div>
                                <p className="font-bold text-slate-900 leading-none">{post.author.name}</p>
                                <p className="text-slate-400 text-xs mt-1">{post.author.role}</p>
                            </div>
                            <div className="ml-auto flex gap-4">
                                <button className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-primary-50 hover:text-primary-600 transition-colors">
                                    <Share2 size={18} />
                                </button>
                            </div>
                        </div>
                    </header>

                    {/* Featured Image */}
                    <div className="rounded-[64px] overflow-hidden shadow-2xl mb-16">
                        <OptimizedImage src={post.image} alt={post.title} className="w-full h-auto" />
                    </div>

                    {/* Content */}
                    <article className="prose prose-slate prose-lg max-w-none mb-20
                        prose-headings:text-slate-900 prose-headings:font-bold prose-headings:tracking-tight
                        prose-h1:text-4xl prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6
                        prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-4
                        prose-p:text-slate-600 prose-p:leading-relaxed prose-p:mb-6
                        prose-strong:text-slate-900 prose-strong:font-bold
                        prose-ul:my-6 prose-li:text-slate-600 prose-li:my-2
                        prose-code:text-primary-600 prose-code:bg-primary-50 prose-code:px-2 prose-code:py-1 prose-code:rounded
                        prose-pre:bg-slate-900 prose-pre:text-slate-100
                        prose-blockquote:border-l-4 prose-blockquote:border-primary-600 prose-blockquote:pl-6 prose-blockquote:italic
                    ">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {post.content || post.excerpt}
                        </ReactMarkdown>
                    </article>

                    {/* Footer / Sharing */}
                    <footer className="pt-12 border-t border-slate-100">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                            <div className="flex items-center gap-6">
                                <span className="text-xs font-black uppercase tracking-widest text-slate-300">Compartilhar:</span>
                                <div className="flex gap-4">
                                    <Facebook size={20} className="text-slate-400 hover:text-blue-600 cursor-pointer transition-colors" />
                                    <Twitter size={20} className="text-slate-400 hover:text-sky-500 cursor-pointer transition-colors" />
                                    <Linkedin size={20} className="text-slate-400 hover:text-blue-700 cursor-pointer transition-colors" />
                                </div>
                            </div>
                        </div>
                    </footer>

                    {/* Related Post Suggestion (Simple) */}
                    <section className="mt-32">
                        <h3 className="text-2xl font-bold text-slate-900 mb-10 tracking-tight">Leia também</h3>
                        <div className="grid md:grid-cols-2 gap-8">
                            {MOCK_NEWS.filter(p => p.slug !== post.slug).slice(0, 2).map(r => (
                                <Link key={r.slug} to={`/noticias/${r.slug}`} className="group block">
                                    <div className="aspect-[4/3] rounded-[40px] overflow-hidden mb-6 shadow-lg">
                                        <OptimizedImage src={r.image} alt={r.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    </div>
                                    <h4 className="text-xl font-bold text-slate-900 group-hover:text-primary-600 transition-colors leading-snug">{r.title}</h4>
                                </Link>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
};

export default NewsDetailPage;
