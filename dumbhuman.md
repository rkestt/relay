# r6hub — Dumb Human Guide

Mini istruzioni per far girare l'app senza pensarci troppo.

## Prerequisiti

- Node.js (consigliato 20+)
- `npm install` fatto almeno una volta
- File `.env.local` in root con:
  ```
  NEXT_PUBLIC_SUPABASE_URL=https://tuo-progetto.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=la-tua-anon-key
  ```

## Comandi base

| Azione | Comando |
|--------|---------|
| **Avvia dev server** | `npm run dev` |
| **Build produzione** | `npm run build` |
| **Start produzione** | `npm run start` |
| **Lint** | `npm run lint` |

docker compose --env-file .env.supabase up -d

- Il dev server parte su **http://localhost:3000**
- Se la 3000 è occupata, Next.js usa la 3001 automaticamente

## Come stoppare

Premi `Ctrl + C` nel terminale dove gira `npm run dev`.

## Auth / Login

L'app usa **Supabase Auth** con magic link email.

1. Vai su http://localhost:3000/login
2. Inserisci la tua email
3. Clicca "Send Magic Link"
4. Controlla la email e clicca il link
5. Sei dentro

> Se non hai configurato Supabase Email Auth, il magic link non arriva. Vai su Supabase Dashboard → Authentication → Providers → Email, e abilitalo.

## Struttura rapida

- `app/` — pagine Next.js (App Router)
- `app/api/` — API route (lobby, strategies, validate)
- `lib/supabase/` — client/server/middleware Supabase
- `components/ui/` — componenti UI (Button, ecc.)
- `middleware.ts` — protezione route (redirect a /login se non autenticato)

## Problemi comuni

| Sintomo | Causa probabile | Fix |
|---------|----------------|-----|
| "Unexpected token '<', ... is not valid JSON" | Middleware redirecta API a /login | Controlla che `lib/supabase/middleware.ts` non tocchi le route `/api/*` |
| 404 su /login | Manca la pagina login | Deve esistere `app/login/page.tsx` |
| 401 "Unauthorized" su Create/Join Lobby | Non sei loggato | Vai su /login e autenticati |
| Redirect a /login da tutte le pagine | Middleware fa il suo lavoro | Normale se non sei loggato |

