import { supabase } from '@tgt/core';;

/**
 * Utilitário legado que agora roteia para as novas Edge Functions de IA (OpenAI)
 * para evitar crashes e manter compatibilidade.
 */

export const gemini = {
    /**
     * Melhora a bio do usuário usando a nova Edge Function ai-assistant (OpenAI).
     */
    async improveBio(currentBio: string): Promise<string> {
        if (!currentBio || currentBio.length < 10) {
            throw new Error("A bio atual é muito curta para ser melhorada.");
        }

        try {
            const { data, error } = await supabase.functions.invoke('ai-assistant', {
                body: { 
                    action: 'refine_bio',
                    content: currentBio,
                    context: 'Perfil de Profissional TGT'
                }
            });

            if (error) throw error;
            return data?.result || currentBio;
        } catch (err) {
            console.error('[IA] Erro ao melhorar bio:', err);
            throw new Error("Não foi possível melhorar sua bio no momento.");
        }
    },

    /**
     * Gera e-mail de reagendamento usando a nova Edge Function ai-assistant.
     */
    async generateRescheduleEmail(booking: { service_title: string; booking_date: string; booking_time: string }): Promise<string> {
        try {
            const content = `Agendamento recusado: ${booking.service_title} em ${booking.booking_date} às ${booking.booking_time}.`;
            const { data, error } = await supabase.functions.invoke('ai-assistant', {
                body: { 
                    action: 'suggest_chat_reply',
                    content: content,
                    context: 'Gerar e-mail de reagendamento educado para o cliente.'
                }
            });

            if (error) throw error;
            return data?.result || "Pedimos desculpas, mas não poderemos atender neste horário. Por favor, sugira uma nova data.";
        } catch (err) {
            console.error('[IA] Erro ao gerar e-mail:', err);
            return "Pedimos desculpas, mas não poderemos atender neste horário. Por favor, sugira uma nova data.";
        }
    },

    /**
     * Gera insights de faturamento (Simulado via OpenAI ou lógica simples até termos prompt específico)
     */
    async generateBillingTips(availableBalance: number, pendingBalance: number, transactions: any[]): Promise<string[]> {
        // Para faturamento, podemos retornar dicas estáticas ou chamar a função com contexto
        return [
            "Diversifique seus serviços para aumentar a frequência de vendas.",
            "Complete seu perfil 100% para ganhar mais confiança dos novos clientes."
        ];
    }
};
