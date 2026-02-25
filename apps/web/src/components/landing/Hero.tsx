import React from 'react';
import { motion } from 'framer-motion';
import Button from '@/components/ui/Button';
import { Link } from 'react-router-dom';

const Hero: React.FC = () => {
    return (
        <section className="relative pt-20 sm:pt-28 lg:pt-32 pb-16 sm:pb-20 lg:pb-24 overflow-hidden bg-white">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[300px] sm:w-[400px] lg:w-[500px] h-[300px] sm:h-[400px] lg:h-[500px] bg-brand-primary/5 rounded-full blur-[80px] sm:blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[400px] sm:w-[500px] lg:w-[600px] h-[400px] sm:h-[500px] lg:h-[600px] bg-brand-secondary/5 rounded-full blur-[80px] sm:blur-[100px]" />
            </div>

            <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <span className="inline-block py-1.5 px-3 sm:px-4 rounded-full bg-slate-100 text-slate-900 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-4 sm:mb-6 border border-slate-200">
                            O Marketplace do Futuro
                        </span>
                        <h1 className="font-display text-fluid-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-slate-900 leading-[1.1] mb-6 sm:mb-8 tracking-tight px-2 sm:px-0">
                            A forma mais inteligente de{' '}
                            <span className="text-brand-primary">contratar servicos locais.</span>
                        </h1>
                        <p className="text-base sm:text-lg lg:text-xl text-slate-500 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed px-2 sm:px-0">
                            Conecte-se com os melhores profissionais da sua regiao. Seguranca, agilidade e a garantia CONTRATTO para o seu negocio ou residencia.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-4 sm:px-0"
                    >
                        <Link to="/empresas" className="w-full sm:w-auto">
                            <Button size="lg" className="w-full sm:w-auto rounded-full px-6 sm:px-8 py-3.5 sm:py-4 text-base sm:text-lg shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                Encontrar Prestadores
                            </Button>
                        </Link>
                        <Link to="/empresa/cadastro" className="w-full sm:w-auto">
                            <Button variant="outline" size="lg" className="w-full sm:w-auto rounded-full px-6 sm:px-8 py-3.5 sm:py-4 text-base sm:text-lg border-2 hover:bg-gray-50 bg-white">
                                Cadastrar minha Empresa
                            </Button>
                        </Link>
                    </motion.div>

                    {/* Trust Indicator */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="mt-10 sm:mt-16 flex items-center justify-center gap-2 text-slate-400 text-xs sm:text-sm font-medium"
                    >
                        <div className="flex -space-x-2">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-200 border-2 border-white" />
                            ))}
                        </div>
                        <span>+ 5.000 prestadores verificados</span>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default Hero;
