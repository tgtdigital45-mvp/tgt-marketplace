import React, { useState } from 'react';
import { Shield, Bell, Lock, Smartphone, Globe, Eye, EyeOff, ChevronRight } from 'lucide-react';


import { useToast } from '@/contexts/ToastContext';
import { supabase } from '@tgt/core';
import { Input, Button } from '@tgt/ui-web';
;

const ClientSettings: React.FC = () => {
    const { addToast } = useToast();
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const [passwords, setPasswords] = useState({
        current: '',
        new: '',
        confirm: ''
    });

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwords.new !== passwords.confirm) {
            addToast("As senhas não coincidem.", "error");
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({
                password: passwords.new
            });

            if (error) throw error;
            addToast("Senha atualizada com sucesso!", "success");
            setPasswords({ current: '', new: '', confirm: '' });
        } catch (err: any) {
            addToast(err.message || "Erro ao atualizar senha.", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Security Section */}
                <div className="lg:col-span-2 space-y-8">
                    <section className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                                <Lock size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-800">Segurança da Conta</h3>
                                <p className="text-sm text-slate-400 font-medium">Mantenha seus dados e acessos protegidos.</p>
                            </div>
                        </div>

                        <form onSubmit={handlePasswordChange} className="space-y-6">
                            <div className="relative">
                                <Input
                                    label="Nova Senha"
                                    type={showPassword ? "text" : "password"}
                                    value={passwords.new}
                                    onChange={e => setPasswords({ ...passwords, new: e.target.value })}
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-[38px] text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>

                            <Input
                                label="Confirmar Nova Senha"
                                type={showPassword ? "text" : "password"}
                                value={passwords.confirm}
                                onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
                                placeholder="••••••••"
                                required
                            />

                            <div className="pt-4">
                                <Button 
                                    type="submit" 
                                    isLoading={loading}
                                    className="w-full md:w-auto px-10 rounded-2xl font-black text-sm uppercase tracking-widest h-14 shadow-lg shadow-brand-primary/20"
                                >
                                    Alterar Senha
                                </Button>
                            </div>
                        </form>
                    </section>

                    <section className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                                <Bell size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-800">Notificações</h3>
                                <p className="text-sm text-slate-400 font-medium">Como você deseja receber nossas atualizações.</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <ToggleItem 
                                title="Alertas de Agendamento" 
                                description="Receba lembretes 24h antes do seu serviço começar." 
                                defaultChecked 
                            />
                            <ToggleItem 
                                title="Mensagens de Profissionais" 
                                description="Notificações push quando você receber uma nova mensagem." 
                                defaultChecked 
                            />
                            <ToggleItem 
                                title="Ofertas e Promoções" 
                                description="Fique por dentro de descontos exclusivos na sua região." 
                            />
                        </div>
                    </section>
                </div>

                {/* Account Status / Credits */}
                <div className="space-y-8">
                    <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-white/20 transition-all"></div>
                        <Shield size={40} className="mb-6 opacity-80" />
                        <h4 className="text-xl font-black mb-2">Proteção Premium</h4>
                        <p className="text-indigo-100 text-sm font-medium mb-6">Sua conta está protegida por criptografia de ponta a ponta e verificação em duas etapas.</p>
                        <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10 rounded-xl font-black text-[10px] uppercase tracking-widest">
                            Ver Relatório de Acessos
                        </Button>
                    </div>

                    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
                        <h4 className="font-black text-slate-800 mb-6 flex items-center gap-2">
                            <Smartphone size={18} className="text-brand-primary" />
                            Acesse em qualquer lugar
                        </h4>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl group cursor-pointer hover:bg-slate-100 transition-all">
                                <div className="flex items-center gap-3">
                                    <Globe size={20} className="text-slate-400" />
                                    <span className="text-xs font-bold text-slate-700">Versão Mobile App</span>
                                </div>
                                <ChevronRight size={14} className="text-slate-300" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ToggleItem = ({ title, description, defaultChecked }: { title: string, description: string, defaultChecked?: boolean }) => (
    <div className="flex items-center justify-between p-4 rounded-3xl hover:bg-slate-50 transition-all">
        <div className="flex-grow pr-4">
            <h5 className="text-sm font-black text-slate-800">{title}</h5>
            <p className="text-[11px] text-slate-400 font-medium">{description}</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" defaultChecked={defaultChecked} />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
        </label>
    </div>
);

export default ClientSettings;
