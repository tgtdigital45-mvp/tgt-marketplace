import React from 'react';
import { motion } from 'framer-motion';
import Button from '@/components/ui/Button';
import { Link } from 'react-router-dom';

const Hero: React.FC = () => {
    return (
        <section className="relative pt-32 pb-24 overflow-hidden bg-white">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary-600/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-slate-900/5 rounded-full blur-[100px]" />
            </div>

            <div className="container mx-auto px-6 relative z-10">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <span className="inline-block py-1.5 px-4 rounded-full bg-slate-100 text-slate-900 text-xs font-bold uppercase tracking-widest mb-6 border border-slate-200">
                            O Marketplace do Futuro
                        </span>
                        <h1 className="text-5xl md:text-7xl font-bold text-slate-900 leading-[1.1] mb-8 tracking-tight">
                            A forma mais inteligente de <br />
                            <span className="text-primary-600">contratar serviços locais.</span>
                        </h1>
                        <p className="text-xl text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed">
                            Conecte-se com os melhores profissionais da sua região. Segurança, agilidade e a garantia TGT Contratto para o seu negócio ou residência.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4"
                    >
                        <Link to="/empresas">
                            <Button size="lg" className="rounded-full px-8 py-4 text-lg shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                Encontrar Prestadores
                            </Button>
                        </Link>
                        <Link to="/empresa/cadastro">
                            <Button variant="outline" size="lg" className="rounded-full px-8 py-4 text-lg border-2 hover:bg-gray-50 bg-white">
                                Cadastrar minha Empresa
                            </Button>
                        </Link>
                    </motion.div>

                    {/* Trust Indicator */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="mt-16 flex items-center justify-center gap-2 text-slate-400 text-sm font-medium"
                    >
                        <div className="flex -space-x-2">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white" />
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
