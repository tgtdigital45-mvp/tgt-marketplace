import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { UserProfile, Booking } from '../../types'; // Ensure Booking is exported or redefine
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useToast } from '../../contexts/ToastContext';
import Badge from '../../components/ui/Badge';
import { Link, useLocation } from 'react-router-dom';

// Icons
const UserIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const CalendarIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const ChatIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>;
const SignOutIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;

const ClientProfilePage: React.FC = () => {
  const { user, signOut } = useAuth();
  const { addToast } = useToast();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'profile' | 'bookings' | 'messages'>('bookings');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const state = location.state as { activeTab?: 'profile' | 'bookings' | 'messages' };
    if (state?.activeTab) {
      setActiveTab(state.activeTab);
    }
  }, [location]);

  // Profile State
  const [profileData, setProfileData] = useState<UserProfile | null>(null);

  // Bookings State
  const [bookings, setBookings] = useState<any[]>([]);

  // Messages State (Simplified Conversation List)
  const [conversations, setConversations] = useState<any[]>([]);

  // -- FETCH DATA --
  useEffect(() => {
    if (!user) return;

    const fetchAllData = async () => {
      setLoading(true);
      try {
        // 1. Fetch Profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profile) setProfileData({ ...user, ...profile });

        // 2. Fetch Bookings
        const { data: bookingsData } = await supabase
          .from('bookings')
          .select('*, companies(company_name)')
          .eq('client_id', user.id)
          .order('created_at', { ascending: false });

        setBookings(bookingsData || []);

        // 3. Fetch Messages (Grouped by Company)
        // Ideally we use a View or more complex query. Simple grouping here.
        const { data: msgs } = await supabase
          .from('messages')
          .select('*')
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .order('created_at', { ascending: false });

        if (msgs) {
          // Determine unique contacts (Companies)
          const contactIds = new Set();
          const convos = [];
          for (const m of msgs) {
            const otherId = m.sender_id === user.id ? m.receiver_id : m.sender_id;
            if (!contactIds.has(otherId)) {
              contactIds.add(otherId);
              convos.push({
                contactId: otherId,
                lastMessage: m.content,
                date: m.created_at,
                unread: m.receiver_id === user.id && !m.read
              });
            }
          }
          // Fetch company names for these contacts
          const contactIdArray = Array.from(contactIds);
          if (contactIdArray.length > 0) {
            const { data: companies } = await supabase
              .from('companies')
              .select('id, company_name, profile_id')
              .in('profile_id', contactIdArray);

            // Merge names
            const finalConvos = convos.map(c => {
              const comp = companies?.find((co: any) => co.profile_id === c.contactId);
              return { ...c, name: comp?.company_name || 'Empresa Desconhecida' };
            });
            setConversations(finalConvos);
          }
        }

      } catch (error) {
        console.error(error);
        addToast("Erro ao carregar dados.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [user]);

  // -- PROFILE HANDLERS --
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profileData) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('profiles').update({
        cpf: profileData.cpf,
        phone: profileData.phone,
        address_street: profileData.address_street,
        address_city: profileData.address_city,
        // Add other fields as needed
      }).eq('id', user.id);

      if (error) throw error;
      addToast("Perfil atualizado!", "success");
    } catch (err) {
      addToast("Erro ao atualizar.", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      {/* Header / Cover */}
      <div className="bg-brand-primary h-48 w-full relative">
        <div className="absolute -bottom-16 left-0 right-0 container mx-auto px-4 flex items-end">
          <div className="flex items-center gap-6">
            <img
              src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=random`}
              alt="Avatar"
              className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-white"
            />
            <div className="mb-4">
              <h1 className="text-3xl font-bold text-white">{user.name}</h1>
              <p className="text-white/80">{user.email}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-20 grid grid-cols-1 lg:grid-cols-4 gap-8">

        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden sticky top-24">
            <nav className="flex flex-col">
              <button
                onClick={() => setActiveTab('bookings')}
                className={`flex items-center px-6 py-4 text-left transition-colors ${activeTab === 'bookings' ? 'bg-primary-50 text-brand-primary border-l-4 border-brand-primary font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <CalendarIcon />
                <span className="ml-3">Meus Pedidos</span>
              </button>
              <button
                onClick={() => setActiveTab('messages')}
                className={`flex items-center px-6 py-4 text-left transition-colors ${activeTab === 'messages' ? 'bg-primary-50 text-brand-primary border-l-4 border-brand-primary font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <ChatIcon />
                <span className="ml-3">Mensagens</span>
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex items-center px-6 py-4 text-left transition-colors ${activeTab === 'profile' ? 'bg-primary-50 text-brand-primary border-l-4 border-brand-primary font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <UserIcon />
                <span className="ml-3">Meus Dados</span>
              </button>
              <div className="border-t border-gray-100 mt-2">
                <button
                  onClick={signOut}
                  className="flex items-center px-6 py-4 text-left text-red-600 hover:bg-red-50 w-full transition-colors"
                >
                  <SignOutIcon />
                  <span className="ml-3">Sair</span>
                </button>
              </div>
            </nav>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3">

          {/* BOOKINGS TAB */}
          {activeTab === 'bookings' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800">Meus Pedidos e Agendamentos</h2>
              {bookings.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CalendarIcon />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">Nenhum agendamento ainda</h3>
                  <p className="text-gray-500 mb-6">Encontre profissionais e solicite orçamentos.</p>
                  <Link to="/empresas" className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-brand-primary hover:bg-brand-secondary transition-colors">
                    Buscar Profissionais
                  </Link>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <ul className="divide-y divide-gray-100">
                    {bookings.map((booking: any) => (
                      <li key={booking.id} className="p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">{booking.service_title}</h4>
                            <p className="text-gray-600 text-sm mb-1">Com: {booking.companies?.company_name}</p>
                            <p className="text-gray-500 text-xs">
                              Data: {new Date(booking.booking_date).toLocaleDateString()} • {booking.booking_time}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
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
                            {booking.service_price && (
                              <span className="text-sm font-medium text-gray-900">R$ {booking.service_price}</span>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* MESSAGES TAB */}
          {activeTab === 'messages' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800">Minhas Mensagens</h2>
              {conversations.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                  <p className="text-gray-500">Você ainda não iniciou conversas.</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <ul className="divide-y divide-gray-100">
                    {conversations.map((conv: any, idx) => (
                      <li key={idx} className="p-6 hover:bg-gray-50 transition-colors">
                        <Link to="/minhas-mensagens" className="block"> {/* In real app, link to specific chat */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-brand-primary font-bold text-lg">
                                {conv.name.charAt(0)}
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900">{conv.name}</h4>
                                <p className="text-gray-500 text-sm truncate max-w-xs">{conv.lastMessage}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-xs text-gray-400 block mb-1">
                                {new Date(conv.date).toLocaleDateString()}
                              </span>
                              {conv.unread && (
                                <span className="inline-block w-3 h-3 bg-red-500 rounded-full"></span>
                              )}
                            </div>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* PROFILE DATA TAB */}
          {activeTab === 'profile' && profileData && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800">Meus Dados Pessoais</h2>
              <div className="bg-white rounded-xl shadow-sm p-8">
                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input label="Nome Completo" value={profileData.name} disabled />
                    <Input label="Email" value={profileData.email} disabled />
                    <Input
                      label="CPF"
                      value={profileData.cpf || ''}
                      onChange={e => setProfileData({ ...profileData, cpf: e.target.value })}
                      placeholder="000.000.000-00"
                    />
                    <Input
                      label="Telefone / WhatsApp"
                      value={profileData.phone || ''}
                      onChange={e => setProfileData({ ...profileData, phone: e.target.value })}
                      placeholder="(00) 00000-0000"
                    />
                    <Input
                      label="Rua"
                      value={profileData.address_street || ''}
                      onChange={e => setProfileData({ ...profileData, address_street: e.target.value })}
                    />
                    <Input
                      label="Cidade"
                      value={profileData.address_city || ''}
                      onChange={e => setProfileData({ ...profileData, address_city: e.target.value })}
                    />
                  </div>
                  <div className="pt-4 flex justify-end">
                    <Button type="submit" isLoading={loading}>
                      Salvar Alterações
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ClientProfilePage;
