# r6hub — Business Model & Monetization

**Stato:** Design definitivo (2026-08-07)
**Contesto:** App non live (0 utenti), side income, manutenzione-only, perimetro funzionale bloccato.

---

## 1. Executive Summary

r6hub è un **second-screen tactical companion** per Rainbow Six Siege: lobby real-time, pick/ban coordinati, task assignment, libreria UGC di strategie validate.

**Il modello è: free = strumento, Pro = knowledge base eseguibile.**

- **Free (completo, sempre)**: coordinamento live della lobby, strategie contestuali assegnate dall'engine, link condivisi view-only. Niente limiti, niente paywall sul flusso di gioco.
- **Pro — €3.99/mese**: la biblioteca completa di strategie cercabile (mappa/sito/operatore/tag), dettaglio esecutivo fuori lobby, profilo pubblico, playbook/favoriti, badge Verified Contributor, validazione prioritaria.
- **Il paywall è sulla scoperta, non sull'esecuzione.** In lobby tutto è gratis e completo; Pro è "scopri e costruisci oltre il tuo stack".

**La rottura del circolo contenuti-utenti** avviene per seeding: semini tu le prime 50-100 strategie core, poi il flywheel contributor li sostituisce.

**Realtà dei numeri:** tetto realistico €200-800/mese con 500-2000 MAU. Il valore vero del progetto oggi è la qualità del prodotto e il portfolio, non i ricavi. Kill criteria espliciti al §9.

---

## 2. Prodotto e Stato Attuale (verificato sul codice)

| Area | Stato |
|---|---|
| Lobby real-time (room code 6 char, sync 3s, persistence) | ✅ Implementato |
| Pick/ban per round, lock selection, new round, winner side | ✅ Implementato + dati salvati |
| Task assignment (tag/archetipo → strategia per giocatore) | ✅ Implementato, fallback progressivo mappa→sito |
| Strategie UGC: submit, moderazione (gateway Discord), approvazione | ✅ Implementato (endpoint + webhook) |
| Endpoint API strategie con filtri (map/site/status) | ✅ Esiste, **manca la UI browse/search** |
| Auth Supabase, RLS, profili | ✅ Implementato |
| PWA, GDPR (privacy/terms/cookies), export/delete account, Sentry | ✅ Implementato |
| Contenuti in DB | ⚠️ ~27 strategie seed, 82 mappe, 77 operatori taggati |
| Live pubblico | ❌ Non ancora |

**Dato chiave:** il DB colleziona già pick, ban e winner per ogni round di ogni lobby. È un asset unico (nessun altro raccoglie ban reali per lobby) che oggi costa zero e domani vale come Meta Insights (§5.4).

---

## 3. Mercato e Realismo

### 3.1 La nicchia

- R6 Siege: gioco maturo (~10 anni), player base in declino lento ma ancora larga (milioni di registrati, centinaia di migliaia di attivi).
- Il segmento rilevante: **stack competitivi** (platino+) che giocano 3+ sere/settimana. Stima onesta: 5-10% del player base attivo → 50-150k persone in Europa.
- **Competitor**: R6Tab / Rainbow Six Tracker (stats, gratis, ads), Strat Roulette (divertimento, gratis), YouTube/Discord (strategie, gratis). **Nessuno** fa coordinamento real-time con strategie eseguibili integrate nel match flow. Il gap esiste.

### 3.2 Precedenti che validano il modello

- **Mobalytics** (LoL): tool free + abbonamento premium su analytics/contenuti. Funziona.
- **Chessable**: knowledge base a pagamento in una nicchia competitiva. Funziona.
- **op.gg / R6Tab**: gratis con ads — il modello ads non è il nostro.
- Pattern confermato: **companion tool free + contenuti differenziati a pagamento** è il modello che regge nelle nicchie competitive.

### 3.3 La lezione di vendita

Non vendiamo "strategie" — su YouTube/Reddit/Discord sono gratis e più complete. Vendiamo il **formato eseguibile**:

