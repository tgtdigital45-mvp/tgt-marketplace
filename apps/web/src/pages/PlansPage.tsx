import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Check, X, Shield, Zap, Rocket, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@tgt/ui-web';

const PlansPage: React.FC = () => {
    const plans = [
        {
            name: 'Básico',
            price: 'Grátis',
            period: '/sempre',
            description: 'Para quem está começando a divulgar serviços.',
            icon: <Rocket size={24} className="text-slate-400" />,
            features: [
                { text: 'Perfil Básico da Empresa', included: true },
                { text: '1 Categoria de Serviço', included: true },
                { text: 'Receba contatos ilimitados', included: true },
                { text: 'Selo de Verificado', included: false },
                { text: 'Destaque nas buscas', included: false },
            ],
            buttonText: 'Começar Agora',
            highlight: false
        },
        {
            name: 'Profissional',
            price: 'R$ 59',
            period: '/mês',
            description: 'Para quem quer crescer e transmitir total confiança.',
            icon: <Star size={24} className="text-emerald-500" />,
            features: [
                { text: 'Tudo do Básico', included: true },
                { text: 'Selo de Verificado', included: true },
                { text: 'Até 3 Categorias', included: true },
                { text: 'Destaque nos resultados', included: true },
                { text: 'Galeria de Fotos Ilimitada', included: true },
            ],
            buttonText: 'Assinar Pro',
            highlight: true
        },
        {
            name: 'Enterprise',
            price: 'Sob Consulta',
            period: '',
            description: 'Para grandes redes, franquias e corporações.',
            icon: <Shield size={24} className="text-emerald-400" />,
            features: [
                { text: 'Gestão Multi-unidades', included: true },
                { text: 'API de Integração', included: true },
                { text: 'Gerente de Conta Dedicado', included: true },
                { text: 'Relatórios Personalizados', included: true },
                { text: 'Suporte Prioritário 24/7', included: true },
            ],
            buttonText: 'Falar com Consultor',
            highlight: false
        }
    ];

    return (
        <div className="bg-[#050505] min-h-screen pt-44 pb-32">
            <Helmet>
                <title>Planos e Preços | CONTRATTO</title>
                <meta name="description" content="Escolha o plano ideal para destacar sua empresa e conseguir mais clientes na CONTRATTO." />
            </Helmet>

            <div className="container mx-auto px-6 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="max-w-3xl mx-auto mb-20"
                >
                    <h1 className="text-5xl md:text-7xl font-display font-extrabold text-white tracking-tighter mb-6">
                        A estrutura certa para <br />
                        <span className="text-emerald-500">escalar seu negócio.</span>
                    </h1>
                    <p className="text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto">
                        Escolha a melhor opção para aumentar sua visibilidade, transmitir autoridade e fechar contratos de alto valor.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
                    {plans.map((plan, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1, duration: 0.6 }}
                            className={`relative rounded-[2.5rem] p-10 flex flex-col border transition-all duration-500 ${
                                plan.highlight 
                                ? 'bg-white/5 border-emerald-500 shadow-[0_0_80px_rgba(16,185,129,0.1)]' 
                                : 'bg-transparent border-white/5 hover:border-white/10'
                            }`}
                        >
                            {plan.highlight && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-black px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                                    Mais Popular
                                </div>
                            )}

                            <div className="mb-10 text-left">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${plan.highlight ? 'bg-emerald-500/10' : 'bg-white/5'}`}>
                                    {plan.icon}
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                                <div className="flex items-baseline gap-1 mb-4">
                                    <span className="text-4xl font-display font-black text-white">{plan.price}</span>
                                    <span className="text-slate-500 font-medium">{plan.period}</span>
                                </div>
                                <p className="text-sm text-slate-500 leading-relaxed font-medium">{plan.description}</p>
                            </div>

                            <div className="flex-1 space-y-4 mb-10 text-left">
                                {plan.features.map((feature, fIdx) => (
                                    <div key={fIdx} className="flex items-center gap-3">
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                                            feature.included ? 'bg-emerald-500/10 text-emerald-500' : 'bg-white/5 text-slate-700'
                                        }`}>
                                            {feature.included ? <Check size={12} /> : <X size={12} />}
                                        </div>
                                        <span className={`text-sm font-medium ${feature.included ? 'text-slate-300' : 'text-slate-600'}`}>
                                            {feature.text}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <Link to="/empresa/cadastro" className="w-full mt-auto">
                                <Button 
                                    size="lg"
                                    className={`w-full h-14 rounded-2xl font-bold text-base transition-all ${
                                        plan.highlight 
                                        ? 'bg-emerald-500 text-black hover:bg-emerald-400 shadow-lg shadow-emerald-500/20' 
                                        : 'bg-white text-black hover:bg-slate-200'
                                    }`}
                                >
                                    {plan.buttonText}
                                </Button>
                            </Link>
                        </motion.div>
                    ))}
                </div>

                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-20 flex flex-col items-center gap-6"
                >
                    <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-xs">Precisa de algo sob medida?</p>
                    <div className="flex items-center gap-2 group cursor-pointer">
                        <span className="text-white hover:text-emerald-500 transition-colors font-medium">Fale agora com nosso time de expansão</span>
                        <Zap size={16} className="text-emerald-500 group-hover:scale-125 transition-transform" />
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default PlansPage;
