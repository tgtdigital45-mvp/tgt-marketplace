import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

import { checkRateLimit } from '../_shared/rate-limit.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Proteção contra abuso de IA: 3 requisições a cada 60 segundos
  const rateLimitResponse = await checkRateLimit(req, 'ai-assistant', 3, 60);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { action, content, context } = await req.json();

    if (!action || !content) {
      return new Response(JSON.stringify({ error: 'Action and content are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    let prompt = '';
    
    if (action === 'refine_bio') {
      prompt = `Você é um assistente de escrita amigável e entusiasmado para a plataforma TGT, um marketplace de serviços.
      Melhore o seguinte texto de apresentação de uma empresa/profissional em Português do Brasil.
      O objetivo é ser persuasivo, mas manter um tom caloroso e convidativo que conecte com humanos.
      
      Texto Original: ${content}
      ${context ? `Contexto adicional: ${context}` : ''}
      
      Retorne APENAS o texto aprimorado, sem introduções ou explicações.`;
    } else if (action === 'suggest_chat_reply') {
      prompt = `Você é um assistente de vendas amigável no chat da plataforma TGT.
      Sugira uma resposta calorosa e profissional para a última mensagem do cliente.
      Mantenha o foco em ser útil e facilitar o agendamento de forma leve.
      
      Histórico/Contexto: ${context || 'N/A'}
      Mensagem do Cliente: ${content}
      
      Retorne APENAS a sugestão de resposta.`;
    } else if (action === 'generate_service_description') {
      prompt = `Você é um especialista em marketing para prestadores de serviço na plataforma TGT.
      Crie uma descrição atraente e amigável (em 2 ou 3 parágrafos) para o seguinte serviço:
      
      Título do Serviço: ${content}
      Categoria: ${context || 'Geral'}
      
      Destaque os benefícios, use um tom proativo e termine com uma frase convidativa.
      Retorne APENAS a descrição, sem títulos ou introduções.`;
    } else if (action === 'suggest_tags') {
      prompt = `Sugira entre 5 e 8 tags relevantes (palavras-chave curtas) para o seguinte serviço no marketplace TGT:
      
      Serviço: ${content}
      Contexto: ${context || ''}
      
      Retorne as tags separadas por vírgula em uma única linha. Ex: tag1, tag2, tag3.
      Não use hashtags.`;
    } else if (action === 'audit_profile') {
      prompt = `Você é um consultor de sucesso para empresas na plataforma TGT. Analise os seguintes dados de perfil e dê sugestões amigáveis de melhoria:
      
      Dados: ${content}
      
      Sua resposta deve ser estruturada em 3 partes:
      1. Pontos Fortes (O que está legal).
      2. Oportunidades (O que pode melhorar).
      3. Dica de Ouro (Uma ação prática imediata).
      
      Mantenha o tom motivador e construtivo.`;
    } else {
      throw new Error('Invalid action');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Você é um assistente especializado em Português do Brasil.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    return new Response(JSON.stringify({ result: data.choices[0].message.content }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
