import React from 'react';
import { motion } from 'framer-motion';
import { Check, ArrowRight } from 'lucide-react';
import Button from '@/components/ui/Button';

const plans = [
    {
        name: "Business Starter",
        price: "49",
        description: "Ideal para profissionais liberais iniciando sua jornada digital.",
        features: ["Perfil Profissional", "Até 5 Fotos na Galeria", "Receber Avaliações", "Suporte via Email"],
        isPopular: false
    },
    {
        name: "Professional Growth",
        price: "129",
        description: "O plano mais equilibrado para empresas em expansão.",
        features: ["Tudo do Starter", "Galeria Ilimitada", "Destaque nas Buscas", "Dashboard de Métricas", "Suporte Prioritário"],
        isPopular: true
    },
    {
        name: "Enterprise Solution",
        price: "299",
        description: "Para grandes empresas que exigem máxima visibilidade e gestão.",
        features: ["Tudo do Growth", "Gerente de Conta", "Relatórios Customizados", "API de Integração", "Auditoria de Reputação"],
        isPopular: false
    }
];

const PricingSection: React.FC = () => {
    return (
        <section className="py-24 bg-slate-900 text-white overflow-hidden relative">
            <div className="container mx-auto px-6 relative z-10">
                <div className="text-center mb-20">
                    <span className="text-primary-400 font-bold tracking-widest text-[10px] uppercase mb-4 block">Investimento</span>
                    <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
                        Planos acessíveis para cada <span className="text-primary-400">Negócio</span>
                    </h2>
                    <p className="text-slate-400 max-w-2xl mx-auto text-lg">
                        Escolha o plano que melhor se adapta ao momento da sua empresa e comece a escalar hoje mesmo.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {plans.map((plan, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className={`p-10 rounded-[40px] border flex flex-col justify-between relative ${plan.isPopular
                                    ? 'bg-white text-slate-900 border-primary-500 shadow-2xl scale-105 z-20'
                                    : 'bg-slate-800/40 border-slate-700 text-white'
                                }`}
                        >
                            {plan.isPopular && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary-600 text-white px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest">
                                    Mais Recomendado
                                </div>
                            )}

                            <div>
                                <h3 className={`text-2xl font-bold mb-2 tracking-tight ${plan.isPopular ? 'text-slate-900' : 'text-white'}`}>
                                    {plan.name}
                                </h3>
                                <p className={`text-sm mb-8 ${plan.isPopular ? 'text-slate-500' : 'text-slate-400'}`}>
                                    {plan.description}
                                </p>
                                <div className="flex items-baseline gap-1 mb-8">
                                    <span className="text-4xl font-bold tracking-tight">R$ {plan.price}</span>
                                    <span className={`text-sm font-medium ${plan.isPopular ? 'text-slate-400' : 'text-slate-500'}`}>/mês</span>
                                </div>

                                <ul className="space-y-4 mb-10">
                                    {plan.features.map((feature, fIdx) => (
                                        <li key={fIdx} className="flex items-center gap-3">
                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${plan.isPopular ? 'bg-primary-100 text-primary-600' : 'bg-slate-700 text-primary-400'}`}>
                                                <Check size={12} strokeWidth={3} />
                                            </div>
                                            <span className={`text-sm font-medium ${plan.isPopular ? 'text-slate-600' : 'text-slate-400'}`}>
                                                {feature}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <Button
                                variant={plan.isPopular ? 'primary' : 'outline'}
                                className={`w-full h-14 rounded-2xl font-bold ${plan.isPopular ? '' : 'border-slate-600 text-white hover:bg-slate-700'}`}
                            >
                                Começar agora <ArrowRight size={18} className="ml-2" />
                            </Button>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Background Decor */}
            <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary-600/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-primary-500/5 rounded-full blur-[100px] pointer-events-none" />
        </section>
    );
};

export default PricingSection;
