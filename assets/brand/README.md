# Relay — Brand Assets

Unica source of truth per il logo Relay. `public/logo` è un **symlink** a questa cartella: modifichi qui, l'app vede subito le modifiche, niente doppioni.

## SVG (vettoriali) — cartella root

| File | Contenuto | Uso |
|---|---|---|
| `relay-mark.svg` | **R singola** arancio `#E84A2E` | icone, avatar, app/favicon |
| `relay-mark-light.svg` | R mono **chiaro** `#F4F5F7` | su sfondi scuri |
| `relay-mark-dark.svg` | R mono **scuro** `#12141A` | su sfondi chiari |
| `relay-mark-16px-optimized.svg` | R ottimizzata 16px | favicon piccola |
| `relay-lockup.svg` | **R + «elay»** arancio + testo chiaro | hero landing, OG (sfondi scuri) |
| `relay-lockup-light.svg` | lockup mono **chiaro** | sfondi scuri |
| `relay-lockup-dark.svg` | lockup mono **scuro** | sfondi chiari |
| `relay-favicon.svg` | favicon | browser tab |

> **Nomenclatura colore:** `-light` = testo chiaro (per fondo scuro); `-dark` = testo scuro (per fondo chiaro). Il lockup è **centrato** sul suo viewBox (a filo, testo attaccato al mark).

## PNG (raster esportati) — `export/`

| File | Dim | Uso |
|---|---|---|
| `relay-appicon-192.png` | 192×192 | PWA |
| `relay-appicon-512.png` | 512×512 | PWA |
| `relay-appicon-512-maskable.png` | 512×512 | PWA maskable |
| `relay-apple-touch-180.png` | 180×180 | iOS |
| `relay-avatar-1024.png` | 1024×1024 | profilo |
| `relay-banner-1500x500.png` | 1500×500 | banner |
| `relay-favicon-16.png` | 16×16 | favicon |
| `relay-favicon-32.png` | 32×32 | favicon |
| `relay-favicon-48.png` | 48×48 | favicon |
| `relay-og-1200x630.png` | 1200×630 | OpenGraph / social |
| `export-manifest.json` | — | inventario generato |

## Color palette

| Role | Hex |
|---|---|
| Brand (mark R) | `#E84A2E` |
| Texto chiaro (dark bg) | `#F4F5F7` |
| Texto scuro (light bg) | `#12141A` |
| Sfondo scuro brand | `#12141A` → `#1e2430` |

Font del lockup: **Anta** (inline come woff2 base64 nei file SVG — statico, niente fetch esterno).

## Tool

- Editor a mano: `docs/logo/logo-editor.html` (self-contained, aprilo con doppio click; slider Gap/Scala/Baseline, Copia SVG)
- Confronto varianti: `docs/logo/lockup-preview.html`