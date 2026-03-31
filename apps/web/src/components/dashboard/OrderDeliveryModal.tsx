import React, { useState, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { X, Upload, FileText, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@tgt/core';
import Button from '../ui/Button';

interface OrderDeliveryModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: any;
    onSuccess: () => void;
}

interface UploadedFile {
    file: File;
    preview?: string;
    progress: number;
    error?: string;
    url?: string;
}

const OrderDeliveryModal = ({ isOpen, onClose, order, onSuccess }: OrderDeliveryModalProps) => {
    const [message, setMessage] = useState('');
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        const newFiles: UploadedFile[] = selectedFiles.map(file => ({
            file,
            preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
            progress: 0
        }));
        setFiles(prev => [...prev, ...newFiles]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeFile = (index: number) => {
        setFiles(prev => {
            const newFiles = [...prev];
            if (newFiles[index].preview) URL.revokeObjectURL(newFiles[index].preview!);
            newFiles.splice(index, 1);
            return newFiles;
        });
    };

    const uploadFiles = async () => {
        const uploadedFilesMetadata = [];
        
        for (let i = 0; i < files.length; i++) {
            const f = files[i];
            const fileExt = f.file.name.split('.').pop();
            const fileName = `${order.id}/${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `deliveries/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('order-deliveries')
                .upload(filePath, f.file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('order-deliveries')
                .getPublicUrl(filePath);

            uploadedFilesMetadata.push({
                name: f.file.name,
                url: publicUrl,
                type: f.file.type,
                size: f.file.size
            });
        }
        
        return uploadedFilesMetadata;
    };

    const handleSubmit = async () => {
        if (files.length === 0) {
            setError('Por favor, anexe pelo menos uma evidência da entrega.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // 1. Upload files to storage
            const filesMetadata = await uploadFiles();

            // 2. Insert into order_deliveries
            const { error: dbError } = await supabase
                .from('order_deliveries')
                .insert({
                    order_id: order.id,
                    uploaded_by: (await supabase.auth.getUser()).data.user?.id,
                    files: filesMetadata,
                    message: message.trim() || null,
                    status: 'pending_review'
                });

            if (dbError) throw dbError;

            // 3. Update order status
            const { error: orderError } = await supabase
                .from('orders')
                .update({ status: 'awaiting_approval' })
                .eq('id', order.id);

            if (orderError) throw orderError;

            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Error submitting delivery:', err);
            setError(err.message || 'Erro ao enviar entrega. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-xl transform overflow-hidden rounded-[32px] bg-white p-8 text-left align-middle shadow-2xl transition-all border border-gray-100">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="bg-primary-50 p-3 rounded-2xl">
                                        <CheckCircle2 className="w-6 h-6 text-primary-600" />
                                    </div>
                                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                        <X className="w-5 h-5 text-gray-400" />
                                    </button>
                                </div>

                                <Dialog.Title as="h3" className="text-2xl font-black text-gray-900 leading-tight">
                                    Entregar Trabalho
                                </Dialog.Title>
                                <p className="text-gray-500 mt-2 text-sm leading-relaxed">
                                    Envie fotos, vídeos ou documentos que comprovem a conclusão do serviço. 
                                    Isso é fundamental para a liberação do pagamento.
                                </p>

                                <div className="mt-8 space-y-6">
                                    {/* Message Textarea */}
                                    <div>
                                        <label className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2 block">
                                            Mensagem para o cliente (opcional)
                                        </label>
                                        <textarea
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            placeholder="Descreva o que foi feito ou deixe uma nota para o cliente..."
                                            className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-primary-500 focus:bg-white rounded-2xl text-sm outline-none transition-all resize-none h-32"
                                        />
                                    </div>

                                    {/* File Grid */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-xs font-black uppercase tracking-widest text-gray-400">
                                                Evidências e Arquivos
                                            </label>
                                            <button 
                                                onClick={() => fileInputRef.current?.click()}
                                                className="text-primary-600 hover:text-primary-700 text-xs font-black uppercase tracking-widest flex items-center gap-1"
                                            >
                                                <Plus size={14} /> Adicionar
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                            {files.map((file, idx) => (
                                                <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 group">
                                                    {file.preview ? (
                                                        <img src={file.preview} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex flex-col items-center justify-center p-4">
                                                            <FileText className="w-8 h-8 text-gray-300 mb-2" />
                                                            <span className="text-[10px] font-bold text-gray-400 text-center line-clamp-2">{file.file.name}</span>
                                                        </div>
                                                    )}
                                                    <button 
                                                        onClick={() => removeFile(idx)}
                                                        className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                            
                                            <button 
                                                onClick={() => fileInputRef.current?.click()}
                                                className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 hover:border-primary-300 hover:bg-primary-50/50 transition-all group"
                                            >
                                                <Upload className="w-6 h-6 text-gray-300 group-hover:text-primary-500 transition-colors" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-primary-600">Upload</span>
                                            </button>
                                        </div>
                                        <input 
                                            type="file" 
                                            multiple 
                                            className="hidden" 
                                            ref={fileInputRef} 
                                            onChange={handleFileChange}
                                            accept="image/*,video/*,application/pdf"
                                        />
                                    </div>

                                    {error && (
                                        <div className="flex items-start gap-2 p-4 bg-red-50 rounded-2xl border border-red-100">
                                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                            <p className="text-xs font-bold text-red-600 leading-tight">{error}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-8 flex gap-3">
                                    <Button variant="secondary" className="flex-1 rounded-2xl py-4" onClick={onClose} disabled={loading}>
                                        Cancelar
                                    </Button>
                                    <Button 
                                        variant="primary" 
                                        className="flex-1 rounded-2xl py-4" 
                                        onClick={handleSubmit}
                                        isLoading={loading}
                                        disabled={files.length === 0}
                                    >
                                        Finalizar Entrega
                                    </Button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default OrderDeliveryModal;
