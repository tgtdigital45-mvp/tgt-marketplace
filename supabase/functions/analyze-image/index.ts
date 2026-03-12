// @ts-ignore: Deno modules are resolved by Supabase at runtime
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// @ts-ignore: Deno namespace is available at runtime
serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { image, type } = await req.json();

    if (!image) {
      return new Response(JSON.stringify({ error: "Image data is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // @ts-ignore: Deno namespace is available at runtime
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY not configured in Edge Functions");
    }

    // Prepare prompt based on type (profile, cover, portfolio)
    const contextMap = {
      profile: "uma foto de perfil profissional para um prestador de serviços",
      cover: "uma imagem de capa para uma página de empresa de serviços",
      portfolio: "uma evidência de trabalho realizado (ex: foto de obra, serviço concluído)",
    };

    const context = contextMap[type as keyof typeof contextMap] || "uma imagem profissional";

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Você é um especialista em moderação e análise de qualidade de imagens para um marketplace de serviços profissionais (TGT). Sua resposta deve ser estritamente um JSON."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analise se esta imagem é adequada para ser usada como ${context}. 
                Verifique:
                1. Segurança: Contém conteúdo adulto, violento ou ofensivo?
                2. Contexto: É uma imagem real e profissional? Rejeite memes, desenhos irrelevantes ou fotos nitidamente amadoras que prejudiquem a credibilidade.
                3. Qualidade Técnica: A iluminação e nitidez são aceitáveis?
                
                Responda APENAS com um JSON no seguinte formato:
                {
                  "is_valid": boolean,
                  "reason": "Explicação curta em português caso seja inválida, ou 'Aprovada' caso válida",
                  "safety_score": float (0 a 1),
                  "quality_score": float (0 a 1)
                }`
              },
              {
                type: "image_url",
                image_url: {
                  url: image.startsWith("http") ? image : `data:image/jpeg;base64,${image}`
                }
              }
            ]
          }
        ],
        max_tokens: 300,
        response_format: { type: "json_object" }
      }),
    });

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message);
    }

    const analysis = JSON.parse(data.choices[0].message.content);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("Analysis Error:", err);
    return new Response(JSON.stringify({ 
      error: err.message,
      is_valid: true, // Fail open if IA fails to not block users, but log error
      reason: "Erro técnico na análise. Prosseguindo por precaução." 
    }), {
      status: 200, // Return 200 to not break frontend flow
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
