import React, { useState } from 'react';
import SEO from '../components/SEO';
import { Link, useNavigate } from 'react-router-dom';
import SocialButton from '../components/ui/SocialButton';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import FileUpload from '../components/FileUpload';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { validateCNPJ, validateCPF } from '../utils/validators';
import { CATEGORIES } from '../constants';
import { supabase } from '../lib/supabase';
import { Store, Briefcase, ChevronRight, Check } from 'lucide-react';
import { getCoordinatesFromAddress } from '../utils/geocoding';
import { coordsToH3 } from '../utils/h3Utils';

const CompanyRegistrationPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Guard: If user is already logged in and has a company, send them to dashboard
  React.useEffect(() => {
    const checkExistingCompany = async () => {
      if (user?.id && user.type === 'company') {
        console.log("[CompanyRegistrationPage] Checking for existing company for user:", user.id);
        const { data } = await supabase
          .from('companies')
          .select('slug')
          .eq('profile_id', user.id)
          .maybeSingle();

        if (data?.slug) {
          console.log("[CompanyRegistrationPage] Company found, redirecting to dashboard:", data.slug);
          navigate(`/dashboard/empresa/${data.slug}`, { replace: true });
        }
      }
    };
    checkExistingCompany();
  }, [user, navigate]);

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    companyName: '',
    legalName: '',
    cnpj: '',
    email: '',
    phone: '',
    website: '',
    category: '',
    description: '',
    street: '',
    number: '',
    district: '',
    city: '',
    state: '',
    cep: '',
    adminName: '',
    adminCpf: '',
    adminEmail: '',
    password: '',
    confirmPassword: '',
    selectedPlan: '' // 'starter' | 'pro' | 'agency'
  });
  const [logo, setLogo] = useState<File | null>(null);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [cnpjDocument, setCnpjDocument] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (setter: React.Dispatch<React.SetStateAction<File | null>>, fieldName: string) => (file: File | null) => {
    setter(file);
    if (file) {
      setErrors(prev => ({ ...prev, [fieldName]: '' }));
    }
  }

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.companyName) newErrors.companyName = 'Campo obrigatório';
    if (!formData.legalName) newErrors.legalName = 'Campo obrigatório';
    if (!validateCNPJ(formData.cnpj)) newErrors.cnpj = 'CNPJ inválido';
    if (!formData.email) newErrors.email = 'Campo obrigatório';
    if (!formData.category) newErrors.category = 'Campo obrigatório';
    if (!logo) newErrors.logo = 'O logo da empresa é obrigatório.';
    if (!coverImage) newErrors.coverImage = 'A imagem de capa é obrigatória.';
    if (!cnpjDocument) newErrors.cnpjDocument = 'Você precisa anexar o documento do CNPJ para ativar o perfil.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.street) newErrors.street = 'Campo obrigatório';
    if (!formData.city) newErrors.city = 'Campo obrigatório';
    if (!formData.state) newErrors.state = 'Campo obrigatório';
    if (!formData.cep) newErrors.cep = 'Campo obrigatório';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validação do passo 3 (Dados de Acesso) - Pular se usuário já estiver logado
  const validateStep3 = () => {
    if (user) return true; // Se já está logado, não precisa validar senha

    const newErrors: Record<string, string> = {};
    if (!formData.adminName) newErrors.adminName = 'Campo obrigatório'; // Este campo pode ser preenchido automaticamente se tivermos o perfil
    if (!validateCPF(formData.adminCpf)) newErrors.adminCpf = 'CPF inválido';
    if (!formData.adminEmail) newErrors.adminEmail = 'Campo obrigatório';
    if (!formData.password || formData.password.length < 6) newErrors.password = 'Senha deve ter no mínimo 6 caracteres';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'As senhas não conferem';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  const validateStep4 = () => {
    if (!formData.selectedPlan) {
      setErrors(prev => ({ ...prev, selectedPlan: 'Por favor, selecione um plano para continuar.' }));
      return false;
    }
    return true;
  }

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    if (step === 2 && validateStep2()) setStep(3);
    if (step === 3 && validateStep3()) setStep(4);
    window.scrollTo(0, 0);
  };

  const handleBack = () => setStep(prev => prev - 1);

  const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const cep = e.target.value.replace(/\D/g, '');
    if (cep.length === 8) {
      try {
        setIsLoading(true);
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();

        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            street: data.logradouro,
            district: data.bairro,
            city: data.localidade,
            state: data.uf
          }));
          setErrors(prev => ({ ...prev, cep: '' }));
        } else {
          setErrors(prev => ({ ...prev, cep: 'CEP não encontrado.' }));
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
        setErrors(prev => ({ ...prev, cep: 'Erro ao buscar CEP.' }));
      } finally {
        setIsLoading(false);
      }
    }
  };

  const uploadFile = async (file: File, bucket: string, path: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${path}/${fileName}`;

    const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();
    if (!validateStep4()) return; // Validação final

    if (isLoading) return; // Prevent double clicks
    setIsLoading(true);

    try {
      let userId = user?.id;
      let authSession = null;

      // 1. Authenticate or Get User
      if (!userId) {
        // Normal Flow: Sign Up
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.adminEmail,
          password: formData.password,
          options: {
            data: {
              name: formData.companyName,
              type: 'company',
              role: 'company',
            }
          }
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error("Erro ao criar usuário.");

        userId = authData.user.id;
        authSession = authData.session;
      } else {
        // Resume Flow: User already logged in (Limbo state)
        console.log("Usuário já autenticado, pulando criação de conta auth:", userId);
        // Opcional: Atualizar metadados se necessário
      }

      if (!userId) throw new Error("Falha ao identificar usuário.");

      // 2. Upload Files
      let logoUrl = '';
      let coverUrl = '';
      let cnpjUrl = '';

      if (logo) logoUrl = await uploadFile(logo, 'logos', userId);
      if (coverImage) coverUrl = await uploadFile(coverImage, 'covers', userId);
      if (cnpjDocument) cnpjUrl = await uploadFile(cnpjDocument, 'documents', userId);

      const slug = formData.companyName
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');

      // 2.5 Geocode Address & Calculate H3
      let h3Index = null;
      let lat = null;
      let lng = null;

      try {
        const coordinates = await getCoordinatesFromAddress(
          formData.street,
          formData.number,
          formData.district,
          formData.city,
          formData.state
        );

        if (coordinates) {
          lat = coordinates.lat;
          lng = coordinates.lng;
          h3Index = coordsToH3(lat, lng);
        }
      } catch (error) {
        console.error("Geocoding failed:", error);
      }

      // 3. Create Company Record
      const { error: dbError } = await supabase.from('companies').insert({
        profile_id: userId,
        slug: slug,
        company_name: formData.companyName,
        legal_name: formData.legalName,
        cnpj: formData.cnpj,
        email: formData.email,
        phone: formData.phone,
        website: formData.website,
        category: formData.category,
        description: formData.description,
        address: {
          street: formData.street,
          number: formData.number,
          district: formData.district,
          city: formData.city,
          state: formData.state,
          cep: formData.cep,
          latitude: lat,
          longitude: lng
        },
        h3_index: h3Index,
        rating: 0,
        total_reviews: 0,
        admin_contact: {
          name: formData.adminName,
          cpf: formData.adminCpf,
          email: formData.adminEmail
        },
        logo_url: logoUrl,
        cover_image_url: coverUrl,
        cnpj_document_url: cnpjUrl,
        status: 'active', // TODO: Maybe 'pending_payment' if plan is paid?
        current_plan_tier: 'starter', // Default to starter until paid, or update webhook to set.
        // For paid plans, we will redirect to checkout.
      });

      addToast('Cadastro realizado! Redirecionando para pagamento...', 'success');

      // 4. Redirect to Stripe Checkout
      // Placeholder IDs - SHOULD be environment variables
      const PRICES = {
        'starter': 'price_1Q...',
        'pro': 'price_1Q...',
        'agency': 'price_1Q...'
      };

      const selectedPriceId = PRICES[formData.selectedPlan as keyof typeof PRICES];

      if (selectedPriceId) {
        // Timeout wrapper for checking out invoke
        const invokeCheckout = async () => {
          const { data, error } = await supabase.functions.invoke('create-subscription-checkout', {
            body: {
              priceId: selectedPriceId,
              userId: userId,
              successUrl: `${window.location.origin}/dashboard`, // Simplified success URL for now
              cancelUrl: `${window.location.origin}/dashboard/empresa/${slug}/assinatura`,
              companyId: null
            }
          });
          return { data, error };
        };

        const { data, error } = await Promise.race([
          invokeCheckout(),
          new Promise<{ data: any, error: any }>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 15000))
        ]).catch(err => ({ data: null, error: err }));

        if (error) {
          console.error('Checkout error:', error);
          // Fallback: successful registration but failed checkout -> Go to dashboard to retry later
          addToast('Empresa criada, mas houve um erro ao iniciar o pagamento. Você pode tentar novamente no painel.', 'warning');
          setTimeout(() => {
            window.location.href = `/dashboard/empresa/${slug}/assinatura`;
          }, 2000);
        } else if (data?.url) {
          window.location.href = data.url;
          return;
        }
      }

      // If free plan or no checkout url (fallback)
      if (authSession || user) {
        // DO NOT Sign out. If session causes issues, it's better to refresh it.
        // await supabase.auth.signOut(); 

        addToast('Cadastro realizado com sucesso!', 'success');

        // Force a specialized redirect to dashboard
        // We use window.location.href to force a full reload and ensure AuthContext picks up the new company
        setTimeout(() => {
          window.location.href = `/dashboard/empresa/${slug}`;
        }, 1000);
        return;
      }

      // Fallback for cases without immediate session (e.g. email confirmation required)
      setTimeout(() => {
        navigate('/login/empresa', { replace: true });
      }, 1500);

    } catch (err) {
      console.error("Registration Error", err);
      const message = err instanceof Error ? err.message : "";
      if (message.includes("User already registered")) {
        addToast('CNPJ/Email já cadastrado.', 'error');
      } else {
        addToast('Erro ao registrar. Tente novamente.', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative bg-gray-50 overflow-hidden">
      <SEO
        title="Cadastro de Empresa | TGT Contratto"
        description="Cadastre sua empresa no TGT Contratto e encontre novos clientes na sua região."
      />

      {/* Background Split */}
      <div className="absolute top-0 w-full h-[40vh] bg-[#004E89] rounded-b-[50px] z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#004E89] to-[#003B66]" />
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23ffffff\" fill-opacity=\"1\"%3E%3Cpath d=\"M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')"
          }}
        />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white tracking-tight">
            Destaque sua Empresa
          </h2>
          <p className="mt-2 text-blue-100">
            Milhares de clientes esperam por profissionais como você.
          </p>
        </div>

        <div className="mx-auto w-full max-w-4xl">
          <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-10 border border-gray-100">

            {/* Account Type Toggle */}
            <div className="max-w-md mx-auto mb-8">
              <div className="bg-gray-100 p-1 rounded-xl flex">
                <Link
                  to="/cadastro/cliente"
                  className="flex-1 flex items-center justify-center py-2 px-4 text-sm font-medium rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all"
                >
                  <Store className="w-4 h-4 mr-2" />
                  Cliente
                </Link>
                <button
                  className="flex-1 flex items-center justify-center py-2 px-4 text-sm font-medium rounded-lg bg-white text-gray-900 shadow-sm transition-all"
                >
                  <Briefcase className="w-4 h-4 mr-2 text-brand-primary" />
                  Empresa
                </button>
              </div>

              <div className="mt-8 text-center">
                <p className="text-sm text-gray-500 mb-4">Cadastre-se com</p>
                <div className="flex justify-center gap-4">
                  <SocialButton
                    provider="facebook"
                    mode="icon"
                    onClick={() => addToast('Login com Facebook em breve!', 'info')}
                    title="Facebook"
                  />
                  <SocialButton
                    provider="apple"
                    mode="icon"
                    onClick={() => addToast('Login com Apple em breve!', 'info')}
                    title="Apple"
                  />
                  <SocialButton
                    provider="google"
                    mode="icon"
                    onClick={() => addToast('Login com Google em breve!', 'info')}
                    title="Google"
                  />
                </div>
                <div className="relative mt-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">ou com e-mail</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-10">
              {/* Custom Stepper */}
              <div className="flex flex-col items-center mb-10 min-h-[80px]">
                <div className="w-full max-w-xs relative mb-4">
                  <div className="absolute left-0 top-1/2 w-full h-1 bg-gray-200 -z-10 rounded"></div>
                  <div
                    className="absolute left-0 top-1/2 h-1 bg-brand-primary -z-10 rounded transition-all duration-300"
                    style={{ width: `${((step - 1) / 3) * 100}%` }} // Adjusted to 3 segments for 4 steps
                  />

                  <div className="flex justify-between w-full">
                    {/* Step 1 */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${step >= 1 ? 'bg-brand-primary text-white ring-4 ring-brand-primary/20' : 'bg-gray-200 text-gray-500'}`}>
                      {step > 1 ? <Check className="w-5 h-5" /> : '1'}
                    </div>
                    {/* Step 2 */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${step >= 2 ? 'bg-brand-primary text-white ring-4 ring-brand-primary/20' : 'bg-gray-200 text-gray-500'}`}>
                      {step > 2 ? <Check className="w-5 h-5" /> : '2'}
                    </div>
                    {/* Step 3 */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${step >= 3 ? 'bg-brand-primary text-white ring-4 ring-brand-primary/20' : 'bg-gray-200 text-gray-500'}`}>
                      {step > 3 ? <Check className="w-5 h-5" /> : '3'}
                    </div>
                    {/* Step 4 */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${step >= 4 ? 'bg-brand-primary text-white ring-4 ring-brand-primary/20' : 'bg-gray-200 text-gray-500'}`}>
                      4
                    </div>
                  </div>
                </div>
                <div className="flex justify-between w-full max-w-xs text-[10px] sm:text-xs font-medium text-gray-500 px-1">
                  <span className={step === 1 ? 'text-brand-primary font-bold' : ''}>Dados</span>
                  <span className={step === 2 ? 'text-brand-primary font-bold' : ''}>Endereço</span>
                  <span className={step === 3 ? 'text-brand-primary font-bold' : ''}>Acesso</span>
                  <span className={step === 4 ? 'text-brand-primary font-bold' : ''}>Plano</span>
                </div>
              </div>

              <form onSubmit={(e) => e.preventDefault()}>
                {step === 1 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right duration-500">
                    <h3 className="text-xl font-bold text-gray-800 border-l-4 border-brand-primary pl-3">Dados da Empresa</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Input label="Nome Fantasia" name="companyName" placeholder="Ex: TGT Soluções" value={formData.companyName} onChange={handleChange} error={errors.companyName} required />
                      <Input label="Razão Social" name="legalName" placeholder="Razão social completa" value={formData.legalName} onChange={handleChange} error={errors.legalName} required />
                      <Input label="CNPJ" name="cnpj" placeholder="00.000.000/0000-00" value={formData.cnpj} onChange={handleChange} error={errors.cnpj} required />
                      <Input label="Email Público" name="email" type="email" placeholder="contato@empresa.com" value={formData.email} onChange={handleChange} error={errors.email} required />
                      <Input label="Telefone" name="phone" type="tel" placeholder="(00) 00000-0000" value={formData.phone} onChange={handleChange} error={errors.phone} />
                      <Input label="Website" name="website" placeholder="www.suaempresa.com.br" value={formData.website} onChange={handleChange} error={errors.website} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                        <select
                          id="category"
                          name="category"
                          value={formData.category}
                          onChange={handleChange}
                          className={`appearance-none block w-full px-3 py-2 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary sm:text-sm ${errors.category ? 'border-red-500' : ''}`}
                        >
                          <option value="">Selecione uma categoria</option>
                          {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                        {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Uploads</label>
                        <div className="text-xs text-gray-500">Prepare seu logo e capa para o próximo passo.</div>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Breve Descrição</label>
                      <textarea
                        id="description"
                        name="description"
                        rows={3}
                        placeholder="Descreva seus serviços e diferenciais..."
                        value={formData.description}
                        onChange={handleChange}
                        className="appearance-none block w-full px-3 py-2 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary sm:text-sm"
                      ></textarea>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Logo</label>
                        <FileUpload id="logo-upload" accept="image/jpeg,image/png" maxSizeMb={5} onFileChange={handleFileChange(setLogo, 'logo')} />
                        {errors.logo && <p className="mt-1 text-xs text-red-500">{errors.logo}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Imagem de Capa</label>
                        <FileUpload id="cover-upload" accept="image/jpeg,image/png" maxSizeMb={10} onFileChange={handleFileChange(setCoverImage, 'coverImage')} />
                        {errors.coverImage && <p className="mt-1 text-xs text-red-500">{errors.coverImage}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Doc. CNPJ (PDF/Img)</label>
                        <FileUpload id="cnpj-upload" accept="application/pdf,image/jpeg,image/png" maxSizeMb={10} onFileChange={handleFileChange(setCnpjDocument, 'cnpjDocument')} />
                        {errors.cnpjDocument && <p className="mt-1 text-xs text-red-500">{errors.cnpjDocument}</p>}
                      </div>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right duration-500">
                    <h3 className="text-xl font-bold text-gray-800 border-l-4 border-brand-primary pl-3">Endereço Comercial</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Input label="CEP" name="cep" placeholder="00000-000" value={formData.cep} onChange={handleChange} onBlur={handleCepBlur} error={errors.cep} required />
                      <Input label="Rua" name="street" value={formData.street} onChange={handleChange} error={errors.street} required />
                      <Input label="Número" name="number" value={formData.number} onChange={handleChange} error={errors.number} />
                      <Input label="Bairro" name="district" value={formData.district} onChange={handleChange} error={errors.district} />
                      <Input label="Cidade" name="city" value={formData.city} onChange={handleChange} error={errors.city} required />
                      <Input label="Estado" name="state" value={formData.state} onChange={handleChange} error={errors.state} required />
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right duration-500">
                    <h3 className="text-xl font-bold text-gray-800 border-l-4 border-brand-primary pl-3">Administrador da Conta</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Input label="Nome do Responsável" name="adminName" placeholder="Nome completo" value={formData.adminName} onChange={handleChange} error={errors.adminName} required />
                      <Input label="CPF do Responsável" name="adminCpf" placeholder="000.000.000-00" value={formData.adminCpf} onChange={handleChange} error={errors.adminCpf} required />
                      <div className="md:col-span-2">
                        <Input label="Email de Login (Admin)" name="adminEmail" type="email" placeholder="Seu email de acesso" value={formData.adminEmail} onChange={handleChange} error={errors.adminEmail} required />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Input label="Senha" name="password" type="password" placeholder="Mínimo 6 caracteres" value={formData.password} onChange={handleChange} error={errors.password} required />
                      <Input label="Confirmar Senha" name="confirmPassword" type="password" placeholder="Repita a senha" value={formData.confirmPassword} onChange={handleChange} error={errors.confirmPassword} required />
                    </div>

                    <div className="flex items-center text-xs text-gray-500 bg-gray-50 p-3 rounded-lg mt-4">
                      <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <div>
                        <p className="font-semibold text-gray-700">Segurança Garantida</p>
                        <p>Seus dados são criptografados e armazenados com segurança.</p>
                      </div>
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right duration-500">
                    <h3 className="text-xl font-bold text-gray-800 border-l-4 border-brand-primary pl-3">Escolha seu Plano</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Selecione o plano ideal para iniciar. Você terá <strong>30 dias grátis</strong> para experimentar.
                    </p>

                    <div className="grid grid-cols-1 gap-4">
                      {/* Starter */}
                      <div
                        className={`relative border-2 rounded-xl p-4 cursor-pointer transition-all ${formData.selectedPlan === 'starter' ? 'border-brand-primary bg-brand-primary/5' : 'border-gray-200 hover:border-brand-primary/50'}`}
                        onClick={() => setFormData(prev => ({ ...prev, selectedPlan: 'starter' }))}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-bold text-gray-900">Starter</h4>
                            <p className="text-sm text-gray-500">Para quem está começando</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">R$ 49,90<span className="text-sm font-normal text-gray-500">/mês</span></p>
                          </div>
                        </div>
                        <ul className="mt-3 space-y-1 text-sm text-gray-600">
                          <li className="flex items-center"><Check className="w-4 h-4 text-green-500 mr-2" /> 20% de Taxa</li>
                          <li className="flex items-center"><Check className="w-4 h-4 text-green-500 mr-2" /> 5 Serviços Ativos</li>
                        </ul>
                        {formData.selectedPlan === 'starter' && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-brand-primary rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>

                      {/* Pro */}
                      <div
                        className={`relative border-2 rounded-xl p-4 cursor-pointer transition-all ${formData.selectedPlan === 'pro' ? 'border-brand-primary bg-brand-primary/5' : 'border-gray-200 hover:border-brand-primary/50'}`}
                        onClick={() => setFormData(prev => ({ ...prev, selectedPlan: 'pro' }))}
                      >
                        <div className="absolute -top-3 left-4 bg-brand-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Recomendado</div>
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-bold text-gray-900">TGT Pro</h4>
                            <p className="text-sm text-gray-500">Mais visibilidade</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">R$ 99,90<span className="text-sm font-normal text-gray-500">/mês</span></p>
                          </div>
                        </div>
                        <ul className="mt-3 space-y-1 text-sm text-gray-600">
                          <li className="flex items-center"><Check className="w-4 h-4 text-green-500 mr-2" /> 12% de Taxa</li>
                          <li className="flex items-center"><Check className="w-4 h-4 text-green-500 mr-2" /> Serviços Ilimitados</li>
                          <li className="flex items-center"><Check className="w-4 h-4 text-green-500 mr-2" /> Selo Verificado</li>
                        </ul>
                        {formData.selectedPlan === 'pro' && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-brand-primary rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>

                      {/* Agency */}
                      <div
                        className={`relative border-2 rounded-xl p-4 cursor-pointer transition-all ${formData.selectedPlan === 'agency' ? 'border-brand-primary bg-brand-primary/5' : 'border-gray-200 hover:border-brand-primary/50'}`}
                        onClick={() => setFormData(prev => ({ ...prev, selectedPlan: 'agency' }))}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-bold text-gray-900">Agency</h4>
                            <p className="text-sm text-gray-500">Para alto volume</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">R$ 299,90<span className="text-sm font-normal text-gray-500">/mês</span></p>
                          </div>
                        </div>
                        <ul className="mt-3 space-y-1 text-sm text-gray-600">
                          <li className="flex items-center"><Check className="w-4 h-4 text-green-500 mr-2" /> 8% de Taxa</li>
                          <li className="flex items-center"><Check className="w-4 h-4 text-green-500 mr-2" /> Multi-usuários e Relatórios</li>
                        </ul>
                        {formData.selectedPlan === 'agency' && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-brand-primary rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                    </div>

                    {errors.selectedPlan && <p className="text-sm text-red-500 font-medium mt-2">{errors.selectedPlan}</p>}
                  </div>
                )}

                <div className="mt-8 flex justify-between items-center border-t border-gray-100 pt-6">
                  {step > 1 ? (
                    <Button type="button" variant="outline" onClick={handleBack}>
                      Voltar
                    </Button>
                  ) : (
                    <div />
                  )}

                  {step < 4 ? (
                    <Button type="button" onClick={handleNext} className="flex items-center">
                      Próximo Passo <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  ) : (
                    <Button type="button" onClick={(e) => handleSubmit(e)} isLoading={isLoading} disabled={isLoading} size="lg" className="px-8 bg-green-600 hover:bg-green-700">
                      {isLoading ? 'Processando...' : 'Finalizar e Ir para Pagamento'}
                    </Button>
                  )}
                </div>
              </form>

              <div className="mt-8 text-center">
                <p className="text-sm text-gray-600">
                  Já tem cadastro?{' '}
                  <Link to="/login/empresa" className="font-bold text-brand-primary hover:text-brand-primary/80">
                    Acessar Minha Conta
                  </Link>
                </p>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyRegistrationPage;
