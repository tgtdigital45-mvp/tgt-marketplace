import React, { useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import Button from '../ui/Button';
import { useToast } from '../../contexts/ToastContext';

interface DeliveryModalProps {
    orderId: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const DeliveryModal: React.FC<DeliveryModalProps> = ({ orderId, isOpen, onClose, onSuccess }) => {
    const { addToast } = useToast();
    const [note, setNote] = useState('');
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = async () => {
        if (!note.trim()) {
            addToast('Por favor, adicione uma nota de entrega.', 'error');
            return;
        }
        if (!fileInputRef.current?.files?.length) {
            addToast('É necessário anexar pelo menos um arquivo.', 'error');
            return;
        }

        setUploading(true);
        try {
            // 1. Upload File
            const file = fileInputRef.current.files[0];
            const fileExt = file.name.split('.').pop();
            const filePath = `${orderId}/delivery_${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('order-deliveries')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. Update Order Status
            const { error: updateError } = await supabase
                .from('orders')
                .update({ status: 'delivered' })
                .eq('id', orderId);

            if (updateError) throw updateError;

            // 3. Send System Message (optional but good for UX)
            await supabase.from('messages').insert({
                order_id: orderId,
                sender_id: (await supabase.auth.getUser()).data.user?.id, // Gets current user ID securely
                content: `ENTREGA REALIZADA: ${note}`,
                file_url: filePath // Linking the delivery file in chat history
            });

            addToast('Trabalho entregue com sucesso!', 'success');
            onSuccess();
            onClose();

        } catch (error: any) {
            console.error('Delivery error:', error);
            addToast('Erro na entrega: ' + error.message, 'error');
        } finally {
            setUploading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 animate-in zoom-in-95 duration-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Entregar Trabalho</h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nota de Entrega</label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-primary min-h-[100px]"
                            placeholder="Descreva o que está sendo entregue..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Anexar Arquivos Finais</label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                onChange={(e) => {
                                    if (e.target.files?.length) {
                                        // Force update to show filename (simple way)
                                        setNote(prev => prev);
                                    }
                                }}
                            />
                            <div className="text-gray-500">
                                {fileInputRef.current?.files?.[0] ? (
                                    <span className="text-brand-primary font-medium">{fileInputRef.current.files[0].name}</span>
                                ) : (
                                    <span>Clique para selecionar arquivos</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                    <Button variant="outline" onClick={onClose} disabled={uploading}>Cancelar</Button>
                    <Button onClick={handleSubmit} isLoading={uploading}>Enviar Entrega</Button>
                </div>
            </div>
        </div>
    );
};

export default DeliveryModal;
