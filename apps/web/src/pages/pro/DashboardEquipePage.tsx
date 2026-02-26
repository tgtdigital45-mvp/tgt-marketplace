import React from 'react';
import Button from '@/components/ui/Button';
import { motion } from 'framer-motion';
import {
  ChevronRight,
  Users,
  Mail,
  Shield,
  BarChart3,
  Target,
  Sparkles,
} from 'lucide-react';

const ROADMAP = [
  { icon: <Mail size={14} />, label: 'Convite de novos membros por e-mail' },
  { icon: <Shield size={14} />, label: 'Cargos e permissoes personalizadas' },
  { icon: <BarChart3 size={14} />, label: 'Historico de atividades por membro' },
  { icon: <Target size={14} />, label: 'Metas individuais e coletivas' },
];

const DashboardEquipePage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-5 sm:space-y-6">

      {/* ─── Page Header ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
          <span>Dashboard</span><ChevronRight size={12} />
          <span className="text-gray-600 font-medium">Equipe</span>
        </div>
        <div className="flex items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Gestao de Equipe</h1>
          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full uppercase tracking-wider">
            Em breve
          </span>
        </div>
      </motion.div>

      {/* ─── Coming Soon Card ────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 sm:p-8 lg:p-10 relative overflow-hidden"
      >
        <div className="relative z-10 text-center max-w-lg mx-auto">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-5 backdrop-blur-sm border border-white/10">
            <Users size={28} className="text-white" />
          </div>

          <h2 className="text-lg sm:text-xl font-bold text-white mb-3">
            Estamos construindo algo especial
          </h2>
          <p className="text-sm text-white/60 leading-relaxed mb-6">
            Em breve voce podera gerenciar seu time, definir permissoes e acompanhar o desempenho de cada membro — tudo dentro da CONTRATTO.
          </p>

          <Button
            onClick={() => window.open('mailto:contato@contratto.com?subject=Interesse%20em%20Gestao%20de%20Equipe', '_blank')}
            variant="outline"
            size="sm"
            className="!rounded-xl !border-white/20 !text-white hover:!bg-white/10"
          >
            <Sparkles size={14} className="mr-1.5 text-amber-400" />
            Quero ser notificado
          </Button>
        </div>

        {/* Decorative elements */}
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-secondary-500/10 rounded-full blur-3xl" />
      </motion.div>

      {/* ─── Roadmap ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6"
      >
        <h3 className="text-sm font-bold text-gray-900 mb-4">O que vem por ai</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ROADMAP.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + idx * 0.08 }}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center flex-shrink-0">
                {item.icon}
              </div>
              <span className="text-xs sm:text-sm text-gray-600 font-medium">{item.label}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default DashboardEquipePage;
