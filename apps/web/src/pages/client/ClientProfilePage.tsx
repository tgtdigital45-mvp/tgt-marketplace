import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@tgt/core';
import { UserProfile } from '@tgt/core';


import { useToast } from '@/contexts/ToastContext';

import { Link, useLocation } from 'react-router-dom';
import { useClientProfileData } from '@/hooks/useClientProfileData';
import OptimizedImage from '@/components/ui/OptimizedImage';
import {
  CreditCard, Heart, MessageSquare, User, LogOut,
  Calendar, Clock, LayoutGrid, FileText, Settings,
  HelpCircle, MapPin, ChevronRight, Camera, Loader2
} from 'lucide-react';

import ImageCropModal from '@/components/ImageCropModal';

// New Section Components
import ClientHome from './components/ClientHome';
import ClientBudgets from './components/ClientBudgets';
import ClientAddresses from './components/ClientAddresses';
import ClientHelp from './components/ClientHelp';
import ClientSettings from './components/ClientSettings';
import ClientPayments from './components/ClientPayments';
import MyAppointments from '@/pages/client/MyAppointments';
import { Badge, Input, Button } from '@tgt/ui-web';


type TabType = 'home' | 'bookings' | 'budgets' | 'messages' | 'favorites' | 'profile' | 'addresses' | 'payments' | 'help' | 'settings';

