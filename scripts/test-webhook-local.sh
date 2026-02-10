#!/bin/bash
# ============================================================================
# Stripe Webhook Local Testing Script
# ============================================================================
# Requisitos:
#   - Stripe CLI instalado (https://stripe.com/docs/stripe-cli)
#   - Supabase local rodando (npx supabase start)
#
# Uso:
#   ./scripts/test-webhook-local.sh
# ============================================================================

echo "🧪 Testando Webhook Stripe Localmente"
echo ""
echo "📋 Pré-requisitos:"
echo "  ✓ Stripe CLI instalado"
echo "  ✓ Supabase local rodando (npx supabase start)"
echo ""

# Verificar se Stripe CLI está instalado
if ! command -v stripe &> /dev/null
then
    echo "❌ Stripe CLI não encontrado!"
    echo "   Instale em: https://stripe.com/docs/stripe-cli"
    exit 1
fi

echo "✅ Stripe CLI encontrado"
echo ""

# URL da Edge Function local
WEBHOOK_URL="http://localhost:54321/functions/v1/handle-payment-webhook"

echo "🔗 Encaminhando webhooks Stripe para:"
echo "   $WEBHOOK_URL"
echo ""
echo "⚡ Iniciando listener..."
echo "   (Pressione Ctrl+C para parar)"
echo ""

# Iniciar listener
stripe listen --forward-to "$WEBHOOK_URL"
