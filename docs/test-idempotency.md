# Teste de Idempotência do Webhook Stripe

## Objetivo

Garantir que o webhook `handle-payment-webhook` processe cada evento Stripe **exatamente uma vez**, mesmo que o Stripe reenvie o evento múltiplas vezes.

---

## Cenários de Teste

### ✅ Cenário 1: Evento Duplicado (Idempotência)

**Objetivo:** Verificar que eventos duplicados não causam processamento duplicado.

**Passos:**

1. **Criar um pedido de teste**
   ```sql
   -- No Supabase SQL Editor
   INSERT INTO orders (id, buyer_id, seller_id, service_id, service_title, price, agreed_price, status)
   VALUES (
     'test-order-123',
     'uuid-do-comprador',
     'uuid-do-vendedor',
     'uuid-do-servico',
     'Serviço de Teste',
     10000,
     10000,
     'pending'
   );
   ```

2. **Enviar webhook válido pela primeira vez**
   ```bash
   # Usando Stripe CLI
   stripe trigger checkout.session.completed
   
   # OU usando cURL
   curl -X POST http://localhost:54321/functions/v1/handle-payment-webhook \
     -H "Content-Type: application/json" \
     -H "stripe-signature: whsec_test_signature" \
     -d '{
       "type": "checkout.session.completed",
       "data": {
         "object": {
           "id": "cs_test_idempotency_001",
           "amount_total": 10000,
           "metadata": {
             "order_id": "test-order-123"
           }
         }
       }
     }'
   ```

3. **Verificar que o pedido foi atualizado**
   ```sql
   SELECT id, payment_status, stripe_session_id, amount_total
   FROM orders
   WHERE id = 'test-order-123';
   
   -- Esperado:
   -- payment_status: 'paid'
   -- stripe_session_id: 'cs_test_idempotency_001'
   ```

4. **Verificar saldo da carteira**
   ```sql
   SELECT user_id, pending_balance
   FROM wallets
   WHERE user_id = 'uuid-do-vendedor';
   
   -- Esperado:
   -- pending_balance: 8500 (85% de 10000)
   ```

5. **Enviar o MESMO webhook novamente**
   ```bash
   # Repetir o mesmo cURL acima
   curl -X POST http://localhost:54321/functions/v1/handle-payment-webhook \
     -H "Content-Type: application/json" \
     -H "stripe-signature: whsec_test_signature" \
     -d '{
       "type": "checkout.session.completed",
       "data": {
         "object": {
           "id": "cs_test_idempotency_001",
           "amount_total": 10000,
           "metadata": {
             "order_id": "test-order-123"
           }
         }
       }
     }'
   ```

6. **Verificar resposta**
   ```json
   {
     "received": true,
     "idempotent": true
   }
   ```

7. **Verificar que o saldo NÃO foi duplicado**
   ```sql
   SELECT user_id, pending_balance
   FROM wallets
   WHERE user_id = 'uuid-do-vendedor';
   
   -- Esperado:
   -- pending_balance: 8500 (AINDA 8500, não 17000!)
   ```

8. **Verificar logs estruturados**
   ```bash
   npx supabase functions logs handle-payment-webhook --tail
   
   # Esperado no segundo envio:
   # {
   #   "timestamp": "...",
   #   "level": "info",
   #   "message": "Webhook already processed (idempotent)",
   #   "context": {
   #     "session_id": "cs_test_idempotency_001",
   #     "order_id": "test-order-123",
   #     "payment_status": "paid"
   #   }
   # }
   ```

**✅ Resultado Esperado:**
- Primeira chamada: Pedido atualizado, saldo creditado
- Segunda chamada: Retorna 200 OK, mas NÃO processa novamente
- Saldo permanece 8500, não duplica para 17000

---

### ❌ Cenário 2: Assinatura Inválida

**Objetivo:** Verificar que webhooks sem assinatura válida são rejeitados.

**Passos:**