> Strategie validate, strutturate (hotspot, tag, operatori, task breakdown) e collegate al flusso del match. Non leggi la strategia — la esegui in 30 secondi nella Prep Phase.

Quello non esiste da nessun'altra parte. È la frase di posizionamento da usare ovunque.

---

## 4. Modello di Business

### 4.1 La linea free/Pro

```
FREE (strumento, sempre completo)
├── Coordinamento live: lobby, pick/ban, task assignment, new round
├── Strategie contestuali: quelle che l'engine assegna alla TUA lobby
├── Link condivisi view-only (regola ferrea, vedi §8.1)
└── Auth, profilo base

PRO — €3.99/mese (knowledge base + identità)
├── Biblioteca completa: browse, search, filtri (mappa/sito/operatore/tag)
├── Dettaglio esecutivo FUORI lobby (hotspot, task, image)
├── Profilo pubblico + Verified Contributor + playbook/favoriti
├── Validazione prioritaria delle strategie pubblicate
└── (Fase 3) Meta Insights: aggregati ban/pick/winner per mappa/sito
```

**Principio fondante: monetizzazione additiva, non restrittiva.** Il free non perde mai nulla di ciò che ha. La gente paga per avere di più (scoperta, identità, dati), non per non perdere ciò che ha. Ogni leva restrittiva testata in discussione (limite lobby >10, history round, browse limitato) è stata scartata: o fisicamente impossibile (R6 è 5v5), o inutile (post-match stats vs tracker ufficiali), o controproducente (limita la distribuzione).

### 4.2 Perché Pro è un'abbinamento, non un tool

- È **prodotto-contenuto**: strategie nuove che entrano = valore ricorrente = pagamento ricorrente. Il sub è il formato giusto (un one-time non ha senso per una knowledge base viva).
- La cadenza contenuti è garantita dai **seasonal shift di R6** (~3 mesi/season, bilanciamenti, nuovi operatori): il meta cambia, la biblioteca si rigenera, il sub resta giustificato.
- L'ops è zero con Merchant of Record (rinnovi, dunning, ricevute, IVA automatiche).

---

## 5. Cosa Vendiamo e Perché la Gente Paga

### 5.1 Il compratore (persona)

**Lo shotcaller di uno stack rankeado.** Gioca platino+ 3+ sere/settimana con lo stesso gruppo. Vuole edge competitivo ma non ha tempo di studiare VOD e setup su YouTube. Compra per sé e per lo stack — **1 compratore per stack di 5**, non 1 per giocatore.

### 5.2 Driver di pagamento (in ordine)

1. **Vincere di più** — edge competitivo. Il driver dominante, da solo. (Biblioteca + dettaglio eseguibile)
2. **Risparmiare tempo** — 2 min di prep invece di 20. Il prodotto stesso esiste per questo; Pro estende il valore fuori dal match.
3. **Identità/status** — badge Verified Contributor, profilo pubblico, playbook da mostrare. Secondario ma reale (è come Ubisoft monetizza R6: skin).
4. **Supporto** — bottone donazione per chi ama l'app ma non vuole Pro. Zero build, cattura goodwill.

### 5.3 Perché non vendiamo altro

- **Ads**: ARPU misero, rovina UX, svaluta il brand. No.
- **Pay-to-win sui pick/ban**: rovina il prodotto, la community ti lincia. No.
- **B2B/esports**: mercato in shrink, vendita lenta, fuori perimetro. No.
- **Marketplace con commissioni**: richiede curation = lavoro. Fuori perimetro. (Evoluzione possibile solo se la biblioteca decolla, vedi §12.)

### 5.4 L'asset a lungo termine: i dati

Il DB colleziona già pick/ban/winner per lobby. Con volume sufficiente (~1k+ lobby/mese) diventano **Meta Insights**: "cosa banna la community su questo sito", "attaccanti vincono di più se X è bannato". Dato che nessun altro ha. **Non si monetizza oggi** (serve scala per essere statisticamente valido) ma non si butta mai: nessun reset DB, nessuna cancellazione. È il moat del progetto.

