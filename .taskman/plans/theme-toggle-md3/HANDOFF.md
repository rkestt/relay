# Theme Toggle MD3

Implementare dark/light theme toggle con persistenza e system preference detection.

## Problema attuale
- Dark mode only (hardcoded in globals.css)
- Nessuno switch per light mode
- Nessuna persistenza preferenza utente
- Nessuna detection system preference

## Cosa fare

### 1. ThemeProvider (stores/themeStore.ts)
- Zustand store per theme state: 'light' | 'dark' | 'system'
- Azioni: setTheme, toggleTheme
- Persistenza: localStorage (key: 'r6hub_theme')
- System preference detection: window.matchMedia('(prefers-color-scheme: dark)')
- Sync con system preference se theme === 'system'

### 2. Theme Toggle Component (components/ui/ThemeToggle.tsx)
- Button con icona: sun (light) / moon (dark) / monitor (system)
- Click: cicla tra light → dark → system → light
- Tooltip: mostra stato attuale
- MD3 style: icon button MD3

### 3. CSS Variables per Light Theme
In globals.css, aggiungere:
```css
[data-theme="light"] {
  --background: oklch(0.98 0 0);
  --foreground: oklch(0.15 0 0);
  --card: oklch(0.96 0 0);
  /* ... tutti i tokens light ... */
}
```

### 4. App Wrapper (app/layout.tsx)
- Inizializzare theme da localStorage o system preference
- Applicare data-theme attribute a <html>
- ThemeProvider context

### 5. Aggiungere ThemeToggle al Layout
- Header globale (dal piano layout-shell-md3)
- Posizione: top-right, vicino a UserMenu
- Mobile: nella bottom nav bar

## Agent
- **davinci** (fork): UI design, theme toggle component
- **human** (fresh): implementazione codice, ThemeProvider, CSS
- **pastor** (fork): architettura, state management

## Verifica
- [ ] ThemeProvider store funzionante
- [ ] ThemeToggle component visibile
- [ ] Click toggle: light ↔ dark ↔ system
- [ ] Persistenza: reload pagina mantiene theme
- [ ] System preference: respect OS setting
- [ ] CSS variables light theme applicate
- [ ] Build passa
- [ ] Screenshot light + dark mode
- [ ] Test su mobile + desktop