---
title: Project Discovery: r6hub (MVP)
version: 1.0
role: Senior Product Manager / Idea Generator
status: Perimetro Definito
---

# r6hub — Project Discovery (MVP)

## 1. Visione del Prodotto

R6 Tactical Sync è un'applicazione "second-screen" (PWA/Mobile) pensata per ridurre la curva di conoscenza in Rainbow Six Siege. Trasforma i 30–45 secondi della Preparation Phase da momento di confusione a fase di esecuzione chirurgica, fornendo task individuali, mirati e visuali basati sulla composizione del team in tempo reale.

## 2. Il Problema (The "Pain")

- **Decision Paralysis**: i giocatori spesso non sanno come impostare un sito o coordinare un attacco.
- **Tempo Limitato**: la Preparation Phase è troppo breve per spiegare strategie complesse vocalmente.
- **Mancanza di Visual**: istruzioni vocali come "metti il reinforcement lì" sono imprecise e causano errori.

## 3. Perimetro dell'MVP (Core Features)

### A. Flusso utente "Low-Friction"

- **Lobby Creation**: un utente crea una stanza e condivide un Room Code (6 caratteri).
- **Persistence**: grazie al Local Storage, i membri rimangono collegati alla stanza tra un match e l'altro senza reinserire il codice.
- **Selection rapido**: in meno di 5 secondi ogni utente seleziona: Mappa → Sito → Operatore.

### B. Motore di Assegnazione Task (Logica Bottom-Up)

- L'app utilizza un sistema a tag/archetipi invece di strategie rigide.
- **Modularità**: scegliere un operatore con tag "Hard Breacher" suggerisce i task prioritari per quel ruolo sul sito.
- **Prevenzione Conflitti**: evita l'assegnazione duplicata dello stesso compito nella stessa sessione.
- **Output ibrido**: ogni task include una mappa 2D (posizionamento macro) e uno screenshot (precisione tecnica).

### C. Content Strategy: Wiki-Community & Validation

- **UGC**: gli utenti caricano strategie (immagine + testo + tag).
- **Validation Gateway**: ogni sottomissione passa per un gateway (Discord/Telegram) dove validator approvano o scartano il contenuto.
- **Social Proof**: sistema di upvote/downvote per far emergere i setup più efficaci.

## 4. Architettura Tecnica Suggerita

- **Frontend**: Mobile-first (PWA) per accesso immediato da smartphone o secondo monitor.
- **Database**: Real-time per sincronizzare le selezioni dei membri del team.
- **Storage**: ottimizzazione per immagini per upload veloci in condizioni di rete instabile.

## 5. Matrice delle Priorità (Cosa NON fare nell'MVP)

| Incluso nell'MVP | Escluso (Phase 2) |
|---|---|
| Selezione manuale Operatore | Riconoscimento automatico tramite OCR/API |
| Task prioritari per sito | Suggerimenti di ban / counter-pick |
| Room code per lo stack | Integrazione vocale o chat interna |
| Validazione via Discord | Dashboard di amministrazione complessa |

## 6. Considerazioni Critiche del PM

- **Asset Management**: il valore dell'app dipende dalla chiarezza degli screenshot. Serviranno "Linee Guida di Scatto" per i contributori.
- **Velocità**: i task devono caricarsi in meno di 2 secondi; latenza superiore rende lo strumento inutile durante la Prep Phase.
- **Critical Path**: la validazione è il cuore del valore. Senza un flusso costante di strategie approvate, l'app perde utilità.

---

_Documento creato come base per definire scope, architettura e priorità per l'MVP di R6 Tactical Sync._
