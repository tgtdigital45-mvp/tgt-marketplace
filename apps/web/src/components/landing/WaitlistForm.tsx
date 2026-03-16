import React, { useState } from 'react';
import { supabase } from '@tgt/core';;
import Button from '../ui/Button';
import Input from '../ui/Input';
import { toast } from 'react-hot-toast';

interface WaitlistFormProps {
  userType?: 'provider' | 'customer';
  source?: 'web' | 'mobile';
  className?: string;
}

export const WaitlistForm: React.FC<WaitlistFormProps> = ({ 
  userType, 
  source = 'web',
  className = ''
}) => {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [joined, setJoined] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('waitlist')
        .insert([
          { 
            email, 
            full_name: fullName, 
            user_type: userType,
            source,
            metadata: {
              submitted_at: new Date().toISOString(),
              url: window.location.href
            }
          }
        ]);

      if (error) {
        if (error.code === '23505') {
          toast.success('Você já está na nossa lista de espera! 😉');
          setJoined(true);
        } else {
          throw error;
        }
      } else {
        toast.success('Bem-vindo à TGT! Avisaremos você em breve.');
        setJoined(true);
      }
    } catch (error) {
      console.error('Error joining waitlist:', error);
      toast.error('Ocorreu um erro. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  if (joined) {
    return (
      <div className={`text-center p-4 bg-primary/10 rounded-lg animate-in fade-in duration-500 ${className}`}>
        <h4 className="text-lg font-semibold text-primary mb-2">🎉 Você está na lista!</h4>
        <p className="text-sm text-muted-foreground">
          Obrigado pelo seu interesse. Você será o primeiro a saber das novidades da TGT.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <label htmlFor="waitlist-email" className="text-sm font-medium text-muted-foreground mb-1">
          Faça parte do futuro dos marketplaces de serviços:
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            id="waitlist-email"
            type="email"
            placeholder="Seu melhor e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="flex-1"
            disabled={loading}
          />
          <Button type="submit" disabled={loading} className="whitespace-nowrap">
            {loading ? 'Entrando...' : 'Entrar na Lista'}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">
          Ao clicar, você concorda em receber atualizações da TGT. Prometemos não enviar spam.
        </p>
      </form>
    </div>
  );
};
