import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@tgt/core';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

/**
 * QRScannerModal - Interface do profissional para escanear o QR Code do cliente.
 *
 * Como funciona:
 * 1. O profissional abre o app → vai para a ordem ativa → clica em "Fazer Check-in".
 * 2. O modal exibe um campo manual para o código de 6 dígitos.
 * 3. (Opcional futuro) Integrar com jsQR ou ZXing para câmera real.
 * 4. Ao confirmar, chama a Edge Function `validate-checkin`.
 * 5. Se válido, atualiza o UI e exibe confirmação.
 *
 * GPS:
 * - Solicitamos a localização do profissional automaticamente.
 * - Enviamos junto com o código para validação no backend.
 */

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  serviceTitle: string;
  type: 'checkin' | 'checkout';
  onSuccess?: (type: 'checkin' | 'checkout') => void;
}

const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  orderId,
  serviceTitle,
  type,
  onSuccess,
}) => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'loading' | 'ok' | 'denied'>('idle');
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const requestGPS = async (): Promise<{ lat: number; lng: number } | null> => {
    if (!navigator.geolocation) return null;
    setGpsStatus('loading');
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setGpsCoords(coords);
          setGpsStatus('ok');
          resolve(coords);
        },
        () => {
          setGpsStatus('denied');
          resolve(null);
        },
        { timeout: 8000, enableHighAccuracy: true }
      );
    });
  };

  const handleOpen = async () => {
    // Pre-fetch GPS when modal opens
    if (isOpen && gpsStatus === 'idle') {
      await requestGPS();
    }
    inputRef.current?.focus();
  };

  React.useEffect(() => {
    if (isOpen) {
      handleOpen();
      setCode('');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      addToast('O código deve ter 6 dígitos', 'error');
      return;
    }
    if (!user) return;

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/validate-checkin`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            orderId,
            code: code.trim(),
            type,
            lat: gpsCoords?.lat,
            lng: gpsCoords?.lng,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        addToast(result.error || 'Código inválido', 'error');
        return;
      }

      const successMsg = type === 'checkin'
        ? '✅ Check-in confirmado! Serviço iniciado.'
        : '✅ Check-out confirmado! Pagamento liberado.';

      addToast(successMsg, 'success');
      onSuccess?.(type);
      onClose();
    } catch (err) {
      addToast('Erro de conexão. Tente novamente.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const actionLabel = type === 'checkin' ? 'Confirmar Check-in' : 'Confirmar Check-out';
  const actionColor = type === 'checkin' ? 'bg-green-600 hover:bg-green-700' : 'bg-brand-primary hover:bg-brand-primary/90';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className={`p-6 text-white ${type === 'checkin' ? 'bg-green-600' : 'bg-brand-primary'}`}>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm0 12h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zM5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5" />
                  </svg>
                </div>
                <div>
                  <h2 className="font-bold text-lg">{type === 'checkin' ? 'Check-in do Serviço' : 'Check-out do Serviço'}</h2>
                  <p className="text-white/80 text-sm truncate">{serviceTitle}</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* GPS Status */}
              <div className={`flex items-center gap-2 text-sm p-3 rounded-xl ${
                gpsStatus === 'ok' ? 'bg-green-50 text-green-700' :
                gpsStatus === 'denied' ? 'bg-amber-50 text-amber-700' :
                gpsStatus === 'loading' ? 'bg-blue-50 text-blue-700' :
                'bg-gray-50 text-gray-500'
              }`}>
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>
                  {gpsStatus === 'ok' && 'Localização capturada'}
                  {gpsStatus === 'denied' && 'GPS negado — registro sem localização'}
                  {gpsStatus === 'loading' && 'Obtendo localização...'}
                  {gpsStatus === 'idle' && 'Localização pendente'}
                </span>
              </div>

              {/* Code Input */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Código do cliente (6 dígitos)
                </label>
                <input
                  ref={inputRef}
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  required
                  className="w-full text-center text-4xl font-black tracking-[0.5em] font-mono border-2 border-gray-200 rounded-2xl py-4 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 outline-none transition-all"
                  placeholder="000 000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.slice(0, 6))}
                />
                <p className="text-xs text-gray-400 text-center mt-2">
                  Peça ao cliente para mostrar o código no app
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-2xl border-2 border-gray-200 text-gray-600 font-bold text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className={`flex-2 w-full py-3 rounded-2xl text-white font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${actionColor}`}
                >
                  {loading ? 'Validando...' : actionLabel}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default QRScannerModal;
