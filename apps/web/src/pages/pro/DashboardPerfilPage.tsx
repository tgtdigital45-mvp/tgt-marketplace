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
  Instagram
} from 'lucide-react';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';

import { CompanyData } from '@/contexts/CompanyContext';
import { DbPortfolioItem } from '@tgt/shared';

// --- Components for Purity UI Profile ---

const ProfileHeaderCard = ({ company, onAvatarChange, uploading }: { company: CompanyData | null, onAvatarChange: (file: File) => void, uploading: boolean }) => {
  return (
    <div className="relative flex flex-col min-w-0 break-words bg-white w-full mb-6 shadow-xl rounded-2xl p-4">
      <div className="px-6">
        <div className="flex flex-wrap justify-center">
          <div className="w-full lg:w-3/12 px-4 lg:order-2 flex justify-center">
            <div className="relative">
              <div className="w-24 h-24 sm:w-36 sm:h-36 relative -mt-16 border-4 border-white rounded-2xl shadow-lg overflow-hidden bg-white">
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
                <span className="text-sm text-gray-400">Amigos</span>
              </div>
              <div className="mr-4 p-3 text-center">
                <span className="text-xl font-bold block uppercase tracking-wide text-gray-700">10</span>
                <span className="text-sm text-gray-400">Fotos</span>
              </div>
              <div className="lg:mr-4 p-3 text-center">
                <span className="text-xl font-bold block uppercase tracking-wide text-gray-700">89</span>
                <span className="text-sm text-gray-400">Comentários</span>
              </div>
            </div>
          </div>
        </div>
        <div className="text-center mt-4">
          <h3 className="text-2xl font-bold leading-normal mb-1 text-gray-800">
            {company?.company_name || 'Nome da Empresa'}
          </h3>
          <div className="text-sm leading-normal mt-0 mb-2 text-gray-400 font-bold uppercase">
            <i className="fas fa-map-marker-alt mr-2 text-lg text-gray-400"></i>
            {company?.address?.city}, {company?.address?.state || 'Brasil'}
          </div>
          <div className="mb-2 text-gray-600 mt-4">
            <i className="fas fa-briefcase mr-2 text-lg text-gray-400"></i>
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
    }
  });

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
    if (company) {
      setFormData({
        companyName: company.company_name || '',
        legalName: company.legal_name || '',
        phone: company.phone || '',
        website: company.website || '',
        category: company.category || '',
        description: company.description || '',
        email: company.email || '',
        address: company.address || { cep: '', street: '', number: '', district: '', city: '', state: '' }
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

  if (!company) return <LoadingSkeleton className="h-96" />;

  return (
    <div className="relative w-full min-h-screen">
      {/* Background Gradient Header */}
      <div className="absolute top-0 w-full h-80 bg-gradient-to-r from-teal-400 to-brand-primary rounded-xl" style={{ zIndex: 0 }}></div>

      <div className="relative px-4 md:px-10 mx-auto w-full pt-20" style={{ zIndex: 1 }}>

        {/* Profile Card Overlay */}
        <ProfileHeaderCard company={company} onAvatarChange={uploadAvatar} uploading={loading} />

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
                <div className="flex items-center">
                  <strong className="w-32 text-gray-800">Localização:</strong>
                  <span className="text-gray-500">{formData.address.city || 'Cidade'}, {formData.address.state || 'UF'}</span>
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <strong className="text-gray-800">Social:</strong>
                  <a href="#" className="text-blue-600 hover:text-blue-800"><Facebook size={18} /></a>
                  <a href="#" className="text-sky-500 hover:text-sky-700"><Twitter size={18} /></a>
                  <a href="#" className="text-pink-600 hover:text-pink-800"><Instagram size={18} /></a>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={saveProfile} isLoading={loading} size="sm">
                  Salvar Alterações
                </Button>
              </div>
            </div>
          </div>

          {/* 3. Conversations (Mock) */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h6 className="text-lg font-bold text-gray-800 mb-4">Conversas</h6>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <img src={`https://i.pravatar.cc/150?u=${i}`} alt="Avatar" className="w-10 h-10 rounded-xl" />
                    <div>
                      <h6 className="text-sm font-bold text-gray-800">Usuario {i}</h6>
                      <p className="text-xs text-gray-500">Olá! Preciso de mais infor...</p>
                    </div>
                  </div>
                  <button className="text-xs font-bold text-brand-primary uppercase">Responder</button>
                </div>
              ))}
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
