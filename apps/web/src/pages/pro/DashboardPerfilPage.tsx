import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useCompany, CompanyData } from '@/contexts/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { supabase } from '@tgt/shared';
import { CATEGORIES } from '@/constants';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import OptimizedImage from '@/components/ui/OptimizedImage';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import { PortfolioItem } from '@tgt/shared';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getCoordinatesFromAddress } from '@/utils/geocoding';
import { coordsToH3 } from '@/utils/h3Utils';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Camera,
  Edit3,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Save,
  Eye,
  Sparkles,
  Instagram,
  Facebook,
  Linkedin,
  FileText,
  Truck,
  User,
  X,
  ChevronRight,
  Image as ImageIcon,
  Plus,
  Shield,
  Loader2,
} from 'lucide-react';
import { gemini } from '@/utils/gemini';

// ─── Profile Completion Calculator ──────────────────────────────────────────────
const calculateCompletion = (company: CompanyData | null, formData: FormState): number => {
  if (!company) return 0;
  const checks = [
    !!formData.companyName,
    !!company.logo_url,
    !!company.cover_image_url,
    !!formData.description && formData.description.length > 20,
    !!formData.phone,
    !!formData.email,
    !!formData.category,
    !!formData.website,
    !!formData.address.street && !!formData.address.city,
    !!(formData.socialLinks.instagram || formData.socialLinks.facebook || formData.socialLinks.linkedin),
    !!formData.terms_and_policies && formData.terms_and_policies.length > 10,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
};

// ─── Types ──────────────────────────────────────────────────────────────────────
interface FormState {
  companyName: string;
  legalName: string;
  phone: string;
  website: string;
  category: string;
  description: string;
  email: string;
  address: {
    cep: string;
    street: string;
    number: string;
    district: string;
    city: string;
    state: string;
  };
  socialLinks: {
    facebook: string;
    instagram: string;
    linkedin: string;
  };
  coverage_radius_km: number;
  coverage_neighborhoods: string[];
  terms_and_policies: string;
}

type TabKey = 'dados' | 'endereco' | 'termos';

const TABS: { key: TabKey; label: string; icon: React.ReactNode; description: string }[] = [
  { key: 'dados', label: 'Dados Basicos', icon: <User size={16} />, description: 'Informacoes principais da empresa' },
  { key: 'endereco', label: 'Endereco & Logistica', icon: <Truck size={16} />, description: 'Localizacao e area de atendimento' },
  { key: 'termos', label: 'Termos & Politicas', icon: <FileText size={16} />, description: 'Regras e condicoes do servico' },
];

const initialFormState: FormState = {
  companyName: '',
  legalName: '',
  phone: '',
  website: '',
  category: '',
  description: '',
  email: '',
  address: { cep: '', street: '', number: '', district: '', city: '', state: '' },
  socialLinks: { facebook: '', instagram: '', linkedin: '' },
  coverage_radius_km: 30,
  coverage_neighborhoods: [],
  terms_and_policies: '',
};

// ─── Completion Progress Bar ────────────────────────────────────────────────────
const CompletionBar = ({ percentage }: { percentage: number }) => {
  const color = percentage === 100 ? 'bg-emerald-500' : percentage >= 70 ? 'bg-primary-500' : percentage >= 40 ? 'bg-amber-500' : 'bg-red-400';
  const label = percentage === 100
    ? 'Perfil completo! Voce esta pronto para receber clientes.'
    : percentage >= 70
      ? 'Quase la! Complete os campos restantes para aumentar sua visibilidade.'
      : percentage >= 40
        ? 'Bom comeco. Perfis completos recebem 3x mais contatos.'
        : 'Seu perfil precisa de atencao. Preencha os campos para aparecer nas buscas.';

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4 }}
      className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-sm"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {percentage === 100 ? (
            <CheckCircle2 size={16} className="text-emerald-500" />
          ) : (
            <AlertCircle size={16} className="text-amber-500" />
          )}
          <span className="text-xs sm:text-sm font-bold text-gray-700">
            Perfil {percentage}% completo
          </span>
        </div>
        <span className="text-[10px] sm:text-xs text-gray-400 font-medium hidden sm:block">
          {percentage === 100 ? 'Excelente!' : `${Math.round((100 - percentage) / (100 / 11))} campos restantes`}
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.4 }}
        />
      </div>
      <p className="text-[10px] sm:text-xs text-gray-400 mt-2 leading-relaxed">{label}</p>
    </motion.div>
  );
};

