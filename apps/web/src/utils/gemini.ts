import { GoogleGenAI } from "@google/genai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: API_KEY });

/**
 * Utilitário para executar tarefas com o Gemini com Exponential Backoff
 */
async function runWithRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
    let lastError: any;
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (err: any) {
            lastError = err;
            // 429 is the Rate Limit error code for Gemini API
            if (err.message?.includes('429') || err.status === 429) {
                const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
                console.warn(`Gemini rate limited. Retrying in ${Math.round(delay)}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }
            throw err;
        }
    }
    throw lastError;
}

export const gemini = {
    /**
     * Melhora a bio do usuário focando em vendas e persuasão.
     */
    async improveBio(currentBio: string): Promise<string> {
        if (!currentBio || currentBio.length < 10) {
            throw new Error("A bio atual é muito curta para ser melhorada.");
        }

        return runWithRetry(async () => {
            const prompt = `Você é um especialista em marketing e vendas. 
      Sua tarefa é reescrever a 'bio' abaixo para que ela seja mais persuasiva, profissional e focada em converter visitantes em clientes para um prestador de serviços.
      Mantenha o tom profissional mas amigável. Use gatilhos mentais de autoridade e confiança.
      Retorne APENAS o texto da nova bio, sem comentários adicionais.
      
      Bio atual: "${currentBio}"`;

            const result = await ai.models.generateContent({
                model: "gemini-3-flash-preview",
                contents: prompt
            });
            return result.text.trim();
        });
    },

    /**
     * Gera um e-mail educado de reagendamento para um booking recusado.
     */
    async generateRescheduleEmail(booking: { service_title: string; booking_date: string; booking_time: string }): Promise<string> {
        return runWithRetry(async () => {
            const prompt = `Você é um assistente de atendimento ao cliente amigável.
      Um agendamento para o serviço "${booking.service_title}" no dia ${booking.booking_date} às ${booking.booking_time} foi recusado por conflito de agenda.
      Escreva um e-mail educado para o cliente explicando que infelizmente não podemos atender nesse horário específico, mas que gostaríamos muito de atendê-lo em outro momento. 
      Peça para ele sugerir um novo horário ou verificar a agenda novamente.
      Retorne APENAS o corpo do e-mail, de forma concisa e profissional.`;

            const result = await ai.models.generateContent({
                model: "gemini-3-flash-preview",
                contents: prompt
            });
            return result.text.trim();
        });
    },

    /**
     * Gera insights de faturamento baseados em dados de carteira e transações.
     */
    async generateBillingTips(wallet: { balance: number; pending_balance: number }, transactions: any[]): Promise<string[]> {
        return runWithRetry(async () => {
            // Resumo simplificado das transações para contexto
            const recentTrxSummary = transactions.slice(0, 5).map(t => `${t.description}: R$${t.amount} (${t.type})`).join("; ");

            const prompt = `Você é um consultor financeiro para pequenos empreendedores e prestadores de serviços.
      Dados Atuais:
      - Saldo Disponível: R$ ${wallet.balance}
      - Saldo Pendente: R$ ${wallet.pending_balance}
      - Transações Recentes: ${recentTrxSummary}

      Com base nesses dados (ou na ausência de movimentação significativa), gere 2 dicas práticas e curtas (máximo 2 frases cada) para este profissional aumentar seu faturamento ou gerir melhor suas finanças na plataforma CONTRATTO.
      Retorne as dicas em um formato de lista simples, separadas por uma quebra de linha, sem numeração ou introdução.`;

            const result = await ai.models.generateContent({
                model: "gemini-3-flash-preview",
                contents: prompt
            });
            const tips = result.text.trim().split('\n').filter(t => t.trim().length > 0);
            return tips.slice(0, 2); // Garantir que retornamos apenas 2
        });
    }
};
