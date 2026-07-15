# Desktop UI Redesign Plan — Horizontal Layout

## Overview
Complete redesign of desktop UI to horizontal layout optimized for PC format. Mobile UI remains untouched.

## Current State Analysis

### Problems with Current Desktop UI
1. **No dedicated desktop layout** — mobile-first single-column stretched to desktop
2. **Wasted screen real estate** — wide screens show narrow centered content
3. **No persistent navigation** — each page has its own header, no shell
4. **Poor multitasking** — can't see lobby context while navigating
5. **Vertical scrolling fatigue** — all content stacked vertically

### What We Keep
- Mobile UI (unchanged)
- Design system (colors, typography, spacing, components)
- Component library (shadcn/ui)
- Data flow (Supabase, Zustand, realtime)
- Auth flow

## Proposed Desktop Architecture

### Layout Structure (Desktop Only)
```
┌─────────────────────────────────────────────────────────────────┐
│ TopBar (64px)                                                   │
│ Logo | Lobby Code | Round Status | Timer | User Menu            │
├────────────┬────────────────────────────────────┬───────────────┤
│            │                                    │               │
│ Left       │    Main Content Area               │ Right         │
│ Sidebar    │    (Dynamic per route)             │ Panel         │
│ (280px)    │                                    │ (320px)       │
│            │    - Bans: Operator grids          │               │
│ - Lobby    │    - Map: Map selection            │ - Round Info  │
│   Info     │    - Select: Site/Operator wizard  │ - Members     │
│ - Members  │    - Tasks: Strategy cards         │ - Quick       │
│ - Rounds   │    - Task Detail: Full strategy    │   Actions     │
│ - Nav      │                                    │ - Chat/       │
│            │                                    │   Activity    │
│            │                                    │               │
└────────────┴────────────────────────────────────┴───────────────┘
```

### Responsive Strategy
- **Mobile (< 1024px)**: Current single-column layout (unchanged)
- **Desktop (≥ 1024px)**: New horizontal 3-panel layout
- Breakpoint: `lg:` (1024px) — existing Tailwind breakpoint

## Skills Integration Strategy

### Skill Usage Per Phase

| Phase | Primary Skills | Purpose |
|-------|---------------|---------|
| **Phase 1: Foundation** | `impeccable` (shape, craft), `hallmark` (audit) | Design shell layout, avoid AI-slop patterns |
| **Phase 2: Lobby Pages** | `impeccable` (craft, polish), `nextjs-app-router-patterns` | Refactor pages with best practices |
| **Phase 3: Non-Lobby Pages** | `impeccable` (craft, adapt), `simplify` | Adapt pages, simplify code |
| **Phase 4: Polish** | `impeccable` (animate, delight), `hallmark` (audit) | Add interactions, final quality check |
| **Phase 5: Testing** | `tdd`, `impeccable` (audit, harden) | Test coverage, production-ready |

### Skill Commands Workflow

#### Phase 1: Foundation
```bash
# Design shell structure
$impeccable shape desktop-shell

# Build shell components
$impeccable craft desktop-shell

# Audit for AI-slop patterns
$hallmark audit components/layout/

# Polish shell interactions
$impeccable polish components/layout/
```

#### Phase 2: Lobby Pages
```bash
# Refactor each lobby page
$impeccable craft lobby-bans-page
$impeccable craft lobby-map-page
$impeccable craft lobby-select-page
$impeccable craft lobby-tasks-page
$impeccable craft lobby-task-detail-page

# Audit each page
$hallmark audit app/lobby/[code]/

# Simplify code
$simplify app/lobby/[code]/
```

#### Phase 3: Non-Lobby Pages
```bash
# Adapt pages to desktop
$impeccable adapt app/page.tsx
$impeccable adapt app/submit/page.tsx
$impeccable adapt app/tasks/page.tsx

# Simplify code
$simplify app/
```

#### Phase 4: Polish
```bash
# Add animations
$impeccable animate components/layout/

# Add delight
$impeccable delight app/lobby/

# Final audit
$hallmark audit app/
$impeccable audit app/
```

#### Phase 5: Testing
```bash
# Test-driven development
$tdd components/layout/
$tdd app/lobby/

# Production hardening
$impeccable harden app/
```

