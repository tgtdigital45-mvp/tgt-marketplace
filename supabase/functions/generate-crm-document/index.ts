// @ts-nocheck - Deno Edge Function
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { jsPDF } from "https://esm.sh/jspdf@2.5.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 200 })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { orderId, quoteId, type } = await req.json()
    const authHeader = req.headers.get('Authorization')!
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''))

    if (userError || !user) throw new Error('Unauthorized')

    // 1. Fetch Data
    let subjectData;
    let company;
    let customer;

    if (orderId) {
      const { data, error } = await supabaseClient
        .from('orders')
        .select('*, services(*, companies(*)), buyer:buyer_id(*)')
        .eq('id', orderId)
        .single()
      if (error) throw error
      subjectData = data
      company = data.services?.companies
      customer = data.buyer
    } else if (quoteId) {
      const { data, error } = await supabaseClient
        .from('quotes')
        .select('*, services(*, companies(*)), user:user_id(*)')
        .eq('id', quoteId)
        .single()
      if (error) throw error
      subjectData = data
      company = data.services?.companies
      customer = data.user
    } else {
      throw new Error('Missing orderId or quoteId')
    }

    if (!company) throw new Error('Company not found')

    // 2. Generate PDF
    const doc = new jsPDF()
    const title = type === 'proposal' ? 'PROPOSTA COMERCIAL' : 'CONTRATO DE SERVIÇO'
    
    // Header
    doc.setFontSize(22)
    doc.setTextColor(40, 40, 40)
    doc.text(company.company_name || 'Empresa', 20, 30)
    
    doc.setFontSize(10)
    doc.setTextColor(150, 150, 150)
    doc.text(title, 20, 40)
    
    // Line Separator
    doc.setDrawColor(230, 230, 230)
    doc.line(20, 45, 190, 45)

    // Customer Info
    doc.setFontSize(12)
    doc.setTextColor(80, 80, 80)
    doc.text('PARA:', 20, 60)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(0, 0, 0)
    doc.text(customer?.full_name || 'Cliente', 20, 68)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    doc.text(customer?.email || '', 20, 75)

    // Service Info
    doc.setFontSize(12)
    doc.setTextColor(80, 80, 80)
    doc.text('DETALHES DO SERVIÇO:', 20, 95)
    
    doc.setFontSize(14)
    doc.setTextColor(0, 0, 0)
    doc.text(subjectData.service_title || subjectData.services?.title || 'Serviço Personalizado', 20, 105)
    
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    const description = subjectData.description || 'Descrição do serviço conforme acordado.'
    const splitDescription = doc.splitTextToSize(description, 170)
    doc.text(splitDescription, 20, 115)

    // Values
    const price = subjectData.price || subjectData.budget_expectation || 0
    doc.setFontSize(16)
    doc.setTextColor(0, 0, 0)
    doc.text(`VALOR TOTAL: R$ ${price.toLocaleString('pt-BR')}`, 20, 150)

    // Footer
    doc.setFontSize(8)
    doc.setTextColor(180, 180, 180)
    doc.text(`Gerado via CONTRATTO CRM em ${new Date().toLocaleDateString('pt-BR')}`, 20, 280)
    doc.text(`ID do Documento: ${crypto.randomUUID()}`, 20, 285)

    const pdfBuffer = doc.output('arraybuffer')

    // 3. Upload to Storage
    const fileName = `${type}_${Date.now()}.pdf`
    const filePath = `${company.id}/${customer.id}/${fileName}`

    const { error: uploadError } = await supabaseClient.storage
      .from('crm_documents')
      .upload(filePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true
      })

    if (uploadError) throw uploadError

    // 4. Save to Database
    const { data: docRecord, error: dbError } = await supabaseClient
      .from('crm_documents')
      .insert({
        company_id: company.id,
        customer_id: customer.id,
        order_id: orderId || null,
        quote_id: quoteId || null,
        name: `${title} - ${customer.full_name}`,
        file_path: filePath,
        type: type,
        status: 'draft',
        metadata: { generated_at: new Date().toISOString() }
      })
      .select()
      .single()

    if (dbError) throw dbError

    return new Response(
      JSON.stringify(docRecord),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('Document generation error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
