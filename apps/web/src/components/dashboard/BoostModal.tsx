import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@tgt/ui-web';
import { 
  X, 
  Sparkles, 
  Zap, 
  TrendingUp, 
  Building2, 
  CheckCircle2, 
  ArrowRight,
  Target
} from 'lucide-react';

interface BoostModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceTitle?: string;
  onConfirm: (type: 'service' | 'company') => void;
}

const BoostModal: React.FC<BoostModalProps> = ({ 
  isOpen, 
  onClose, 
  serviceTitle,
  onConfirm 
}) => {
  const [selectedType, setSelectedType] = React.useState<'service' | 'company' | null>(serviceTitle ? 'service' : 'company');

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800"
          >
            {/* Header com Gradiente */}
            <div className="relative h-32 bg-gradient-to-br from-indigo-600 via-blue-600 to-emerald-500 p-8 flex flex-col justify-end">
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
              >
                <X size={20} />
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 backdrop-blur-md rounded-xl">
                  <Sparkles size={24} className="text-amber-300" fill="currentColor" />
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight">Impulsionar Negócio</h2>
              </div>
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-1">
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  Aumente sua visibilidade no marketplace e receba até 4x mais cliques nos seus serviços.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Opção 1: Serviço Específico */}
                {serviceTitle && (
                  <button
                    onClick={() => setSelectedType('service')}
                    className={`relative p-6 text-left rounded-3xl border-2 transition-all group ${
                      selectedType === 'service' 
                        ? 'border-blue-500 bg-blue-50/30 dark:bg-blue-500/5' 
                        : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className={`p-3 rounded-2xl mb-4 w-fit transition-colors ${
                      selectedType === 'service' ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}>
                      <Zap size={24} />
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white mb-1">Este Serviço</h3>
                    <p className="text-xs text-slate-500 line-clamp-1 mb-4 italic">"{serviceTitle}"</p>
                    <ul className="space-y-2 mb-6">
                      <li className="flex items-center gap-2 text-[10px] font-bold text-slate-600 dark:text-slate-400">
                        <CheckCircle2 size={12} className="text-emerald-500" /> TOPO DA CATEGORIA
                      </li>
                      <li className="flex items-center gap-2 text-[10px] font-bold text-slate-600 dark:text-slate-400">
                        <CheckCircle2 size={12} className="text-emerald-500" /> BADGE EXCLUSIVO
                      </li>
                    </ul>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-blue-600">R$ 19,90 /mês</span>
                      {selectedType === 'service' && <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />}
                    </div>
                  </button>
                )}

                {/* Opção 2: Perfil Completo */}
                <button
                  onClick={() => setSelectedType('company')}
                  className={`relative p-6 text-left rounded-3xl border-2 transition-all group ${
                    selectedType === 'company' 
                      ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-500/5' 
                      : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                  }`}
                >
                  <div className={`p-3 rounded-2xl mb-4 w-fit transition-colors ${
                    selectedType === 'company' ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}>
                    <Building2 size={24} />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white mb-1">Perfil Completo</h3>
                  <p className="text-xs text-slate-500 mb-4">Destaque sua empresa em todas as buscas.</p>
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-center gap-2 text-[10px] font-bold text-slate-600 dark:text-slate-400">
                      <CheckCircle2 size={12} className="text-emerald-500" /> TODA A EMPRESA VIP
                    </li>
                    <li className="flex items-center gap-2 text-[10px] font-bold text-slate-600 dark:text-slate-400">
                      <CheckCircle2 size={12} className="text-emerald-500" /> VITRINE RECOMENDADA
                    </li>
                  </ul>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-emerald-600">R$ 49,90 /mês</span>
                    {selectedType === 'company' && <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />}
                  </div>
                </button>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl flex gap-3 border border-slate-100 dark:border-slate-800">
                <TrendingUp className="text-blue-500 flex-shrink-0" size={20} />
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-normal">
                  Ao impulsionar, seu serviço ou perfil receberá o selo <span className="font-bold text-amber-500">Patrocinado</span> e será priorizado nos algoritmos de busca e recomendação do marketplace.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button 
                  variant="secondary" 
                  onClick={onClose}
                  className="flex-1 !rounded-2xl py-4 h-auto text-sm font-bold order-2 sm:order-1"
                >
                  Agora não
                </Button>
                <Button 
                  onClick={() => selectedType && onConfirm(selectedType)}
                  disabled={!selectedType}
                  className="flex-[2] !rounded-2xl py-4 h-auto text-sm font-black bg-slate-900 hover:bg-slate-800 text-white shadow-xl shadow-blue-500/10 order-1 sm:order-2 group"
                >
                  Ativar Impulsionamento
                  <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default BoostModal;
