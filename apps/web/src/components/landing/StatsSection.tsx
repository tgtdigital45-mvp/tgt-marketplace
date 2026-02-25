import React, { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Building2, Briefcase, Star, MapPin } from 'lucide-react';

interface StatItem {
  icon: React.ElementType;
  value: number;
  suffix: string;
  label: string;
}

const stats: StatItem[] = [
  { icon: Building2, value: 5000, suffix: '+', label: 'Prestadores Verificados' },
  { icon: Briefcase, value: 12000, suffix: '+', label: 'Servicos Realizados' },
  { icon: Star, value: 4.9, suffix: '/5', label: 'Avaliacao Media' },
  { icon: MapPin, value: 15, suffix: '+', label: 'Cidades Atendidas' },
];

function useCountUp(end: number, duration = 2000, start = false) {
  const [count, setCount] = useState(0);
  const isDecimal = end % 1 !== 0;

  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    let rafId: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const current = eased * end;
      setCount(isDecimal ? parseFloat(current.toFixed(1)) : Math.floor(current));
      if (progress < 1) rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [end, duration, start, isDecimal]);

  return count;
}

const StatCard: React.FC<{ stat: StatItem; delay: number }> = ({ stat, delay }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  const count = useCountUp(stat.value, 2200, isInView);

  const displayValue = stat.value >= 1000
    ? `${(count / 1000).toFixed(count >= stat.value ? 0 : 0)}k`
    : String(count);

  const formattedValue = stat.value >= 1000
    ? `${Math.floor(count / 1000)}.${String(Math.floor(count % 1000)).padStart(3, '0').slice(0, -1).replace(/0+$/, '') || '0'}`
    : String(count);

  const finalDisplay = stat.value >= 1000
    ? `${new Intl.NumberFormat('pt-BR').format(count)}`
    : String(count);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay, duration: 0.5 }}
      className="text-center group"
    >
      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4 sm:mb-5 group-hover:bg-white/15 group-hover:scale-110 transition-all duration-300">
        <stat.icon size={22} strokeWidth={1.5} className="text-primary-400" />
      </div>
      <div className="font-display text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight mb-2">
        {finalDisplay}<span className="text-primary-400">{stat.suffix}</span>
      </div>
      <p className="text-slate-400 text-xs sm:text-sm font-medium uppercase tracking-widest">
        {stat.label}
      </p>
    </motion.div>
  );
};

const StatsSection: React.FC = () => {
  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-slate-900 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 grain-texture opacity-[0.03] pointer-events-none" />
      <div className="absolute top-[-20%] right-[-10%] w-[400px] h-[400px] bg-primary-600/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[300px] h-[300px] bg-brand-secondary/8 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16"
        >
          <span className="text-primary-400 font-bold tracking-[0.2em] text-[10px] sm:text-xs uppercase mb-3 block">
            Numeros que falam
          </span>
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight">
            A CONTRATTO em <span className="text-primary-400">numeros</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 lg:gap-12">
          {stats.map((stat, i) => (
            <StatCard key={i} stat={stat} delay={i * 0.1} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
