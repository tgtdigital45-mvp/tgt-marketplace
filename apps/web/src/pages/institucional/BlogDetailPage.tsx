import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import SEO from '@/components/SEO';
import { MOCK_BLOGS } from '@/data/blogs';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { Calendar, Clock, ArrowLeft, Share2, Facebook, Twitter, Linkedin } from 'lucide-react';
import { Button } from '@tgt/ui-web';
import LazyMarkdown from '@/components/ui/LazyMarkdown';

const BlogDetailPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const post = MOCK_BLOGS.find(p => p.slug === slug);

    if (!post) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center bg-white">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-slate-900 mb-6">Artigo não encontrado</h1>
                    <Link to="/institucional/blog">
                        <Button className="rounded-full px-8">Voltar para o Blog</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <main className="bg-white pt-8 pb-24">
            <SEO
                title={`${post.title} | CONTRATTO`}
                description={post.excerpt}
                image={post.image}
            />

            <div className="max-w-4xl mx-auto px-4 md:px-0">
                {/* Back Button */}
                <button
                    onClick={() => navigate('/institucional/blog')}
                    className="flex items-center gap-2 text-slate-400 hover:text-primary-600 font-bold text-xs uppercase tracking-widest mb-10 transition-colors group"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Voltar para o Blog
                </button>

                {/* Post Header */}
                <header className="mb-14">
                    <div className="flex flex-wrap items-center gap-5 text-slate-400 text-xs font-bold uppercase tracking-widest mb-8">
                        <span className="bg-primary-50 text-primary-600 border border-primary-100 px-4 py-1.5 rounded-full">{post.category}</span>
                        <div className="flex items-center gap-1.5">
                            <Calendar size={14} />
                            {new Date(post.date).toLocaleDateString('pt-BR')}
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Clock size={14} />
                            {post.readTime} de leitura
                        </div>
                    </div>

                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 mb-8 tracking-tight leading-[1.1]">
                        {post.title}
                    </h1>

                    <div className="flex items-center gap-4 py-6 border-y border-slate-100">
                        <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-200">
                            <OptimizedImage src={post.author.avatar} alt={post.author.name} className="w-full h-full object-cover rounded-full" />
                        </div>
                        <div>
                            <p className="font-bold text-slate-900 leading-none mb-1">{post.author.name}</p>
                            <p className="text-slate-500 text-xs">{post.author.role}</p>
                        </div>
                        <div className="ml-auto flex gap-3">
                            <button title="Compartilhar" className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-primary-50 hover:text-primary-600 transition-colors">
                                <Share2 size={16} />
                            </button>
                        </div>
                    </div>
                </header>

                {/* Featured Image */}
                <div className="rounded-[32px] md:rounded-[40px] overflow-hidden shadow-2xl mb-14 bg-slate-100">
                    <OptimizedImage src={post.image} alt={post.title} className="w-full h-auto max-h-[500px] object-cover" />
                </div>

                {/* Markdown Content */}
                <article className="prose prose-slate prose-lg md:prose-xl max-w-none mb-20
                    prose-headings:text-slate-900 prose-headings:font-black prose-headings:tracking-tight
                    prose-h1:text-4xl prose-h2:text-3xl prose-h2:mt-14 prose-h2:mb-6
                    prose-h3:text-2xl prose-h3:mt-10 prose-h3:mb-4
                    prose-p:text-slate-600 prose-p:leading-relaxed prose-p:mb-6
                    prose-strong:text-slate-900 prose-strong:font-extrabold
                    prose-ul:my-6 prose-li:text-slate-600 prose-li:my-2
                    prose-a:text-primary-600 prose-a:no-underline hover:prose-a:text-primary-700 hover:prose-a:underline
                    prose-blockquote:border-l-4 prose-blockquote:border-primary-600 prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-slate-500
                ">
                    <LazyMarkdown content={post.content || post.excerpt} />
                </article>

                {/* Footer Sharing */}
                <footer className="pt-10 border-t border-slate-100 mb-16">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-12">
                            <span className="text-xs font-black uppercase tracking-widest text-slate-400">Gostou da leitura? Compartilhe:</span>
                            <div className="flex gap-4">
                                <Facebook size={20} className="text-slate-400 hover:text-brand-accent cursor-pointer transition-colors" />
                                <Twitter size={20} className="text-slate-400 hover:text-brand-accent cursor-pointer transition-colors" />
                                <Linkedin size={20} className="text-slate-400 hover:text-brand-accent cursor-pointer transition-colors" />
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </main>
    );
};

export default BlogDetailPage;
