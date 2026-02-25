import React from 'react';
import { TestimonialsColumn } from '@/components/ui/TestimonialsColumn';
import { motion } from 'framer-motion';

interface Testimonial {
  text: string;
  image: string;
  name: string;
  role: string;
}

const testimonials: Testimonial[] = [
  {
    text: 'A CONTRATTO revolucionou a forma como encontramos parceiros de engenharia em Cascavel. A verificacao dos profissionais nos da muita seguranca para fechar negocios.',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
    name: 'Ricardo Fontes',
    role: 'Diretor de Operacoes, RailCorp',
  },
  {
    text: 'Fechamos uma consultoria tributaria em menos de 48 horas. Processos claros, prestadores qualificados e suporte impecavel. Recomendo para todo empreendedor.',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop',
    name: 'Amanda Rezende',
    role: 'CEO, TechStart',
  },
  {
    text: 'A interface e muito intuitiva e o time de suporte e excelente. Implementamos a CONTRATTO em toda a empresa em menos de uma semana.',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
    name: 'Carlos Eduardo',
    role: 'Gerente de TI, LogisTech',
  },
  {
    text: 'Desde que comecamos a usar a CONTRATTO, nossas contratacoes ficaram muito mais eficientes. Os filtros avancados economizam horas de pesquisa.',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
    name: 'Fernando Costa',
    role: 'Diretor Comercial, EngeSul',
  },
  {
    text: 'A garantia de qualidade da plataforma faz toda a diferenca. Sabemos que cada prestador foi verificado e avaliado por clientes reais.',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop',
    name: 'Patricia Lima',
    role: 'Gerente de Projetos, ArqDesign',
  },
  {
    text: 'Tripliquei meus clientes em 3 meses apos cadastrar minha empresa na CONTRATTO. A visibilidade que a plataforma oferece e incrivel.',
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop',
    name: 'Renata Soares',
    role: 'Fotografa, FotoArt Studio',
  },
  {
    text: 'O dashboard de metricas nos ajuda a entender exatamente o que funciona. Dados reais para decisoes reais.',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    name: 'Thiago Martins',
    role: 'Diretor de Marketing, DigitalPR',
  },
  {
    text: 'Precisavamos de um escritorio contabil confiavel em Londrina e encontramos em menos de uma hora. Servico impecavel do inicio ao fim.',
    image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=400&fit=crop',
    name: 'Camila Rodrigues',
    role: 'CFO, GreenBuild',
  },
  {
    text: 'A CONTRATTO transformou a presenca digital da minha clinica. Mais pacientes, mais avaliacoes positivas, mais crescimento.',
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop',
    name: 'Dr. Henrique Bastos',
    role: 'Diretor Clinico, MedVida',
  },
];

const firstColumn = testimonials.slice(0, 3);
const secondColumn = testimonials.slice(3, 6);
const thirdColumn = testimonials.slice(6, 9);

const TestimonialsSection: React.FC = () => {
  return (
    <section className="bg-white relative py-16 sm:py-20 lg:py-28 overflow-hidden">
      <div className="w-full max-w-[1280px] z-10 mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="flex flex-col items-center justify-center max-w-[540px] mx-auto mb-10 sm:mb-14"
        >
          <span className="text-primary-600 font-bold tracking-[0.2em] text-[10px] sm:text-xs uppercase mb-3 sm:mb-4 block">
            Depoimentos
          </span>

          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 text-center">
            O que nossos <span className="text-primary-600">clientes</span> dizem
          </h2>
          <p className="text-center mt-3 sm:mt-4 text-slate-500 text-sm sm:text-base max-w-md">
            Feedback real de empresas e profissionais que usam a CONTRATTO todos os dias.
          </p>
        </motion.div>

        <div className="flex justify-center gap-4 sm:gap-6 [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)] max-h-[500px] sm:max-h-[640px] lg:max-h-[740px] overflow-hidden">
          <TestimonialsColumn testimonials={firstColumn} duration={15} />
          <TestimonialsColumn
            testimonials={secondColumn}
            className="hidden md:block"
            duration={19}
          />
          <TestimonialsColumn
            testimonials={thirdColumn}
            className="hidden lg:block"
            duration={17}
          />
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
