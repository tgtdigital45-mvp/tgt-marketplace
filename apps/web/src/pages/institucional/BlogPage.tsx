import React from 'react';
import { motion } from 'framer-motion';
import SEO from '@/components/SEO';
import { BookOpen } from 'lucide-react';

const BlogPage: React.FC = () => {
    return (
        <div className="max-w-3xl mx-auto text-center py-12">
            <SEO
                title="Blog do Especialista | TGT Contratto"
                description="Guias técnicos, dicas de mercado e insights sobre construção, manutenção e serviços digitais."
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-slate-50 rounded-full w-20 h-20 mx-auto flex items-center justify-center mb-6"
            >
                <BookOpen className="text-brand-primary" size={32} />
            </motion.div>

            <h2 className="text-2xl font-bold text-slate-900 mb-4">Conteúdo Especializado em Breve</h2>
            <p className="text-slate-500 mb-8 max-w-md mx-auto">
                Nossos especialistas estão preparando artigos técnicos e guias completos para ajudar você a tomar as melhores decisões.
            </p>

            <div className="inline-block p-4 bg-yellow-50 text-yellow-800 rounded-lg border border-yellow-100 text-sm">
                🚧 Módulo em construção. Volte em breve!
            </div>
        </div>
    );
};

export default BlogPage;
