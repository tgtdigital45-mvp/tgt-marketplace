import React, { useState, useEffect } from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { supabase } from '@tgt/shared';
import { CATEGORIES } from '@/constants';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import FileUpload from '@/components/FileUpload';
import { Switch } from '@headlessui/react'; // Assuming we have headlessui installed, or I'll implement a simple switch
import { Link } from 'react-router-dom';
import {
  Building,
  MapPin,
  Phone,
  Mail,
  Globe,
  Edit2,
  Camera,
  MessageSquare,
  Facebook,
  Twitter,
  Instagram,
  Linkedin
} from 'lucide-react';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';

import { CompanyData } from '@/contexts/CompanyContext';
import { DbPortfolioItem } from '@tgt/shared';

// --- Components for Purity UI Profile ---

const ProfileHeaderCard = ({
  company,
  onAvatarChange,
  onCoverChange,
  uploading
}: {
  company: CompanyData | null,
  onAvatarChange: (file: File) => void,
  onCoverChange: (file: File) => void,
  uploading: boolean
}) => {
  return (
    <div className="relative flex flex-col min-w-0 break-words bg-white w-full mb-6 shadow-xl rounded-2xl overflow-hidden">
      {/* Cover Image */}
      <div className="relative h-48 sm:h-64 w-full bg-gray-200 overflow-hidden">
        {company?.cover_image_url ? (
          <img
            src={company.cover_image_url}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-teal-400 to-brand-primary" />
        )}

        <label
          htmlFor="cover-upload"
          className="absolute bottom-4 right-4 bg-white/80 backdrop-blur-sm p-2 rounded-lg cursor-pointer hover:bg-white shadow-lg transition-all flex items-center gap-2 text-xs font-bold text-gray-700"
        >
          <Camera size={16} className="text-brand-primary" />
          Alterar Capa
          <input
            type="file"
            id="cover-upload"
            className="hidden"
            accept="image/*"
            onChange={(e) => e.target.files && onCoverChange(e.target.files[0])}
            disabled={uploading}
          />
        </label>
      </div>

      <div className="px-6 pb-6">
        <div className="flex flex-wrap justify-center">
          <div className="w-full lg:w-3/12 px-4 lg:order-2 flex justify-center">
            <div className="relative">
              <div className="w-24 h-24 sm:w-36 sm:h-36 relative -mt-12 sm:-mt-16 border-4 border-white rounded-2xl shadow-lg overflow-hidden bg-white">
                <img
                  alt={company?.company_name}
                  src={company?.logo_url || 'https://via.placeholder.com/150'}
                  className="w-full h-full object-cover"
                />
                <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 bg-white p-1 rounded-tl-lg cursor-pointer hover:bg-gray-100 shadow-sm">
                  <Edit2 size={16} className="text-brand-primary" />
                  <input
                    type="file"
                    id="avatar-upload"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => e.target.files && onAvatarChange(e.target.files[0])}
                    disabled={uploading}
                  />
                </label>
              </div>
            </div>
          </div>
          <div className="w-full lg:w-4/12 px-4 lg:order-3 lg:text-right lg:self-center">
            <div className="py-6 px-3 mt-32 sm:mt-0">
              {/* Place for action buttons if needed */}
            </div>
          </div>
          <div className="w-full lg:w-4/12 px-4 lg:order-1">
            <div className="flex justify-center py-4 lg:pt-4 pt-8">
              <div className="mr-4 p-3 text-center">
                <span className="text-xl font-bold block uppercase tracking-wide text-gray-700">22</span>
                <span className="text-sm text-gray-400">Reviews</span>
              </div>
              <div className="mr-4 p-3 text-center">
                <span className="text-xl font-bold block uppercase tracking-wide text-gray-700">10</span>
                <span className="text-sm text-gray-400">Fotos</span>
              </div>
              <div className="lg:mr-4 p-3 text-center">
                <span className="text-xl font-bold block uppercase tracking-wide text-gray-700">89</span>
                <span className="text-sm text-gray-400">Conversas</span>
              </div>
            </div>
          </div>
        </div>
        <div className="text-center mt-4">
          <h3 className="text-2xl font-bold leading-normal mb-1 text-gray-800">
            {company?.company_name || 'Nome da Empresa'}
          </h3>
          <div className="text-sm leading-normal mt-0 mb-2 text-gray-400 font-bold uppercase">
            <MapPin size={16} className="inline mr-2 text-gray-400" />
            {company?.address?.city}, {company?.address?.state || 'Brasil'}
          </div>
          <div className="mb-2 text-gray-600 mt-4">
            <Building size={16} className="inline mr-2 text-gray-400" />
            {company?.category || 'Categoria'}
          </div>
        </div>
      </div>
    </div>
  );
};

