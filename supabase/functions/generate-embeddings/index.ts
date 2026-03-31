import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const { input, record, table, type } = payload;

    // Determine the text to embed
    let textToEmbed = input;
    
    // If it's a trigger for a service
    if (record && table === 'services') {
      textToEmbed = `${record.title}. ${record.description || ''}`;
    }

    if (!textToEmbed) {
       // Silent return if it's a trigger but no data (e.g. delete)
       if (record) return new Response(JSON.stringify({ message: 'Nothing to embed' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
       
       return new Response(JSON.stringify({ error: 'Input is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    // Call OpenAI for embedding
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: textToEmbed,
      }),
    });

    const openaiData = await response.json();

    if (openaiData.error) {
      throw new Error(openaiData.error.message);
    }

    const embedding = openaiData.data[0].embedding;

    // If it's a trigger, update the database directly
    if (record && table === 'services' && record.id) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
      
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { error: updateError } = await supabase
        .from('services')
        .update({ embedding })
        .eq('id', record.id);

      if (updateError) {
        console.error('Error updating service embedding:', updateError);
        throw updateError;
      }

      return new Response(JSON.stringify({ status: 'success', updated: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Otherwise just return the embedding (legacy behavior)
    return new Response(JSON.stringify({ embedding }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    console.error('Edge Function Error:', err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
