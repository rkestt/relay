# Lemon Squeezy Setup — r6hub Pro (LWTS-14)

Guida operativa per attivare i pagamenti Pro. Il codice è pronto e testato;
manca solo la configurazione dell'account merchant (azione manuale, non automatizzabile).

## Stato attuale (verificato 2026-08-07)

| Pezzo | Stato |
|---|---|
| Webhook `POST /api/webhooks/lemon-squeezy` | ✅ Implementato, firma HMAC SHA-256, testato live |
| Gestione eventi | ✅ `subscription_created/updated/resumed/cancelled/expired/paused/payment_success` |
| Helper `lib/pro.ts` | ✅ `isProUser` / `getProStatus` (scadenza rispettata) |
| Gating server-side | ✅ API Pro → 403 per free, hotspot nascosti view-only |
| `/upgrade` + `/settings/pro` + `/api/pro/cancel` | ✅ Funzionanti |
| Env vars in `.env.example` | ✅ Placeholder pronti |
| **Account Lemon Squeezy + prodotto + secret reali** | ❌ **Da fare (tu)** |

## Cosa serve da te (15 min)

1. **Crea l'account** → https://app.lemonsqueezy.com/register (Merchant of Record:
   gestisce IVA UE + sales tax globale + ricevute + dunning. Costo ~5% + 0.50€/transazione).
2. **Crea il prodotto**:
   - Nome: `r6hub Pro`
   - Prezzo: **€3.99/mese** (subscription, un solo tier)
3. **Genera le API key** → Settings → API → New API key (Read & Write).
4. **Copia le 3 variabili** in `.env.local` (e in Vercel per prod):

```env
LEMON_SQUEEZY_API_KEY=ls_xxx_your_write_key
LEMON_SQUEEZY_WEBHOOK_SECRET=your-webhook-signing-secret
LEMON_SQUEEZY_CHECKOUT_URL=https://your-store.lemonsqueezy.com/checkout/buy/your-product-id
NEXT_PUBLIC_LEMON_SQUEEZY_CHECKOUT_URL=https://your-store.lemonsqueezy.com/checkout/buy/your-product-id
```

5. **Configura il webhook** → Settings → Webhooks → Add webhook:
   - URL: `https://<dominio>/api/webhooks/lemon-squeezy`
   - Eventi: **tutti quelli subscription\*** (created, updated, cancelled, expired, paused, resumed, payment_success)
   - Il signing secret mostrato da LS va in `LEMON_SQUEEZY_WEBHOOK_SECRET`.
   - LS firma il body con HMAC SHA-256 nell'header `X-Signature` — già verificato dal codice.

## Note implementative

- **Risoluzione utente**: il webhook cerca l'utente per email via
  `GET /auth/v1/admin/users?filter=<email>` (lookup diretto, non lista paginata).
- **`subscription_created` senza `ends_at`**: fallback a 30 giorni da ora.
- **Idempotenza**: `license_keys.key` ha unique index → `upsert onConflict:"key"`
  non crea duplicati su eventi ripetuti (retry LS).
- **Cancel**: `/api/pro/cancel` revoca localmente (`is_pro=false`) e, se `LEMON_SQUEEZY_API_KEY`
  è configurata, chiama l'API LS per cancellare la subscription remota. Il webhook allinea.
- **Niente secret in git**: `.env.local` è in `.gitignore`; in `.env.example` solo placeholder.

## Verifica dopo setup

```bash
# 1. Firma valida → 200 handled:true
curl -X POST https://<dominio>/api/webhooks/lemon-squeezy \
  -H "X-Signature: <firma-hmac>" -H "Content-Type: application/json" \
  -d '{"meta":{"event_name":"subscription_created"},"data":{"attributes":{"user_email":"tuo@email"}}}'

# 2. Firma assente → 401
curl -X POST https://<dominio>/api/webhooks/lemon-squeezy -d '{}'

# 3. Checkout: /upgrade → CTA → LS → ritorno a /upgrade?success=1
# 4. profiles.is_pro=true dopo il primo pagamento (webhook)
```
