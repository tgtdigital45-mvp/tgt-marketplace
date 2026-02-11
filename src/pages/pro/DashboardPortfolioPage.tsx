import React, { useState, useEffect } from 'react';
import FileUpload from '../../components/FileUpload';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { DbPortfolioItem } from '../../types';

const DashboardPortfolioPage: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [items, setItems] = useState<DbPortfolioItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [companyId, setCompanyId] = useState<string | null>(null);

    // Fetch Items
    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                // Get Company ID
                const { data: companyData, error: companyError } = await supabase
                    .from('companies')
                    .select('id')
                    .eq('profile_id', user.id)
                    .single();

                if (companyError) {
                    // Fallback for company slug
                    if (user.companySlug) {
                        const { data: cData } = await supabase.from('companies').select('id').eq('slug', user.companySlug).single();
                        if (cData) {
                            setCompanyId(cData.id);
                            await fetchItems(cData.id);
                        }
                    }
                    return;
                }

                setCompanyId(companyData.id);
                await fetchItems(companyData.id);

            } catch (err) {
                console.error("Error fetching portfolio:", err);
                addToast("Erro ao carregar portfólio.", "error");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user, addToast]);

    const fetchItems = async (compId: string) => {
        // Get Portfolio Items
        const { data: itemsData, error: itemsError } = await supabase
            .from('portfolio_items')
            .select('*')
            .eq('company_id', compId)
            .order('created_at', { ascending: false });

        if (itemsError) throw itemsError;
        setItems(itemsData || []);
    }


    const handleFileUpload = async (file: File | null) => {
        if (!file) return; // Ignore null files (e.g. from removeFile)
        if (!companyId) return;
        setUploading(true);

        try {
            // 1. Upload Image
            const fileExt = file.name.split('.').pop();
            const fileName = `${companyId}/${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('portfolio')
                .upload(filePath, file);

            if (uploadError) {
                if (uploadError.message.includes('Bucket not found')) {
                    throw new Error("Erro de configuração: Bucket 'portfolio' não encontrado.");
                }
                throw uploadError;
            }

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('portfolio')
                .getPublicUrl(filePath);

            // 3. Insert into Database
            const { data: newItem, error: dbError } = await supabase
                .from('portfolio_items')
                .insert({
                    company_id: companyId,
                    type: 'image',
                    image_url: publicUrl,
                    caption: 'Novo Item' // Default caption
                })
                .select()
                .single();

            if (dbError) throw dbError;

            setItems(prev => [newItem, ...prev]);
            addToast("Imagem adicionada com sucesso!", "success");

        } catch (err) {
            const error = err as Error;
            console.error("Error uploading item:", error);
            addToast(error.message || "Erro ao adicionar imagem.", "error");
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Tem certeza que deseja excluir esta imagem?")) return;

        try {
            // 1. Delete from DB
            const { error: dbError } = await supabase
                .from('portfolio_items')
                .delete()
                .eq('id', id);

            if (dbError) throw dbError;

            // 2. Delete from Storage
            const itemToDelete = items.find(i => i.id === id);
            if (itemToDelete) {
                const path = itemToDelete.image_url.split('portfolio/').pop();
                if (path) {
                    const { error: storageError } = await supabase.storage
                        .from('portfolio')
                        .remove([path]);

                    if (storageError) {
                        console.error("Error deleting file from storage:", storageError);
                        // We don't throw here to avoid blocking UI update since DB delete succeeded
                    }
                }
            }

            setItems(prev => prev.filter(i => i.id !== id));
            addToast("Item excluído.", "info");
        } catch (err) {
            console.error("Error deleting item:", err);
            addToast("Erro ao excluir item.", "error");
        }
    };

    // Trigger file upload from custom button
    const triggerUpload = () => {
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) fileInput.click();
    };


    return (
        <div className="space-y-6 p-6">
            <div className="sm:flex sm:items-center sm:justify-between">
                <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Portfólio / Galeria</h3>
                    <p className="mt-1 text-sm text-gray-500">Gerencie as imagens e vídeos que aparecem no seu perfil.</p>
                </div>
                {items.length > 0 && (
                    <div className="mt-4 sm:mt-0 w-full sm:w-auto">
                        <div className="relative">
                            <FileUpload
                                onFileChange={handleFileUpload}
                                accept="image/*"
                                maxSizeMb={5}
                                className="w-full sm:w-auto"
                            />
                            {uploading && <span className="text-sm text-gray-500 ml-2">Enviando...</span>}
                        </div>
                    </div>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-brand-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </div>
            ) : items.length === 0 ? (
                /* User provided Empty State */
                <div className="col-span-full py-12 text-center border-2 border-dashed border-gray-200 rounded-xl">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-camera" ariaTitle="true">
                            <path d="M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z"></path>
                            <circle cx="12" cy="13" r="3"></circle>
                        </svg>
                    </div>
                    <h5 class="text-lg font-medium text-gray-900">Sem projetos ainda</h5>
                    <p class="text-gray-500 mb-4">Adicione itens ao seu portfólio para exibi-los aqui.</p>

                    {/* Hidden File Upload for the button to trigger */}
                    <div className="hidden">
                        <FileUpload
                            onFileChange={handleFileUpload}
                            accept="image/*"
                            maxSizeMb={5}
                            className=""
                        />
                    </div>

                    <button
                        onClick={triggerUpload}
                        disabled={uploading}
                        className="inline-flex items-center justify-center font-bold rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm active:scale-95 bg-[#FF6B35] text-white hover:bg-[#E85D2E] focus:ring-[#FF6B35] shadow-orange-200 px-6 py-3 text-sm ">
                        {uploading ? 'Enviando...' : 'Adicionar ao Portfólio'}
                    </button>

                    {/* Fallback if company not found */}
                    {!companyId && <p className="text-red-500 mt-4 text-sm">Erro: Perfil de empresa não encontrado.</p>}
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {items.map(item => (
                        <div key={item.id} className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100 shadow-sm border border-gray-100">
                            <img src={item.image_url} alt={item.caption || 'Portfolio Item'} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleDelete(item.id)}
                                    className="text-white hover:text-red-400 transition-colors p-3 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm"
                                    title="Excluir imagem"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DashboardPortfolioPage;