## Score Point System (0-100)

### Scoring Categories

| Category | Weight | Criteria |
|----------|--------|----------|
| **Visual Quality** | 25% | Design, spacing, hierarchy, color usage |
| **Code Quality** | 20% | Clean, maintainable, tested, documented |
| **Performance** | 15% | Fast load, no jank, optimized |
| **Accessibility** | 15% | Keyboard nav, screen reader, contrast |
| **Responsive** | 15% | Mobile untouched, desktop works perfectly |
| **User Experience** | 10% | Intuitive, efficient, delightful |

### Detailed Scoring Rubric

#### Visual Quality (25 points)
- **25**: Exceptional design, perfect spacing, clear hierarchy, consistent with design system
- **20**: Good design, minor spacing issues, hierarchy mostly clear
- **15**: Acceptable design, some spacing/hierarchy issues
- **10**: Poor design, inconsistent spacing, unclear hierarchy
- **5**: Very poor design, major issues

**Checklist:**
- [ ] Spacing follows 4px grid (DESIGN.md)
- [ ] Typography scale correct (DESIGN.md)
- [ ] Color usage consistent (DESIGN.md)
- [ ] Border radius consistent
- [ ] Shadows/elevation correct
- [ ] No AI-slop patterns (hallmark audit)

#### Code Quality (20 points)
- **20**: Clean, well-structured, tested, documented, no duplication
- **16**: Good structure, some tests, minimal duplication
- **12**: Acceptable structure, few tests, some duplication
- **8**: Poor structure, no tests, high duplication
- **4**: Very poor structure, no tests

**Checklist:**
- [ ] Components follow shadcn/ui patterns
- [ ] No code duplication
- [ ] TypeScript types correct
- [ ] Tests written (unit + integration)
- [ ] Code documented (comments where needed)
- [ ] No console.log/debug code

#### Performance (15 points)
- **15**: Fast load (<2s), no layout shift, smooth interactions
- **12**: Good load (<3s), minimal layout shift
- **9**: Acceptable load (<4s), some layout shift
- **6**: Slow load (>4s), noticeable jank
- **3**: Very slow, major performance issues

**Checklist:**
- [ ] No layout shift on load
- [ ] Fast panel switching (<100ms)
- [ ] Smooth scrolling (60fps)
- [ ] No jank during interactions
- [ ] Images optimized
- [ ] Lazy loading where appropriate

#### Accessibility (15 points)
- **15**: Fully accessible, keyboard nav, screen reader friendly
- **12**: Mostly accessible, minor issues
- **9**: Some accessibility features, major gaps
- **6**: Poor accessibility, hard to use with keyboard
- **3**: Not accessible

**Checklist:**
- [ ] All interactive elements focusable
- [ ] Keyboard navigation works (Tab, Enter, Esc, Arrow keys)
- [ ] ARIA labels correct
- [ ] Focus management correct (modals, panels)
- [ ] Contrast ratios ≥4.5:1 (body), ≥3:1 (large text)
- [ ] Screen reader friendly (ARIA landmarks)

#### Responsive (15 points)
- **15**: Mobile untouched, desktop perfect, smooth transition
- **12**: Mobile mostly untouched, desktop good
- **9**: Mobile has minor changes, desktop acceptable
- **6**: Mobile broken or desktop poor
- **3**: Both mobile and desktop broken

**Checklist:**
- [ ] Mobile UI unchanged (no regressions)
- [ ] Desktop layout works at 1024px, 1280px, 1440px, 1920px
- [ ] Responsive breakpoints correct
- [ ] No horizontal scroll on mobile
- [ ] Desktop uses horizontal space efficiently

#### User Experience (10 points)
- **10**: Intuitive, efficient, delightful, no friction
- **8**: Good UX, minor friction points
- **6**: Acceptable UX, some friction
- **4**: Poor UX, confusing or frustrating
- **2**: Very poor UX, unusable

**Checklist:**
- [ ] Navigation intuitive
- [ ] Actions discoverable
- [ ] Feedback clear (loading, success, error)
- [ ] No dead ends
- [ ] Keyboard shortcuts work
- [ ] Hover states clear

### Score Calculation

