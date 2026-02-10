# Guia de Teste do Webhook Stripe

## 🎯 Objetivo

Validar localmente a integração do webhook Stripe antes de deploy em produção.

---

## 📋 Pré-requisitos

1. **Stripe CLI instalado**
   ```bash
   # Windows (via Scoop)
   scoop install stripe
   
   # macOS (via Homebrew)
   brew install stripe/stripe-cli/stripe
   
   # Linux
   # Baixar de: https://github.com/stripe/stripe-cli/releases
   ```

2. **Autenticar Stripe CLI**
   ```bash
   stripe login
   ```

3. **Supabase local rodando**
   ```bash
   npx supabase start
   ```

---

## 🧪 Método 1: Teste com Stripe CLI (Recomendado)

### Passo 1: Iniciar Listener

```bash
# Terminal 1: Iniciar o listener do webhook
stripe listen --forward-to http://localhost:54321/functions/v1/handle-payment-webhook
```

**Saída esperada:**
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx (^C to quit)
```

⚠️ **IMPORTANTE:** Copie o `webhook signing secret` e configure no Supabase:

```bash
# Adicionar ao arquivo .env local do Supabase
echo "STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx" >> supabase/.env.local

# Reiniciar Supabase para aplicar
npx supabase functions deploy handle-payment-webhook --no-verify-jwt
```

### Passo 2: Disparar Evento de Teste

```bash
# Terminal 2: Disparar evento checkout.session.completed
stripe trigger checkout.session.completed
```

### Passo 3: Verificar Logs

```bash
# Terminal 3: Ver logs da Edge Function
npx supabase functions logs handle-payment-webhook --tail
```

**Logs esperados (formato JSON):**
```json
{
  "timestamp": "2026-02-09T22:45:00.000Z",
  "level": "info",
  "message": "Webhook signature validated successfully",
  "context": {
    "event_type": "checkout.session.completed"
  }
}
```

---

## 🧪 Método 2: Teste Manual com cURL

### Criar Evento de Teste

```bash
# 1. Criar um pedido de teste no banco
# Execute no Supabase SQL Editor:
INSERT INTO orders (id, buyer_id, seller_id, service_id, service_title, price, agreed_price, status)
VALUES (
  'test-order-curl-001',
  (SELECT id FROM profiles WHERE email = 'comprador@test.com' LIMIT 1),
  (SELECT id FROM profiles WHERE email = 'vendedor@test.com' LIMIT 1),
  (SELECT id FROM services LIMIT 1),
  'Teste de Webhook',
  10000,
  10000,
  'pending'
);

# 2. Enviar webhook simulado
curl -X POST http://localhost:54321/functions/v1/handle-payment-webhook \
  -H "Content-Type: application/json" \
  -H "stripe-signature: whsec_test_fake_signature" \
  -d '{
    "type": "checkout.session.completed",
    "data": {
      "object": {
        "id": "cs_test_curl_001",
        "amount_total": 10000,
        "url": "https://checkout.stripe.com/receipt/test",
        "metadata": {
          "order_id": "test-order-curl-001"
        }
      }
    }
  }'
```

**⚠️ Nota:** Este método NÃO valida a assinatura Stripe (retornará 401 em produção).

---

## ✅ Cenários de Teste

### 1️⃣ Teste de Idempotência

**Objetivo:** Garantir que eventos duplicados não processam 2x.

```bash
# Enviar o mesmo evento 2 vezes
stripe trigger checkout.session.completed
# Aguardar 2 segundos
sleep 2
stripe trigger checkout.session.completed
```

**Verificação:**
```sql
-- Deve haver apenas 1 transação criada
SELECT COUNT(*) FROM transactions WHERE type = 'credit';
-- Resultado esperado: 1

-- Saldo não deve duplicar
SELECT pending_balance FROM wallets WHERE user_id = 'uuid-do-vendedor';
-- Resultado esperado: 8500 (não 17000)
```

### 2️⃣ Teste de Assinatura Inválida

**Objetivo:** Verificar que webhooks sem assinatura são rejeitados.

```bash
curl -X POST http://localhost:54321/functions/v1/handle-payment-webhook \
  -H "Content-Type: application/json" \
  -d '{"type": "test"}'
```

**Resposta esperada:**
```json
{
  "error": "Missing signature"
}
```
- Status HTTP: `401 Unauthorized`

### 3️⃣ Teste de Logs Estruturados

**Objetivo:** Validar formato JSON dos logs.

```bash
# Disparar evento
stripe trigger checkout.session.completed

# Ver logs
npx supabase functions logs handle-payment-webhook --tail | jq
```

**Formato esperado:**
```json
{
  "timestamp": "2026-02-09T22:45:00.000Z",
  "level": "info",
  "message": "Order updated successfully",
  "context": {
    "session_id": "cs_test_...",
    "order_id": "uuid-...",
    "payment_status": "paid"
  }
}
```

---

## 🔍 Comandos de Verificação

### Verificar Pedidos Processados
```sql
SELECT id, payment_status, stripe_session_id, amount_total, created_at
FROM orders
WHERE payment_status = 'paid'
ORDER BY created_at DESC
LIMIT 5;
```

### Verificar Transações Criadas
```sql
SELECT t.id, t.order_id, t.amount, t.type, t.status, t.created_at
FROM transactions t
WHERE t.type = 'credit'
ORDER BY t.created_at DESC
LIMIT 5;
```

### Verificar Saldos das Carteiras
```sql
SELECT w.user_id, w.pending_balance, w.available_balance, p.full_name
FROM wallets w
JOIN profiles p ON p.id = w.user_id
ORDER BY w.updated_at DESC
LIMIT 5;
```

---

## 🚀 Deploy para Produção

### 1. Configurar Webhook Secret no Supabase

```bash
# No Dashboard do Supabase:
# 1. Ir em: Edge Functions → handle-payment-webhook → Settings
# 2. Adicionar variável de ambiente:
#    STRIPE_WEBHOOK_SECRET = whsec_xxxxxxxxxxxxxx
```

### 2. Configurar Endpoint no Stripe Dashboard

1. Acessar: [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Clicar em "Add endpoint"
3. URL: `https://SEU_PROJETO.supabase.co/functions/v1/handle-payment-webhook`
4. Eventos: Selecionar `checkout.session.completed`
5. Copiar o `Signing secret` e adicionar no Supabase

### 3. Testar em Produção

```bash
# Fazer um checkout real de teste
# Verificar logs no Dashboard Supabase
```

---

## 📊 Checklist Final

- [ ] Stripe CLI instalado e autenticado
- [ ] Listener do webhook funcionando localmente
- [ ] `STRIPE_WEBHOOK_SECRET` configurado
- [ ] Teste de idempotência passou
- [ ] Teste de assinatura inválida retorna 401
- [ ] Logs estruturados em JSON
- [ ] Pedidos sendo atualizados corretamente
- [ ] Saldos sendo creditados sem duplicação
- [ ] Webhook configurado no Stripe Dashboard (produção)
- [ ] Teste em produção realizado com sucesso

---

## 🆘 Troubleshooting

### Erro: "Webhook secret not configured"
**Solução:** Adicionar `STRIPE_WEBHOOK_SECRET` nas variáveis de ambiente do Supabase.

### Erro: "Invalid signature"
**Solução:** Verificar se o secret está correto e se o listener do Stripe CLI está rodando.

### Erro: "Missing order_id in metadata"
**Solução:** Garantir que o checkout session foi criado com `metadata: { order_id: '...' }`.

### Saldo duplicado
**Solução:** Verificar se a idempotência está funcionando. Checar logs para ver se `idempotent: true` aparece.
