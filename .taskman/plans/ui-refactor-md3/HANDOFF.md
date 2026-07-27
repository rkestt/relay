# UI Refactor Plan — Material Design 3 Style

Refactor incrementale della UI r6hub verso Material Design 3 principles, mantenendo stack attuale (shadcn/ui + base-ui + Tailwind v4).

## Strategia
**NON sostituire shadcn/ui** — applicare principi MD3 su stack esistente. Aggiungere solo ciò che manca:
- State layers (hover/pressed overlays)
- Elevation system migliorato
- Color roles (primary ≠ destructive)
- Navigation patterns
- Light theme
- Typography refinement

## Problemi da risolvere (davinci audit)
1. **Primary === Destructive** stesso colore → confusione semantica
2. **WIP overlay invasivo** → rompere UX
3. **No navigation persistence** → disorientamento
4. **Buttons troppo uniformi** → no gerarchia
5. **Saturation alta** → occhi stanchi
6. **No light theme** → esclusione utenti
7. **Lobby affollata** → cognitive load alta
8. **Modals not mobile-specific** → UX mobile scarsa
9. **Icons missing aria** → a11y risk

## Approccio incrementale
7 fasi sequenziali, ognuna testabile indipendentemente:
1. Design tokens + palette (foundation)
2. Core components (button, card, input, dialog)
3. App shell (layout, navigation, header)
4. Landing page (CTA, gerarchia)
5. Lobby flow (modals, states, subcomponents)
6. Submit/settings (forms, spacing)
7. Theme toggle (dark/light)

## Workflow subagent
- **davinci** (fork context, impeccable + hallmark skills) → UI/UX design, visual review, screenshots
- **human** (fresh context) → implementazione codice, edits, test
- **pastor** (fork context) → architettura, decisioni tecniche, review
- **messiah** (fresh context) → codebase mapping, pattern discovery
- **evangelist** (fresh context) → wiki capture, decisioni design

## Skill disponibili
- **impeccable** (206K installs) → critique, audit, polish, animate, colorize, adapt, clarify
- **hallmark** (27K installs) → anti-slop design, themes, macrostructures, slop test

## Branch
`refactor/ui-material-design` (già creato)

## Verifica incrementale
Ogni fase ha acceptance criteria specifici:
- Build passa
- Screenshot dark + light
- Accessibility audit (WCAG AA)
- Visual review davinci
- User testing manuale

## Rischi
- **Breaking changes**: refactor tokens può rompere componenti esistenti → migration guide
- **Performance**: Tailwind v4 + shadcn già ottimizzati → minimo impatto
- **Compatibility**: base-ui + MD3 → verificare focus trap, aria, motion

## Success criteria
- Primary ≠ Destructive visivamente
- Light theme funzionante
- Navigation persistente (mobile + desktop)
- Button hierarchy chiara
- Lobby page semplificata
- WCAG AA compliance
- Build + test pass