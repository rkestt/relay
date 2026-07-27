# Layout Shell MD3 — Phase 2

## Obiettivo
Shell di navigazione persistente + integrazione ThemeProvider. Touch `app/layout.tsx` una volta sola (pastor fix #2).

## Decisioni Tecniche
- **Skip-to-content**: `<a href="#main">` come primo elemento
- **Landmarks**: `<header>`, `<main id="main">`, `<footer>`
- **ThemeProvider integration**: import useThemeStore, apply `data-theme` to `<html>`, `suppressHydrationWarning`
- **Header persistente**: `components/ui/Header.tsx` con logo, nav, ThemeToggle, UserMenu
- **Mobile**: `components/ui/BottomNav.tsx` (MD3 bottom app bar)
- **Lobby layout**: `app/lobby/[code]/layout.tsx` con back button, lobby code, phase indicator, tabs
- **WIP overlay**: rimuovere o convertire in Banner dismissibile
- **Viewport fix**: rimuovere `maximumScale: 1, userScalable: false`

## Files
- **Create**: `components/ui/Header.tsx`, `components/ui/BottomNav.tsx`, `app/lobby/[code]/layout.tsx`
- **Modify**: `app/layout.tsx` (UNA SOLA VOLTA: ThemeProvider + landmarks + skip-to-content + viewport)
- **Modify**: `components/auth/UserMenu.tsx`

## Rollback
Commit separato: `git revert <commit-hash>`.

## Agent
- **davinci**: UI design, header/nav pattern, screenshots
- **human**: implementazione codice, refactor layout
- **pastor**: architettura, lobby layout structure