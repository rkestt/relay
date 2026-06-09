# r6Hub — Design System

## Color Strategy
**Committed** — Red-orange fire palette on dark background. Single saturated accent carries 30-40% of interactive surface.

### Primary Palette (Red-Orange Fire)
- **Primary**: `oklch(0.65 0.22 25)` — Vibrant red-orange (CTA buttons, active states, primary actions)
- **Primary-hover**: `oklch(0.70 0.24 25)` — Lighter red-orange (hover states)
- **Primary-active**: `oklch(0.60 0.20 25)` — Deeper red-orange (active/pressed states)
- **Primary-foreground**: `oklch(0.98 0 0)` — Near-white text on primary

### Background & Surface
- **Background**: `oklch(0.12 0.005 270)` — Deep dark with subtle blue tint (not pure black)
- **Card**: `oklch(0.16 0.005 270)` — Slightly lighter than background
- **Elevated**: `oklch(0.20 0.005 270)` — Modals, dropdowns, popovers
- **Foreground**: `oklch(0.96 0 0)` — Near-white text

### Neutral Scale (Tinted toward blue)
- **Neutral-50**: `oklch(0.96 0.003 270)` — Primary text
- **Neutral-100**: `oklch(0.90 0.005 270)` — Secondary text
- **Neutral-200**: `oklch(0.80 0.008 270)` — Tertiary text, icons
- **Neutral-300**: `oklch(0.70 0.010 270)` — Disabled text
- **Neutral-400**: `oklch(0.50 0.012 270)` — Borders, dividers
- **Neutral-500**: `oklch(0.40 0.010 270)` — Muted backgrounds
- **Neutral-600**: `oklch(0.30 0.008 270)` — Card borders
- **Neutral-700**: `oklch(0.24 0.006 270)` — Input backgrounds
- **Neutral-800**: `oklch(0.20 0.005 270)` — Elevated surfaces
- **Neutral-900**: `oklch(0.16 0.005 270)` — Cards
- **Neutral-950**: `oklch(0.12 0.005 270)` — Page background

### Semantic Colors
- **Success**: `oklch(0.70 0.18 145)` — Green (completed actions, locked selections)
- **Warning**: `oklch(0.75 0.16 85)` — Amber (warnings, leader badge)
- **Destructive**: `oklch(0.65 0.22 25)` — Red-orange (errors, destructive actions, leave)
- **Info**: `oklch(0.65 0.18 240)` — Blue (defender side, informational)

### Special
- **Attacker**: `oklch(0.65 0.22 25)` — Red-orange (attacker side indicator)
- **Defender**: `oklch(0.65 0.18 240)` — Blue (defender side indicator)

## Typography

### Font Families
- **Display/Heading**: Geist Sans (already configured) — Clean, modern, technical
- **Body**: Geist Sans — Consistent with headings
- **Mono**: Geist Mono (already configured) — Code, room codes, technical data

### Type Scale (1.25 ratio)
- **Display**: 48px / 3rem — Hero titles (font-weight: 700)
- **H1**: 36px / 2.25rem — Page titles (font-weight: 700)
- **H2**: 28px / 1.75rem — Section titles (font-weight: 600)
- **H3**: 22px / 1.375rem — Card titles (font-weight: 600)
- **Body-lg**: 18px / 1.125rem — Lead text (font-weight: 400)
- **Body**: 16px / 1rem — Default text (font-weight: 400)
- **Body-sm**: 14px / 0.875rem — Secondary text (font-weight: 400)
- **Caption**: 12px / 0.75rem — Labels, metadata (font-weight: 500)

### Line Heights
- **Headings**: 1.2 (tight)
- **Body**: 1.5 (comfortable reading)
- **Caption**: 1.4 (compact)

### Letter Spacing
- **Display/H1**: -0.02em (tighter for large text)
- **Body**: 0 (default)
- **Caption/Labels**: 0.05em (wider for small caps)

## Spacing Scale
Based on 4px grid:
- **xs**: 4px (0.25rem)
- **sm**: 8px (0.5rem)
- **md**: 12px (0.75rem)
- **lg**: 16px (1rem)
- **xl**: 24px (1.5rem)
- **2xl**: 32px (2rem)
- **3xl**: 48px (3rem)
- **4xl**: 64px (4rem)

## Border Radius
- **sm**: 6px (inputs, small elements)
- **md**: 8px (buttons, badges)
- **lg**: 12px (cards, modals)
- **xl**: 16px (large containers)
- **2xl**: 20px (hero elements)
- **full**: 9999px (circular avatars, pills)

## Elevation (Shadows)
- **Level 0**: No shadow (flat elements)
- **Level 1**: `0 1px 2px 0 oklch(0 0 0 / 0.05)` — Subtle lift (cards)
- **Level 2**: `0 4px 6px -1px oklch(0 0 0 / 0.1), 0 2px 4px -2px oklch(0 0 0 / 0.1)` — Elevated (dropdowns)
- **Level 3**: `0 10px 15px -3px oklch(0 0 0 / 0.1), 0 4px 6px -4px oklch(0 0 0 / 0.1)` — Modal (dialogs)
- **Level 4**: `0 20px 25px -5px oklch(0 0 0 / 0.1), 0 8px 10px -6px oklch(0 0 0 / 0.1)` — Popover (tooltips)

## Motion
- **Duration**: 
  - Fast: 150ms (micro-interactions)
  - Normal: 250ms (standard transitions)
  - Slow: 400ms (page transitions, modals)
- **Easing**: 
  - Default: `cubic-bezier(0.4, 0, 0.2, 1)` (ease-out-quart)
  - Enter: `cubic-bezier(0, 0, 0.2, 1)` (ease-out-quint)
  - Exit: `cubic-bezier(0.4, 0, 1, 1)` (ease-in-quart)

## Component Patterns

### Buttons
- **Primary**: Red-orange background, white text, rounded-lg, shadow on hover
- **Secondary**: Transparent background, neutral border, rounded-lg
- **Ghost**: No background/border, text color only
- **Destructive**: Red-orange background (same as primary for consistency)

### Cards
- Background: Neutral-900
- Border: 1px Neutral-600
- Radius: rounded-lg (12px)
- Padding: 24px (1.5rem)
- Shadow: Level 1

### Inputs
- Background: Neutral-700
- Border: 1px Neutral-600
- Radius: rounded-md (8px)
- Height: 40px (2.5rem)
- Focus: 2px ring Primary/20% opacity

### Modals/Dialogs
- Background: Neutral-800
- Border: 1px Neutral-600
- Radius: rounded-xl (16px)
- Padding: 24px
- Shadow: Level 3
- Backdrop: oklch(0 0 0 / 0.6) with backdrop-blur-sm

## Visual Hierarchy Rules
1. **Primary actions** — Red-orange background, prominent placement
2. **Secondary actions** — Neutral border, same size as primary
3. **Tertiary actions** — Ghost style, smaller text
4. **Information** — Neutral-200 text, no background
5. **Metadata** — Neutral-300 text, caption size

## Accessibility
- **Contrast ratio**: Minimum 4.5:1 for body text, 3:1 for large text
- **Focus states**: 2px ring with Primary color, 2px offset
- **Touch targets**: Minimum 44x44px for interactive elements
- **Keyboard navigation**: All interactive elements focusable, logical tab order

## Responsive Breakpoints
- **Mobile**: < 640px (default)
- **Tablet**: 640px - 1024px (sm:)
- **Desktop**: > 1024px (lg:)

## Dark Mode Only
Site is dark-mode only. No light theme toggle. All colors optimized for dark background.
