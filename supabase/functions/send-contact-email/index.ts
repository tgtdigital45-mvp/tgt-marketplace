import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

serve(async (req) => {
  const { record } = await req.json()

  // 1. Notificar Administrador
  const notifyAdmin = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: 'Sistema CONTRATTO <onboarding@resend.dev>',
      to: 'tgtsolucoesdigitais@gmail.com',
      subject: `[Suporte Pro] Nova Mensagem: ${record.subject}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 24px;">
          <h2 style="color: #1e293b; font-size: 24px; font-weight: 800; margin-bottom: 24px;">Novo Contato Recebido (Pro)</h2>
          <div style="background-color: #f8fafc; padding: 24px; border-radius: 16px; margin-bottom: 24px;">
            <p style="margin: 0 0 12px 0;"><strong>Nome:</strong> ${record.full_name}</p>
            <p style="margin: 0 0 12px 0;"><strong>E-mail:</strong> ${record.email}</p>
            <p style="margin: 0 0 12px 0;"><strong>Assunto:</strong> ${record.subject}</p>
            <p style="margin: 0;"><strong>Mensagem:</strong></p>
            <p style="color: #475569; line-height: 1.6; background: #fff; padding: 15px; border-radius: 8px; border: 1px solid #edf2f7;">${record.message}</p>
          </div>
          <p style="font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">Este é um envio automático do ecossistema CONTRATTO.</p>
        </div>
      `,
    }),
  })

  // 2. Confirmação para o Usuário
  const confirmUser = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: 'CONTRATTO Support <onboarding@resend.dev>',
      to: record.email,
      subject: 'Recebemos sua solicitação de atendimento',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #ffffff; border-radius: 32px; border: 1px solid #f1f5f9;">
          <div style="text-align: left; margin-bottom: 32px;">
            <div style="background-color: #2563eb; width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                <span style="color: white; font-weight: 900; font-size: 20px; line-height: 40px; width: 100%; text-align: center; display: block;">C</span>
            </div>
          </div>
          <h1 style="color: #1e293b; font-size: 24px; font-weight: 800; margin-bottom: 16px; letter-spacing: -0.02em;">Olá, ${record.full_name}.</h1>
          <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
            Recebemos sua mensagem sobre <strong>"${record.subject}"</strong>. Nosso time de Customer Success já foi notificado e entrará em contato com você em breve.
          </p>
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 16px; border-left: 4px solid #2563eb;">
            <p style="margin: 0; font-size: 14px; color: #64748b; font-style: italic;">
              "Aguarde um retorno em até 24h úteis no seu e-mail corporativo."
            </p>
          </div>
          <p style="font-size: 13px; color: #94a3b8; margin-top: 40px; border-top: 1px solid #f1f5f9; pt-20: padding-top: 20px;">
            Atenciosamente,<br />
            <strong>Equipe CONTRATTO Pro</strong>
          </p>
        </div>
      `,
    }),
  })

  return new Response(JSON.stringify({ 
    admin: await notifyAdmin.json(), 
    user: await confirmUser.json() 
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
