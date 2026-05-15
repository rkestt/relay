## Context

r6hub è una nuova applicazione da costruire da zero. Non esiste codebase preesistente. Il Product Discovery Document (PDD) definisce un MVP di second-screen companion per Rainbow Six Siege: creazione lobby, selezione rapida operatore/sito/mappa, motore di assegnazione task basato su tag, contenuto UGC con validazione, e sincronizzazione real-time. L'intero stack deve essere scelto e architettato ex-novo per supportare un PWA mobile-first ma usabile anche su desktop.

## Goals / Non-Goals

**Goals:**
- Realizzare un PWA installabile con Next.js, ottimizzato per mobile ma responsive su desktop.
- Implementare un flusso "low-friction": creazione lobby con room code, persistenza localStorage, selezione Map → Site → Operatore in < 5 secondi.
- Costruire un motore di assegnazione task ibrido: lookup deterministico client-side + risoluzione conflitti server-side (first-write-wins).
- Output ibrido per ogni task: mappa 2D statica con SVG overlay hotspot + screenshot tecnico.
- Supportare upload strategie UGC (immagine + testo + tag + hotspot tap-to-place) con ottimizzazione rete.
- Integrare un validation gateway su Discord con URL firmati HMAC per approvazione/rifiuto contenuti.
- Sincronizzare in real-time le selezioni di tutti i membri della lobby con meccanismo di resync.
- Garantire caricamento task < 2 secondi.
- Implementare graceful degradation per offline, realtime disconnesso, e API down.

**Non-Goals:**
- Riconoscimento automatico operatore via OCR/API.
- Suggerimenti ban / counter-pick.
- Chat vocale o testuale interna alla lobby.
- Dashboard amministrazione complessa.
- Moderazione automatizzata (nel MVP la validazione è manuale su Discord).

## Decisions

### Frontend Framework: Next.js (App Router)
- **Rationale**: Setup rapido, PWA nativamente supportabile, fullstack con API Routes, ottima DX. L'App Router offre Server Components per ridurre il JS client-side, fondamentale su mobile.
- **Alternative considerate**: SvelteKit (più leggero ma ecosistema più piccolo per PWA/realtime), Remix (ottimo ma meno convenzioni PWA out-of-the-box).

### Real-time & Backend: Supabase
- **Rationale**: PostgreSQL + realtime subscriptions WebSocket integrate, auth out-of-the-box, storage per immagini, SDK JavaScript maturo. Rispetto a Firebase offre dati relazionali (utile per lobby, utenti, task) e meno vendor lock-in.
- **Alternative considerate**: Firebase (più semplice ma NoSQL, meno flessibile per query complesse su task), Node.js custom + Socket.io (richiede troppo setup infrastrutturale per un MVP).

### Styling & Componenti: Tailwind CSS + shadcn/ui
- **Rationale**: Sviluppo rapido mobile-first, design system consistente senza peso di una UI library esterna pesante. shadcn/ui fornisce componenti accessibili e personalizzabili.
- **Alternative considerate**: Material UI (troppo opinato visivamente), Chakra UI (buono ma meno comunità rispetto a Tailwind).

### State Management Client: Zustand
- **Rationale**: Leggerissimo, nessun boilerplate, perfetto per gestire lo stato della lobby locale (selezioni, task assegnati) che deve persistere anche offline.
- **Alternative considerate**: Redux Toolkit (troppo verboso per uno stato semplice), React Context (performance scarshe con aggiornamenti frequenti).

### PWA: next-pwa
- **Rationale**: Plugin consolidato per generare service worker e manifest con zero configurazione.

### Mappe 2D: SVG overlay su immagini statiche
- **Rationale**: Performance eccellente, nessuna libreria pesante necessaria. Le mappe di R6 sono statiche; i task richiedono indicatori di posizione (hotspot SVG) sopra l'immagine base.
- **Alternative considerate**: Leaflet/Mapbox (overkill per mappe indoor statiche), Canvas custom (più complesso per interazioni touch).

