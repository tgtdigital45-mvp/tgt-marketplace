import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Button from '../components/ui/Button';
import AnimatedSection from '../components/ui/AnimatedSection';

const NotFoundPage: React.FC = () => {
    return (
        <div className="min-h-[80vh] flex items-center justify-center bg-white px-4">
            <Helmet>
                <title>Página Não Encontrada | TGT Contratto</title>
                <meta name="robots" content="noindex, follow" />
            </Helmet>

            <div className="max-w-xl w-full text-center">
                <AnimatedSection>
                    <div className="relative mb-8">
                        <h1 className="text-[12rem] md:text-[15rem] font-black text-gray-100 leading-none select-none">
                            404
                        </h1>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="bg-brand-primary w-24 h-24 rounded-full flex items-center justify-center shadow-lg transform -rotate-12 animate-bounce">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </AnimatedSection>

                <AnimatedSection delay={0.1}>
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 tracking-tight">
                        Ops! Onde fomos parar?
                    </h2>
                    <p className="text-gray-500 text-lg mb-10 leading-relaxed">
                        Parece que a página que você está procurando não existe ou foi movida.
                        Não se preocupe, acontece com os melhores!
                    </p>
                </AnimatedSection>

                <AnimatedSection delay={0.2}>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link to="/" className="w-full sm:w-auto">
                            <Button className="w-full sm:px-8 py-3 text-lg shadow-xl shadow-brand-primary/20">
                                Voltar ao Início
                            </Button>
                        </Link>
                        <Link to="/empresas" className="w-full sm:w-auto">
                            <Button variant="outline" className="w-full sm:px-8 py-3 text-lg border-gray-200 text-gray-700 hover:bg-gray-50">
                                Buscar Empresas
                            </Button>
                        </Link>
                    </div>
                </AnimatedSection>

                <div className="mt-16 pt-8 border-t border-gray-100">
                    <p className="text-sm text-gray-400">
                        Precisa de ajuda? <Link to="/contato" className="text-brand-primary hover:underline font-medium">Fale conosco</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default NotFoundPage;