// Toggle Switch Component
const Toggle = ({ label, enabled, onChange }: { label: string, enabled: boolean, onChange: (val: boolean) => void }) => (
  <div className="flex items-center justify-between mb-4">
    <span className="text-sm text-gray-500 font-medium">{label}</span>
    <Switch
      checked={enabled}
      onChange={onChange}
      className={`${enabled ? 'bg-brand-primary' : 'bg-gray-200'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none`}
    >
      <span className={`${enabled ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
    </Switch>
  </div>
);




const DashboardPerfilPage: React.FC = () => {
  const { company, loading: companyLoading, refreshCompany } = useCompany();
  const { user } = useAuth();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [portfolioItems, setPortfolioItems] = useState<DbPortfolioItem[]>([]);
  const [threads, setThreads] = useState<any[]>([]);
  const [loadingThreads, setLoadingThreads] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    companyName: '',
    legalName: '',
    phone: '',
    website: '',
    category: '',
    description: '',
    email: '',
    address: {
      cep: '',
      street: '',
      number: '',
      district: '',
      city: '',
      state: '',
    },
    socialLinks: {
      facebook: '',
      instagram: '',
      linkedin: '',
    },
    coverage_radius_km: 30,
    coverage_neighborhoods: [] as string[],
    terms_and_policies: '',
  });

  const [neighborhoodInput, setNeighborhoodInput] = useState('');

  // Settings State (Mock)
  const [settings, setSettings] = useState({
    emailFollows: true,
    emailAnswers: false,
    emailMentions: true,
    newLaunches: false,
    monthlyUpdates: true,
    newsletter: false
  });

  useEffect(() => {
    const fetchRecentConversations = async () => {
      if (!user) return;
      try {
        setLoadingThreads(true);
        const { data: sent } = await supabase.from('messages').select('*, jobs(title), orders(service_title)').eq('sender_id', user.id).order('created_at', { ascending: false }).limit(20);
        const { data: received } = await supabase.from('messages').select('*, jobs(title), orders(service_title)').eq('receiver_id', user.id).order('created_at', { ascending: false }).limit(20);

        const allMessages = [...(sent || []), ...(received || [])];
        allMessages.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        const uniqueThreads = new Map<string, any>();
        const partnerIdsToFetch = new Set<string>();

        const getPartnerId = (msg: any) => msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;

        allMessages.forEach(msg => {
          const partnerId = getPartnerId(msg);
          if (partnerId && (msg.job_id || msg.order_id)) {
            partnerIdsToFetch.add(partnerId);
          }
        });

        let profilesMap: Record<string, any> = {};
        if (partnerIdsToFetch.size > 0) {
          const { data: profiles } = await supabase.from('profiles').select('id, full_name, avatar_url').in('id', Array.from(partnerIdsToFetch));
          profiles?.forEach((p: any) => profilesMap[p.id] = p);
        }

        allMessages.forEach((msg: any) => {
          if (!msg.job_id && !msg.order_id) return;
          const threadId = msg.job_id || msg.order_id;
          if (!uniqueThreads.has(threadId)) {
            const partnerId = getPartnerId(msg);
            const profile = profilesMap[partnerId];
            let jobTitle = 'Serviço';
            if (msg.job_id && msg.jobs?.title) jobTitle = msg.jobs.title;
            else if (msg.order_id && msg.orders?.service_title) jobTitle = msg.orders.service_title;

            uniqueThreads.set(threadId, {
              threadId,
              partnerName: profile?.full_name || 'Cliente',
              partnerAvatar: profile?.avatar_url,
              lastMessage: msg.content,
              lastMessageTime: msg.created_at,
              jobTitle
            });
          }
        });

        setThreads(Array.from(uniqueThreads.values()).slice(0, 4));
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingThreads(false);
      }
    };

    if (user) {
      fetchRecentConversations();
    }
  }, [user]);

  useEffect(() => {
    if (company) {
      setFormData({
        companyName: company.company_name || '',
        legalName: company.legal_name || '',
        phone: company.phone || '',
        website: company.website || '',
        category: company.category || '',
        description: company.description || '',
        email: company.email || '',
        address: company.address || { cep: '', street: '', number: '', district: '', city: '', state: '' },
        socialLinks: (company as any).social_links || { facebook: '', instagram: '', linkedin: '' },
        coverage_radius_km: (company as any).coverage_radius_km ?? 30,
        coverage_neighborhoods: (company as any).coverage_neighborhoods || [],
        terms_and_policies: (company as any).terms_and_policies || '',
      });
      fetchPortfolio();
    }
  }, [company]);

  const fetchPortfolio = async () => {
    if (!company?.id) return;
    const { data } = await supabase.from('portfolio_items').select('*').eq('company_id', company.id).order('created_at', { ascending: false }).limit(4);
    setPortfolioItems(data || []);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (['street', 'number', 'district', 'city', 'state', 'cep'].includes(name)) {
      setFormData(prev => ({ ...prev, address: { ...prev.address, [name]: value } }));
    } else if (['facebook', 'instagram', 'linkedin'].includes(name)) {
      setFormData(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, [name]: value } }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const uploadAvatar = async (file: File) => {
    try {
      setLoading(true);
      const path = `${company?.id}/logo-${Date.now()}`;
      const { error } = await supabase.storage.from('company-assets').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('company-assets').getPublicUrl(path);

      await supabase.from('companies').update({ logo_url: publicUrl }).eq('id', company?.id);
      await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });

      refreshCompany();
      addToast('Logo atualizado com sucesso!', 'success');
    } catch (err) {
      console.error(err);
      addToast('Erro ao atualizar logo.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.from('companies').update({
        company_name: formData.companyName,
        legal_name: formData.legalName,
        phone: formData.phone,
        website: formData.website,
        category: formData.category,
        description: formData.description,
        email: formData.email,
        address: formData.address,
        social_links: formData.socialLinks,
        coverage_radius_km: formData.coverage_radius_km,
        coverage_neighborhoods: formData.coverage_neighborhoods,
        terms_and_policies: formData.terms_and_policies,
      }).eq('id', company?.id);

      if (error) throw error;
      await supabase.auth.updateUser({ data: { name: formData.companyName } });
      refreshCompany();
      addToast('Perfil salvo com sucesso!', 'success');
    } catch (err) {
      console.error(err);
      addToast('Erro ao salvar perfil.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const uploadCover = async (file: File) => {
    try {
      setLoading(true);

      // Validate dimensions: max 3000x1080
      const img = new Image();
      img.src = URL.createObjectURL(file);
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      if (img.width > 3000 || img.height > 1080) {
        throw new Error(`Imagem muito grande (${img.width}x${img.height}). O máximo permitido é 3000x1080px.`);
      }

      const path = `${company?.id}/cover-${Date.now()}`;
      const { error } = await supabase.storage.from('company-assets').upload(path, file, { upsert: true });
      if (error) {
        if (error.message.includes('Bucket not found')) {
          // Fallback to portfolio bucket if company-assets doesn't exist
          const { error: pError } = await supabase.storage.from('portfolio').upload(path, file, { upsert: true });
          if (pError) throw pError;
          const { data: { publicUrl } } = supabase.storage.from('portfolio').getPublicUrl(path);
          await supabase.from('companies').update({ cover_image_url: publicUrl }).eq('id', company?.id);
        } else {
          throw error;
        }
      } else {
        const { data: { publicUrl } } = supabase.storage.from('company-assets').getPublicUrl(path);
        await supabase.from('companies').update({ cover_image_url: publicUrl }).eq('id', company?.id);
      }

      refreshCompany();
      addToast('Capa atualizada com sucesso!', 'success');
    } catch (err: any) {
      console.error(err);
      addToast(err.message || 'Erro ao atualizar capa.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!company) return <LoadingSkeleton className="h-96" />;

  return (
    <div className="relative w-full min-h-screen">
      {/* Background Gradient Header - Hidden when cover exists, or used as fallback */}
      {!company?.cover_image_url && (
        <div className="absolute top-0 w-full h-80 bg-gradient-to-r from-teal-400 to-brand-primary rounded-xl" style={{ zIndex: 0 }}></div>
      )}

      <div className="relative px-4 md:px-10 mx-auto w-full pt-10" style={{ zIndex: 1 }}>

        {/* Profile Card Overlay */}
        <ProfileHeaderCard
          company={company}
          onAvatarChange={uploadAvatar}
          onCoverChange={uploadCover}
          uploading={loading}
        />

        {/* 3-Column Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">

          {/* 1. Platform Settings */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h6 className="text-lg font-bold text-gray-800 mb-4">Configurações da Plataforma</h6>
            <div className="mb-6">
              <p className="text-xs font-bold text-gray-400 uppercase mb-4">Conta</p>
              <Toggle label="Notificar novos seguidores" enabled={settings.emailFollows} onChange={v => setSettings(s => ({ ...s, emailFollows: v }))} />
              <Toggle label="Notificar respostas" enabled={settings.emailAnswers} onChange={v => setSettings(s => ({ ...s, emailAnswers: v }))} />
              <Toggle label="Notificar menções" enabled={settings.emailMentions} onChange={v => setSettings(s => ({ ...s, emailMentions: v }))} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase mb-4">Aplicação</p>
              <Toggle label="Novos lançamentos" enabled={settings.newLaunches} onChange={v => setSettings(s => ({ ...s, newLaunches: v }))} />
              <Toggle label="Atualizações mensais" enabled={settings.monthlyUpdates} onChange={v => setSettings(s => ({ ...s, monthlyUpdates: v }))} />
              <Toggle label="Newsletter" enabled={settings.newsletter} onChange={v => setSettings(s => ({ ...s, newsletter: v }))} />
            </div>
          </div>

          {/* 2. Profile Information (Editable Form Styled as Info) */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h6 className="text-lg font-bold text-gray-800">Informações do Perfil</h6>
              {/* <button onClick={saveProfile} className="p-2 bg-gray-50 rounded-lg hover:bg-gray-100 text-brand-primary">
                        <Edit2 size={16} />
                    </button> */}
            </div>
            <div className="space-y-4 text-sm text-gray-600">
              <p className="mb-6 opacity-80">
                {formData.description || "Adicione uma descrição para sua empresa..."}
              </p>

              <div className="space-y-4">
                <div className="flex items-center">
                  <strong className="w-32 text-gray-800">Nome Fantasia:</strong>
                  <Input
                    id="companyName"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    className="!mt-0 !h-8 !border-0 border-b border-gray-200 focus:ring-0 rounded-none px-0"
                  />
                </div>
                <div className="flex items-center">
                  <strong className="w-32 text-gray-800">Telefone:</strong>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="!mt-0 !h-8 !border-0 border-b border-gray-200 focus:ring-0 rounded-none px-0"
                  />
                </div>
                <div className="flex items-center">
                  <strong className="w-32 text-gray-800">Email:</strong>
                  <Input
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="!mt-0 !h-8 !border-0 border-b border-gray-200 focus:ring-0 rounded-none px-0"
                  />
                </div>
                <div className="space-y-4 pt-4 border-t border-gray-50">
                  <h6 className="text-xs font-bold text-gray-400 uppercase">Endereço Detalhado</h6>
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="CEP" name="cep" value={formData.address.cep} onChange={handleChange} />
                    <Input label="Número" name="number" value={formData.address.number} onChange={handleChange} />
                  </div>
                  <Input label="Rua" name="street" value={formData.address.street} onChange={handleChange} />
                  <Input label="Bairro" name="district" value={formData.address.district} onChange={handleChange} />
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Cidade" name="city" value={formData.address.city} onChange={handleChange} />
                    <Input label="Estado (UF)" name="state" value={formData.address.state} onChange={handleChange} />
                  </div>
                </div>

                <div className="space-y-4 pt-6 mt-6 border-t border-gray-50">
                  <h6 className="text-xs font-bold text-gray-400 uppercase">Redes Sociais</h6>
                  <div className="flex items-center gap-3">
                    <Facebook size={18} className="text-blue-600" />
                    <Input
                      name="facebook"
                      placeholder="Link do Facebook"
                      value={formData.socialLinks.facebook}
                      onChange={handleChange}
                      className="!mt-0 flex-grow"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <Instagram size={18} className="text-pink-600" />
                    <Input
                      name="instagram"
                      placeholder="Link do Instagram"
                      value={formData.socialLinks.instagram}
                      onChange={handleChange}
                      className="!mt-0 flex-grow"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <Linkedin size={18} className="text-blue-700" />
                    <Input
                      name="linkedin"
                      placeholder="Link do LinkedIn"
                      value={formData.socialLinks.linkedin}
                      onChange={handleChange}
                      className="!mt-0 flex-grow"
                    />
                  </div>
                </div>
              </div>

                {/* Logistics Section */}
                <div className="space-y-4 pt-6 mt-2 border-t border-gray-50">
                  <h6 className="text-xs font-bold text-gray-400 uppercase">Logística de Atendimento</h6>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Raio de Atendimento (km)</label>
                      <input
                        type="number" min={1} max={500}
                        value={formData.coverage_radius_km}
                        onChange={e => setFormData(prev => ({ ...prev, coverage_radius_km: parseInt(e.target.value) || 30 }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Bairros Atendidos</label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={neighborhoodInput}
                        onChange={e => setNeighborhoodInput(e.target.value)}
                        onKeyDown={e => {
                          if ((e.key === 'Enter' || e.key === ',') && neighborhoodInput.trim()) {
                            e.preventDefault();
                            const val = neighborhoodInput.trim().replace(/,$/, '');
                            if (val && !formData.coverage_neighborhoods.includes(val)) {
                              setFormData(prev => ({ ...prev, coverage_neighborhoods: [...prev.coverage_neighborhoods, val] }));
                            }
                            setNeighborhoodInput('');
                          }
                        }}
                        placeholder="Digite e pressione Enter"
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                      />
                    </div>
                    {formData.coverage_neighborhoods.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {formData.coverage_neighborhoods.map(nb => (
                          <span key={nb} className="inline-flex items-center gap-1 bg-brand-primary/10 text-brand-primary text-xs font-medium px-2 py-1 rounded-full">
                            {nb}
                            <button
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, coverage_neighborhoods: prev.coverage_neighborhoods.filter(n => n !== nb) }))}
                              className="hover:text-red-500 transition-colors ml-0.5"
                            >×</button>
                          </span>
                        ))}
                      </div>
                    )}
                    {formData.coverage_neighborhoods.length === 0 && (
                      <p className="text-xs text-gray-400">Nenhum bairro adicionado. Deixe em branco para atender toda a cidade.</p>
                    )}
                  </div>
                </div>

                {/* Terms & Policies Section */}
                <div className="space-y-3 pt-6 mt-2 border-t border-gray-50">
                  <h6 className="text-xs font-bold text-gray-400 uppercase">Termos e Políticas Próprios</h6>
                  <textarea
                    rows={5}
                    maxLength={3000}
                    value={formData.terms_and_policies}
                    onChange={e => setFormData(prev => ({ ...prev, terms_and_policies: e.target.value }))}
                    placeholder="Descreva suas regras de cancelamento, garantias e condições especiais de atendimento..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary resize-none"
                  />
                  <p className="text-xs text-gray-400 text-right">{formData.terms_and_policies.length}/3000</p>
                </div>

              <div className="flex justify-end pt-4">
                <Button onClick={saveProfile} isLoading={loading} size="sm">
                  Salvar Alterações
                </Button>
              </div>
            </div>
          </div>

          {/* 3. Conversations */}
          <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h6 className="text-lg font-bold text-gray-800">Conversas Recentes</h6>
              <Link to={`/dashboard/empresa/${company.slug}/mensagens`} className="text-xs font-bold text-brand-primary uppercase hover:underline">
                Ver Todas
              </Link>
            </div>

            <div className="space-y-4 flex-grow">
              {loadingThreads ? (
                <div className="space-y-4">
                  <LoadingSkeleton className="h-12 w-full rounded-lg" />
                  <LoadingSkeleton className="h-12 w-full rounded-lg" />
                  <LoadingSkeleton className="h-12 w-full rounded-lg" />
                </div>
              ) : threads.length === 0 ? (
                <div className="text-center text-gray-500 text-sm py-8">
                  Nenhuma conversa encontrada.
                </div>
              ) : (
                threads.map((thread, i) => (
                  <div key={thread.threadId || i} className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-xl flex items-center justify-center text-gray-500 font-bold overflow-hidden flex-shrink-0">
                        {thread.partnerAvatar ? (
                          <img src={thread.partnerAvatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          thread.partnerName?.charAt(0) || 'U'
                        )}
                      </div>
                      <div className="min-w-0">
                        <h6 className="text-sm font-bold text-gray-800 truncate">{thread.partnerName}</h6>
                        <p className="text-xs text-gray-500 truncate max-w-[150px] sm:max-w-xs">{thread.lastMessage}</p>
                      </div>
                    </div>
                    <Link to={`/dashboard/empresa/${company.slug}/mensagens`} className="text-xs font-bold text-brand-primary uppercase whitespace-nowrap ml-2">Responder</Link>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Projects Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mt-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h6 className="text-lg font-bold text-gray-800">Projetos</h6>
              <p className="text-sm text-gray-500">Seus trabalhos recentes</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => window.location.href = '/dashboard/portfolio'}>
              Ver Tudo
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portfolioItems.length > 0 ? portfolioItems.map((item, idx) => (
              <div key={item.id} className="group relative rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-gray-100">
                <div className="h-48 overflow-hidden">
                  <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <div className="text-white">
                      <h5 className="font-bold text-lg mb-1">{item.title}</h5>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-white">
                  <p className="text-xs text-brand-primary font-bold uppercase mb-1">Projeto #{idx + 1}</p>
                  <h5 className="text-xl font-bold text-gray-800 mb-2">{item.title}</h5>
                  <p className="text-sm text-gray-500 line-clamp-2">{item.description || "Sem descrição."}</p>
                  <div className="mt-4 flex justify-between items-center">
                    <Button size="sm" variant="outline" className="text-xs">Editar</Button>
                    <div className="flex -space-x-2">
                      <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-200" title="Visualizador 1"></div>
                      <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-300" title="Visualizador 2"></div>
                      <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-400" title="Visualizador 3"></div>
                    </div>
                  </div>
                </div>
              </div>
            )) : (
              <div className="col-span-full py-12 text-center border-2 border-dashed border-gray-200 rounded-xl">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                  <Camera size={32} />
                </div>
                <h5 className="text-lg font-medium text-gray-900">Sem projetos ainda</h5>
                <p className="text-gray-500 mb-4">Adicione itens ao seu portfólio para exibi-los aqui.</p>
                <Button onClick={() => window.location.href = '/dashboard/portfolio'}>
                  Adicionar ao Portfólio
                </Button>
              </div>
            )}

            {/* Plus Card for adding new project (Visual sweetener) */}
            {portfolioItems.length > 0 && (
              <div className="rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center p-6 text-gray-400 hover:border-brand-primary hover:text-brand-primary cursor-pointer transition-colors" onClick={() => window.location.href = '/dashboard/portfolio'}>
                <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3 group-hover:bg-brand-primary/10 transition-colors">
                  <span className="text-2xl font-light">+</span>
                </div>
                <span className="font-medium">Criar Novo Projeto</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default DashboardPerfilPage;
