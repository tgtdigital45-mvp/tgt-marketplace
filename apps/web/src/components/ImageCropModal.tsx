import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import type { Area, Point } from 'react-easy-crop';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut, Check, Loader2 } from 'lucide-react';
import { getCroppedImg } from '@/utils/cropImage';

interface ImageCropModalProps {
    isOpen: boolean;
    onClose: () => void;
    imageSrc: string;
    aspectRatio: number;
    onCropComplete: (file: File) => void;
}

const ImageCropModal: React.FC<ImageCropModalProps> = ({
    isOpen,
    onClose,
    imageSrc,
    aspectRatio,
    onCropComplete,
}) => {
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [processing, setProcessing] = useState(false);

    const isAvatar = aspectRatio === 1;
    const title = isAvatar ? 'Ajustar Foto de Perfil' : 'Ajustar Imagem de Capa';

    // Output dimensions based on aspect ratio
    const outputWidth = isAvatar ? 400 : 1200;

    const handleCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleConfirm = useCallback(async () => {
        if (!croppedAreaPixels || !imageSrc) return;

        try {
            setProcessing(true);
            const blob = await getCroppedImg(imageSrc, croppedAreaPixels, outputWidth);
            const fileName = isAvatar ? `avatar-${Date.now()}.jpg` : `cover-${Date.now()}.jpg`;
            const file = new File([blob], fileName, { type: 'image/jpeg' });
            onCropComplete(file);
        } catch (err) {
            console.error('Error cropping image:', err);
        } finally {
            setProcessing(false);
        }
    }, [croppedAreaPixels, imageSrc, outputWidth, isAvatar, onCropComplete]);

    const handleClose = useCallback(() => {
        if (!processing) {
            setCrop({ x: 0, y: 0 });
            setZoom(1);
            setCroppedAreaPixels(null);
            onClose();
        }
    }, [processing, onClose]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                        onClick={handleClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden z-10"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                            <div>
                                <h3 className="text-sm font-bold text-gray-900">{title}</h3>
                                <p className="text-[11px] text-gray-400 mt-0.5">
                                    {isAvatar
                                        ? 'Arraste e ajuste o zoom para enquadrar sua foto'
                                        : 'Posicione a área visível da sua imagem de capa'}
                                </p>
                            </div>
                            <button
                                onClick={handleClose}
                                disabled={processing}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all disabled:opacity-50"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Cropper Area */}
                        <div
                            className="relative bg-gray-900"
                            style={{ height: isAvatar ? '360px' : '320px' }}
                        >
                            <Cropper
                                image={imageSrc}
                                crop={crop}
                                zoom={zoom}
                                aspect={aspectRatio}
                                cropShape={isAvatar ? 'round' : 'rect'}
                                showGrid={!isAvatar}
                                onCropChange={setCrop}
                                onZoomChange={setZoom}
                                onCropComplete={handleCropComplete}
                            />
                        </div>

                        {/* Zoom Controls */}
                        <div className="px-5 py-3 border-t border-gray-100">
                            <div className="flex items-center gap-3">
                                <ZoomOut size={14} className="text-gray-400 flex-shrink-0" />
                                <input
                                    type="range"
                                    min={1}
                                    max={3}
                                    step={0.05}
                                    value={zoom}
                                    onChange={(e) => setZoom(Number(e.target.value))}
                                    className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-4
                    [&::-webkit-slider-thumb]:h-4
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-primary-500
                    [&::-webkit-slider-thumb]:shadow-md
                    [&::-webkit-slider-thumb]:cursor-pointer
                    [&::-webkit-slider-thumb]:transition-transform
                    [&::-webkit-slider-thumb]:hover:scale-110"
                                />
                                <ZoomIn size={14} className="text-gray-400 flex-shrink-0" />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-100 bg-gray-50/50">
                            <button
                                onClick={handleClose}
                                disabled={processing}
                                className="px-4 py-2.5 text-xs font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={processing || !croppedAreaPixels}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 text-white text-xs font-bold rounded-xl hover:bg-primary-600 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {processing ? (
                                    <>
                                        <Loader2 size={14} className="animate-spin" />
                                        Processando...
                                    </>
                                ) : (
                                    <>
                                        <Check size={14} />
                                        Confirmar Recorte
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ImageCropModal;
