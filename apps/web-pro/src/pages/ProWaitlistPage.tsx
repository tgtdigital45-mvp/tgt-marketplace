import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@tgt/ui-web';
import { Check, ArrowRight, Video, Loader2, PartyPopper } from 'lucide-react';
import { supabase } from '@tgt/core';
import { toast } from 'react-hot-toast';

const ProWaitlistPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    
    // Newsletter states
    const [newsletterEmail, setNewsletterEmail] = useState('');
    const [newsletterLoading, setNewsletterLoading] = useState(false);
    const [isNewsletterSubmitted, setIsNewsletterSubmitted] = useState(false);

    const handleWaitlistSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!email) {
            toast.error('Por favor, insira um e-mail válido.');
            return;
        }

        setLoading(true);
        try {
            // Verificar se o e-mail já existe primeiro para evitar o erro 409 no console
            const { data: existing, error: checkError } = await supabase
                .from('waitlist_submissions')
                .select('email')
                .eq('email', email)
                .maybeSingle();

            if (checkError) throw checkError;

            if (existing) {
                toast.error('Este e-mail já está na nossa lista de espera!');
                setLoading(false);
                return;
            }

            const { error: insertError } = await supabase
                .from('waitlist_submissions')
                .insert([{ email }]);

            if (insertError) {
                if (insertError.code === '23505') {
                    toast.error('Este e-mail já está na nossa lista de espera!');
                    return;
                }
                throw insertError;
            }

            toast.success('Inscrição realizada com sucesso!');
            setIsSubmitted(true);
            setEmail('');
        } catch (error: any) {
            console.error('Erro na waitlist:', error);
            toast.error('Ocorreu um erro ao processar sua inscrição.');
        } finally {
            setLoading(false);
        }
    };

    const handleNewsletterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!newsletterEmail) {
            toast.error('Por favor, insira um e-mail válido para a newsletter.');
            return;
        }

        setNewsletterLoading(true);
        try {
            // Verificar duplicidade antes de inserir
            const { data: existing, error: checkError } = await supabase
                .from('waitlist_submissions')
                .select('email')
                .eq('email', newsletterEmail)
                .maybeSingle();

            if (checkError) throw checkError;

            if (existing) {
                toast.error('Este e-mail já está inscrito em nossa rede!');
                setNewsletterLoading(false);
                return;
            }

            const { error: insertError } = await supabase
                .from('waitlist_submissions')
                .insert([{ email: newsletterEmail }]);

            if (insertError) {
                if (insertError.code === '23505') {
                    toast.error('Este e-mail já está inscrito em nossa rede!');
                    return;
                }
                throw insertError;
            }

            toast.success('Inscrição na newsletter confirmada!');
            setIsNewsletterSubmitted(true);
            setNewsletterEmail('');
        } catch (error: any) {
            console.error('Erro na newsletter:', error);
            toast.error('Erro ao processar inscrição na newsletter.');
        } finally {
            setNewsletterLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-[#04B4E0]/20 overflow-x-hidden pt-20">
            {/* Background Gradient Effect */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-[#04B4E0]/5 blur-[120px] rounded-full opacity-40" />
            </div>

            <div className="container mx-auto px-6 relative z-10 pt-20 pb-32">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="max-w-4xl mx-auto text-center"
                >
                    {/* Badge */}
                    <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-[#04B4E0]/5 border border-[#04B4E0]/10 text-[#04B4E0] text-[10px] font-bold tracking-[0.2em] uppercase mb-8 backdrop-blur-sm">
                        Lançamento Q2 2026
                    </div>

                    {/* Headline */}
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-extrabold tracking-tighter leading-[1.1] mb-8 text-slate-900">
                        Seja Avisado para o <br />
                        <span className="text-[#04B4E0]">Acesso Antecipado.</span>
                    </h1>

                    {/* Description */}
                    <p className="text-base md:text-lg text-slate-600 max-w-xl mx-auto leading-relaxed mb-12 font-medium">
                        Gaste menos tempo gerenciando marketing e mais tempo melhorando seu produto. 
                        Nós cuidamos do resto com IA e tecnologia de ponta para a CONTRATTO.
                    </p>

                    {/* Waitlist Form */}
                    {isSubmitted ? (
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-white p-8 rounded-3xl border border-[#04B4E0]/20 shadow-xl max-w-md mx-auto mb-10 flex items-center gap-4 text-left"
                        >
                            <div className="w-12 h-12 bg-[#04B4E0] rounded-2xl flex items-center justify-center text-white shrink-0">
                                <PartyPopper size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 leading-tight">Você está na lista!</h3>
                                <p className="text-sm text-slate-500">Prepare-se para o futuro da gestão pro.</p>
                            </div>
                        </motion.div>
                    ) : (
                        <form 
                            className="max-w-md mx-auto mb-10 flex flex-col sm:flex-row gap-3 p-1.5 bg-white backdrop-blur-md border border-slate-200 rounded-2xl sm:rounded-full group focus-within:border-[#04B4E0]/50 transition-all shadow-xl" 
                            onSubmit={handleWaitlistSubmit}
                        >
                            <input
                                type="email"
                                required
                                disabled={loading}
                                placeholder="seu@parceiro.com"
                                className="bg-transparent border-none outline-none flex-1 px-6 h-12 text-sm font-medium placeholder:text-slate-400 text-slate-900 disabled:opacity-50"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            <Button 
                                type="submit"
                                disabled={loading}
                                className="rounded-2xl sm:rounded-full h-12 px-8 font-bold shadow-soft hover:scale-105 active:scale-95 transition-all bg-[#04B4E0] hover:bg-[#039BBF] text-white border-none flex items-center gap-2 justify-center disabled:opacity-50"
                            >
                                {loading ? <Loader2 size={18} className="animate-spin" /> : "Entrar na Waitlist"}
                            </Button>
                        </form>
                    )}

                    {/* Social Proof */}
                    <div className="flex flex-col items-center gap-4 mb-24">
                        <div className="flex -space-x-2.5">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="w-7 h-7 rounded-full border-2 border-white bg-slate-200 overflow-hidden shadow-sm">
                                    <img src={`https://i.pravatar.cc/100?img=${i + 20}`} alt="User" />
                                </div>
                            ))}
                        </div>
                        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                            Junte-se a <span className="text-[#04B4E0] font-bold">+5.000 profissionais</span> na CONTRATTO.
                        </p>
                    </div>

                    {/* Main Mockup Visualization */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4, duration: 1 }}
                        className="relative max-w-4xl mx-auto mb-32"
                    >
                        <div className="absolute -inset-4 bg-[#04B4E0]/5 blur-[60px] rounded-full" />
                        <div className="relative z-10 aspect-[16/10] bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-2xl ring-1 ring-slate-100">
                            <div className="absolute inset-0 bg-gradient-to-br from-[#04B4E0]/5 to-transparent" />
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-20">
                                <div className="w-16 h-16 bg-white/20 hover:bg-[#04B4E0]/10 backdrop-blur-md rounded-full flex items-center justify-center cursor-pointer transition-all border border-white/40 group shadow-lg">
                                    <Video size={24} className="text-[#04B4E0] ml-0.5 group-hover:scale-110 transition-transform" />
                                </div>
                            </div>
                            <img 
                                src="https://framerusercontent.com/images/yzrexRPhHxmEWAfDNk4k2vYIwsU.png" 
                                alt="Waitlist Mockup" 
                                className="w-full h-full object-cover opacity-80 mix-blend-multiply transition-all duration-700 hover:scale-105"
                            />
                        </div>
                    </motion.div>

                    {/* Brand Logos */}
                    <div className="mb-32">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mb-12">CONFIADO POR MARCAS VISIONÁRIAS</p>
                        <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-40 hover:opacity-100 transition-all duration-700">
                             <div className="font-display font-black text-2xl text-slate-900">GUMPER</div>
                             <div className="font-display font-black text-2xl text-slate-900">LOOPWEAR</div>
                             <div className="font-display font-black text-2xl text-slate-900">EVO</div>
                             <div className="font-display font-black text-2xl text-slate-900">STRIDE</div>
                             <div className="font-display font-black text-2xl text-slate-900">PROVIX</div>
                        </div>
                    </div>

                    {/* Bottom CTA Section */}
                    <div className="max-w-4xl mx-auto bg-white border border-slate-200 p-12 md:p-20 rounded-[3rem] text-left relative overflow-hidden group shadow-xl">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#04B4E0]/5 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2" />
                        <div className="relative z-10 flex flex-col md:flex-row items-end justify-between gap-12">
                            <div className="max-w-md">
                                <h2 className="text-3xl md:text-5xl font-display font-extrabold mb-6 leading-tight text-slate-900">
                                    Grandes ideias precisam <br />
                                    de automação.
                                </h2>
                                <p className="text-slate-600 font-medium mb-0">
                                    Junte-se à nossa newsletter para insights semanais sobre IA e gestão operacional.
                                </p>
                            </div>
                            <div className="w-full md:w-auto flex flex-col gap-4">
                                {isNewsletterSubmitted ? (
                                    <div className="flex items-center gap-3 px-6 py-4 bg-green-50 border border-green-100 rounded-full text-green-700">
                                        <Check size={18} />
                                        <span className="text-sm font-bold">Inscrição confirmada!</span>
                                    </div>
                                ) : (
                                    <form 
                                        onSubmit={handleNewsletterSubmit}
                                        className="flex bg-slate-50 rounded-full p-1.5 pl-6 border border-slate-200 w-full md:w-96 focus-within:border-[#04B4E0]/50 transition-colors shadow-inner"
                                    >
                                        <input 
                                            type="email" 
                                            required
                                            value={newsletterEmail}
                                            onChange={(e) => setNewsletterEmail(e.target.value)}
                                            disabled={newsletterLoading}
                                            placeholder="seu@email.com" 
                                            className="bg-transparent border-none outline-none flex-1 text-sm text-slate-900 disabled:opacity-50" 
                                        />
                                        <Button 
                                            size="sm" 
                                            type="submit"
                                            disabled={newsletterLoading}
                                            className="rounded-full px-6 bg-[#04B4E0] text-white hover:bg-[#039BBF] border-none shadow-soft flex items-center gap-2"
                                        >
                                            {newsletterLoading ? <Loader2 size={16} className="animate-spin" /> : "Inscrever"}
                                        </Button>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default ProWaitlistPage;
