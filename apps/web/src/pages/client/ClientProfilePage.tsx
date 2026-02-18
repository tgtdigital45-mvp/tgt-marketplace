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
import { CreditCard, Heart, MessageSquare, User, LogOut, Calendar } from 'lucide-react';

const ClientProfilePage: React.FC = () => {
  const { user, signOut } = useAuth();
  const { addToast } = useToast();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'profile' | 'bookings' | 'messages' | 'favorites'>('bookings');

  // Unified Data Fetching
  const { data, isLoading: loading } = useClientProfileData(user?.id);

  // Local state for profile form editing
  const [profileData, setProfileData] = useState<UserProfile | null>(null);

  useEffect(() => {
    const state = location.state as { activeTab?: 'profile' | 'bookings' | 'messages' };
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

  const NavItem = ({ id, label, icon: Icon, active }: { id: string, label: string, icon: any, active: boolean }) => (
    <button
      onClick={() => setActiveTab(id as any)}
      className={`w-full flex items-center px-4 py-3 mb-2 rounded-xl transition-all duration-200 ${active
          ? 'bg-white shadow-md text-brand-primary font-bold'
          : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
        }`}
    >
      <div className={`p-2 rounded-lg mr-3 ${active ? 'bg-brand-primary text-white shadow-brand-md' : 'bg-white text-brand-primary shadow-sm'}`}>
        <Icon size={18} />
      </div>
      <span className="text-sm">{label}</span>
    </button>
  );

  return (
    <div className="relative w-full min-h-screen bg-gray-50 pb-12">
      {/* Background Gradient Header */}
      <div className="absolute top-0 w-full h-80 bg-gradient-to-r from-teal-400 to-brand-primary rounded-b-[2rem]" style={{ zIndex: 0 }}></div>

      <div className="relative px-4 pb-20 mx-auto w-full pt-20 max-w-7xl" style={{ zIndex: 1 }}>

        {/* Profile Header Card */}
        <div className="relative flex flex-col min-w-0 break-words bg-white w-full mb-8 shadow-xl rounded-2xl p-4 mt-10">
          <div className="px-6">
            <div className="flex flex-wrap justify-between items-center">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 border-4 border-white rounded-2xl shadow-lg overflow-hidden bg-white -mt-10">
                    <OptimizedImage
                      src={user.avatar || ''}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                      fallbackSrc={`https://ui-avatars.com/api/?name=${user.name}&background=random`}
                    />
                  </div>
                </div>
                <div className="mt-2">
                  <h3 className="text-2xl font-bold text-gray-800">{user.name}</h3>
                  <p className="text-gray-500 font-medium">{user.email}</p>
                </div>
              </div>
              {/* Optional Stats or Status */}
              <div className="flex gap-8 mt-4 md:mt-0 text-center">
                <div>
                  <span className="text-xl font-bold text-gray-800 block">{bookings.length}</span>
                  <span className="text-sm text-gray-500">Pedidos</span>
                </div>
                <div>
                  <span className="text-xl font-bold text-gray-800 block">{favorites.length}</span>
                  <span className="text-sm text-gray-500">Favoritos</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <h6 className="font-bold text-xs uppercase text-gray-500 mb-4 px-2">Menu do Cliente</h6>
              <nav className="flex flex-col">
                <NavItem id="bookings" label="Meus Pedidos" icon={Calendar} active={activeTab === 'bookings'} />
                <NavItem id="favorites" label="Favoritos" icon={Heart} active={activeTab === 'favorites'} />
                <NavItem id="messages" label="Mensagens" icon={MessageSquare} active={activeTab === 'messages'} />
                <NavItem id="profile" label="Meus Dados" icon={User} active={activeTab === 'profile'} />

                <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent my-4"></div>

                <button
                  onClick={signOut}
                  className="w-full flex items-center px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors duration-200 group"
                >
                  <div className="p-2 rounded-lg mr-3 bg-white text-red-500 shadow-sm group-hover:bg-red-500 group-hover:text-white transition-all">
                    <LogOut size={18} />
                  </div>
                  <span className="text-sm font-bold">Sair</span>
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-6">

            {/* BOOKINGS CONTENT */}
            {activeTab === 'bookings' && (
              <div className="bg-white rounded-2xl shadow-lg p-6 min-h-[500px]">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800">Meus Pedidos</h2>
                  <Link to="/empresas">
                    <Button size="sm" variant="outline">Novo Pedido</Button>
                  </Link>
                </div>

                {loading ? <p className="text-gray-500">Carregando...</p> : bookings.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                      <Calendar size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">Nenhum pedido encontrado</h3>
                    <p className="text-gray-500 mb-6">Você ainda não realizou nenhum agendamento.</p>
                    <Link to="/empresas">
                      <Button variant="primary">Encontrar Profissionais</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-gray-400 text-xs font-bold uppercase border-b border-gray-100">
                          <th className="pb-4 pl-2">Serviço / Profissional</th>
                          <th className="pb-4">Data</th>
                          <th className="pb-4">Valor</th>
                          <th className="pb-4">Status</th>
                          <th className="pb-4"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {bookings.map((booking: any) => (
                          <tr key={booking.id} className="hover:bg-gray-50 transition-colors text-sm">
                            <td className="py-4 pl-2">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                                  {booking.companies?.logo_url ? <img src={booking.companies.logo_url} className="w-full h-full object-cover rounded-lg" /> : <User size={20} />}
                                </div>
                                <div>
                                  <p className="font-bold text-gray-800">{booking.service_title}</p>
                                  <p className="text-xs text-gray-500">{booking.companies?.name}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 text-gray-600 font-bold">
                              {new Date(booking.booking_date).toLocaleDateString()}
                            </td>
                            <td className="py-4 text-gray-600 font-bold">
                              {booking.service_price ? `R$ ${booking.service_price}` : '-'}
                            </td>
                            <td className="py-4">
                              <Badge variant={
                                booking.status === 'confirmed' ? 'success' :
                                  booking.status === 'cancelled' ? 'danger' :
                                    booking.status === 'completed' ? 'info' : 'warning'
                              }>
                                {booking.status === 'pending' && 'Pendente'}
                                {booking.status === 'confirmed' && 'Confirmado'}
                                {booking.status === 'cancelled' && 'Cancelado'}
                                {booking.status === 'completed' && 'Concluído'}
                              </Badge>
                            </td>
                            <td className="py-4 text-right">
                              <Link to={`/orders/${booking.id}`} className="text-brand-primary font-bold hover:underline text-xs">
                                Detalhes
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* FAVORITES CONTENT */}
            {activeTab === 'favorites' && (
              <div className="bg-white rounded-2xl shadow-lg p-6 min-h-[500px]">
                <h2 className="text-xl font-bold text-gray-800 mb-6">Meus Favoritos</h2>
                {favorites.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    Nenhuma empresa favoritada ainda.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {favorites.map((fav) => (
                      <div key={fav.id} className="border border-gray-100 rounded-xl p-4 flex gap-4 hover:shadow-md transition-all">
                        <OptimizedImage
                          src={fav.company?.logo_url || ''}
                          alt={fav.company?.name}
                          className="w-16 h-16 rounded-xl object-cover shadow-sm bg-gray-50"
                          fallbackSrc={`https://ui-avatars.com/api/?name=${fav.company?.name}&background=random`}
                        />
                        <div>
                          <h4 className="font-bold text-gray-800">{fav.company?.name}</h4>
                          <p className="text-xs text-gray-500 mb-2">{fav.company?.category}</p>
                          <Link to={`/empresa/${fav.company?.id}`} className="text-brand-primary text-xs font-bold hover:underline">
                            Ver Perfil
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* MESSAGES CONTENT */}
            {activeTab === 'messages' && (
              <div className="bg-white rounded-2xl shadow-lg p-6 min-h-[500px]">
                <h2 className="text-xl font-bold text-gray-800 mb-6">Mensagens</h2>
                {conversations.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    Nenhuma conversa iniciada.
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {conversations.map((conv, idx) => (
                      <li key={idx} className="py-4 hover:bg-gray-50 px-2 rounded-lg transition-colors">
                        <Link to="/minhas-mensagens" className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-brand-primary font-bold text-lg">
                              {conv.name.charAt(0)}
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-800">{conv.name}</h4>
                              <p className="text-sm text-gray-500 truncate max-w-xs font-medium">{conv.lastMessage}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-xs text-gray-400 block mb-1">
                              {new Date(conv.date).toLocaleDateString()}
                            </span>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* PROFILE CONTENT */}
            {activeTab === 'profile' && profileData && (
              <div className="bg-white rounded-2xl shadow-lg p-6 min-h-[500px]">
                <h2 className="text-xl font-bold text-gray-800 mb-6">Meus Dados</h2>
                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input label="Nome Completo" value={profileData.name} disabled />
                    <Input label="Email" value={profileData.email} disabled />
                    <Input label="CPF" value={profileData.cpf || ''} onChange={e => setProfileData({ ...profileData, cpf: e.target.value })} />
                    <Input label="Telefone" value={profileData.phone || ''} onChange={e => setProfileData({ ...profileData, phone: e.target.value })} />
                  </div>

                  <h3 className="text-sm font-bold text-gray-800 uppercase mt-8 mb-4 border-b border-gray-100 pb-2">Endereço</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Input label="CEP" value={profileData.address_zip || ''} onChange={e => setProfileData({ ...profileData, address_zip: e.target.value })} />
                    <div className="md:col-span-2">
                      <Input label="Rua" value={profileData.address_street || ''} onChange={e => setProfileData({ ...profileData, address_street: e.target.value })} />
                    </div>
                    <Input label="Número" value={profileData.address_number || ''} onChange={e => setProfileData({ ...profileData, address_number: e.target.value })} />
                    <Input label="Bairro" value={profileData.address_neighborhood || ''} onChange={e => setProfileData({ ...profileData, address_neighborhood: e.target.value })} />
                    <Input label="Cidade" value={profileData.address_city || ''} onChange={e => setProfileData({ ...profileData, address_city: e.target.value })} />
                  </div>

                  <div className="flex justify-end pt-6">
                    <Button type="submit" isLoading={loading} className="px-8">Salvar Alterações</Button>
                  </div>
                </form>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientProfilePage;
