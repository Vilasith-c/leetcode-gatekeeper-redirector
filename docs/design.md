# Design System & Aesthetics Specification — Mad Coder Pro

## 1. Design Direction & Aesthetic Vision

**Mad Coder Pro** rejects generic, stock, or AI-default aesthetics (such as default slate shadcn UI or plain browser styling). The design language is engineered as an **intense, rewarding, developer-focused "Terminal Unlock / Focus Mode"** theme. It conveys discipline, focus, and accomplishment.

### Key Visual Characteristics
- **Theme**: Deep dark mode ("Obsidian Control Center") with dark glassmorphism (`bg-dark-card/90 backdrop-blur-md`).
- **Accent Theme**: High-contrast **Electric Cyan (`#06b6d4`)** as the primary brand color, complemented by **Glowing Emerald (`#10b981`)** for freedom/solve success, **Amber Flame (`#f59e0b`)** for streaks & hints, and **Vibrant Rose (`#f43f5e`)** for blocked warnings & emergency overrides.
- **Lighting & Elevation**: Subtle ambient glow effects (`shadow-lg shadow-brand-500/20`), crisp 1px dark borders (`#1e293b`), and smooth interactive hover scale states.

---

## 2. Color Palette Specification

```
┌────────────────────────────────────────────────────────────────────────┐
│ Dark Base Palette                                                      │
├─────────────────┬──────────────────────────────────────────────────────┤
│ Background      │ #080c14 (Obsidian Black)                             │
│ Card Surface    │ #0f172a (Deep Slate Card)                            │
│ Card Hover      │ #1e293b (Interactive Slate)                          │
│ Border          │ #1e293b (1px Subtle Divider)                         │
└─────────────────┴──────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│ Brand & Semantic Accents                                               │
├─────────────────┬──────────────────────────────────────────────────────┤
│ Primary Brand   │ #06b6d4 (Electric Cyan - Brand 500)                  │
│ Brand Hover     │ #0891b2 (Cyan 600)                                   │
│ Brand Glow      │ rgba(6, 182, 212, 0.25)                              │
│ Success / Free  │ #10b981 (Emerald 500) — Unlocked freedom state       │
│ Warning / Streak│ #f59e0b (Amber 500) — Flame streaks & hints          │
│ Danger / Block  │ #f43f5e (Rose 500) — Blocked URL & emergency alert   │
│ Purple Accent   │ #a855f7 (Purple 500) — XP level progression fill     │
└─────────────────┴──────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│ Difficulty Badges                                                      │
├─────────────────┬──────────────────────────────────────────────────────┤
│ Easy            │ bg-emerald-500/20 text-emerald-400 border-emerald-500/30│
│ Medium          │ bg-amber-500/20 text-amber-400 border-amber-500/30  │
│ Hard            │ bg-rose-500/20 text-rose-400 border-rose-500/30    │
└─────────────────┴──────────────────────────────────────────────────────┘
```

---

## 3. Typography Specification

To reinforce the developer context, Mad Coder Pro pairs clean UI sans typography with a crisp code monospace font.

- **UI Chrome Font**: `Inter`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `sans-serif`.
- **Code & Title Font**: `JetBrains Mono`, `Fira Code`, `monospace`.

### Type Scale Tokens
- **Header Title**: `text-2xl font-black tracking-tight` (Block Page problem title)
- **Section Heading**: `text-base font-bold tracking-wide`
- **Body Text**: `text-xs font-normal text-slate-300`
- **Label / Micro**: `text-[10px] uppercase font-bold text-slate-400 tracking-wider`
- **Monospace Code**: `font-mono text-xs font-semibold`

---

## 4. Layout & Component-Specific Styling

### A. Block Page (`src/tabs/block.tsx`)
- **Zone 1 (Top Bar)**: Floating header with glowing streak flame badge (`🔥 N Day Streak`) and daily solve status indicators.
- **Zone 2 (Problem Card - Dominant)**: Large title, difficulty badge, blurred problem preview (Zeigarnik effect) with gradient overlay ("Start solving to reveal full task →"), expandable algorithmic hint drawer, and prominent "Go Solve It on LeetCode" button.
- **Zone 3 (Bottom Bar)**: Blocked domain indicator, identity statement quote, and Emergency Override trigger button.

### B. Action Popup (`src/popup/index.tsx`)
- **Header**: Compact header with extension logo badge and flame streak pill.
- **Nav Tabs**: 4 tab buttons (Dashboard, Goals, Whitelist, Stats) with brand active bottom border.
- **Dashboard Tab**: Large "Start Session / End Session" toggle, active assigned goal card, freedom countdown timer banner, and 2-column stats grid.
- **Goals Tab**: Drag-and-drop PDF study plan upload zone, parse progress indicator, and goal table preview.
- **Whitelist Tab**: Add domain input with quick preset buttons (+ Dev Docs, + Search Engines) and scrollable domain list with trash icons.
- **Stats Tab**: Level badge, animated Framer Motion XP progress bar, freeze token status, and overrides counter.

---

## 5. Motion Principles (Framer Motion Guidance)

Micro-animations must be **snappy, rewarding, and performance-optimized**:

- **XP Fill Bar**: Smooth ease-out fill animation (`duration: 0.8s, ease: "easeOut"`).
- **Streak Flame Pulse**: Subtle continuous scale oscillation (`scale: [1, 1.08, 1], duration: 1.5s`).
- **Tab Switching**: Fast fade and slight y-translation (`initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, duration: 0.2s`).
- **Celebration Confetti**: Particle burst triggered upon problem solve and freedom unlock events (`particleCount: 100, spread: 70`).
