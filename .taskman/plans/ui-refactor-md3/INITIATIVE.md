# UI Refactor Initiative — r6hub

## Obiettivo
Refactor completo della UI r6hub verso Material Design 3 style, mantenendo lo stack attuale (shadcn + base-ui + Tailwind v4). Incrementale, pagina per pagina.

## Problemi trovati (davinci analysis)
- Primary = Destructive (stesso colore) → confonde azioni
- WIP overlay invasivo, dialog senza a11y, glowing CTA = AI slop
- No visual identity, radius inconsistente, dark-only

## Direzione
**MD3-style custom** su shadcn/base-ui + Tailwind (NO MUI pesante). Vantaggi:
- Mantiene stack attuale
- Più leggero e incrementale
- Controllo totale su design tokens

## Piani (ordinati)
1. **design-tokens-md3** — Nuovi tokens: palette MD3, elevation, motion, dark+light. Aggiorna globals.css + DESIGN.md.
2. **components-md3** — Refactor componenti base (Button, Card, Input, Dialog, Badge) con stile MD3.
3. **layout-shell-md3** — Layout shell: header, nav, bottom bar MD3.
4. **pages-home-lobby-md3** — Refactor home + lobby page (split lobby in subcomponenti).
5. **pages-subpages-md3** — Refactor pagine figlie (map, select, bans, settings).
6. **theme-toggle-md3** — Dark/light toggle, media query preference, persistence.
7. **a11y-md3** — Audit + fix accessibilità: focus trap, aria, contrasto WCAG AA.

## Workflow subagent
- **davinci** (con impeccable + hallmark): UI/UX review, prototipi, implementazione UI
- **human**: implementazione codice, edits
- **pastor**: architettura, decisioni tecniche
- **messiah**: codebase mapping
- **evangelist**: wiki capture

## Skill disponibili
- impeccable: critique, audit, polish, animate, colorize, adapt
- hallmark: anti-slop design, themes, macrostructures

## Branch
`refactor/ui-material-design` (già creato)