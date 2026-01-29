import React, { useState, useEffect } from 'react';
import FileUpload from '../../components/FileUpload';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

interface PortfolioItem {
    id: string;
    image_url: string;
    title: string;
    description: string;
}

const DashboardPortfolioPage: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [items, setItems] = useState<PortfolioItem[]>([]);
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

                if (companyError) throw companyError;
                setCompanyId(companyData.id);

                // Get Portfolio Items
                const { data: itemsData, error: itemsError } = await supabase
                    .from('portfolio_items')
                    .select('*')
                    .eq('company_id', companyData.id)
                    .order('created_at', { ascending: false });

                if (itemsError) throw itemsError;
                setItems(itemsData || []);

            } catch (err) {
                console.error("Error fetching portfolio:", err);
                addToast("Erro ao carregar portfólio.", "error");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user, addToast]);


    const handleFileUpload = async (file: File) => {
        if (!companyId) return;
        setUploading(true);

        try {
            // 1. Upload Image
            const fileExt = file.name.split('.').pop();
            const fileName = `${companyId}/${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('portfolio') // Requires 'portfolio' bucket
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('portfolio')
                .getPublicUrl(filePath);

            // 3. Insert into Database
            const { data: newItem, error: dbError } = await supabase
                .from('portfolio_items')
                .insert({
                    company_id: companyId,
                    image_url: publicUrl,
                    title: 'Novo Item',
                    description: ''
                })
                .select()
                .single();

            if (dbError) throw dbError;

            setItems(prev => [newItem, ...prev]);
            addToast("Imagem adicionada com sucesso!", "success");

        } catch (err) {
            console.error("Error uploading item:", err);
            addToast("Erro ao adicionar imagem.", "error");
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

            // 2. Delete from Storage (Optional optimisation, skipping for MVP stability as ID parsing is needed)
            // Ideally we parse the path from the URL to delete from bucket too.

            setItems(prev => prev.filter(i => i.id !== id));
            addToast("Item excluído.", "info");
        } catch (err) {
            console.error("Error deleting item:", err);
            addToast("Erro ao excluir item.", "error");
        }
    };

    return (
        <div className="space-y-6 p-6">
            <div className="sm:flex sm:items-center sm:justify-between">
                <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Portfólio / Galeria</h3>
                    <p className="mt-1 text-sm text-gray-500">Gerencie as imagens e vídeos que aparecem no seu perfil.</p>
                </div>
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
            </div>

            {loading ? (
                <p className="text-gray-500 text-center py-10">Carregando galeria...</p>
            ) : items.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-gray-300 rounded-lg">
                    <p className="text-gray-500">Sua galeria está vazia.</p>
                    <p className="text-sm text-gray-400">Adicione fotos dos seus trabalhos para atrair mais clientes.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {items.map(item => (
                        <div key={item.id} className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                            <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleDelete(item.id)}
                                    className="text-white hover:text-red-400 transition-colors p-2 rounded-full bg-black/20"
                                    title="Excluir imagem"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
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