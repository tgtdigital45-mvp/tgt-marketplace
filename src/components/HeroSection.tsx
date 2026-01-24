import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import QuickSearch from '@/components/QuickSearch';
import AnimatedSection from '@/components/ui/AnimatedSection';
import ParallaxLayer from '@/components/ui/ParallaxLayer'; // Assuming ParallaxLayer is a custom component
import { fadeInUp } from '../utils/animations';

const HeroSection: React.FC = () => {
    const { scrollY } = useScroll();
    const y1 = useTransform(scrollY, [0, 500], [0, 200]);
    const y2 = useTransform(scrollY, [0, 500], [0, -150]);

    return (
        <section className="relative min-h-[90vh] flex flex-col justify-end pb-20 overflow-hidden bg-brand-primary text-white grain-texture">
            {/* Background Elements - Parallax */}
            <div className="absolute top-0 right-0 w-full h-full opacity-20 pointer-events-none">
                <motion.div style={{ y: y1 }} className="absolute top-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-brand-accent rounded-full blur-[100px]" />
                <motion.div style={{ y: y2 }} className="absolute bottom-[10%] left-[-10%] w-[40vw] h-[40vw] bg-brand-secondary rounded-full blur-[80px]" />
            </div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="grid md:grid-cols-[65%_35%] gap-8 items-end">

                    {/* Left Column: Massive Typography */}
                    <div className="relative">
                        <AnimatedSection className="mb-4">
                            <ParallaxLayer offset={-50}>
                                <h1 className="text-massive font-black leading-none tracking-tighter text-white mix-blend-overlay opacity-90">
                                    TGT
                                </h1>
                            </ParallaxLayer>
                            <ParallaxLayer offset={30}>
                                <h2 className="text-6xl md:text-8xl font-bold leading-none mt-[-2rem] md:mt-[-4rem] ml-2 text-brand-secondary">
                                    Local.
                                </h2>
                            </ParallaxLayer>
                        </AnimatedSection>
                    </div>

                    {/* Right Column: Context & Action */}
                    <div className="mb-8 md:mb-16">
                        <AnimatedSection delay={0.2} className="bg-white/10 backdrop-blur-sm p-8 rounded-sharp border border-white/20 shadow-2xl">
                            <p className="text-xl md:text-2xl font-medium mb-6 leading-relaxed">
                                Conectamos você aos melhores profissionais da sua cidade. Sem burocracia, com energia local.
                            </p>

                            <div className="bg-white rounded-sharp p-1 shadow-lg transform -rotate-1 hover:rotate-0 transition-transform duration-300">
                                <QuickSearch />
                            </div>

                            <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-6 text-sm font-medium">
                                <div className="flex items-center gap-3">
                                    <div className="flex -space-x-3">
                                        {[1, 2, 3, 4].map(i => (
                                            <div key={i} className="w-10 h-10 rounded-full bg-brand-accent border-2 border-brand-primary shadow-sm" />
                                        ))}
                                    </div>
                                    <div className="text-left">
                                        <div className="font-black text-lg leading-none">+12.483</div>
                                        <div className="opacity-70 text-[10px] uppercase tracking-widest">Profissionais</div>
                                    </div>
                                </div>
                                <div className="h-8 w-px bg-white/20 hidden sm:block" />
                                <div className="flex items-center gap-2">
                                    <div className="text-brand-accent text-xl">★★★★★</div>
                                    <div className="text-xs opacity-80 underline">4.9/5 de satisfação</div>
                                </div>
                            </div>
                        </AnimatedSection>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;
