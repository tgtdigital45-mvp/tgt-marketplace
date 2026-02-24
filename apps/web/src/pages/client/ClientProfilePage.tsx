import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@tgt/shared';
import { UserProfile } from '@tgt/shared';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useToast } from '@/contexts/ToastContext';
import Badge from '@/components/ui/Badge';
import { Link, useLocation } from 'react-router-dom';
import { useClientProfileData } from '@/hooks/useClientProfileData';
import OptimizedImage from '@/components/ui/OptimizedImage';
import {
  CreditCard, Heart, MessageSquare, User, LogOut,
  Calendar, Clock, LayoutGrid, FileText, Settings,
  HelpCircle, MapPin, ChevronRight
} from 'lucide-react';

// New Section Components
import ClientHome from './components/ClientHome';
import ClientBudgets from './components/ClientBudgets';
import ClientAddresses from './components/ClientAddresses';
import ClientHelp from './components/ClientHelp';
import MyAppointments from '@/pages/client/MyAppointments';
import PaymentHistory from '@/pages/client/PaymentHistory';

type TabType = 'home' | 'bookings' | 'budgets' | 'messages' | 'favorites' | 'profile' | 'addresses' | 'payments' | 'help';

const ClientProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<TabType>('home');

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
  const conversations = data?.conversations || [];
  const favorites = data?.favorites || [];

  // -- PROFILE HANDLERS --
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
      addToast("Perfil atualizado!", "success");
    } catch (err) {
      console.error(err);
      addToast("Erro ao atualizar.", "error");
    }
  };

  if (!user) return null;

  const NavItem = ({ id, label, icon: Icon, active, color = "text-[#1E293B]" }: { id: TabType, label: string, icon: any, active: boolean, color?: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center px-5 py-3.5 rounded-2xl transition-all duration-200 ${active
        ? 'bg-white shadow-sm text-gray-900 font-bold'
        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/50 font-medium'
        }`}
    >
      <div className={`mr-4 ${active ? color : 'text-gray-400'}`}>
        <Icon size={20} className={active ? "fill-current/10" : ""} />
      </div>
      <span className="text-sm tracking-wide">{label}</span>
      {active && <div className="ml-auto w-1.5 h-6 bg-brand-primary rounded-full blur-[1px]"></div>}
    </button>
  );

  return (
    <div className="relative w-full min-h-screen bg-gray-50 pb-12">
      {/* Background Gradient Header */}
      <div className="absolute top-0 w-full h-[320px] bg-gradient-to-r from-[#00b09b] to-[#2c3e50] rounded-b-[3rem]" style={{ zIndex: 0 }}></div>

      <div className="relative px-4 pb-20 mx-auto w-full pt-20 max-w-7xl" style={{ zIndex: 1 }}>

        {/* Profile Header Card */}
        <div className="relative flex flex-col min-w-0 break-words bg-white/80 backdrop-blur-xl w-full mb-10 shadow-xl rounded-[2.5rem] p-8 mt-16 border border-white/40">
          <div className="px-6">
            <div className="flex flex-wrap justify-between items-center">
              <div className="flex items-center gap-8">
                <div className="relative">
                  <div className="w-28 h-28 border-[6px] border-white rounded-[2rem] shadow-2xl overflow-hidden bg-white -mt-20 backdrop-blur-xl">
                    <OptimizedImage
                      src={user.avatar || ''}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                      fallbackSrc={`https://ui-avatars.com/api/?name=${user.name}&background=random`}
                    />
                  </div>
                </div>
                <div>
                  <h3 className="text-3xl font-black text-[#1E293B] tracking-tight">{user.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="info" className="bg-blue-100 text-blue-700 border-none font-bold">Cliente</Badge>
                    <p className="text-gray-400 font-medium text-sm">{user.email}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-12 mt-6 md:mt-0">
                <div className="flex flex-col items-center">
                  <span className="text-3xl font-black text-[#1E293B] block">{bookings.length}</span>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Agendamentos</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-3xl font-black text-[#1E293B] block">{favorites.length}</span>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Favoritos</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">

              <section>
                <h6 className="font-black text-[10px] tracking-widest uppercase text-slate-400 mb-4 px-5">Principal</h6>
                <nav className="flex flex-col space-y-1">
                  <NavItem id="home" label="Início" icon={LayoutGrid} active={activeTab === 'home'} color="text-brand-primary" />
                  <NavItem id="bookings" label="Meus Agendamentos" icon={Calendar} active={activeTab === 'bookings'} color="text-blue-500" />
                  <NavItem id="budgets" label="Área de Orçamentos" icon={FileText} active={activeTab === 'budgets'} color="text-orange-500" />
                  <NavItem id="messages" label="Mensagens" icon={MessageSquare} active={activeTab === 'messages'} color="text-indigo-500" />
                  <NavItem id="favorites" label="Favoritos" icon={Heart} active={activeTab === 'favorites'} color="text-red-500" />
                </nav>
              </section>

              <section>
                <h6 className="font-black text-[10px] tracking-widest uppercase text-slate-400 mb-4 px-5">Configurações</h6>
                <nav className="flex flex-col space-y-1">
                  <NavItem id="profile" label="Dados Pessoais" icon={User} active={activeTab === 'profile'} />
                  <NavItem id="addresses" label="Meus Endereços" icon={MapPin} active={activeTab === 'addresses'} />
                  <NavItem id="payments" label="Formas de Pagamento" icon={CreditCard} active={activeTab === 'payments'} />
                </nav>
              </section>

              <section>
                <h6 className="font-black text-[10px] tracking-widest uppercase text-slate-400 mb-4 px-5">Ajuda</h6>
                <nav className="flex flex-col space-y-1">
                  <NavItem id="help" label="Central de Suporte" icon={HelpCircle} active={activeTab === 'help'} color="text-green-600" />

                  <div className="h-4"></div>

                  <button
                    onClick={logout}
                    className="w-full flex items-center px-5 py-3.5 rounded-2xl text-red-500 hover:bg-red-50 transition-all duration-200 group font-bold"
                  >
                    <LogOut size={20} className="mr-4 opacity-70 group-hover:opacity-100" />
                    <span className="text-sm tracking-wide">Sair da Conta</span>
                  </button>
                </nav>
              </section>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3 pb-20">
            {/* Render selected tab content */}
            <div className="min-h-[600px]">
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
                          <Link to="/minhas-mensagens" className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-slate-100 group">
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
                      <Input label="Nome Completo" value={profileData.name} disabled className="bg-slate-50 opacity-70" />
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

              {activeTab === 'payments' && (
                <div className="bg-white rounded-[2.5rem] shadow-xl p-8 border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h2 className="text-2xl font-black text-slate-800 mb-2">Formas de Pagamento</h2>
                  <p className="text-sm text-slate-500 font-medium mb-8">Gerencie seus cartões salvos para checkout rápido.</p>
                  <PaymentHistory isEmbedded={true} />
                </div>
              )}

              {activeTab === 'help' && <ClientHelp />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientProfilePage;
