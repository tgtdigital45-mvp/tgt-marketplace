import React, { useState, useEffect } from 'react';
import FileUpload from '@/components/FileUpload';
import { supabase } from '@tgt/shared';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { PortfolioItem as DbPortfolioItem } from '@tgt/shared';
import OptimizedImage from '@/components/ui/OptimizedImage';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import Button from '@/components/ui/Button';
import { motion } from 'framer-motion';
import ImageCropModal from '@/components/ImageCropModal';
import {
  ChevronRight,
  Camera,
  Plus,
  Trash2,
  ImageIcon,
  Lightbulb,
} from 'lucide-react';

const DashboardPortfolioPage: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [items, setItems] = useState<DbPortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);

  // Crop Modal State
  const [cropModal, setCropModal] = useState<{
    isOpen: boolean;
    imageSrc: string;
  }>({ isOpen: false, imageSrc: '' });

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: companyData, error: companyError } = await supabase
          .from('companies').select('id').eq('profile_id', user.id).single();
        if (companyError) {
          if (user.companySlug) {
            const { data: cData } = await supabase.from('companies').select('id').eq('slug', user.companySlug).single();
            if (cData) { setCompanyId(cData.id); await fetchItems(cData.id); }
          }
          return;
        }
        setCompanyId(companyData.id);
        await fetchItems(companyData.id);
      } catch (err) {
        console.error('Error fetching portfolio:', err);
        addToast('Erro ao carregar portfolio.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, addToast]);

  const fetchItems = async (compId: string) => {
    const { data, error } = await supabase
      .from('portfolio_items').select('*').eq('company_id', compId).order('created_at', { ascending: false });
    if (error) throw error;
    setItems(data || []);
  };

  const handleFileSelect = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setCropModal({ isOpen: true, imageSrc: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (croppedFile: File) => {
    setCropModal({ isOpen: false, imageSrc: '' });
    await uploadToPortfolio(croppedFile);
  };

  const uploadToPortfolio = async (file: File) => {
    if (!companyId) return;
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${companyId}/${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('portfolio').upload(filePath, file);
      if (uploadError) {
        if (uploadError.message.includes('Bucket not found'))
          throw new Error("Erro de configuracao: Bucket 'portfolio' nao encontrado.");
        throw uploadError;
      }
      const { data: { publicUrl } } = supabase.storage.from('portfolio').getPublicUrl(filePath);
      const { data: newItem, error: dbError } = await supabase
        .from('portfolio_items').insert({ company_id: companyId, image_url: publicUrl, title: 'Novo Item' }).select().single();
      if (dbError) throw dbError;
      setItems(prev => [newItem, ...prev]);
      addToast('Imagem adicionada com sucesso!', 'success');
    } catch (err: any) {
      console.error('Error uploading:', err);
      addToast(err.message || 'Erro ao adicionar imagem.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta imagem?')) return;
    try {
      const { error: dbError } = await supabase.from('portfolio_items').delete().eq('id', id);
      if (dbError) throw dbError;
      const itemToDelete = items.find(i => i.id === id);
      if (itemToDelete) {
        const path = itemToDelete.image_url.split('portfolio/').pop();
        if (path) {
          await supabase.storage.from('portfolio').remove([path]).catch(console.error);
        }
      }
      setItems(prev => prev.filter(i => i.id !== id));
      addToast('Item excluido.', 'info');
    } catch (err) {
      console.error('Error deleting:', err);
      addToast('Erro ao excluir item.', 'error');
    }
  };

  const triggerUpload = () => {
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) fileInput.click();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5 sm:space-y-6">

      {/* ─── Page Header ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3"
      >
        <div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
            <span>Dashboard</span><ChevronRight size={12} />
            <span className="text-gray-600 font-medium">Portfolio</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Meu Portfolio</h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
            {items.length > 0
              ? `${items.length} imagen${items.length > 1 ? 's' : ''} no portfolio`
              : 'Mostre seus melhores trabalhos'}
          </p>
        </div>
        {items.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="relative">
              <FileUpload onFileChange={handleFileSelect} accept="image/*" maxSizeMb={5} />
              {uploading && <span className="text-xs text-gray-400 ml-2">Enviando...</span>}
            </div>
          </div>
        )}
      </motion.div>

      {/* ─── Tip Box ─────────────────────────────────────────────────── */}
      {items.length > 0 && items.length < 6 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3"
        >
          <Lightbulb size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700 leading-relaxed">
            <strong>Dica:</strong> Portfolios com pelo menos 6 fotos recebem ate 5x mais visualizacoes. Adicione mais {6 - items.length} imagen{6 - items.length > 1 ? 's' : ''} para maximizar sua visibilidade.
          </p>
        </motion.div>
      )}

      {/* ─── Content ─────────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4, 5, 6].map(i => <LoadingSkeleton key={i} className="aspect-square rounded-2xl" />)}
        </div>
      ) : items.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl border-2 border-dashed border-gray-200 py-16 px-6 text-center"
        >
          <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Camera size={24} className="text-gray-300" />
          </div>
          <h3 className="text-sm sm:text-base font-bold text-gray-700 mb-1">Sem projetos ainda</h3>
          <p className="text-xs text-gray-400 mb-5 max-w-sm mx-auto">
            Empresas com portfolio recebem ate 5x mais orcamentos. Mostre seus melhores trabalhos e conquiste mais clientes.
          </p>
          <div className="hidden">
            <FileUpload onFileChange={handleFileSelect} accept="image/*" maxSizeMb={5} />
          </div>
          <Button onClick={triggerUpload} disabled={uploading || !companyId} size="sm" className="!rounded-xl">
            <Plus size={14} className="mr-1.5" />
            {uploading ? 'Enviando...' : 'Adicionar ao Portfolio'}
          </Button>
          {!companyId && <p className="text-red-500 mt-3 text-xs">Erro: Perfil de empresa nao encontrado.</p>}
        </motion.div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {items.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.05 * idx }}
              className="group relative aspect-square rounded-2xl overflow-hidden bg-gray-100 border border-gray-100 shadow-sm hover:shadow-md transition-all"
            >
              <OptimizedImage
                src={item.image_url}
                alt={item.title || 'Portfolio'}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                optimizedWidth={400}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-3">
                <p className="text-white text-xs font-bold truncate mr-2">{item.title}</p>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2 rounded-lg bg-black/40 hover:bg-red-500 text-white backdrop-blur-sm transition-colors flex-shrink-0"
                  title="Excluir"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </motion.div>
          ))}

          {/* Add Card */}
          <div
            onClick={triggerUpload}
            className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:border-primary-300 hover:text-primary-500 transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-full bg-gray-50 group-hover:bg-primary-50 flex items-center justify-center mb-2 transition-colors">
              <Plus size={20} />
            </div>
            <span className="text-[10px] sm:text-xs font-medium">Adicionar</span>
          </div>
        </div>
      )}

      {/* Image Crop Modal */}
      <ImageCropModal
        isOpen={cropModal.isOpen}
        imageSrc={cropModal.imageSrc}
        aspectRatio={1} // Square for portfolio
        onClose={() => setCropModal({ isOpen: false, imageSrc: '' })}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
};

export default DashboardPortfolioPage;