---

## 6. Il Motore dei Contenuti (il critical path)

**Il modello vive o muore qui.** Un paywall su una biblioteca vuota è ridicolo; nessuno paga per cercare 27 strategie.

### 6.1 Il circolo e la rottura

```
biblioteca vuota → nessuno paga → niente incentivo contenuti → biblioteca vuota
```

Il loop si rompe in **un solo punto controllabile al 100%: il seeding**. Il fondatore semina le prime 50-100 strategie core (meta attuale, setup noti, formato app: immagine + hotspot + tag + task). Prima ancora che esista un utente.

### 6.2 Il flywheel contributor

- **Incentivo**: Pro gratis in cambio di strategie approvate (es. 3 approvate = 1 mese Pro).
- Il gateway di validazione Discord esiste già: è il processo di quality control.
- I contributor sono i power user: quelli che oggi farebbero la moderazione gratis, domani la fanno in cambio di Pro + badge Verified Contributor.
- Il flywheel: contributor → contenuti → utenti → sub → più contributor.

### 6.3 Target di volume

- **Prima del lancio Pro**: ~300+ strategie validate totali (il paywall diventa credibile).
- **Copertura minima per essere utile**: ~10 strategie per mappa attiva, per i siti principali.
- **Cadenza a regime**: qualche strategia nuova a settimana, trainata dai seasonal shift.

---

## 7. Prezzi e Pagamenti

