import React, { useState } from 'react';
import ImageCropModal from '@/components/ImageCropModal';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { supabase } from '@tgt/core';
import type { StepProps } from '../wizard.types';

const StepGallery = ({ data, updateData }: StepProps) => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [uploading, setUploading] = useState(false);
    const [cropModal, setCropModal] = useState({ isOpen: false, imageSrc: '' });

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const reader = new FileReader();
            reader.onload = () => setCropModal({ isOpen: true, imageSrc: reader.result as string });
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleCropComplete = async (croppedBlob: Blob) => {
        if (!user) return;
        setUploading(true);
        try {
            const fileName = `${user.id}/${Date.now()}.jpg`;
            const { error: uploadError } = await supabase.storage
                .from('portfolio')
                .upload(`gallery/${fileName}`, croppedBlob);
            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('portfolio')
                .getPublicUrl(`gallery/${fileName}`);

            updateData({ gallery: [...data.gallery, publicUrl] });
            addToast('Imagem adicionada!', 'success');
        } catch {
            addToast('Erro no upload.', 'error');
        } finally {
            setUploading(false);
            setCropModal({ isOpen: false, imageSrc: '' });
        }
    };

    return (
        <div className="space-y-10 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div
                    onClick={() => document.getElementById('image-upload')?.click()}
                    className="aspect-square bg-gray-50 border-2 border-dashed rounded-[40px] flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors"
                >
                    <input type="file" id="image-upload" className="hidden" accept="image/*" onChange={handleImageChange} />
                    {uploading
                        ? <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
                        : <p className="font-bold text-gray-500">Adicionar Foto</p>
                    }
                </div>

                {data.gallery.map((url) => (
                    <div key={url} className="aspect-square relative rounded-[40px] overflow-hidden group">
                        <img src={url} alt="Imagem da galeria do serviço" className="w-full h-full object-cover" />
                        <button
                            onClick={() => updateData({ gallery: data.gallery.filter((u) => u !== url) })}
                            className="absolute inset-0 bg-red-500/50 opacity-0 group-hover:opacity-100 text-white font-bold transition-opacity"
                        >
                            Remover
                        </button>
                    </div>
                ))}
            </div>

            <ImageCropModal
                isOpen={cropModal.isOpen}
                imageSrc={cropModal.imageSrc}
                aspectRatio={16 / 9}
                onClose={() => setCropModal({ isOpen: false, imageSrc: '' })}
                onCropComplete={handleCropComplete}
            />
        </div>
    );
};

export default StepGallery;