```
Total Score = (Visual × 0.25) + (Code × 0.20) + (Performance × 0.15) + 
              (Accessibility × 0.15) + (Responsive × 0.15) + (UX × 0.10)
```

**Example:**
- Visual: 23/25
- Code: 18/20
- Performance: 14/15
- Accessibility: 13/15
- Responsive: 14/15
- UX: 9/10

```
Total = (23 × 0.25) + (18 × 0.20) + (14 × 0.15) + (13 × 0.15) + (14 × 0.15) + (9 × 0.10)
      = 5.75 + 3.6 + 2.1 + 1.95 + 2.1 + 0.9
      = 16.4 / 20 × 100 = 82/100
```

## Quality Gates

### Gate 1: Foundation Complete (Target: 70/100)
**Criteria:**
- DesktopShell renders on desktop
- TopBar shows lobby info
- LeftSidebar shows members
- RightPanel shows context
- Mobile UI unchanged
- No console errors

**Verification:**
```bash
# Visual check
open http://localhost:3000/lobby/[code]

# Responsive check
# Chrome DevTools → 1024px, 1280px, 1440px, 1920px
# Mobile: 375px, 414px

# Console check
# No errors, no warnings
```

### Gate 2: Lobby Pages Refactored (Target: 75/100)
**Criteria:**
- All lobby pages work in desktop layout
- Navigation works (sidebar → pages)
- RightPanel context-aware
- Mobile UI unchanged
- No layout shift

**Verification:**
```bash
# Test all lobby routes
/lobby/[code]
/lobby/[code]/bans
/lobby/[code]/map
/lobby/[code]/select
/lobby/[code]/tasks
/lobby/[code]/tasks/[id]

# Check mobile
# 375px, 414px — all pages work as before
```

### Gate 3: Non-Lobby Pages Adapted (Target: 80/100)
**Criteria:**
- Home page works on desktop
- Submit page works on desktop
- Tasks page works on desktop
- Settings pages work on desktop
- Mobile UI unchanged

**Verification:**
```bash
# Test all routes
/
/submit
/tasks
/settings/account
/settings/cookies

# Check mobile
# All pages work as before
```

### Gate 4: Polish Complete (Target: 85/100)
**Criteria:**
- Animations smooth
- Keyboard shortcuts work
- Hover states clear
- No AI-slop patterns
- Design system consistent

**Verification:**
```bash
# Keyboard test
Tab through all interactive elements
Esc closes modals
1-4 navigate lobby sections

# Animation test
# Smooth transitions, no jank

# Hallmark audit
$hallmark audit app/
# No critical issues
```

### Gate 5: Production Ready (Target: 90/100)
**Criteria:**
- All tests pass
- No console errors
- Performance optimized
- Accessibility verified
- Cross-browser tested

**Verification:**
```bash
# Run tests
npm test

# Build check
npm run build

# Lighthouse
# Performance: >90
# Accessibility: >90
# Best Practices: >90

# Browser test
# Chrome, Firefox, Safari
```

## /Goal Iteration Strategy

### Goal Setup
```bash
/goal desktop-ui-redesign --max-turns 20 --max-minutes 30 --max-tokens 400000
```

### Iteration Loop

#### Turn 1-4: Foundation
- Build DesktopShell, TopBar, LeftSidebar, RightPanel
- Score: Target 70/100
- Evidence: Screenshots at 1024px, 1280px, 1440px

#### Turn 5-8: Lobby Pages
- Refactor all lobby pages
- Score: Target 75/100
- Evidence: All routes work, mobile unchanged

#### Turn 9-12: Non-Lobby Pages
- Adapt all non-lobby pages
- Score: Target 80/100
- Evidence: All routes work, mobile unchanged

#### Turn 13-16: Polish
- Add animations, keyboard shortcuts
- Score: Target 85/100
- Evidence: Keyboard nav works, animations smooth

#### Turn 17-20: Testing & Hardening
- Write tests, optimize performance
- Score: Target 90/100
- Evidence: Tests pass, Lighthouse >90

### Auto-Continue Logic
- If score < target: continue to next turn
- If score ≥ target: mark complete, show evidence
- If max turns reached: stop, show current score, ask user

