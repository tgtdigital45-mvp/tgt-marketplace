import React, { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '@tgt/shared';
import { useToast } from '@/contexts/ToastContext';

interface AiAssistButtonProps {
  content: string;
  onRefine: (refinedText: string) => void;
  action?: 'refine_bio' | 'suggest_chat_reply';
  context?: string;
  className?: string;
}

const AiAssistButton: React.FC<AiAssistButtonProps> = ({ 
  content, 
  onRefine, 
  action = 'refine_bio',
  context,
  className = ''
}) => {
  const [isRefining, setIsRefining] = useState(false);
  const { addToast } = useToast();

  const handleAiRefine = async () => {
    if (!content || content.length < 10) {
      addToast('Escreva pelo menos um rascunho curto para a IA poder ajudar.', 'info');
      return;
    }

    setIsRefining(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: { 
          action,
          content,
          context: context || 'Plataforma TGT - Marketplace de Serviços'
        }
      });

      if (error) throw error;

      if (data?.result) {
        onRefine(data.result);
        addToast('Texto aprimorado com sucesso!', 'success');
      }
    } catch (err) {
      console.error('AI Refine Error:', err);
      addToast('Erro ao processar com IA. Tente novamente mais tarde.', 'error');
    } finally {
      setIsRefining(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleAiRefine}
      disabled={isRefining}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-primary bg-brand-primary/10 hover:bg-brand-primary/20 rounded-full transition-all border border-brand-primary/20 ${className} disabled:opacity-50`}
      title="Melhorar texto com IA ✨"
    >
      {isRefining ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Sparkles className="w-3.5 h-3.5" />
      )}
      {isRefining ? 'Processando...' : 'Melhorar com IA'}
    </button>
  );
};

export default AiAssistButton;
