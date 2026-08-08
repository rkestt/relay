# Lemon Squeezy Setup — r6hub Pro (LWTS-14)

Guida operativa per attivare i pagamenti Pro. Il codice è pronto e testato;
manca solo la configurazione dell'account merchant (azione manuale, non automatizzabile).

## Modello: One-time purchase (OTP) — LIFETIME

r6hub Pro è **acquisto una tantum**: paghi una volta, Pro attivo per sempre.
Niente abbonamenti mensili, niente rinnovi, niente dunning.

- Pagamento: `order_created` (LS) → `is_pro=true`, `pro_expires_at=null` (lifetime)
- Rimborso: `order_refunded` → `is_pro=false` (revoca)
- Il vecchio modello subscription (`subscription_*`) è **ignorato** dal webhook (handled:false)

## Stato attuale (verificato 2026-08-08)

| Pezzo | Stato |
|---|---|
| Webhook `POST /api/webhooks/lemon-squeezy` | ✅ Implementato, firma HMAC SHA-256, testato live |
| Eventi OTP | ✅ `order_created` (attiva lifetime) / `order_refunded` (revoca) |
| Helper `lib/pro.ts` | ✅ `isProUser` — `pro_expires_at=null` = lifetime |
| Gating server-side | ✅ API Pro → 403 per free, hotspot nascosti view-only |
| `/upgrade` + `/settings/pro` | ✅ Prezzo en-tantum, niente cancel abbonamento |
| Env vars in `.env.example` | ✅ Placeholder pronti |
| **Account Lemon Squeezy + prodotto + secret reali** | ❌ **Da fare (tu)** |

## Cosa serve da te (15 min)

1. **Crea l'account** → https://app.lemonsqueezy.com/register (Merchant of Record:
   gestisce IVA UE + sales tax globale + ricevute. Costo ~5% + 0.50€/transazione).
   - Business name: `RKST` — website: qualunque URL valido (es. GitHub profile).
2. **Crea il prodotto**:
   - Nome: `r6hub Pro`
   - Tipo: **One-time purchase** (NON subscription)
   - Prezzo: **€14.99** una tantum
3. **Genera le API key** → Settings → API → New API key (Read & Write).
4. **Copia le 4 variabili** in `.env.local` (e in Vercel per prod):

```env
LEMON_SQUEEZY_API_KEY=ls_xxx_your_write_key
LEMON_SQUEEZY_WEBHOOK_SECRET=your-webhook-signing-secret
LEMON_SQUEEZY_CHECKOUT_URL=https://your-store.lemonsqueezy.com/checkout/buy/your-product-id
NEXT_PUBLIC_LEMON_SQUEEZY_CHECKOUT_URL=https://your-store.lemonsqueezy.com/checkout/buy/your-product-id
```

5. **Configura il webhook** → `Settings → Webhooks → Add webhook`:
   - URL: `https://<dominio>/api/webhooks/lemon-squeezy`
   - Eventi: **`order_created`** e **`order_refunded`** (per OTP bastano questi)
   - Il signing secret va in `LEMON_SQUEEZY_WEBHOOK_SECRET` e in LS (campo Signing secret): **LS impone max 40 char** — generare con `openssl rand -hex 20`. Firmato con HMAC SHA-256 nell'header `X-Signature` — già verificato dal codice.

## Note implementative

- **Risoluzione utente**: il webhook cerca l'utente per email via
  `GET /auth/v1/admin/users?filter=<email>` (lookup diretto, non lista paginata).
- **Lifetime**: `pro_expires_at=NULL` → `lib/pro.ts` tratta null = mai scaduto.
- **Idempotenza**: `license_keys.key` ha unique index → `upsert onConflict:"key"`
  non crea duplicati su eventi ripetuti (retry LS).
- **Niente cancel**: il modello OTP non ha cancellazione abbonamento. La UI
  `/settings/pro` non mostra più il pulsante cancel; `/api/pro/cancel` resta
  come compat ma è orfano.
- **Niente secret in git**: `.env.local` è in `.gitignore`; in `.env.example` solo placeholder.

## Verifica dopo setup

```bash
# 1. Firma valida → 200 handled:true
curl -X POST https://<dominio>/api/webhooks/lemon-squeezy \
  -H "X-Signature: <firma-hmac>" -H "Content-Type: application/json" \
  -d '{"meta":{"event_name":"order_created"},"data":{"attributes":{"user_email":"tuo@email"}}}'

# 2. Firma assente → 401
curl -X POST https://<dominio>/api/webhooks/lemon-squeezy -d '{}'

# 3. Checkout: /upgrade → CTA → LS → ritorno a /upgrade?success=1
# 4. profiles.is_pro=true, pro_expires_at=null (lifetime) dopo il primo pagamento
```