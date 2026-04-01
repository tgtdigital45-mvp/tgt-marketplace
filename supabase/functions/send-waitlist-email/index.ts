import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

serve(async (req) => {
  const { record } = await req.json()

  // Enviar para o Administrador
  const notifyAdmin = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: 'CONTRATTO <onboarding@resend.dev>',
      to: 'tgtsolucoesdigitais@gmail.com',
      subject: `Novo Profissional na Waitlist: ${record.email}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 24px;">
          <h2 style="color: #1e293b; font-size: 24px; font-weight: 800; margin-bottom: 12px; tracking: -0.05em;">Novidade na Rede</h2>
          <p style="color: #64748b; font-size: 16px; margin-bottom: 24px;">Um novo e-mail acaba de ser cadastrado no sistema:</p>
          <div style="background-color: #f1f5f9; padding: 24px; border-radius: 16px; text-align: center;">
            <p style="margin: 0; font-size: 20px; font-weight: 700; color: #0284c7;">${record.email}</p>
          </div>
          <p style="font-size: 12px; color: #94a3b8; margin-top: 24px;">Enviado pela automação CONTRATTO Pro.</p>
        </div>
      `,
    }),
  })

  // Enviar para o Usuário (Boas-vindas)
  const welcomeUser = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: 'CONTRATTO Pro <onboarding@resend.dev>',
      to: [record.email],
      subject: 'Bem-vindo ao Futuro | Lista de Espera CONTRATTO',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #ffffff; border-radius: 32px; border: 1px solid #f1f5f9;">
          <div style="text-align: center; margin-bottom: 32px;">
            <div style="width: 48px; h-48: bg-blue-600; border-radius: 12px; padding: 10px; display: inline-block;">
                <span style="color: #ffffff; font-weight: 900; font-size: 24px;">C</span>
            </div>
          </div>
          <h1 style="color: #1e293b; text-align: center; font-size: 28px; font-weight: 800; margin-bottom: 16px; letter-spacing: -0.02em;">Obrigado por se inscrever!</h1>
          <p style="color: #475569; text-align: center; font-size: 16px; line-height: 1.6; margin-bottom: 32px;">
            Sua vaga na lista de espera para o <strong>CONTRATTO Pro</strong> está garantida. Estamos construindo a ferramenta mais avançada para os profissionais do futuro.
          </p>
          <div style="background-color: #f0f9ff; padding: 24px; border-radius: 20px; text-align: center;">
             <p style="margin: 0 0 8px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #0369a1; font-weight: 700;">Próximos Passos</p>
             <p style="margin: 0; color: #0284c7; font-weight: 600;">Fique atento ao seu e-mail para novidades exclusivas.</p>
          </div>
          <p style="font-size: 13px; color: #94a3b8; text-align: center; margin-top: 40px;">
            © 2026 CONTRATTO Hub. Todos os direitos reservados.
          </p>
        </div>
      `,
    }),
  })

  return new Response(JSON.stringify({ admin: await notifyAdmin.json(), user: await welcomeUser.json() }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