1. **Enviar webhook SEM header de assinatura**
   ```bash
   curl -X POST http://localhost:54321/functions/v1/handle-payment-webhook \
     -H "Content-Type: application/json" \
     -d '{
       "type": "checkout.session.completed",
       "data": {
         "object": {
           "id": "cs_test_no_signature",
           "amount_total": 5000,
           "metadata": {
             "order_id": "test-order-456"
           }
         }
       }
     }'
   ```

2. **Verificar resposta de erro**
   ```json
   {
     "error": "Missing signature"
   }
   ```
   - Status HTTP: `401 Unauthorized`

3. **Verificar log estruturado**
   ```bash
   npx supabase functions logs handle-payment-webhook --tail
   
   # Esperado:
   # {
   #   "timestamp": "...",
   #   "level": "error",
   #   "message": "Missing Stripe signature header",
   #   "context": {
   #     "error": "No stripe-signature header found"
   #   }
   # }
   ```

**✅ Resultado Esperado:**
- Retorna `401 Unauthorized`
- Pedido NÃO é processado
- Log de erro estruturado registrado

---

### ✅ Cenário 3: Evento Válido (Happy Path)

**Objetivo:** Verificar que eventos válidos são processados corretamente.

**Passos:**

1. **Usar Stripe CLI para gerar evento real**
   ```bash
   # Terminal 1: Iniciar listener
   stripe listen --forward-to http://localhost:54321/functions/v1/handle-payment-webhook
   
   # Terminal 2: Disparar evento
   stripe trigger checkout.session.completed
   ```

2. **Verificar logs em tempo real**
   ```bash
   npx supabase functions logs handle-payment-webhook --tail
   ```

3. **Verificar sequência de logs esperada**
   ```json
   [
     {
       "level": "info",
       "message": "Webhook signature validated successfully",
       "context": { "event_type": "checkout.session.completed" }
     },
     {
       "level": "info",
       "message": "Processing checkout.session.completed",
       "context": { "session_id": "cs_...", "amount_total": 10000 }
     },
     {
       "level": "info",
       "message": "No existing order found, proceeding with processing"
     },
     {
       "level": "info",
       "message": "Order updated successfully",
       "context": { "order_id": "...", "payment_status": "paid" }
     },
     {
       "level": "info",
       "message": "Transaction created successfully"
     },
     {
       "level": "info",
       "message": "Wallet balance updated successfully"
     },
     {
       "level": "info",
       "message": "Webhook processed successfully",
       "context": { "duration_ms": 234 }
     }
   ]
   ```

**✅ Resultado Esperado:**
- Todos os logs são estruturados em JSON
- Pedido atualizado com sucesso
- Transação criada
- Saldo creditado corretamente

---

## Checklist de Validação

- [ ] Evento duplicado retorna `200 OK` com `idempotent: true`
- [ ] Saldo não é duplicado em eventos repetidos
- [ ] Webhook sem assinatura retorna `401 Unauthorized`
- [ ] Todos os logs são estruturados em JSON
- [ ] Logs contêm `session_id`, `order_id` e `event_type`
- [ ] Erros incluem stack trace no contexto
- [ ] Eventos válidos processam corretamente
- [ ] Transações não são duplicadas

---

## Comandos Úteis

### Ver logs em tempo real
```bash
npx supabase functions logs handle-payment-webhook --tail
```

### Verificar pedidos processados
```sql
SELECT id, payment_status, stripe_session_id, amount_total, created_at
FROM orders
WHERE payment_status = 'paid'
ORDER BY created_at DESC
LIMIT 10;
```

### Verificar transações criadas
```sql
SELECT t.id, t.order_id, t.amount, t.type, t.status, t.created_at
FROM transactions t
WHERE t.type = 'credit'
ORDER BY t.created_at DESC
LIMIT 10;
```

### Verificar saldos das carteiras
```sql
SELECT w.user_id, w.pending_balance, w.available_balance, p.full_name
FROM wallets w
JOIN profiles p ON p.id = w.user_id
ORDER BY w.updated_at DESC
LIMIT 10;
```
