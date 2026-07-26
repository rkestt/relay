# r6Hub — Design System

## Stato
Refactor in corso verso **Material Design 3** su stack esistente (Next.js + Tailwind v4 + shadcn/ui + @base-ui/react).

## Stack Decisioni
- **CSS variables** in `app/globals.css`
- **OKLCH** color space per gamma dinamica e accessibilità
- **Theme system** via Zustand + `data-theme` attribute su `<html>`
- **Dark-first**, con light mode supportata
- **Font**: Geist Sans + Geist Mono (mantenuti)

---

## Color System (MD3)

### Primary (Red-Orange Fire — Brand)
- **Primary**: `oklch(0.65 0.22 25)` — CTA buttons, active states
- **Primary-hover**: `oklch(0.70 0.24 25)` — Hover states
- **Primary-active**: `oklch(0.60 0.20 25)` — Active/pressed states
- **On-primary**: `oklch(0.98 0 0)` — Text on primary
- **Inverse-primary**: `oklch(0.65 0.22 25)` — Text/link su surface inverse

### Secondary (Defender Blue)
- **Secondary**: `oklch(0.65 0.18 240)` — Secondary actions
- **On-secondary**: `oklch(0.12 0.005 270)` — Text on secondary

### Tertiary (Amber)
- **Tertiary**: `oklch(0.75 0.16 85)` — Accent alternativo, leader badge
- **On-tertiary**: `oklch(0.12 0 0)` — Text on tertiary

### Error / Destructive (FIXED ≠ primary)
- **Error**: `oklch(0.60 0.22 15)` — Error states, destructive actions
- **On-error**: `oklch(0.98 0 0)` — Text on error
- **Destructive**: `oklch(0.60 0.22 15)` — Mantenuto per compat shadcn
- **Destructive-hover**: `oklch(0.55 0.20 15)` — Hover destructive

### Surface System (MD3 Tonal Elevation)
Dark mode:
- **Surface**: `oklch(0.14 0.005 270)` — Base surface
- **Surface-variant**: `oklch(0.16 0.005 270)` — Variante surface
- **Surface-container-lowest**: `oklch(0.10 0.005 270)`
- **Surface-container-low**: `oklch(0.12 0.005 270)`
- **Surface-container**: `oklch(0.16 0.005 270)` — Cards, containers
- **Surface-container-high**: `oklch(0.20 0.005 270)` — Elevated cards
- **Surface-container-highest**: `oklch(0.24 0.005 270)` — Modals, dialogs
- **Surface-bright**: `oklch(0.20 0.005 270)`
- **Surface-dim**: `oklch(0.10 0.005 270)`
- **Inverse-surface**: `oklch(0.90 0.005 270)`
- **Inverse-on-surface**: `oklch(0.12 0.005 270)`

Light mode speculare: surfaces chiari, testo scuro.

### Outline
- **Outline**: `oklch(0.40 0.010 270)` (dark)
- **Outline-variant**: `oklch(0.30 0.008 270)` (dark)
- **On-surface-variant**: `oklch(0.70 0.010 270)` (dark)

### Semantic Colors
- **Success**: `oklch(0.70 0.18 145)`
- **Warning**: `oklch(0.75 0.16 85)`
- **Info**: `oklch(0.65 0.18 240)`

### Game Roles
- **Attacker**: `oklch(0.65 0.22 25)` — Red-orange
- **Defender**: `oklch(0.65 0.18 240)` — Blue

---

## Light Theme

`[data-theme="light"]` inverte i surface e testo. Palette colorata (primary, secondary, error, success, etc.) rimane la stessa o leggermente adattata per leggibilità.

---

## Elevation System

| Livello | Token | Uso |
|---------|-------|-----|
| 0 | `--md-sys-elevation-0` | Flat, no shadow |
| 1 | `--md-sys-elevation-1` | Resting cards |
| 2 | `--md-sys-elevation-2` | Raised cards, buttons |
| 3 | `--md-sys-elevation-3` | Navigation drawers, FAB |
| 4 | `--md-sys-elevation-4` | Modals, bottom sheets |
| 5 | `--md-sys-elevation-5` | Pickers, date pickers |

---

## Motion System

| Durata | Token | Uso |
|--------|-------|-----|
| 150ms | `--md-sys-motion-duration-fast` | Hover, small transitions |
| 250ms | `--md-sys-motion-duration-medium` | Default transitions |
| 400ms | `--md-sys-motion-duration-slow` | Page transitions |
| 500ms | `--md-sys-motion-duration-emphasized` | Emphasized animations |

### Easing
- **Standard**: `cubic-bezier(0.2, 0.0, 0.0, 1.0)`
- **Emphasized**: `cubic-bezier(0.2, 0.0, 0.0, 1.0)`
- **Decelerate**: `cubic-bezier(0.0, 0.0, 0.0, 1.0)`
- **Accelerate**: `cubic-bezier(0.3, 0.0, 1.0, 1.0)`

---

## Typography System

| Token | Size | Uso |
|-------|------|-----|
| `--md-sys-typescale-display-large` | 3rem | Hero titles |
| `--md-sys-typescale-headline-large` | 2.25rem | Page titles |
| `--md-sys-typescale-headline-medium` | 1.75rem | Section titles |
| `--md-sys-typescale-headline-small` | 1.375rem | Card titles |
| `--md-sys-typescale-title-large` | 1.25rem | Subsection |
| `--md-sys-typescale-body-large` | 1.125rem | Lead text |
| `--md-sys-typescale-body-medium` | 1rem | Body default |
| `--md-sys-typescale-body-small` | 0.875rem | Secondary text |
| `--md-sys-typescale-label-medium` | 0.75rem | Labels |

---

## Shape System

- **Radius base**: `0.75rem` (12px)
- **Full rounded**: per chips, avatar
- **Medium rounded**: per cards (12px)
- **Small rounded**: per inputs (6px)

---

## State Layers

| Stato | Opacity |
|-------|---------|
| Hover | `--md-sys-state-hover-opacity: 0.08` |
| Pressed | `--md-sys-state-pressed-opacity: 0.12` |
| Focus | `--md-sys-state-focus-opacity: 0.12` |
| Drag | `--md-sys-state-drag-opacity: 0.16` |
| Disabled | `--md-sys-state-disabled-opacity: 0.38` |

---

## Theme Toggle

- **State**: Zustand store con persistenza `localStorage`
- **Modes**: `light` | `dark` | `system`
- **Detection**: `prefers-color-scheme: dark`
- **Apply**: `data-theme` attribute su `<html>`

---

## Compatibility Shim

Per mantenere le 17 pagine esistenti funzionanti durante la transizione, ogni token legacy ha un alias `--old-*` che punta al token corrente.

Esempio:
```css
--old-primary: var(--primary);
--old-destructive: var(--destructive);
```

---

## Storico Decisioni

- **2024-07-26**: Passaggio da dark-only a dark + light. Introdotto MD3 token system. Fix `--destructive` ≠ `--primary`.