### Evidence Requirements
Each claim must be backed by:
- **Visual**: Screenshot or description of visual check
- **Code**: File path + line number
- **Test**: Test output or Lighthouse score
- **Performance**: Load time, FPS, layout shift metrics

### Safety Limits
- **Max auto-turns**: 20
- **Max time**: 30 minutes
- **Max tokens**: 400k
- **No-progress pause**: <50 output tokens after 2 stalled turns

## Implementation Plan

### Phase 1: Foundation (Core Shell)
**Goal**: Create desktop layout shell without breaking mobile

#### 1.1 Create Desktop Shell Component
- **File**: `components/layout/DesktopShell.tsx`
- **Structure**:
  ```tsx
  <div className="hidden lg:flex h-screen flex-col">
    <TopBar />
    <div className="flex flex-1 overflow-hidden">
      <LeftSidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
      <RightPanel />
    </div>
  </div>
  ```
- **Mobile**: Hidden via `hidden lg:flex`, mobile uses existing layout
- **Responsive**: Only renders on `lg:` breakpoint

#### 1.2 Create TopBar Component
- **File**: `components/layout/TopBar.tsx`
- **Content**:
  - Logo (left)
  - Lobby code with copy button (center-left)
  - Round status indicator (center)
  - Timer if active (center-right)
  - UserMenu (right, moved from floating position)
- **Sticky**: Fixed at top, 64px height
- **Background**: Neutral-900 with border-bottom

#### 1.3 Create LeftSidebar Component
- **File**: `components/layout/LeftSidebar.tsx`
- **Sections**:
  1. **Lobby Info** (collapsible)
     - Lobby name/code
     - Leader name
     - Created date
  2. **Members List** (scrollable)
     - Avatar + username
     - Leader badge
     - Ready status
     - Team indicator (attack/defend)
  3. **Navigation** (bottom)
     - Bans (if leader)
     - Map (if leader)
     - Select
     - Tasks
- **Width**: 280px fixed
- **Scrollable**: Members list scrolls independently

#### 1.4 Create RightPanel Component
- **File**: `components/layout/RightPanel.tsx`
- **Content** (context-aware per route):
  - **Bans page**: Current ban status, banned operators list
  - **Map page**: Selected map preview, map stats
  - **Select page**: Current selections, site info
  - **Tasks page**: Filter/sort controls, task stats
  - **Task detail**: Related tasks, vote summary
- **Width**: 320px fixed
- **Collapsible**: Can be hidden to give more space to main content

#### 1.5 Update Root Layout
- **File**: `app/layout.tsx`
- **Changes**:
  ```tsx
  <body>
    <DesktopShell>
      {children}
    </DesktopShell>
    {/* Mobile-only elements */}
    <div className="lg:hidden">
      <UserMenu />
      <CookieBanner />
    </div>
    <LogPanel />
  </body>
  ```
- **Conditional**: DesktopShell only on desktop, mobile keeps current structure

### Phase 2: Refactor Lobby Pages
**Goal**: Adapt lobby pages to work within desktop shell

#### 2.1 Lobby Home Page
- **File**: `app/lobby/[code]/page.tsx`
- **Changes**:
  - Remove page header (moved to TopBar)
  - Remove sticky bottom actions (moved to RightPanel)
  - Content: Waiting room state, phase transitions
  - Desktop: Show in main content area
  - Mobile: Keep current layout

#### 2.2 Bans Page
- **File**: `app/lobby/[code]/bans/page.tsx`
- **Changes**:
  - Remove page header
  - Operator grids: Keep `md:grid-cols-2` (already horizontal)
  - Desktop: Grids expand to fill main content area
  - RightPanel: Show banned operators list, ban count
  - Mobile: Keep current layout

#### 2.3 Map Selection Page
- **File**: `app/lobby/[code]/map/page.tsx`
- **Changes**:
  - Remove page header
  - Map grid: `lg:grid-cols-5` (5 maps per row on desktop)
  - Desktop: Maps larger, more visible
  - RightPanel: Selected map preview, map stats (attacks/defenses)
  - Mobile: Keep current layout

#### 2.4 Select Page (Site + Operator)
- **File**: `app/lobby/[code]/select/page.tsx`
- **Changes**:
  - Remove page header
  - Step wizard: Horizontal stepper in main content top
  - Operator grid: `lg:grid-cols-6` (6 operators per row)
  - Desktop: More operators visible at once
  - RightPanel: Current selections, site info, operator details
  - Mobile: Keep current layout

