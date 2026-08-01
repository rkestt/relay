NON CREARE CLAUDE.MD, non sei claude code

# Protocollo di Debug Runtime con Playwright

Questo protocollo è mandatorio quando viene segnalato un errore runtime (console error, fetch fallito, UI rotta, crash di pagina). L'ispezione runtime ha priorità assoluta sull'analisi del codice statico.

## Regole Tassative per l'Agent

* **No Blind Guessing:** È vietato cercare nel codice statico o fare supposizioni prima di aver verificato il comportamento runtime con Playwright.
* **No Domande Inutili:** Non chiedere all'utente screenshot o log della console. Usa Playwright per raccoglierli autonomamente.
* **Isolamento Network:** In caso di `Failed to fetch`, analizza esclusivamente il network layer (CORS, endpoint down, status 4xx/5xx). Non modificare il codice del componente prima di questa verifica.

---

## Prassi Standard di Diagnostica

Esegui questi passaggi in ordine prima di modificare qualsiasi file:

1. **Avvio:** Esegui `npx playwright test --debug` o uno script di diagnostica locale.
2. **Raccolta Evidenze:** Estrai nell'ordine:
   * Console errors (`page.on('console', ...)`)
   * Network failures (`page.on('requestfailed', ...)`)
   * Screenshot dello stato visivo (`page.screenshot()`)
   * Snapshot del DOM (`page.content()`)
3. **Risoluzione:** Identifica il problema dai log runtime e procedi al fix sul codice statico solo come ultimo step.

## Conoscenza: LLM Wiki (@evangelist)

graphify è stato sostituito dalla LLM Wiki (`@zosmaai/pi-llm-wiki`, agent `evangelist`).

Regole:
- Per domande su codebase/decisioni/progetti: `wiki_recall`/`wiki_search` prima di grep grezzi.
- Dopo lavoro significativo: `wiki_observe` per osservazioni, `wiki_retro` per insight duraturi.
- Per roba wiki: delega a `evangelist` o gestisci direttamente con i tool wiki.
- Non usare più `graphify` (rimosso dal progetto).