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
      prompt = `Você é um assistente de escrita profissional para a plataforma TGT, um marketplace de serviços.
      Melhore o seguinte texto de apresentação de uma empresa/profissional, tornando-o mais persuasivo, profissional e claro em Português do Brasil.
      Mantenha um tom confiável e focado em converter clientes.
      
      Texto Original: ${content}
      ${context ? `Contexto adicional: ${context}` : ''}
      
      Retorne APENAS o texto aprimorado, sem introduções ou explicações.`;
    } else if (action === 'suggest_chat_reply') {
      prompt = `Você é um assistente de vendas no chat da plataforma TGT.
      Sugira uma resposta profissional e amigável para a última mensagem do cliente.
      Mantenha o foco em agendar o serviço ou esclarecer dúvidas de forma eficiente.
      
      Histórico/Contexto: ${context || 'N/A'}
      Mensagem do Cliente: ${content}
      
      Retorne APENAS a sugestão de resposta.`;
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
