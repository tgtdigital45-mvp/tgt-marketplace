import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * OrderQRCode - Gerador de QR Code TOTP para check-in do profissional.
 *
 * Como funciona:
 * 1. O cliente recebe este componente na página do pedido.
 * 2. O componente gera um QR Code que muda a cada 30 segundos (TOTP-like).
 * 3. O profissional escaneia o QR Code com o app para confirmar o check-in.
 * 4. O sistema valida o código e atualiza o status do pedido para "checked_in".
 *
 * Segurança:
 * - O código muda a cada 30 segundos → impossível usar screenshots antigas.
 * - O código é gerado no frontend mas validado no backend (Edge Function).
 * - O backend só aceita o código se ele for o código atual do pedido (±30s de margin).
 */

interface OrderQRCodeProps {
  orderId: string;
  serviceTitle: string;
  scheduledFor?: string;
  onCheckinConfirmed?: () => void;
}

// Gera um hash simples baseado em orderId + janela de tempo (30s)
// O servidor usa a mesma lógica para validar
const generateTOTPLikeCode = (orderId: string): string => {
  const timeWindow = Math.floor(Date.now() / 30000); // Muda a cada 30s
  const seed = `${orderId}-${timeWindow}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Retorna um código numérico de 6 dígitos
  return Math.abs(hash % 1000000).toString().padStart(6, '0');
};

// Tempo restante na janela de 30s atual
const getTimeRemaining = (): number => {
  return 30 - (Math.floor(Date.now() / 1000) % 30);
};

const OrderQRCode: React.FC<OrderQRCodeProps> = ({
  orderId,
  serviceTitle,
  scheduledFor,
  onCheckinConfirmed,
}) => {
  const [code, setCode] = useState(() => generateTOTPLikeCode(orderId));
  const [timeLeft, setTimeLeft] = useState(getTimeRemaining);
  const [checkinStatus, setCheckinStatus] = useState<'waiting' | 'scanning' | 'confirmed' | 'error'>('waiting');

  // Atualiza o código e o contador regressivo
  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = getTimeRemaining();
      setTimeLeft(remaining);
      if (remaining === 30) {
        // Nova janela de 30s → novo código
        setCode(generateTOTPLikeCode(orderId));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [orderId]);

  // Gera a URL do QR Code via API pública (sem dependência de lib)
  const qrPayload = JSON.stringify({
    orderId,
    code,
    ts: Math.floor(Date.now() / 30000), // time window
  });
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(qrPayload)}&color=0a1628&bgcolor=ffffff&qzone=2`;

  // Progresso da janela de tempo (para a barra visual)
  const progressPercent = ((30 - timeLeft) / 30) * 100;
  const isExpiringSoon = timeLeft <= 8;

  return (
    <div className="w-full max-w-sm mx-auto">
      <AnimatePresence mode="wait">
        {checkinStatus === 'confirmed' ? (
          <motion.div
            key="confirmed"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center p-8 bg-green-50 rounded-3xl border border-green-200"
          >
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-green-800 mb-2">Check-in Confirmado!</h3>
            <p className="text-green-600 text-sm">O profissional chegou. O serviço está em andamento.</p>
          </motion.div>
        ) : (
          <motion.div key="qr" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-5">
            {/* Header */}
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">QR Code de Check-in</p>
              <h3 className="text-lg font-bold text-gray-900 leading-tight">{serviceTitle}</h3>
              {scheduledFor && (
                <p className="text-sm text-gray-500 mt-1">
                  {new Date(scheduledFor).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                </p>
              )}
            </div>

            {/* QR Code */}
            <motion.div
              key={code}
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 1 }}
              className="relative inline-block"
            >
              <div className={`p-3 rounded-3xl border-4 transition-colors ${isExpiringSoon ? 'border-amber-400 bg-amber-50' : 'border-gray-100 bg-white'} shadow-xl`}>
                <img
                  src={qrUrl}
                  alt="QR Code para check-in"
                  className="w-52 h-52 rounded-xl"
                />
              </div>
              {/* Countdown badge */}
              <div className={`absolute -top-3 -right-3 w-12 h-12 rounded-full flex items-center justify-center text-lg font-black shadow-md transition-colors ${isExpiringSoon ? 'bg-amber-400 text-white' : 'bg-gray-900 text-white'}`}>
                {timeLeft}
              </div>
            </motion.div>

            {/* Progress bar */}
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <motion.div
                className={`h-2 rounded-full transition-colors ${isExpiringSoon ? 'bg-amber-400' : 'bg-brand-primary'}`}
                style={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>

            {/* Code display */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <p className="text-xs text-gray-400 mb-2 uppercase tracking-widest">Código atual</p>
              <p className="text-4xl font-black text-gray-900 tracking-[0.5em] font-mono">
                {code.slice(0,3)} {code.slice(3)}
              </p>
              <p className="text-xs text-gray-400 mt-2">Renova a cada 30 segundos • Não compartilhe screenshots</p>
            </div>

            {/* Instructions */}
            <div className="text-left bg-blue-50 rounded-2xl p-4 border border-blue-100 space-y-2">
              <div className="flex items-start gap-2 text-sm text-blue-700">
                <span className="font-bold text-blue-500 mt-0.5">1.</span>
                Quando o profissional chegar, mostre este QR Code.
              </div>
              <div className="flex items-start gap-2 text-sm text-blue-700">
                <span className="font-bold text-blue-500 mt-0.5">2.</span>
                Ele escaneará pelo app para confirmar o início do serviço.
              </div>
              <div className="flex items-start gap-2 text-sm text-blue-700">
                <span className="font-bold text-blue-500 mt-0.5">3.</span>
                Após o serviço, um novo código será gerado para o check-out.
              </div>
            </div>

            {/* Simulated check-in for demo — in production, this fires via realtime */}
            <button
              onClick={() => { setCheckinStatus('confirmed'); onCheckinConfirmed?.(); }}
              className="w-full py-3 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              [Dev] Simular confirmação de check-in →
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OrderQRCode;