#### 2.5 Tasks Page (Strategies Feed)
- **File**: `app/lobby/[code]/tasks/page.tsx`
- **Changes**:
  - Remove page header
  - Strategy cards: `lg:grid-cols-3` (3 cards per row)
  - Desktop: Cards larger, more content visible
  - RightPanel: Filter/sort controls, task stats (total, voted, pending)
  - Mobile: Keep current layout

#### 2.6 Task Detail Page
- **File**: `app/lobby/[code]/tasks/[id]/page.tsx`
- **Changes**:
  - Remove page header
  - Layout: Split view (image gallery left, content right)
  - Desktop: `lg:grid lg:grid-cols-2` (gallery + content side-by-side)
  - MapViewer: Larger, more detailed
  - RightPanel: Related tasks, vote summary, comments
  - Mobile: Keep current layout (stacked)

### Phase 3: Non-Lobby Pages
**Goal**: Adapt other pages to desktop shell

#### 3.1 Home Page (Landing)
- **File**: `app/page.tsx`
- **Changes**:
  - Desktop: Centered content, wider max-width (`max-w-2xl`)
  - Create/Join lobby: Side-by-side cards on desktop
  - Recent lobbies: Grid layout on desktop
  - Mobile: Keep current layout

#### 3.2 Login/Signup Pages
- **Files**: `app/login/page.tsx`, `app/signup/page.tsx`
- **Changes**:
  - Desktop: Centered card, wider (`max-w-md`)
  - Form fields: Larger, more spacing
  - Mobile: Keep current layout

#### 3.3 Submit Strategy Page
- **File**: `app/submit/page.tsx`
- **Changes**:
  - Desktop: Split layout (form left, MapViewer right)
  - `lg:grid lg:grid-cols-2` (form + map side-by-side)
  - MapViewer: Larger, easier to place hotspots
  - Mobile: Keep current layout (stacked)

#### 3.4 Global Tasks Page
- **File**: `app/tasks/page.tsx`
- **Changes**:
  - Desktop: Full-width table (already has `md:grid` headers)
  - More columns visible, better use of space
  - Mobile: Keep current layout

#### 3.5 Settings Pages
- **Files**: `app/settings/account/page.tsx`, `app/settings/cookies/page.tsx`
- **Changes**:
  - Desktop: Wider max-width (`max-w-3xl`)
  - More spacing, larger text
  - Mobile: Keep current layout

### Phase 4: Polish & Interactions
**Goal**: Add desktop-specific interactions

#### 4.1 Keyboard Shortcuts
- **Global**:
  - `Esc`: Close modals/panels
  - `Ctrl+K`: Quick search (future)
  - `1-4`: Navigate lobby sections (bans/map/select/tasks)
- **Implementation**: `hooks/useKeyboardShortcuts.ts`

#### 4.2 Hover States
- **Cards**: Lift on hover (shadow increase)
- **Buttons**: Subtle scale (1.02)
- **Nav items**: Background highlight
- **Implementation**: Tailwind `hover:` classes

#### 4.3 Collapsible Panels
- **RightPanel**: Toggle button to hide/show
- **LeftSidebar**: Collapse to icons only (future)
- **Implementation**: State in `stores/uiStore.ts` (new)

#### 4.4 Animations
- **Panel transitions**: Smooth slide in/out
- **Page transitions**: Fade + slide
- **Card hover**: Lift + shadow
- **Implementation**: Framer Motion or CSS transitions

### Phase 5: Testing & Optimization
**Goal**: Ensure quality across all screen sizes

#### 5.1 Responsive Testing
- **Breakpoints**: Test at 1024px, 1280px, 1440px, 1920px
- **Devices**: Chrome DevTools device emulation
- **Real devices**: Test on actual desktop monitors

#### 5.2 Performance
- **Lazy loading**: RightPanel content loads on demand
- **Virtualization**: Long member lists use virtual scroll
- **Image optimization**: Map/operator images optimized

#### 5.3 Accessibility
- **Keyboard navigation**: All interactive elements focusable
- **Screen readers**: ARIA labels for panels
- **Focus management**: Focus trapped in modals

