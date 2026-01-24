import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import FileUpload from '../components/FileUpload';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext'; // Import useAuth
import { validateCNPJ, validateCPF } from '../utils/validators';
import { CATEGORIES } from '../constants';
import { supabase } from '../lib/supabase';

const CompanyRegistrationPage: React.FC = () => {
  const { user } = useAuth(); // Get current user
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
    password: '', // Added password field for auth
    confirmPassword: '',
  });
  const [logo, setLogo] = useState<File | null>(null);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [cnpjDocument, setCnpjDocument] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToast();
  const navigate = useNavigate();

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

  const validateStep3 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.adminName) newErrors.adminName = 'Campo obrigatório';
    if (!validateCPF(formData.adminCpf)) newErrors.adminCpf = 'CPF inválido';
    if (!formData.adminEmail) newErrors.adminEmail = 'Campo obrigatório';
    if (!formData.password || formData.password.length < 6) newErrors.password = 'Senha deve ter no mínimo 6 caracteres';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'As senhas não conferem';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    if (step === 2 && validateStep2()) setStep(3);
  };

  const handleBack = () => setStep(prev => prev - 1);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep3()) return;

    setIsLoading(true);

    try {
      let userId = '';
      // let emailContact = formData.adminEmail;

      if (user) {
        // User is already logged in
        userId = user.id;
        // emailContact = user.email || formData.adminEmail; // Unused

        // Optional: Update user type to 'company' if they were 'client'
        // This depends on business logic. For now, we assume they can own a company.
        const { error: updateError } = await supabase.from('profiles').update({
          user_type: 'company'
        }).eq('id', userId);

        if (updateError) {
          console.error("Error updating profile type:", updateError);
          // Verify if we should stop or continue. Continuing for now.
        }

      } else {
        // 1. Sign up user (New User Flow)
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.adminEmail, // Admin email used as login
          password: formData.password,
          options: {
            data: {
              name: formData.companyName,
              type: 'company',
            }
          }
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error("Erro ao criar usuário.");

        // CHECK FOR SESSION
        if (!authData.session) {
          // Se não há sessão imediata, mas o e-mail não precisa de confirmação,
          // o usuário deve poder logar normalmente.
          addToast('Cadastro realizado! Agora você pode fazer login.', 'success');
          setIsLoading(false);
          navigate('/auth/login');
          return;
        }
        userId = authData.user.id;
      }

      // 2. Upload files
      // Assuming user ID as folder for organization
      // const userId = authData.user.id; // Removed as we define it above

      let logoUrl = '';
      let coverUrl = '';
      let cnpjUrl = '';

      if (logo) logoUrl = await uploadFile(logo, 'logos', userId);
      if (coverImage) coverUrl = await uploadFile(coverImage, 'covers', userId);
      if (cnpjDocument) cnpjUrl = await uploadFile(cnpjDocument, 'documents', userId);

      // 3. Insert into companies table
      // Generate slug from company name
      const slug = formData.companyName
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .replace(/^-+|-+$/g, ''); // Trim hyphens

      const { error: dbError } = await supabase.from('companies').insert({
        profile_id: userId,
        slug: slug,
        company_name: formData.companyName,
        legal_name: formData.legalName,
        cnpj: formData.cnpj,
        email: formData.email, // Public contact email
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
          cep: formData.cep
        },
        admin_contact: {
          name: formData.adminName,
          cpf: formData.adminCpf,
          email: formData.adminEmail
        },
        logo_url: logoUrl,
        cover_image_url: coverUrl,
        cnpj_document_url: cnpjUrl,
        status: 'pending'
      });

      if (dbError) {
        // Rollback or manual fix needed if DB fails but Auth passed. 
        // In MVP, we just show error.
        console.error("Database Insert Error:", dbError);
        throw new Error("Erro ao salvar dados da empresa. Contate o suporte.");
      }

      addToast('Cadastro realizado com sucesso! Aguarde a aprovação.', 'success');
      navigate('/auth/login');

    } catch (err) {
      console.error("Registration Error", err);

      const message = err instanceof Error ? err.message : "";

      // Handle "User already registered" specifically
      if (message.includes("User already registered") || message.includes("already registered")) {
        addToast('Este e-mail já está cadastrado. Faça login para continuar ou use outro e-mail.', 'error');
        // We could redirect here or let the user choose
      } else {
        addToast(message || 'Erro ao registrar empresa.', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl py-12 px-4">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Cadastre sua Empresa</h1>
        <p className="text-gray-600 mb-8">Siga os passos para criar o perfil do seu negócio.</p>

        {/* Stepper */}
        <div className="mb-8">
          <ol className="flex items-center w-full">
            <li className={`flex w-full items-center ${step >= 1 ? 'text-primary-600' : 'text-gray-500'} after:content-[''] after:w-full after:h-1 after:border-b ${step > 1 ? 'after:border-primary-600' : 'after:border-gray-200'} after:border-4 after:inline-block`}>
              <span className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full lg:h-12 lg:w-12 shrink-0">1</span>
            </li>
            <li className={`flex w-full items-center ${step >= 2 ? 'text-primary-600' : 'text-gray-500'} after:content-[''] after:w-full after:h-1 after:border-b ${step > 2 ? 'after:border-primary-600' : 'after:border-gray-200'} after:border-4 after:inline-block`}>
              <span className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full lg:h-12 lg:w-12 shrink-0">2</span>
            </li>
            <li className={`flex items-center ${step >= 3 ? 'text-primary-600' : 'text-gray-500'}`}>
              <span className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full lg:h-12 lg:w-12 shrink-0">3</span>
            </li>
          </ol>
        </div>


        <form onSubmit={handleSubmit}>
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">1. Dados da Empresa</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Nome Fantasia" name="companyName" value={formData.companyName} onChange={handleChange} error={errors.companyName} required />
                <Input label="Razão Social" name="legalName" value={formData.legalName} onChange={handleChange} error={errors.legalName} required />
                <Input label="CNPJ" name="cnpj" placeholder="CNPJ (somente números ou formatado)" value={formData.cnpj} onChange={handleChange} error={errors.cnpj} required />
                <Input label="Email de Contato Público" name="email" type="email" value={formData.email} onChange={handleChange} error={errors.email} required />
                <Input label="Telefone (Opcional)" name="phone" type="tel" value={formData.phone} onChange={handleChange} error={errors.phone} />
                <Input label="Website (Opcional)" name="website" value={formData.website} onChange={handleChange} error={errors.website} />
              </div>
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">Categoria</label>
                <select id="category" name="category" value={formData.category} onChange={handleChange} className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md ${errors.category ? 'border-red-500' : ''}`}>
                  <option value="">Selecione uma categoria</option>
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                {errors.category && <p className="mt-2 text-sm text-red-600">{errors.category}</p>}
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descrição</label>
                <textarea id="description" name="description" rows={3} value={formData.description} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm sm:text-sm p-2 focus:ring-primary-500 focus:border-primary-500"></textarea>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="logo-upload" className="block text-sm font-medium text-gray-700">Logo</label>
                  <FileUpload id="logo-upload" accept="image/jpeg,image/png" maxSizeMb={5} onFileChange={handleFileChange(setLogo, 'logo')} />
                  {errors.logo && <p className="mt-2 text-sm text-red-600">{errors.logo}</p>}
                </div>
                <div>
                  <label htmlFor="cover-upload" className="block text-sm font-medium text-gray-700">Imagem de Capa</label>
                  <FileUpload id="cover-upload" accept="image/jpeg,image/png" maxSizeMb={10} onFileChange={handleFileChange(setCoverImage, 'coverImage')} />
                  {errors.coverImage && <p className="mt-2 text-sm text-red-600">{errors.coverImage}</p>}
                </div>
              </div>
              <div>
                <label htmlFor="cnpj-upload" className="block text-sm font-medium text-gray-700">Comprovante de CNPJ</label>
                <FileUpload id="cnpj-upload" accept="application/pdf,image/jpeg,image/png" maxSizeMb={10} onFileChange={handleFileChange(setCnpjDocument, 'cnpjDocument')} />
                {errors.cnpjDocument && <p className="mt-2 text-sm text-red-600">{errors.cnpjDocument}</p>}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">2. Endereço</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="CEP" name="cep" value={formData.cep} onChange={handleChange} error={errors.cep} required />
                <Input label="Rua" name="street" value={formData.street} onChange={handleChange} error={errors.street} required />
                <Input label="Número" name="number" value={formData.number} onChange={handleChange} error={errors.number} />
                <Input label="Bairro" name="district" value={formData.district} onChange={handleChange} error={errors.district} />
                <Input label="Cidade" name="city" value={formData.city} onChange={handleChange} error={errors.city} required />
                <Input label="Estado" name="state" value={formData.state} onChange={handleChange} error={errors.state} required />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">3. Administrador Responsável</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Nome do Responsável" name="adminName" value={formData.adminName} onChange={handleChange} error={errors.adminName} required />
                <Input label="CPF do Responsável" name="adminCpf" value={formData.adminCpf} onChange={handleChange} error={errors.adminCpf} required />
                <Input label="Email de Login (Admin)" name="adminEmail" type="email" value={formData.adminEmail} onChange={handleChange} error={errors.adminEmail} required />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Senha" name="password" type="password" value={formData.password} onChange={handleChange} error={errors.password} required />
                <Input label="Confirmar Senha" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} error={errors.confirmPassword} required />
              </div>
              <div className="flex items-center text-sm text-gray-500 mt-4">
                <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                As informações da sua empresa estão protegidas pela criptografia do Supabase.
              </div>
            </div>
          )}

          <div className="mt-8 flex justify-between">
            {step > 1 && <Button type="button" variant="secondary" onClick={handleBack}>Voltar</Button>}
            <div />
            {step < 3 && <Button type="button" onClick={handleNext}>Próximo</Button>}
            {step === 3 && <Button type="submit" isLoading={isLoading}>Finalizar Cadastro</Button>}
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompanyRegistrationPage;
