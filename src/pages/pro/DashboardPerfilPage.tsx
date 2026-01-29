import React, { useState, useEffect } from 'react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import FileUpload from '@/components/FileUpload';
import { CATEGORIES } from '../../constants';
import { useToast } from '../../contexts/ToastContext';
import { useCompany } from '../../contexts/CompanyContext';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

const DashboardPerfilPage: React.FC = () => {
  const { company, loading: companyLoading, refreshCompany } = useCompany();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    companyName: '',
    legalName: '',
    cnpj: '',
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

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load company data when available
  useEffect(() => {
    if (company) {
      setFormData({
        companyName: company.company_name || '',
        legalName: company.legal_name || '',
        cnpj: company.cnpj || '',
        phone: company.phone || '',
        website: company.website || '',
        category: company.category || '',
        description: company.description || '',
        email: company.email || '',
        address: company.address || {
          cep: '',
          street: '',
          number: '',
          district: '',
          city: '',
          state: '',
        }
      });
    }
  }, [company]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    // Handle nested address object
    if (['street', 'number', 'district', 'city', 'state', 'cep'].includes(name)) {
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [name]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const uploadImage = async (file: File, bucket: string, path: string) => {
    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: true });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company || !user) return;

    setIsLoading(true);
    try {
      let logoUrl = company.logo_url;
      let coverUrl = company.cover_image_url;

      // Upload logo if changed
      if (logoFile) {
        logoUrl = await uploadImage(logoFile, 'company-assets', `${company.id}/logo-${Date.now()}`);
      }

      // Upload cover if changed
      if (coverFile) {
        coverUrl = await uploadImage(coverFile, 'company-assets', `${company.id}/cover-${Date.now()}`);
      }

      // Update company in database
      const { error: updateError } = await supabase
        .from('companies')
        .update({
          company_name: formData.companyName,
          legal_name: formData.legalName,
          phone: formData.phone,
          website: formData.website,
          category: formData.category,
          description: formData.description,
          email: formData.email,
          address: formData.address,
          logo_url: logoUrl,
          cover_image_url: coverUrl,
        })
        .eq('id', company.id);

      if (updateError) throw updateError;

      // Update user metadata to sync name and avatar
      const { error: updateMetadataError } = await supabase.auth.updateUser({
        data: {
          name: formData.companyName,
          avatar_url: logoUrl,
        }
      });

      if (updateMetadataError) {
        console.warn('Failed to update user metadata:', updateMetadataError);
      }

      // Refresh company data
      await refreshCompany();

      addToast('Perfil atualizado com sucesso!', 'success');
    } catch (err) {
      const error = err as Error;
      console.error('Error updating profile:', error);
      addToast('Erro ao atualizar perfil. Tente novamente.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (companyLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Carregando dados da empresa...</p>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-red-500">Erro ao carregar dados da empresa.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 overflow-y-auto">
      <div>
        <h3 className="text-lg leading-6 font-medium text-gray-900">Editar Perfil</h3>
        <p className="mt-1 text-sm text-gray-500">
          Atualize as informações públicas da sua empresa.
        </p>
      </div>
      <form className="space-y-8 divide-y divide-gray-200" onSubmit={handleSubmit}>
        <div className="space-y-8">
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <Input label="Nome Fantasia" id="companyName" name="companyName" value={formData.companyName} onChange={handleChange} required />
            </div>
            <div className="sm:col-span-3">
              <Input label="Razão Social" id="legalName" name="legalName" value={formData.legalName} onChange={handleChange} required />
            </div>
            <div className="sm:col-span-3">
              <Input label="CNPJ" id="cnpj" name="cnpj" value={formData.cnpj} disabled />
            </div>
            <div className="sm:col-span-3">
              <Input label="Telefone" id="phone" name="phone" value={formData.phone} onChange={handleChange} />
            </div>
            <div className="sm:col-span-3">
              <Input label="Website" id="website" name="website" value={formData.website} onChange={handleChange} />
            </div>
            <div className="sm:col-span-3">
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">Categoria</label>
              <select id="category" name="category" value={formData.category} onChange={handleChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md">
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div className="sm:col-span-6">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descrição da Empresa</label>
              <textarea id="description" name="description" rows={4} value={formData.description} onChange={handleChange} className="mt-1 shadow-sm block w-full sm:text-sm border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"></textarea>
            </div>
            <div className="sm:col-span-3">
              <label className="block text-sm font-medium text-gray-700">Logo</label>
              <FileUpload onFileChange={setLogoFile} accept="image/*" maxSizeMb={5} />
              {company.logo_url && !logoFile && (
                <p className="mt-2 text-xs text-gray-500">Logo atual: <a href={company.logo_url} target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline">Ver imagem</a></p>
              )}
            </div>
            <div className="sm:col-span-3">
              <label className="block text-sm font-medium text-gray-700">Imagem de Capa</label>
              <FileUpload onFileChange={setCoverFile} accept="image/*" maxSizeMb={10} />
              {company.cover_image_url && !coverFile && (
                <p className="mt-2 text-xs text-gray-500">Capa atual: <a href={company.cover_image_url} target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline">Ver imagem</a></p>
              )}
            </div>
          </div>
        </div>
        <div className="pt-8 space-y-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Endereço</h3>
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-2">
              <Input label="CEP" id="cep" name="cep" value={formData.address.cep} onChange={handleChange} />
            </div>
            <div className="sm:col-span-4">
              <Input label="Rua" id="street" name="street" value={formData.address.street} onChange={handleChange} />
            </div>
            <div className="sm:col-span-2">
              <Input label="Número" id="number" name="number" value={formData.address.number} onChange={handleChange} />
            </div>
            <div className="sm:col-span-2">
              <Input label="Bairro" id="district" name="district" value={formData.address.district} onChange={handleChange} />
            </div>
            <div className="sm:col-span-2">
              <Input label="Cidade" id="city" name="city" value={formData.address.city} onChange={handleChange} />
            </div>
            <div className="sm:col-span-2">
              <Input label="Estado" id="state" name="state" value={formData.address.state} onChange={handleChange} />
            </div>
          </div>
        </div>
        <div className="pt-5">
          <div className="flex justify-end">
            <Button type="button" variant="secondary">
              Cancelar
            </Button>
            <Button type="submit" className="ml-3" isLoading={isLoading}>
              Salvar alterações
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default DashboardPerfilPage;
