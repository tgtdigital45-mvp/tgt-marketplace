import React from 'react';
import { motion } from 'framer-motion';

const logos = [
    "Microsoft", "Google", "Amazon", "Stripe", "Airbnb", "Slack", "Discord"
];

const LogoCloud: React.FC = () => {
    return (
        <section className="py-20 bg-white border-y border-slate-100">
            <div className="container mx-auto px-6">
                <p className="text-center text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-12">
                    Empresas de Confiança que utilizam a TGT
                </p>
                <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24">
                    {logos.map((logo, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 0.4 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ opacity: 1, scale: 1.1 }}
                            className="text-2xl font-black text-slate-900 grayscale cursor-pointer transition-all"
                        >
                            {logo}
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default LogoCloud;