// ─── Profile Header Card ────────────────────────────────────────────────────────
const ProfileHeaderCard = ({
  company,
  completion,
  onAvatarChange,
  onCoverChange,
  uploading,
}: {
  company: CompanyData;
  completion: number;
  onAvatarChange: (file: File) => void;
  onCoverChange: (file: File) => void;
  uploading: boolean;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="relative bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm"
    >
      {/* Cover Image */}
      <div className="relative h-40 sm:h-52 lg:h-60 w-full bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 overflow-hidden">
        {company.cover_image_url ? (
          <OptimizedImage
            src={company.cover_image_url}
            alt="Cover"
            className="w-full h-full object-cover"
            optimizedWidth={1200}
          />
        ) : (
          <>
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImEiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCBmaWxsPSJ1cmwoI2EpIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIi8+PC9zdmc+')] opacity-60" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white/60">
                <ImageIcon size={32} className="mx-auto mb-2" />
                <p className="text-xs font-medium">Adicione uma imagem de capa</p>
              </div>
            </div>
          </>
        )}

        {/* Cover Upload Button */}
        <label
          htmlFor="cover-upload"
          className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-xl cursor-pointer hover:bg-white shadow-lg transition-all flex items-center gap-2 text-[10px] sm:text-xs font-bold text-gray-700 group"
        >
          <Camera size={14} className="text-primary-500 group-hover:scale-110 transition-transform" />
          <span className="hidden sm:inline">Alterar Capa</span>
          <span className="sm:hidden">Capa</span>
          <input
            type="file"
            id="cover-upload"
            className="hidden"
            accept="image/*"
            onChange={(e) => e.target.files && onCoverChange(e.target.files[0])}
            disabled={uploading}
          />
        </label>

        {/* Completion Badge */}
        <div className="absolute top-3 left-3 sm:top-4 sm:left-4">
          <div className={`px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold backdrop-blur-sm ${completion === 100
            ? 'bg-emerald-500/90 text-white'
            : 'bg-white/90 text-gray-700'
            }`}>
            {completion === 100 ? (
              <span className="flex items-center gap-1"><CheckCircle2 size={12} /> Perfil Verificado</span>
            ) : (
              <span className="flex items-center gap-1"><Sparkles size={12} className="text-primary-500" /> {completion}% completo</span>
            )}
          </div>
        </div>
      </div>

      {/* Profile Info Section */}
      <div className="px-4 sm:px-6 lg:px-8 pb-5 sm:pb-6">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10 sm:-mt-12">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-4 border-white shadow-lg overflow-hidden bg-white">
              <OptimizedImage
                alt={company.company_name}
                src={company.logo_url}
                fallbackSrc="https://via.placeholder.com/150"
                className="w-full h-full object-cover"
                optimizedWidth={200}
              />
            </div>
            <label
              htmlFor="avatar-upload"
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary-500 text-white rounded-lg flex items-center justify-center cursor-pointer hover:bg-primary-600 shadow-md transition-all hover:scale-110"
            >
              <Edit3 size={12} />
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

          {/* Company Info + CTA */}
          <div className="flex-grow flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 min-w-0">
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">
                {company.company_name || 'Nome da Empresa'}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                {company.category && (
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <Building2 size={12} className="text-primary-400" />
                    {company.category}
                  </span>
                )}
                {company.address?.city && (
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <MapPin size={12} className="text-primary-400" />
                    {company.address.city}, {company.address.state || 'PR'}
                  </span>
                )}
                {company.status === 'active' && (
                  <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Online
                  </span>
                )}
              </div>
            </div>

            <Link
              to={`/empresa/${company.slug}`}
              target="_blank"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-xs font-bold rounded-xl hover:bg-gray-800 transition-all hover:shadow-lg hover:-translate-y-0.5 flex-shrink-0"
            >
              <Eye size={14} />
              Ver Perfil Publico
              <ExternalLink size={12} />
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ─── Tab Navigation ─────────────────────────────────────────────────────────────
const TabNavigation = ({ activeTab, onChange }: { activeTab: TabKey; onChange: (tab: TabKey) => void }) => (
  <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
    {TABS.map((tab) => (
      <button
        key={tab.key}
        onClick={() => onChange(tab.key)}
        className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-2.5 sm:py-3 rounded-lg text-[11px] sm:text-xs font-bold transition-all ${activeTab === tab.key
          ? 'bg-white text-gray-900 shadow-sm'
          : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
          }`}
      >
        <span className={activeTab === tab.key ? 'text-primary-500' : ''}>{tab.icon}</span>
        <span className="hidden sm:inline">{tab.label}</span>
        <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
      </button>
    ))}
  </div>
);

// ─── Form Section Wrapper ───────────────────────────────────────────────────────
const FormSection = ({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) => (
  <div className="space-y-4">
    <div>
      <h3 className="text-sm font-bold text-gray-800">{title}</h3>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
    {children}
  </div>
);

// ─── Sticky Save Bar ────────────────────────────────────────────────────────────
const StickySaveBar = ({
  hasChanges,
  saving,
  onSave,
  onDiscard,
}: {
  hasChanges: boolean;
  saving: boolean;
  onSave: () => void;
  onDiscard: () => void;
}) => (
  <AnimatePresence>
    {hasChanges && (
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-50 lg:left-64 xl:left-72"
      >
        <div className="bg-white/95 backdrop-blur-xl border-t border-gray-200 shadow-[0_-8px_32px_rgba(0,0,0,0.08)] px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium text-gray-600 truncate">
                Voce tem alteracoes nao salvas
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <button
                onClick={onDiscard}
                className="px-3 sm:px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
              >
                Descartar
              </button>
              <Button
                onClick={onSave}
                isLoading={saving}
                size="sm"
                className="!rounded-xl"
              >
                <Save size={14} className="mr-1.5" />
                Salvar Perfil
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);


// ═════════════════════════════════════════════════════════════════════════════════
// ─── MAIN PAGE COMPONENT ────────────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════════

const DashboardPerfilPage: React.FC = () => {
  const { company, isLoading: companyLoading, refreshCompany } = useCompany();
  const { user } = useAuth();
  const { addToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('dados');
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [neighborhoodInput, setNeighborhoodInput] = useState('');
  const [improvingBio, setImprovingBio] = useState(false);

  // ─── Form State ─────────────────────────────────────────────────────────────
  const [formData, setFormData] = useState<FormState>(initialFormState);
  const [initialSnapshot, setInitialSnapshot] = useState<string>('');

  // ─── Populate form from company data ────────────────────────────────────────
  useEffect(() => {
    if (company) {
      const data: FormState = {
        companyName: company.company_name || '',
        legalName: company.legal_name || '',
        phone: company.phone || '',
        website: company.website || '',
        category: company.category || '',
        description: company.description || '',
        email: company.email || '',
        address: {
          cep: company.address?.cep || '',
          street: company.address?.street || '',
          number: company.address?.number || '',
          district: company.address?.district || '',
          city: company.address?.city || '',
          state: company.address?.state || '',
        },
        socialLinks: (company as any).social_links || { facebook: '', instagram: '', linkedin: '' },
        coverage_radius_km: (company as any).coverage_radius_km ?? 30,
        coverage_neighborhoods: (company as any).coverage_neighborhoods || [],
        terms_and_policies: (company as any).terms_and_policies || '',
      };
      setFormData(data);
      setInitialSnapshot(JSON.stringify(data));
      fetchPortfolio();
    }
  }, [company]);

  // ─── Unsaved changes detection ──────────────────────────────────────────────
  const hasChanges = useMemo(() => {
    if (!initialSnapshot) return false;
    return JSON.stringify(formData) !== initialSnapshot;
  }, [formData, initialSnapshot]);

  // ─── Profile Completion ─────────────────────────────────────────────────────
  const completion = useMemo(() => calculateCompletion(company, formData), [company, formData]);

  // ─── Category options ───────────────────────────────────────────────────────
  const categoryOptions = useMemo(() => {
    return CATEGORIES.map((cat: any) => ({
      label: typeof cat === 'string' ? cat : cat.name,
      value: typeof cat === 'string' ? cat : cat.name,
    }));
  }, []);

  // ─── Fetch portfolio ───────────────────────────────────────────────────────
  const fetchPortfolio = async () => {
    if (!company?.id) return;
    const { data } = await supabase
      .from('portfolio_items')
      .select('*')
      .eq('company_id', company.id)
      .order('created_at', { ascending: false })
      .limit(4);
    setPortfolioItems(data || []);
  };

  // ─── Form handlers ─────────────────────────────────────────────────────────
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (['street', 'number', 'district', 'city', 'state', 'cep'].includes(name)) {
      setFormData(prev => ({ ...prev, address: { ...prev.address, [name]: value } }));
    } else if (['facebook', 'instagram', 'linkedin'].includes(name)) {
      setFormData(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, [name]: value } }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  }, []);

  const handleCategoryChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, category: value }));
  }, []);

  const handleDiscard = useCallback(() => {
    if (initialSnapshot) {
      setFormData(JSON.parse(initialSnapshot));
    }
  }, [initialSnapshot]);

  const addNeighborhood = useCallback(() => {
    const val = neighborhoodInput.trim().replace(/,$/, '');
    if (val && !formData.coverage_neighborhoods.includes(val)) {
      setFormData(prev => ({ ...prev, coverage_neighborhoods: [...prev.coverage_neighborhoods, val] }));
    }
    setNeighborhoodInput('');
  }, [neighborhoodInput, formData.coverage_neighborhoods]);

  const removeNeighborhood = useCallback((nb: string) => {
    setFormData(prev => ({
      ...prev,
      coverage_neighborhoods: prev.coverage_neighborhoods.filter(n => n !== nb),
    }));
  }, []);

  // ─── Upload avatar ─────────────────────────────────────────────────────────
  const uploadAvatar = async (file: File) => {
    try {
      setUploading(true);
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
      setUploading(false);
    }
  };

  // ─── Upload cover ──────────────────────────────────────────────────────────
  const uploadCover = async (file: File) => {
    try {
      setUploading(true);
      const img = new Image();
      img.src = URL.createObjectURL(file);
      await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; });
      if (img.width > 3000 || img.height > 1080) {
        throw new Error(`Imagem muito grande (${img.width}x${img.height}). Maximo: 3000x1080px.`);
      }
      const path = `${company?.id}/cover-${Date.now()}`;
      const { error } = await supabase.storage.from('company-assets').upload(path, file, { upsert: true });
      if (error) {
        if (error.message.includes('Bucket not found')) {
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
      setUploading(false);
    }
  };

  // ─── Save profile ──────────────────────────────────────────────────────────
  const saveProfile = async () => {
    try {
      setSaving(true);

      let h3Index = company?.h3_index;
      let lat = company?.address?.latitude;
      let lng = company?.address?.longitude;

      try {
        const coordinates = await getCoordinatesFromAddress(
          formData.address.street,
          formData.address.number,
          formData.address.district,
          formData.address.city,
          formData.address.state
        );
        if (coordinates) {
          lat = coordinates.lat;
          lng = coordinates.lng;
          h3Index = coordsToH3(lat, lng);
        }
      } catch (err) {
        console.error('Geocoding failed:', err);
      }

      const { error } = await supabase.from('companies').update({
        company_name: formData.companyName,
        legal_name: formData.legalName,
        phone: formData.phone,
        website: formData.website,
        category: formData.category,
        description: formData.description,
        email: formData.email,
        address: { ...formData.address, latitude: lat, longitude: lng },
        h3_index: h3Index,
        social_links: formData.socialLinks,
        coverage_radius_km: formData.coverage_radius_km,
        coverage_neighborhoods: formData.coverage_neighborhoods,
        terms_and_policies: formData.terms_and_policies,
      }).eq('id', company?.id);

      if (error) throw error;
      await supabase.auth.updateUser({ data: { name: formData.companyName } });
      refreshCompany();
      setInitialSnapshot(JSON.stringify(formData));
      addToast('Perfil salvo com sucesso!', 'success');
    } catch (err) {
      console.error(err);
      addToast('Erro ao salvar perfil.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleImproveBio = async () => {
    if (!formData.description || formData.description.length < 20) {
      addToast('Escreva uma bio com pelo menos 20 caracteres para que eu possa melhorar.', 'error');
      return;
    }
    try {
      setImprovingBio(true);
      const improvedBio = await gemini.improveBio(formData.description);
      setFormData(prev => ({ ...prev, description: improvedBio }));
      addToast('Bio otimizada para vendas com sucesso!', 'success');
    } catch (err: any) {
      addToast(err.message || 'Erro ao otimizar bio.', 'error');
    } finally {
      setImprovingBio(false);
    }
  };

  // ─── Loading State ─────────────────────────────────────────────────────────
  if (companyLoading || !company) {
    return (
      <div className="space-y-4 max-w-5xl mx-auto">
        <LoadingSkeleton className="h-10 w-64 rounded-xl" />
        <LoadingSkeleton className="h-16 rounded-2xl" />
        <LoadingSkeleton className="h-64 rounded-2xl" />
        <LoadingSkeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-28 space-y-5 sm:space-y-6">

      {/* ─── Page Header ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
      >
        <div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
            <span>Dashboard</span>
            <ChevronRight size={12} />
            <span className="text-gray-600 font-medium">Meu Perfil</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Editar Perfil
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${company.current_plan_tier === 'agency'
            ? 'bg-amber-50 text-amber-700 border border-amber-200'
            : company.current_plan_tier === 'pro'
              ? 'bg-primary-50 text-primary-700 border border-primary-200'
              : 'bg-gray-50 text-gray-600 border border-gray-200'
            }`}>
            <Shield size={10} />
            Plano {company.current_plan_tier || 'Starter'}
          </span>
        </div>
      </motion.div>

      {/* ─── Completion Bar ──────────────────────────────────────────────────── */}
      <CompletionBar percentage={completion} />

      {/* ─── Profile Header Card ─────────────────────────────────────────────── */}
      <ProfileHeaderCard
        company={company}
        completion={completion}
        onAvatarChange={uploadAvatar}
        onCoverChange={uploadCover}
        uploading={uploading}
      />

      {/* ─── Tab Navigation ──────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <TabNavigation activeTab={activeTab} onChange={setActiveTab} />
      </motion.div>

      {/* ─── Tab Content ─────────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.25 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 lg:p-8"
        >
          {/* ═══ Tab: Dados Basicos ═══ */}
          {activeTab === 'dados' && (
            <div className="space-y-8">
              {/* Identity */}
              <FormSection
                title="Identificacao da Empresa"
                subtitle="Como sua empresa aparece para os clientes"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Nome Fantasia"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    placeholder="Ex: Studio Digital Cascavel"
                  />
                  <Input
                    label="Razao Social"
                    name="legalName"
                    value={formData.legalName}
                    onChange={handleChange}
                    placeholder="Ex: Studio Digital LTDA"
                    helperText="Usado apenas internamente"
                  />
                </div>
                <Select
                  label="Categoria Principal"
                  value={formData.category}
                  onChange={handleCategoryChange}
                  options={categoryOptions}
                  placeholder="Selecione sua area de atuacao"
                />
              </FormSection>

              {/* Description */}
              <FormSection
                title="Descricao do Negocio"
                subtitle="Conte aos clientes o que torna sua empresa unica. Seja especifico e destaque seus diferenciais."
              >
                <div className="relative">
                  <div className="absolute right-0 -top-8">
                    <button
                      type="button"
                      onClick={handleImproveBio}
                      disabled={improvingBio}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-700 rounded-xl text-[10px] font-bold hover:bg-primary-100 transition-all disabled:opacity-50 border border-primary-100 shadow-sm"
                    >
                      {improvingBio ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Sparkles size={12} className="text-primary-500" />
                      )}
                      {improvingBio ? 'Otimizando...' : 'Turbinar Bio com IA'}
                    </button>
                  </div>
                  <textarea
                    name="description"
                    rows={5}
                    maxLength={1000}
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Descreva seus servicos, experiencia, diferenciais competitivos e por que clientes devem escolher sua empresa..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none"
                  />
                  <span className="absolute bottom-3 right-3 text-[10px] text-gray-300">
                    {formData.description.length}/1000
                  </span>
                </div>
              </FormSection>

              {/* Contact */}
              <FormSection
                title="Informacoes de Contato"
                subtitle="Como os clientes entram em contato com voce"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Telefone / WhatsApp"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="(45) 99999-0000"
                  />
                  <Input
                    label="E-mail Comercial"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="contato@suaempresa.com"
                  />
                </div>
                <Input
                  label="Website"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="https://www.suaempresa.com.br"
                />
              </FormSection>

              {/* Social Links */}
              <FormSection
                title="Redes Sociais"
                subtitle="Ajudam a construir credibilidade e confianca"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center text-white flex-shrink-0">
                      <Instagram size={16} />
                    </div>
                    <Input
                      name="instagram"
                      placeholder="https://instagram.com/suaempresa"
                      value={formData.socialLinks.instagram}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white flex-shrink-0">
                      <Facebook size={16} />
                    </div>
                    <Input
                      name="facebook"
                      placeholder="https://facebook.com/suaempresa"
                      value={formData.socialLinks.facebook}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-700 flex items-center justify-center text-white flex-shrink-0">
                      <Linkedin size={16} />
                    </div>
                    <Input
                      name="linkedin"
                      placeholder="https://linkedin.com/company/suaempresa"
                      value={formData.socialLinks.linkedin}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </FormSection>
            </div>
          )}

          {/* ═══ Tab: Endereco & Logistica ═══ */}
          {activeTab === 'endereco' && (
            <div className="space-y-8">
              {/* Address */}
              <FormSection
                title="Endereco Comercial"
                subtitle="Usado para calcular distancia ate os clientes e exibir no mapa"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label="CEP"
                    name="cep"
                    value={formData.address.cep}
                    onChange={handleChange}
                    placeholder="85810-000"
                  />
                  <div className="sm:col-span-2">
                    <Input
                      label="Rua / Avenida"
                      name="street"
                      value={formData.address.street}
                      onChange={handleChange}
                      placeholder="Rua Parana"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <Input
                    label="Numero"
                    name="number"
                    value={formData.address.number}
                    onChange={handleChange}
                    placeholder="1234"
                  />
                  <Input
                    label="Bairro"
                    name="district"
                    value={formData.address.district}
                    onChange={handleChange}
                    placeholder="Centro"
                  />
                  <Input
                    label="Cidade"
                    name="city"
                    value={formData.address.city}
                    onChange={handleChange}
                    placeholder="Cascavel"
                  />
                  <Input
                    label="Estado (UF)"
                    name="state"
                    value={formData.address.state}
                    onChange={handleChange}
                    placeholder="PR"
                  />
                </div>
              </FormSection>

              {/* Coverage */}
              <FormSection
                title="Area de Atendimento"
                subtitle="Defina ate onde voce atende. Isso influencia em quais buscas sua empresa aparece."
              >
                <div className="max-w-xs">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Raio de Atendimento (km)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={5}
                      max={300}
                      step={5}
                      value={formData.coverage_radius_km}
                      onChange={e => setFormData(prev => ({ ...prev, coverage_radius_km: parseInt(e.target.value) || 30 }))}
                      className="flex-grow h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-primary-500"
                    />
                    <span className="text-sm font-bold text-gray-700 w-16 text-right tabular-nums">
                      {formData.coverage_radius_km} km
                    </span>
                  </div>
                </div>

                {/* Neighborhoods */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bairros Atendidos
                  </label>
                  <p className="text-xs text-gray-400 mb-2">
                    Opcional. Deixe em branco para atender toda a regiao.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={neighborhoodInput}
                      onChange={e => setNeighborhoodInput(e.target.value)}
                      onKeyDown={e => {
                        if ((e.key === 'Enter' || e.key === ',') && neighborhoodInput.trim()) {
                          e.preventDefault();
                          addNeighborhood();
                        }
                      }}
                      placeholder="Digite o bairro e pressione Enter"
                      className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={addNeighborhood}
                      className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                    >
                      <Plus size={16} className="text-gray-600" />
                    </button>
                  </div>
                  {formData.coverage_neighborhoods.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {formData.coverage_neighborhoods.map(nb => (
                        <span
                          key={nb}
                          className="inline-flex items-center gap-1.5 bg-primary-50 text-primary-700 text-xs font-medium px-3 py-1.5 rounded-full border border-primary-100"
                        >
                          <MapPin size={10} />
                          {nb}
                          <button
                            type="button"
                            onClick={() => removeNeighborhood(nb)}
                            className="hover:text-red-500 transition-colors ml-0.5"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </FormSection>
            </div>
          )}

          {/* ═══ Tab: Termos & Politicas ═══ */}
          {activeTab === 'termos' && (
            <div className="space-y-8">
              <FormSection
                title="Termos e Politicas da Empresa"
                subtitle="Informe suas regras de cancelamento, garantias e condicoes especiais. Isso gera transparencia e evita conflitos."
              >
                <div className="relative">
                  <textarea
                    rows={10}
                    maxLength={3000}
                    value={formData.terms_and_policies}
                    onChange={e => setFormData(prev => ({ ...prev, terms_and_policies: e.target.value }))}
                    placeholder={`Exemplo:\n\n• Cancelamento: Ate 24h antes do servico, sem custo.\n• Garantia: 30 dias para revisoes.\n• Pagamento: 50% na aprovacao, 50% na entrega.\n• Prazos: Definidos em contrato individual.\n• Deslocamento: Incluso no raio de 30km.`}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none leading-relaxed"
                  />
                  <span className="absolute bottom-3 right-3 text-[10px] text-gray-300">
                    {formData.terms_and_policies.length}/3000
                  </span>
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3">
                  <AlertCircle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-700 leading-relaxed">
                    <strong>Dica:</strong> Empresas com termos claros recebem 40% menos disputas e transmitem mais profissionalismo aos clientes.
                  </div>
                </div>
              </FormSection>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* ─── Portfolio Preview ────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 lg:p-8"
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900">Portfolio</h2>
            <p className="text-xs text-gray-400 mt-0.5">Mostre seus melhores trabalhos para atrair mais clientes</p>
          </div>
          <Link
            to={`/dashboard/empresa/${company.slug}/portfolio`}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
          >
            Gerenciar
            <ChevronRight size={14} />
          </Link>
        </div>

        {portfolioItems.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {portfolioItems.map((item) => (
              <div key={item.id} className="group relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-100">
                <OptimizedImage
                  src={item.image_url}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  optimizedWidth={400}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                  <p className="text-white text-xs font-bold truncate">{item.title}</p>
                </div>
              </div>
            ))}
            {/* Add New Card */}
            <Link
              to={`/dashboard/empresa/${company.slug}/portfolio`}
              className="aspect-[4/3] rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:border-primary-300 hover:text-primary-500 transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-gray-50 group-hover:bg-primary-50 flex items-center justify-center mb-2 transition-colors">
                <Plus size={20} />
              </div>
              <span className="text-[10px] sm:text-xs font-medium">Adicionar</span>
            </Link>
          </div>
        ) : (
          <div className="py-10 text-center border-2 border-dashed border-gray-200 rounded-xl">
            <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <Camera size={24} className="text-gray-300" />
            </div>
            <h5 className="text-sm font-bold text-gray-700 mb-1">Sem projetos ainda</h5>
            <p className="text-xs text-gray-400 mb-4 max-w-xs mx-auto">
              Empresas com portfolio recebem ate 5x mais orcamentos. Adicione seus melhores trabalhos.
            </p>
            <Link
              to={`/dashboard/empresa/${company.slug}/portfolio`}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-primary-500 text-white text-xs font-bold rounded-xl hover:bg-primary-600 transition-all hover:shadow-lg"
            >
              <Plus size={14} />
              Adicionar ao Portfolio
            </Link>
          </div>
        )}
      </motion.div>

      {/* ─── Sticky Save Bar ─────────────────────────────────────────────────── */}
      <StickySaveBar
        hasChanges={hasChanges}
        saving={saving}
        onSave={saveProfile}
        onDiscard={handleDiscard}
      />
    </div>
  );
};

export default DashboardPerfilPage;