| Voce | Decisione |
|---|---|
| Prezzo | **€3.99/mese**, un solo tier |
| Prodotto | Abbonamento (knowledge base viva) |
| Processore | **Lemon Squeezy** (Merchant of Record) |
| Perché MoR | Gestisce IVA UE + sales tax globale + ricevute + dunning. Zero sbatti fiscale, zero partita IVA necessaria. Costo ~5%+0.50€/transazione. |
| Diritto recesso UE | 14 giorni (con consenso all'erogazione immediata del servizio) — gestito dal MoR |
| Licenza | License key + verifica in-app (API Lemon Squeezy) |

### 7.1 Economia dell'abbonamento

- Churn atteso: 8-12%/mese (nicchia, stagionale) → **LTV ≈ €40-50** (€3.99 × 1/churn).
- **CAC = ~0**: la crescita è organica (loop di condivisione, §8). Con CAC=0, qualunque LTV positivo è profitto. Questo è il punto di forza del modello: non c'è spend in acquisizione.

---

## 8. Distribuzione e Growth Loop

### 8.1 Regole ferree

1. **I link condivisi sono sempre view-only gratis.** Se il link su Discord/Reddit non si vede senza pagare, nessuno condivide → virality morta. La condivisione È il marketing. Non si tocca.
2. **La lobby è sempre free e completa.** Il coordinamento live è il prodotto di distribuzione; il paywall è solo sulla superficie di scoperta.

### 8.2 Il loop

```
contenuti → link condivisi (view-only free) → nuovi utenti → usano la lobby free
→ alcuni diventano contributor → Pro gratis → più contenuti → più link
```

### 8.3 Canali (zero budget)

- r/SiegeAcademy, r/Rainbow6 (cautela sulle regole self-promo)
- Server Discord R6, community italiane e internazionali
- Clip brevi: "prepara il tuo stack in 2 min" (TikTok / YT Shorts)
- Il loop naturale: room code condivisi → nuovi utenti portano altri utenti

### 8.4 Metriche di funnel

```
awareness → visitatori → signup → MAU → stack attivi → sub
```

Obiettivo realistico: **5-15% di conversione awareness→MAU**, **10-15% degli stack attivi → sub**.

---

## 9. Metriche, Target e Kill Criteria

### 9.1 Target a regime (6-12 mesi dopo il lancio)

| Metrica | Obiettivo | Ricavo atteso |
|---|---|---|
| MAU | 500-2.000 | — |
| Sub | 50-200 | €200-800/mese |
| Strategie validate | 300+ | — |
| Contributor attivi | 10-30 | — |
| Lobby/mese | 500-1.000 | (gate per Meta Insights) |

### 9.2 Kill criteria (onesti)

Se dopo il lancio e una spinta di distribuzione ragionevole:
- **MAU < 100** dopo 3 mesi → il prodotto non attacca. Stop monetizzazione, resta portfolio.
- **Sub < 10** con 300+ strategie e 500+ MAU → il modello non converte. Testare prezzo/offerta una volta; se fallisce, chiudere.

Il progetto non ha costi variabili rilevanti (solo server, €5-15/mese): **il downside è quasi zero, l'upside è €200-800/mese**. È un'opzione reale, non una scommessa.

---

## 10. Rischi e Mitigazioni

| Rischio | Impatto | Mitigazione |
|---|---|---|
| Bibliotecca vuota → paywall su nulla | Alto | Seeding fondatore (50-100) prima del lancio Pro; target 300+ |
| Link condivisi bloccati → virality morta | Alto | Regola ferrea: link view-only gratis (§8.1) |
| Social freddo a 100 utenti | Medio | Social right-sized: identità + condivisione, niente feed/commenti finché non c'è massa |
| Declino R6 (gioco vecchio) | Medio | R6 ancora vivo con stagioni; il modello si adatta se il gioco cambia (contenuti + dati sono agnostic) |
| ToS Ubisoft | Basso | Input manuale (i giocatori selezionano), nessuna lettura di memoria/automazione. Precedenti tollerati (Strat Roulette, companion sites). Verifica periodica. |
| Churn alto (stagionale) | Medio | Cadenza contenuti sui seasonal shift; offerta lifetime come A/B se churn persistente |
| Seeding troppo lavoro per una persona | Medio | Formato seed efficiente: hotspot + tag + task dal meta noto, batch; contributor dal giorno 1 |
| GDPR/pagamenti | Basso | Già implementato (privacy/terms/cookies, export, delete) + MoR per pagamenti |

---

## 11. Perimetro: cosa NON facciamo

- ❌ Ads, B2B/esports, marketplace con commissioni (ora)
- ❌ App native (PWA basta), OCR/riconoscimento automatico
- ❌ Chat/voce interna, admin dashboard complessa
- ❌ Paywall su qualsiasi funzione del flusso di gioco live
- ❌ Blocco dei link condivisi

---

## 12. Roadmap

| Fase | Cosa | Condizione d'ingresso | Effort |
|---|---|---|---|
| **1. Seed contenuti** | 50-100 strategie core validate | Subito | 1-2 settimane (fondatore) |
| **2. Build Pro** | UI biblioteca (browse/search/filtri), gating Pro, profilo/playbook, license Lemon Squeezy | Fase 1 avviata | 1-2 settimane |
| **3. Lancio free** | Deploy pubblico + distribuzione (Reddit/Discord/clip) | Fase 1+2 fatte | 1 settimana + continua |
| **4. Attiva Pro** | Paywall visibile, contributor program attivo | ~300 strategie validate + MAU minimo | — |
| **5. Flywheel** | Contributor → contenuti → utenti → sub | Fase 4 attiva | continua |
| **6. (Opzionale) Meta Insights** | Aggregati ban/pick/winner | 1k+ lobby/mese | 1-2 settimane |

**Nota sull'ordine:** il lancio free viene PRIMA del paywall (fase 3 prima di 4). La distribuzione deve precedere la monetizzazione, sempre.

---

## 13. North Star

> **"Ogni stack rankeado che gioca una partita coordinata con r6hub, e ogni shotcaller che prepara la serata dalla biblioteca."**

- North star metric: **stack attivi/settimana** (non utenti singoli — i buyer sono 1 per stack).
- Compasso di prodotto: se una decisione monetizza il live flow o blocca la condivisione, è sbagliata.

---

*Questo documento è il contratto di business del progetto. Qualunque deviazione (nuova leva, nuovo tier, nuovo canale) va scritta qui prima di essere costruita.*