### Mini-Editor Hotspot: Tap-to-Place
- **Rationale**: Per UGC, l'utente deve poter definire dove sulla mappa 2D si trova il task. Un semplice "tap to place" (tocca la mappa, piazza un marker, salva coordinate percentuali 0-100) è il minimo indispensabile. Non è un editor complesso — niente drag, niente zoom, niente disegno. Solo tap → marker → conferma.
- **Alternative considerate**: Coordinate manuali (terribile UX), nessuna coordinata (riduce il valore del prodotto), editor completo (scope creep).

### Validation Gateway: Discord Webhook + HMAC-Signed URLs
- **Rationale**: Il MVP non richiede un bot completo. Un webhook posta le submission in un canale privato; i validator cliccano link firmati HMAC che scadono dopo 7 giorni e sono one-time-use. Endpoint API verifica la firma e applica approve/reject.
- **Alternative considerate**: Bot Discord completo (richiede hosting continuo), Telegram Bot API (valida ma meno preferita dall'utente), URL non firmati (insicuro — chiunque può approvare).

### Image Optimization: Client-side compression + Supabase Storage
- **Rationale**: `browser-image-compression` riduce il payload prima dell'upload, fondamentale su reti instabili. Supabase Storage gestisce CDN e trasformazioni immagine.
- **Alternative considerate**: Upload raw + server-side compression (aumenta latenza e costo backend).

### Room Code Generation: Server-Side
- **Rationale**: Generazione server-side con `INSERT ... RETURNING` + UNIQUE constraint + retry loop. Elimina collisioni, più semplice, più sicuro. Client-side generation + round-trip per verifica è strettamente peggiore.
- **Alternative considerate**: Client-side (birthday paradox a ~55K lobby attive, richiede retry loop più complesso).

### Task Engine: Split Ibrido Client/Server
- **Rationale**: Il lookup tag→task è deterministico e può girare client-side (veloce, offline-capable). La risoluzione conflitti DEVE essere server-side in una transazione ACID per garantire first-write-wins. Il client chiama `POST /api/lobby/{id}/lock-selection` che esegue una Postgres function `assign_tasks()` atomica.
- **Alternative considerate**: Tutto client-side (impossibile concordare chi è primo senza server), tutto server-side (più lento, richiede round-trip per ogni operazione).

### Row Level Security (RLS): Supabase Native
- **Rationale**: Ogni tabella con dati utente ha RLS policies. Il database stesso enforce chi può leggere/scrivere cosa. Senza RLS, ogni API route deve fare auth check manuale — errore-prone e ripetitivo.
- **Alternative considerate**: Auth manuale nelle API routes (più codice, più bug, più lento).

### Realtime Resync: Heartbeat + Full-State Fetch
- **Rationale**: Supabase Realtime è broadcast, non coda persistente. Se un messaggio viene perso durante disconnessione, il client è permanentemente out of sync. Soluzione: heartbeat ogni 30s che fa `GET /api/lobby/{id}/state` e sostituisce lo stato Zustand con quello server (server vince sempre).
- **Alternative considerate**: Solo delta events (rischio sync drift permanente), WebSocket persistent queue (non supportato da Supabase).

### Lobby Leader, Ban & Round Management
- **Rationale**: Il creatore della lobby diventa leader fisso nell'MVP. Il leader gestisce i ban per attaccanti e difensori prima di ogni round, e avvia il round successivo. Le selezioni operatori e i task assegnati si resettano tra i round, mentre lobby, mappa, sito e ban persistono. Questo richiede:
  - `leader_id` su `lobbies` (REFERENCES profiles(id))
  - Tabella `lobby_bans` (lobby_id, operator_id, side, round_id) per tracciare chi è bannato per lato in ogni round
  - Tabella `rounds` (lobby_id, round_number, status) per scope delle selezioni e task per round
  - `round_id` aggiunto a `lobby_selections` e `task_assignments`
  - Postgres function `new_round(p_lobby_id)`: crea nuovo round, copia ban dal precedente, resetta selezioni e task
  - API `POST /api/lobby/{id}/bans` (leader-only), `POST /api/lobby/{id}/new-round` (leader-only)
  - Se il leader abbandona, la lobby si scioglie (no auto-promozione nell'MVP)
- **Alternative considerate**: Auto-promozione leader (complessità non necessaria per MVP), ban senza round (inconsistente con il flusso di gioco R6).

### Lobby Cleanup: pg_cron
- **Rationale**: Lobbies attive vengono marcate `closed` dopo 24h di inattività e hard-deleted dopo 7 giorni. Previene crescita infinita del DB e collisioni room code. Implementato come job `pg_cron` su Supabase.
- **Alternative considerate**: Nessun cleanup (DB cresce infinitamente), cleanup manuale (non scalabile).

## Risks / Trade-offs

- **[Risk] Latenza task > 2s su reti lente** → Mitigation: cache locale delle strategie approvate con Service Worker; task engine lookup client-side elimina round-trip; immagini compresse e servite da CDN. Il server-side conflict resolution aggiunge ~100-300ms di round-trip, ma il lookup è istantaneo.
- **[Risk] Qualità inconsistete degli screenshot UGC** → Mitigation: linee guida di scatto nel form di upload; validation gateway manuale che scarta contenuti non conformi; mini-editor hotspot forza l'utente a riflettere sulla posizione.
- **[Risk] Scalabilità della validazione manuale** → Mitigation: nel MVP il volume è gestibile; se cresce, la struttura webhook è facilmente evolvibile verso un bot con pulsanti di approvazione.
- **[Risk] Concorrenza nelle selezioni realtime** → Mitigation: Supabase realtime broadcast + heartbeat resync ogni 30s. In caso di race condition, il server (Postgres) è la fonte di verità; il client si sincronizza automaticamente.
- **[Risk] PWA su iOS ha limitazioni** → Mitigation: test specifico su Safari iOS; fallback per notifiche (non critiche nell'MVP); cache limit ~50MB — ottimizzare asset.
- **[Risk] Task engine content bottleneck** → Mitigation: seeded iniziale con 20-30 task per i flussi più comuni per validare il motore; UGC poi espande la libreria. Il seeded usa la stessa struttura dati degli UGC (`strategy_templates`).
- **[Risk] Supabase Realtime connection limits** → Mitigation: free tier 500 connessioni concurrent. Se superato, l'app deve degradare a polling. Implementare fallback esplicito.
- **[Risk] Zustand ↔ Supabase state drift** → Mitigation: heartbeat ogni 30s + full fetch su reconnect/window focus. Server vince sempre su conflitto.
- **[Risk] Leader abbandona la lobby** → Mitigation: nell'MVP la lobby si scioglie immediatamente (no auto-promozione). Tutti i membri vengono reindirizzati alla home. In Phase 2 si aggiunge auto-promozione.
- **[Risk] Round reset inconsistente** → Mitigation: `new_round()` è una Postgres function atomica. Copia ban, crea round, resetta selezioni in un'unica transazione. I client ricevono l'evento realtime e transitano allo stato di selezione.
- **[Risk] Discord webhook URL esposto** → Mitigation: webhook URL è una env var, mai committata. Il token HMAC è bound a strategy+action, non riutilizzabile.

## Migration Plan

Non applicabile: progetto da zero. Il deploy iniziale avverrà su Vercel (frontend) con Supabase come backend. Nessun dato esistente da migrare.

Schema deployment: Supabase migrations in sequenza:
1. `00001_setup_schema.sql` — tabelle, indici, constraints
2. `00002_rls_policies.sql` — Row Level Security
3. `00003_seed_reference.sql` — mappe, siti, operatori, tag
4. `00004_seed_strategies.sql` — task iniziali approved

## Open Questions

- ~~Room code client-side o server-side?~~ **Risolto**: server-side con retry loop.
- ~~Mappe 2D asset interni o dinamici?~~ **Risolto**: asset statici nel repo per MVP, con seeding SQL.
- ~~Mini-editor hotspot per UGC?~~ **Risolto**: tap-to-place con coordinate percentuali.
- **Quanti task seeded per l'MVP?** Stima: 20-30 task che coprono i 5 flussi più comuni (es. Hard Breacher su Oregon/Bank/Clubhouse, Support su Kafe, Intel su Border). Questo è sufficiente per validare il motore e offrire valore fin dal giorno 0.
- **Leader abbandona → cosa succede?** Per MVP: lobby si scioglie immediatamente. Auto-promozione è Phase 2.
