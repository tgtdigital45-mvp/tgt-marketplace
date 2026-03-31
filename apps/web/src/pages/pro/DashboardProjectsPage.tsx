import React, { useState, useEffect, useCallback } from 'react';
import { supabase, CompanyProject, Service } from '@tgt/core';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import FileUpload from '@/components/FileUpload';
import OptimizedImage from '@/components/ui/OptimizedImage';
import Portal from '@/components/ui/Portal';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, LoadingSkeleton } from '@tgt/ui-web';
import {
  ChevronRight,
  Plus,
  Trash2,
  Edit3,
  Briefcase,
  Image as ImageIcon,
  Calendar,
  X,
  Save,
  Loader2,
  AlertCircle,
  Link as LinkIcon,
} from 'lucide-react';

const DashboardProjectsPage: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [projects, setProjects] = useState<CompanyProject[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Partial<CompanyProject> | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchProjects = useCallback(async (compId: string) => {
    try {
      const { data, error } = await supabase
        .from('company_projects')
        .select('*')
        .eq('company_id', compId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (err) {
      console.error('Error fetching projects:', err);
      addToast('Erro ao carregar projetos.', 'error');
    }
  }, [addToast]);

  const fetchServices = useCallback(async (compId: string) => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('id, title')
        .eq('company_id', compId)
        .is('deleted_at', null);

      if (error) throw error;
      setServices(data || []);
    } catch (err) {
      console.error('Error fetching services:', err);
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    const init = async () => {
      setLoading(true);
      try {
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('id')
          .eq('profile_id', user.id)
          .single();

        if (companyError) throw companyError;

        if (companyData) {
          setCompanyId(companyData.id);
          await Promise.all([
            fetchProjects(companyData.id),
            fetchServices(companyData.id)
          ]);
        }
      } catch (err) {
        console.error('Error initializing projects page:', err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [user, fetchProjects, fetchServices]);

  const handleOpenAddModal = () => {
    if (projects.length >= 5) {
      addToast('Limite de 5 projetos atingido.', 'info');
      return;
    }
    setEditingProject({
      title: '',
      description: '',
      main_image_url: '',
      gallery_urls: [],
      service_id: undefined,
      completion_date: new Date().toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (project: CompanyProject) => {
    setEditingProject({ ...project });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProject(null);
  };

  const handleMainImageChange = async (file: File | null) => {
    if (!file || !companyId || !editingProject) return;
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `projects/${companyId}/${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('portfolio').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('portfolio').getPublicUrl(filePath);
      setEditingProject({ ...editingProject, main_image_url: publicUrl });
    } catch (err) {
      console.error('Error uploading main image:', err);
      addToast('Erro ao carregar imagem principal.', 'error');
    }
  };

  const handleGalleryImageAdd = async (file: File | null) => {
    if (!file || !companyId || !editingProject) return;
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `projects/${companyId}/gallery/${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('portfolio').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('portfolio').getPublicUrl(filePath);
      setEditingProject({
        ...editingProject,
        gallery_urls: [...(editingProject.gallery_urls || []), publicUrl]
      });
    } catch (err) {
      console.error('Error uploading gallery image:', err);
      addToast('Erro ao carregar imagem da galeria.', 'error');
    }
  };

  const removeGalleryImage = (url: string) => {
    if (!editingProject) return;
    setEditingProject({
      ...editingProject,
      gallery_urls: (editingProject.gallery_urls || []).filter(u => u !== url)
    });
  };

  const handleSave = async () => {
    if (!companyId || !editingProject || !editingProject.title || !editingProject.main_image_url) {
      addToast('Preencha os campos obrigatórios.', 'info');
      return;
    }

    setSubmitting(true);
    try {
      const projectData = {
        company_id: companyId,
        title: editingProject.title,
        description: editingProject.description,
        main_image_url: editingProject.main_image_url,
        gallery_urls: editingProject.gallery_urls || [],
        service_id: editingProject.service_id || null,
        completion_date: editingProject.completion_date
      };

      if (editingProject.id) {
        // Update
        const { error } = await supabase
          .from('company_projects')
          .update(projectData)
          .eq('id', editingProject.id);
        if (error) throw error;
        addToast('Projeto atualizado!', 'success');
      } else {
        // Create
        const { error } = await supabase
          .from('company_projects')
          .insert(projectData);
        if (error) throw error;
        addToast('Projeto criado com sucesso!', 'success');
      }

      await fetchProjects(companyId);
      handleCloseModal();
    } catch (err) {
      console.error('Error saving project:', err);
      addToast('Erro ao salvar projeto.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este projeto?')) return;

    try {
      const { error } = await supabase
        .from('company_projects')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setProjects(prev => prev.filter(p => p.id !== id));
      addToast('Projeto removido.', 'info');
    } catch (err) {
      console.error('Error deleting project:', err);
      addToast('Erro ao excluir projeto.', 'error');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
            <span>Dashboard</span><ChevronRight size={12} />
            <span className="text-gray-600 font-medium">Projetos</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Meus Projetos</h1>
          <p className="text-sm text-gray-500 mt-1">
            {projects.length > 0
              ? `${projects.length}/5 projetos cadastrados`
              : 'Mostre seus melhores cases de sucesso (estilo Behance)'}
          </p>
        </div>
        <Button onClick={handleOpenAddModal} disabled={projects.length >= 5} size="sm" className="!rounded-xl">
          <Plus size={16} className="mr-2" />
          Novo Projeto
        </Button>
      </div>

      {projects.length >= 5 && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 leading-relaxed">
            <strong>Limite de Projetos:</strong> Você atingiu o limite de 5 projetos. Remova um projeto existente para adicionar um novo.
          </p>
        </div>
      )}

      {/* Grid de Projetos */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <LoadingSkeleton key={i} className="aspect-[4/3] rounded-2xl" />)}
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 py-16 px-6 text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Briefcase size={32} className="text-blue-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-800">Crie seu primeiro Case de Sucesso</h3>
          <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
            Projetos detalhados ajudam clientes a entenderem seu processo de trabalho e qualidade final.
          </p>
          <Button onClick={handleOpenAddModal} className="!rounded-xl">
            <Plus size={16} className="mr-2" />
            Adicionar Projeto
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <motion.div
              key={project.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="group relative bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all"
            >
              <div className="aspect-[16/10] overflow-hidden bg-gray-100">
                <OptimizedImage
                  src={project.main_image_url}
                  alt={project.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-4">
                <h3 className="font-bold text-gray-900 truncate mb-1">{project.title}</h3>
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Calendar size={12} />
                  <span>{project.completion_date ? new Date(project.completion_date).toLocaleDateString() : 'Sem data'}</span>
                </div>
              </div>
              
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleOpenEditModal(project)}
                  className="p-2 bg-white/90 hover:bg-white text-gray-600 rounded-lg shadow-sm backdrop-blur-sm transition-colors"
                >
                  <Edit3 size={14} />
                </button>
                <button
                  onClick={() => handleDelete(project.id)}
                  className="p-2 bg-red-500/90 hover:bg-red-500 text-white rounded-lg shadow-sm backdrop-blur-sm transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </motion.div>
          ))}
          
          {projects.length < 5 && (
            <button
              onClick={handleOpenAddModal}
              className="aspect-[16/10] sm:aspect-auto sm:h-full rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50/50 transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-gray-50 group-hover:bg-blue-100 flex items-center justify-center mb-2 transition-colors">
                <Plus size={24} />
              </div>
              <span className="text-sm font-medium">Adicionar projeto</span>
            </button>
          )}
        </div>
      )}

      {/* Modal de Criação / Edição */}
      <AnimatePresence>
        {isModalOpen && editingProject && (
          <Portal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col" style={{ maxHeight: 'calc(100vh - 2rem)' }}
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <h2 className="text-lg font-bold text-gray-900">
                  {editingProject.id ? 'Editar Projeto' : 'Novo Projeto'}
                </h2>
                <button onClick={handleCloseModal} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {/* Title */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Título do Projeto *</label>
                  <input
                    type="text"
                    value={editingProject.title}
                    onChange={(e) => setEditingProject({ ...editingProject, title: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-medium"
                    placeholder="Ex: Reforma Cozinha Minimalista"
                    required
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Descrição do Case</label>
                  <textarea
                    value={editingProject.description}
                    onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm min-h-[120px] resize-none"
                    placeholder="Descreva o desafio, o processo e o resultado final..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Service Relation */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Vincular a Serviço</label>
                    <div className="relative">
                      <select
                        value={editingProject.service_id || ''}
                        onChange={(e) => setEditingProject({ ...editingProject, service_id: e.target.value || undefined })}
                        className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all appearance-none text-sm bg-white"
                      >
                        <option value="">Projeto Avulso</option>
                        {services.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                      </select>
                      <LinkIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                  </div>

                  {/* Date */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Data de Conclusão</label>
                    <div className="relative">
                      <input
                        type="date"
                        value={editingProject.completion_date}
                        onChange={(e) => setEditingProject({ ...editingProject, completion_date: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm"
                      />
                      <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                  </div>
                </div>

                {/* Main Image */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 flex items-center gap-2">
                    <ImageIcon size={14} className="text-blue-500" />
                    Imagem Principal (Capa) *
                  </label>
                  
                  {editingProject.main_image_url ? (
                    <div className="relative aspect-[16/9] rounded-2xl overflow-hidden border border-gray-100 shadow-inner group">
                      <img src={editingProject.main_image_url} alt="Capa" className="w-full h-full object-cover" />
                      <button
                        onClick={() => setEditingProject({ ...editingProject, main_image_url: '' })}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-center">
                      <FileUpload
                        onFileChange={handleMainImageChange}
                        accept="image/*"
                        maxSizeMb={5}
                        className="w-full max-w-lg"
                      />
                    </div>
                  )}
                </div>

                {/* Gallery */}
                <div className="space-y-3 border-t border-gray-100 pt-6">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 flex items-center gap-2">
                    <Plus size={14} className="text-blue-500" />
                    Galeria do Storytelling (Até 10 fotos)
                  </label>
                  
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                    {editingProject.gallery_urls?.map((url, idx) => (
                      <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-gray-100 group">
                        <img src={url} alt="Galeria" className="w-full h-full object-cover" />
                        <button
                          onClick={() => removeGalleryImage(url)}
                          className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    
                    {(editingProject.gallery_urls?.length || 0) < 10 && (
                      <div className="aspect-square">
                        <FileUpload
                          onFileChange={handleGalleryImageAdd}
                          accept="image/*"
                          maxSizeMb={5}
                          className="h-full"
                          compact={true}
                        />
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400 italic">Dica: Adicione fotos do processo e do resultado final para criar um storytelling envolvente.</p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                <Button variant="outline" onClick={handleCloseModal} size="sm" className="!rounded-xl">
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={submitting} size="sm" className="!rounded-xl shadow-lg shadow-blue-500/20">
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save size={16} className="mr-2" />
                      {editingProject.id ? 'Salvar Alterações' : 'Criar Projeto'}
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </div>
          </Portal>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DashboardProjectsPage;