#### 5.4 Browser Testing
- **Chrome/Edge**: Primary target
- **Firefox**: Secondary
- **Safari**: Tertiary

## File Structure (New Files)

```
components/
├── layout/
│   ├── DesktopShell.tsx       # Main desktop layout wrapper
│   ├── TopBar.tsx             # Top navigation bar
│   ├── LeftSidebar.tsx        # Left sidebar (lobby info, members, nav)
│   └── RightPanel.tsx         # Right context panel
├── lobby/
│   ├── MembersList.tsx        # Extracted member list component
│   ├── LobbyInfo.tsx          # Lobby metadata display
│   └── RoundStatus.tsx        # Round indicator component
stores/
└── uiStore.ts                 # UI state (panel visibility, etc.)
hooks/
└── useKeyboardShortcuts.ts    # Keyboard navigation
```

## Migration Strategy

### Incremental Rollout
1. **Week 1**: DesktopShell + TopBar + LeftSidebar (foundation)
2. **Week 2**: RightPanel + refactor lobby pages
3. **Week 3**: Non-lobby pages + polish
4. **Week 4**: Testing + optimization + bug fixes

### Backwards Compatibility
- Mobile UI completely untouched
- Desktop users get new layout automatically
- No breaking changes to data flow or API

### Feature Flags (Optional)
- `NEXT_PUBLIC_DESKTOP_UI=true/false` — toggle new desktop UI
- Allows gradual rollout and A/B testing
- Implementation: `lib/feature-flags.ts`

## Success Criteria

### Functional
- [ ] All lobby pages work in desktop layout
- [ ] All non-lobby pages work in desktop layout
- [ ] Mobile UI unchanged (no regressions)
- [ ] Responsive breakpoints work correctly
- [ ] Keyboard navigation works

### Visual
- [ ] Horizontal layout uses screen space efficiently
- [ ] No wasted whitespace
- [ ] Consistent with design system
- [ ] Smooth transitions between states

### Performance
- [ ] No layout shift on load
- [ ] Fast panel switching
- [ ] Smooth scrolling
- [ ] No jank during interactions

### Accessibility
- [ ] Keyboard accessible
- [ ] Screen reader friendly
- [ ] Focus management correct
- [ ] Contrast ratios maintained

## Risks & Mitigations

### Risk 1: Mobile Regressions
- **Mitigation**: Strict responsive class usage, test mobile after every change
- **Fallback**: Feature flag to disable desktop UI

### Risk 2: Complex State Management
- **Mitigation**: Keep UI state separate from data state (uiStore vs lobbyStore)
- **Fallback**: Simple toggle state, no complex logic

### Risk 3: Performance Issues
- **Mitigation**: Lazy load panels, virtualize long lists
- **Fallback**: Disable right panel on low-end devices

### Risk 4: Accessibility Regressions
- **Mitigation**: Test with keyboard-only navigation, screen reader
- **Fallback**: Maintain focus management patterns

## Dependencies

### NPM Packages (if needed)
- `@dnd-kit/core` — drag & drop (optional, future)
- `react-virtuoso` — virtual scrolling (optional, if lists are long)

### No New Dependencies Required For MVP
- All functionality achievable with existing stack
- Tailwind + shadcn/ui sufficient for layout

## Timeline Estimate

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| Phase 1: Foundation | 2-3 days | DesktopShell, TopBar, LeftSidebar, RightPanel |
| Phase 2: Lobby Pages | 3-4 days | All lobby pages refactored |
| Phase 3: Non-Lobby Pages | 2-3 days | All other pages adapted |
| Phase 4: Polish | 2-3 days | Interactions, shortcuts, animations |
| Phase 5: Testing | 2-3 days | Responsive testing, bug fixes |
| **Total** | **11-16 days** | **Complete desktop UI redesign** |

## Next Steps

1. **Review this plan** — confirm scope and approach
2. **Set /goal** — start implementation
3. **Phase 1 first** — build foundation, test on desktop
4. **Iterate** — refine based on visual testing
5. **Self-test** — verify mobile unchanged, desktop works

---

**Status**: Ready for implementation
**Owner**: AI Agent (with @designer for UI polish)
**Review**: User approval required before starting