const ClientProfilePage: React.FC = () => {
    const { user, logout, refreshSession } = useAuth();
    const { addToast } = useToast();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState<TabType>('home');
    const [uploading, setUploading] = useState(false);
    const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
    const [cropModal, setCropModal] = useState<{
        isOpen: boolean;
        imageSrc: string;
    }>({ isOpen: false, imageSrc: '' });

    // Unified Data Fetching
    const { data, isLoading: loading } = useClientProfileData(user?.id);

    // Local state for profile form editing
    const [profileData, setProfileData] = useState<UserProfile | null>(null);

    useEffect(() => {
        const state = location.state as { activeTab?: TabType };
        if (state?.activeTab) {
            setActiveTab(state.activeTab);
        }
    }, [location]);

    // Sync profile data for editing when fetched
    useEffect(() => {
        if (data?.profile) {
            setProfileData({ ...user!, ...data.profile });
        } else if (user) {
            setProfileData({ ...user } as UserProfile);
        }
    }, [data?.profile, user]);

    const bookings = data?.bookings || [];
    const favorites = data?.favorites || [];
    const conversations = data?.conversations || [];
    const totalSpent = data?.totalSpent || 0;

    // -- PROFILE HANDLERS --
    const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setCropModal({ isOpen: true, imageSrc: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const uploadAvatar = async (file: File) => {
        try {
            setUploading(true);
            
            // 1. IA Analysis (Optional but recommended for consistency)
            try {
                setIsAnalyzingImage(true);
                const reader = new FileReader();
                const base64Promise = new Promise<string>((resolve) => {
                    reader.onloadend = () => {
                        const base64 = (reader.result as string).split(',')[1];
                        resolve(base64);
                    };
                });
                reader.readAsDataURL(file);
                const base64Image = await base64Promise;

                const { data: analysis, error: aiError } = await supabase.functions.invoke('analyze-image', {
                    body: { image: base64Image, type: 'avatar' }
                });

                if (!aiError && analysis && !analysis.is_valid) {
                    addToast(`Imagem rejeitada pela IA: ${analysis.reason}`, 'error');
                    setIsAnalyzingImage(false);
                    return;
                }
            } catch (err) {
                console.warn('AI Analysis failed, proceeding anyway:', err);
            } finally {
                setIsAnalyzingImage(false);
            }

            // 2. Upload to Storage
            const path = `avatars/${user?.id}-${Date.now()}.jpg`;
            const { error: uploadError } = await supabase.storage.from('client-assets').upload(path, file, { upsert: true });
            
            if (uploadError) {
                // Fallback secondary bucket
                const { error: fallbackError } = await supabase.storage.from('portfolio').upload(path, file, { upsert: true });
                if (fallbackError) throw uploadError;
            }

            const { data: { publicUrl } } = supabase.storage.from(uploadError ? 'portfolio' : 'client-assets').getPublicUrl(path);

            // 3. Update Profile & Auth
            const { error: updateError } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user?.id);
            if (updateError) throw updateError;

            await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
            
            if (refreshSession) await refreshSession();
            
            addToast('Foto de perfil atualizada!', 'success');
            setCropModal({ isOpen: false, imageSrc: '' });
        } catch (err: any) {
            console.error('Error uploading avatar:', err);
            addToast('Erro ao atualizar foto de perfil.', 'error');
        } finally {
            setUploading(false);
        }
    };

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !profileData) return;

        try {
            const { error } = await supabase.from('profiles').upsert({
                id: user.id,
                email: user.email,
                full_name: profileData.name,
                cpf: profileData.cpf,
                phone: profileData.phone,
                date_of_birth: profileData.date_of_birth,
                address_zip: profileData.address_zip,
                address_street: profileData.address_street,
                address_number: profileData.address_number,
                address_complement: profileData.address_complement,
                address_neighborhood: profileData.address_neighborhood,
                address_city: profileData.address_city,
                address_state: profileData.address_state,
                updated_at: new Date().toISOString()
            });

            if (error) throw error;

            // Update Auth Metadata to keep session in sync
            await supabase.auth.updateUser({
                data: { name: profileData.name }
            });

            if (refreshSession) await refreshSession();
            
            addToast("Perfil atualizado!", "success");
        } catch (err) {
            console.error(err);
            addToast("Erro ao atualizar.", "error");
        }
    };

    if (!user) return null;

    const NavItem = ({ id, label, icon: Icon, active }: { id: TabType, label: string, icon: any, active: boolean }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-5 py-3 rounded-full transition-all duration-300 whitespace-nowrap ${active
                ? 'bg-brand-primary text-white font-black shadow-md shadow-brand-primary/20'
                : 'bg-white/60 text-slate-500 font-bold hover:bg-white hover:text-slate-900 border border-slate-100 hover:shadow-sm'
                }`}
        >
            <Icon size={16} strokeWidth={active ? 2.5 : 2} />
            <span className="text-xs uppercase tracking-widest">{label}</span>
        </button>
    );

    return (
        <div className="relative w-full min-h-screen bg-transparent">
            {/* High-End Fluid Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
                <div className="absolute top-[-10%] right-[-5%] w-[70%] h-[60%] bg-gradient-to-br from-brand-primary/10 via-brand-primary/5 to-transparent rounded-full blur-[140px] opacity-60"></div>
                <div className="absolute bottom-[-10%] left-[-5%] w-[60%] h-[50%] bg-gradient-to-tr from-indigo-500/10 via-indigo-500/5 to-transparent rounded-full blur-[120px] opacity-40"></div>
                <div className="absolute top-[20%] left-[10%] w-[40%] h-[40%] bg-gradient-to-r from-emerald-400/5 to-transparent rounded-full blur-[100px] opacity-30"></div>
                
                {/* Texture/Noise Overlay */}
                <div className="absolute inset-0 opacity-[0.015] grayscale" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
            </div>

            <div className="relative px-4 pb-24 mx-auto w-full pt-16 max-w-[1800px] 2xl:px-12" style={{ zIndex: 1 }}>
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar Navigation */}
                    {/* Sidebar Profile Panel */}
                    <aside className="lg:col-span-1">
                        <div className="sticky top-24 space-y-6">
                            {/* Main Identity Card */}
                            <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-center relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-brand-primary/20 to-indigo-500/20"></div>
                                
                                <div className="relative group mx-auto w-32 h-32 border-4 border-white rounded-[2rem] shadow-xl overflow-hidden bg-white mt-4 mb-5">
                                    <OptimizedImage
                                        src={user.avatar || ''}
                                        alt="Avatar"
                                        className="w-full h-full object-cover transform transition-transform group-hover:scale-110 duration-500"
                                        fallbackSrc={`https://ui-avatars.com/api/?name=${user.name}&background=random`}
                                    />
                                    
                                    <label 
                                        htmlFor="avatar-upload"
                                        className="absolute inset-0 bg-black/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center cursor-pointer text-white"
                                    >
                                        <Camera size={24} className="mb-1" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Alterar</span>
                                        <input 
                                            type="file" 
                                            id="avatar-upload" 
                                            className="hidden" 
                                            accept="image/*"
                                            onChange={handleAvatarSelect}
                                            disabled={uploading}
                                        />
                                    </label>

                                    {(uploading || isAnalyzingImage) && (
                                        <div className="absolute inset-0 bg-white/80 backdrop-blur-md flex flex-col items-center justify-center z-20">
                                            <Loader2 size={24} className="text-brand-primary animate-spin mb-2" />
                                        </div>
                                    )}
                                </div>

                                <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1">{user.name}</h3>
                                <p className="text-[10px] font-black text-brand-primary uppercase tracking-widest mb-4">Cliente Premium</p>
                                
                                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-500 mb-6 bg-slate-50 py-2.5 px-4 rounded-xl border border-slate-100">
                                    <MapPin size={14} className="text-brand-primary" /> 
                                    {data?.profile?.address_city || 'Localização Pendente'}
                                </div>

                                <Button 
                                    variant="outline" 
                                    className="w-full rounded-2xl font-black text-[10px] uppercase tracking-widest border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-brand-primary shadow-sm"
                                    onClick={() => setActiveTab('profile')}
                                >
                                    Editar Perfil
                                </Button>
                            </div>

                            {/* Connected Accounts & Stats */}
                            <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-6">
                                <div>
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Estatísticas</h4>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="font-bold text-slate-600 flex items-center gap-2"><CreditCard size={16} className="text-emerald-500"/> Investimento</span>
                                            <span className="font-black text-slate-900">R$ {totalSpent.toLocaleString('pt-BR')}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="font-bold text-slate-600 flex items-center gap-2"><Calendar size={16} className="text-blue-500"/> Pedidos</span>
                                            <span className="font-black text-slate-900">{bookings.length}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="font-bold text-slate-600 flex items-center gap-2"><Heart size={16} className="text-rose-500"/> Favoritos</span>
                                            <span className="font-black text-slate-900">{favorites.length}</span>
                                        </div>
                                    </div>
                                </div>

                                <hr className="border-slate-100" />

                                <div>
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Contas Conectadas</h4>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500"><User size={14} /></div>
                                            <span className="text-[10px] font-bold text-slate-700 flex-grow truncate">{user.email}</span>
                                            <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[8px] py-0 h-4">Verificado</Badge>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={logout}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all font-black text-[10px] uppercase tracking-widest"
                                >
                                    <LogOut size={14} /> Sair
                                </button>
                            </div>
                        </div>
                    </aside>

          {/* Main Content Area */}
          <div className="lg:col-span-3 pb-20 flex flex-col gap-8">
            {/* Horizontal Tabs Navigation */}
            <div className="bg-white/60 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] p-2.5 flex overflow-x-auto gap-2 no-scrollbar w-full xl:justify-start">
                <NavItem id="home" label="Visão Geral" icon={LayoutGrid} active={activeTab === 'home'} />
                <NavItem id="bookings" label="Serviços" icon={Calendar} active={activeTab === 'bookings'} />
                <NavItem id="budgets" label="Orçamentos" icon={FileText} active={activeTab === 'budgets'} />
                <NavItem id="messages" label="Mensagens" icon={MessageSquare} active={activeTab === 'messages'} />
                <NavItem id="favorites" label="Favoritos" icon={Heart} active={activeTab === 'favorites'} />
                <NavItem id="payments" label="Financeiro" icon={CreditCard} active={activeTab === 'payments'} />
            </div>

            {/* Render selected tab content */}
            <div className="min-h-[600px] w-full">
              {activeTab === 'home' && <ClientHome />}

              {activeTab === 'bookings' && (
                <div className="bg-white rounded-[2.5rem] shadow-xl p-8 border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <h2 className="text-2xl font-black text-slate-800">Meus Agendamentos</h2>
                      <p className="text-sm text-slate-500 font-medium">Acompanhe seus serviços ativos e histórico.</p>
                    </div>
                    <Link to="/empresas">
                      <Button size="sm" variant="outline" className="rounded-xl">Novo Serviço</Button>
                    </Link>
                  </div>
                  <MyAppointments isEmbedded={true} />
                </div>
              )}

              {activeTab === 'budgets' && <ClientBudgets />}

              {activeTab === 'messages' && (
                <div className="bg-white rounded-[2.5rem] shadow-xl p-8 border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h2 className="text-2xl font-black text-slate-800 mb-8">Comunicação</h2>
                  {conversations.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageSquare size={48} className="text-slate-100 mx-auto mb-4" />
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Nenhuma conversa iniciada</p>
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      {conversations.map((conv, idx) => (
                        <li key={idx}>
                          <Link to={conv.threadId ? `/minhas-mensagens?thread=${conv.threadId}` : "/minhas-mensagens"} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-slate-100 group">
                            <div className="flex items-center gap-4">
                              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-brand-primary font-black text-xl shadow-sm border border-slate-100 group-hover:border-brand-primary/20 transition-all">
                                {conv.name.charAt(0)}
                              </div>
                              <div>
                                <h4 className="font-bold text-slate-800 group-hover:text-brand-primary transition-colors">{conv.name}</h4>
                                <p className="text-sm text-slate-500 truncate max-w-xs font-medium">{conv.lastMessage}</p>
                              </div>
                            </div>
                            <div className="text-right flex items-center gap-4">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                {new Date(conv.date).toLocaleDateString()}
                              </span>
                              <ChevronRight size={18} className="text-slate-300 group-hover:text-brand-primary transition-colors" />
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {activeTab === 'favorites' && (
                <div className="bg-white rounded-[2.5rem] shadow-xl p-8 border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h2 className="text-2xl font-black text-slate-800 mb-8">Empresas Favoritas</h2>
                  {favorites.length === 0 ? (
                    <div className="text-center py-12">
                      <Heart size={48} className="text-slate-100 mx-auto mb-4" />
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Nenhum favorito ainda</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {favorites.map((fav) => (
                        <div key={fav.id} className="border border-slate-100 bg-slate-50/50 rounded-3xl p-5 flex gap-5 hover:shadow-lg hover:bg-white transition-all group">
                          <OptimizedImage
                            src={fav.company?.logo_url || ''}
                            alt={fav.company?.name}
                            className="w-20 h-20 rounded-2xl object-cover shadow-md bg-white border-4 border-white"
                            fallbackSrc={`https://ui-avatars.com/api/?name=${fav.company?.name}&background=random`}
                          />
                          <div className="flex flex-col justify-between py-1">
                            <div>
                              <h4 className="font-black text-slate-800 tracking-tight group-hover:text-brand-primary transition-colors">{fav.company?.name}</h4>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{fav.company?.category}</p>
                            </div>
                            <Link to={`/empresa/${fav.company?.id}`} className="text-brand-primary text-xs font-black hover:underline flex items-center gap-1 group/btn">
                              Ver Perfil Completo <ChevronRight size={14} className="group-hover/btn:translate-x-0.5 transition-transform" />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'profile' && profileData && (
                <div className="bg-white rounded-[2.5rem] shadow-xl p-8 border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h2 className="text-2xl font-black text-slate-800 mb-8">Dados Pessoais</h2>
                  <form onSubmit={handleProfileUpdate} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Input 
                        label="Nome Completo" 
                        value={profileData.name} 
                        onChange={e => setProfileData({ ...profileData, name: e.target.value })}
                        placeholder="Seu nome completo"
                      />
                      <Input label="Email de Cadastro" value={profileData.email} disabled className="bg-slate-50 opacity-70" />
                      <Input
                        label="CPF (Para notas fiscais)"
                        value={profileData.cpf || ''}
                        placeholder="000.000.000-00"
                        onChange={e => setProfileData({ ...profileData, cpf: e.target.value })}
                      />
                      <Input
                        label="Telefone WhatsApp"
                        value={profileData.phone || ''}
                        placeholder="(00) 00000-0000"
                        onChange={e => setProfileData({ ...profileData, phone: e.target.value })}
                      />
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button type="submit" isLoading={loading} className="px-10 rounded-2xl font-black text-sm uppercase tracking-widest h-14 shadow-lg shadow-brand-primary/20">
                        Atualizar Perfil
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {activeTab === 'addresses' && <ClientAddresses />}

              {activeTab === 'payments' && <ClientPayments />}

              {activeTab === 'settings' && <ClientSettings />}

              {activeTab === 'help' && <ClientHelp />}
            </div>
          </div>
        </div>
      </div>
            {/* Image Crop Modal */}
            <ImageCropModal
                isOpen={cropModal.isOpen}
                imageSrc={cropModal.imageSrc}
                aspectRatio={1}
                onClose={() => setCropModal({ isOpen: false, imageSrc: '' })}
                onCropComplete={uploadAvatar}
                isAnalyzing={isAnalyzingImage}
            />
        </div>
    );
};



export default ClientProfilePage;
