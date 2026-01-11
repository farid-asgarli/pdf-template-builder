# Survey App Design System

> Based on **Material Design 3 Expressive** principles  
> References: [M3 Foundations](https://m3.material.io/foundations) | [M3 Expressive Research](https://design.google/library/expressive-material-design-google-research) > _"Expressive design makes you feel something. It inspires emotion, communicates function, and helps users achieve their goals."_ — Material Design Team

---

THIS APP IS WIP. MAKE BREAKING CHANGES BOTH IN BACKEND AND FRONTEND AS NEEDED.

## Core Philosophy

This design system follows **M3 Expressive** — Google's research-backed evolution of Material Design that prioritizes emotional connection while maintaining excellent usability.

### Key Principles

1. **No shadows for elevation** — We use color, borders, and containment instead
2. **No transforms for elevation** — Scale/translate effects are not used for depth
3. **No gradients** — Flat, solid colors with opacity variations for layering
4. **Dynamic shape** — Border radius changes on interaction (stationary → hover → focus)
5. **Container-based hierarchy** — Surface levels create visual depth through color
6. **Emotional but functional** — Expressive design that improves usability

---

## Color System

### Philosophy

Colors use the M3 tonal palette system with semantic naming. All colors have light/dark mode variants defined as CSS custom properties.

### Primary Palette

| Token                    | Light     | Dark      | Usage                            |
| ------------------------ | --------- | --------- | -------------------------------- |
| `--primary`              | `#6750a4` | `#d0bcff` | Primary actions, key UI elements |
| `--on-primary`           | `#ffffff` | `#381e72` | Text/icons on primary            |
| `--primary-container`    | `#eaddff` | `#4f378b` | Soft primary backgrounds         |
| `--on-primary-container` | `#21005d` | `#eaddff` | Text on primary container        |

### Secondary & Tertiary

| Token                   | Light     | Dark      | Usage                 |
| ----------------------- | --------- | --------- | --------------------- |
| `--secondary`           | `#625b71` | `#ccc2dc` | Secondary actions     |
| `--secondary-container` | `#e8def8` | `#4a4458` | Secondary backgrounds |
| `--tertiary`            | `#7d5260` | `#efb8c8` | Accent elements       |
| `--tertiary-container`  | `#ffd8e4` | `#633b48` | Tertiary backgrounds  |

### Surface Hierarchy

Surfaces create depth without shadows through progressive tonal shifts:

| Token                         | Light     | Dark      | Level                         |
| ----------------------------- | --------- | --------- | ----------------------------- |
| `--surface-container-lowest`  | `#ffffff` | `#0f0d13` | Deepest background (nav rail) |
| `--surface`                   | `#fef7ff` | `#141218` | Default page background       |
| `--surface-container-low`     | `#f7f2fa` | `#1d1b20` | Slightly raised               |
| `--surface-container`         | `#f3edf7` | `#211f26` | Cards, dialogs                |
| `--surface-container-high`    | `#ece6f0` | `#2b2930` | Elevated containers           |
| `--surface-container-highest` | `#e6e0e9` | `#36343b` | Highest emphasis              |

### Semantic Colors

| Token       | Light     | Dark      | Usage                             |
| ----------- | --------- | --------- | --------------------------------- |
| `--error`   | `#b3261e` | `#f2b8b5` | Error states, destructive actions |
| `--warning` | `#d09000` | `#ffd180` | Warnings, caution states          |
| `--success` | `#2aa86a` | `#80e8a8` | Success states, confirmations     |
| `--info`    | `#5090ff` | `#a3c9ff` | Informational states              |

### Utility Colors

| Token                  | Usage                                    |
| ---------------------- | ---------------------------------------- |
| `--outline`            | Strong borders, dividers                 |
| `--outline-variant`    | Subtle borders (often at 20-40% opacity) |
| `--on-surface`         | Primary text                             |
| `--on-surface-variant` | Secondary text, icons                    |

### Color Application Rules

```
✅ DO:
- Use container colors for backgrounds (surface-container, primary-container)
- Apply opacity to outline-variant for subtle borders (outline-variant/30)
- Use semantic colors for states (error, success, warning, info)
- Layer surfaces to create depth

❌ DON'T:
- Use shadows for elevation
- Create gradients
- Use arbitrary hex colors outside the palette
- Mix incompatible surface/on-surface pairs
```

---

## Typography

### Primary Font: Cereal (Airbnb Cereal)

Variable font supporting weights 100-900 with Cyrillic and Greek character sets.

```css
--font-sans: 'Cereal', ui-sans-serif, system-ui, sans-serif;
```

### Type Scale

| Class         | Size  | Usage                                     |
| ------------- | ----- | ----------------------------------------- |
| `text-[10px]` | 10px  | Badges, small indicators                  |
| `text-xs`     | 12px  | Chips, helper text, timestamps            |
| `text-sm`     | 14px  | Form inputs, descriptions, secondary text |
| `text-base`   | 16px  | Body text, default                        |
| `text-lg`     | 18px  | Card titles, emphasis                     |
| `text-xl`     | 20px  | Section headers                           |
| `text-2xl`    | 24px  | Page subtitles                            |
| `text-3xl`    | 30px  | Stat values, large numbers                |
| `text-4xl+`   | 36px+ | Hero text, page titles                    |

### Font Weights

| Weight | Class           | Usage             |
| ------ | --------------- | ----------------- |
| 400    | `font-normal`   | Body text         |
| 500    | `font-medium`   | Emphasis, labels  |
| 600    | `font-semibold` | Buttons, headings |
| 700    | `font-bold`     | Strong emphasis   |

### Typography Rules

```
✅ DO:
- Use font-semibold for all buttons
- Use font-medium for form labels
- Use text-sm for helper/description text
- Maintain consistent hierarchy within components

❌ DON'T:
- Use font-light (too subtle)
- Mix more than 2-3 weights per component
- Use arbitrary font sizes outside the scale
```

---

## Spacing

### Base Scale (Tailwind Default)

| Token | Value | Common Usage                |
| ----- | ----- | --------------------------- |
| `1`   | 4px   | Tight gaps (gap-1)          |
| `1.5` | 6px   | Icon spacing                |
| `2`   | 8px   | Small gaps, label margins   |
| `2.5` | 10px  | Compact padding             |
| `3`   | 12px  | Default gaps                |
| `4`   | 16px  | Component padding (p-4)     |
| `5`   | 20px  | Comfortable padding (p-5)   |
| `6`   | 24px  | Large gaps, section spacing |
| `8`   | 32px  | Major section breaks        |

### Component Heights

| Element              | Height     | Class  |
| -------------------- | ---------- | ------ |
| Small button/input   | 36px       | `h-9`  |
| Default button/input | 44px       | `h-11` |
| Large button/input   | 48px       | `h-12` |
| XL button            | 56px       | `h-14` |
| Mobile nav bar       | 72px       | `h-18` |
| Navigation rail      | 88px width | `w-22` |

### Spacing Patterns

```css
/* Card padding */
.card {
  @apply p-4 md:p-5;
}

/* Form field spacing */
.field-label {
  @apply mb-2;
}
.field-helper {
  @apply mt-2;
}

/* List item gaps */
.list {
  @apply gap-3;
}

/* Section gaps */
.section {
  @apply gap-6;
}
```

---

## Border Radius (Shape System)

### M3 Expressive Shape Tokens

| Token           | Value  | Usage                          |
| --------------- | ------ | ------------------------------ |
| `--radius-xs`   | 8px    | Checkboxes, small elements     |
| `--radius-sm`   | 12px   | Compact cards, menu items      |
| `--radius-md`   | 16px   | Default cards, inputs, dialogs |
| `--radius-lg`   | 20px   | Large inputs                   |
| `--radius-xl`   | 24px   | Prominent cards                |
| `--radius-2xl`  | 28px   | Feature cards                  |
| `--radius-3xl`  | 32px   | Hero cards                     |
| `--radius-4xl`  | 40px   | Extra large containers         |
| `--radius-5xl`  | 48px   | Maximum expansion              |
| `--radius-full` | 9999px | Pills, buttons, badges         |

### Tailwind Mapping

| Class          | Value  | Usage                  |
| -------------- | ------ | ---------------------- |
| `rounded-lg`   | 12px   | Compact elements       |
| `rounded-xl`   | 16px   | Cards, inputs          |
| `rounded-2xl`  | 16px   | Default containers     |
| `rounded-3xl`  | 24px   | Prominent containers   |
| `rounded-full` | 9999px | Buttons, chips, badges |

### Dynamic Shape (M3 Expressive)

Cards and interactive containers use **shape morphing** on interaction:

```
Stationary → Hover → Focus/Active

Default shape progression:
24px → 36px → 48px (rounded-3xl → [36px] → [48px])

Compact shape progression:
12px → 16px → 24px

Prominent shape progression:
32px → 40px → 48px
```

### Shape Application

| Component        | Shape                           |
| ---------------- | ------------------------------- |
| Buttons          | `rounded-full` (pill)           |
| Chips            | `rounded-full` (pill)           |
| Badges           | `rounded-full` (pill)           |
| Cards            | `rounded-2xl` base, dynamic     |
| Inputs           | `rounded-2xl` (16px)            |
| Dialogs          | `rounded-3xl` (24px)            |
| Checkboxes       | `rounded-lg` (12px)             |
| Navigation items | `rounded-2xl` (16px)            |
| Icon containers  | `rounded-2xl` to `rounded-full` |

---

## Elevation (Without Shadows)

### Philosophy

We achieve visual hierarchy through **color containment** rather than shadows:

```
❌ NO shadows
❌ NO transform: translateY() for depth
❌ NO scale transforms for elevation

✅ Surface color progression
✅ Border emphasis (border-2)
✅ Opacity layering
✅ Dynamic shape expansion
```

### Elevation Levels via Color

| Level | Surface                     | Border               | Usage              |
| ----- | --------------------------- | -------------------- | ------------------ |
| 0     | `surface`                   | none                 | Page background    |
| 1     | `surface-container-lowest`  | subtle               | Nav rail, sidebars |
| 2     | `surface-container-low`     | `outline-variant/20` | Subtle cards       |
| 3     | `surface-container`         | `outline-variant/30` | Default cards      |
| 4     | `surface-container-high`    | `outline-variant/40` | Elevated cards     |
| 5     | `surface-container-highest` | `outline-variant/50` | Highest emphasis   |

### Minimal Shadows (Exceptions)

Only used for floating elements that require strong separation:

```css
/* Toast shadows only */
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 2px 4px -1px rgb(0 0 0 / 0.06);
--shadow-lg: 0 4px 6px -2px rgb(0 0 0 / 0.05);
```

---

## Components

### Buttons

**Variants:**
| Variant | Style | Usage |
|---------|-------|-------|
| `filled` | Solid primary background | Primary actions |
| `tonal` | Primary container background | Secondary actions |
| `outlined` | Border with transparent bg | Tertiary actions |
| `ghost` | Text only, no border | Minimal actions |
| `elevated` | Subtle raised appearance | Alternative primary |
| `destructive` | Error color solid | Delete, danger |
| `destructive-outline` | Error bordered | Soft danger |
| `destructive-tonal` | Error container | Danger container |

**Sizes:**
| Size | Height | Padding | Font |
|------|--------|---------|------|
| `sm` | 36px (h-9) | px-4 | text-xs |
| `default` | 44px (h-11) | px-6 | text-sm |
| `lg` | 48px (h-12) | px-8 | text-base |
| `xl` | 56px (h-14) | px-10 | text-lg |

**Key Styling:**

```css
/* All buttons */
font-semibold
rounded-full
border-2
transition-all duration-200

/* Press feedback */
active:scale-[0.98]
```

### Cards

**Variants:**
| Variant | Background | Border | Usage |
|---------|------------|--------|-------|
| `default` | card-idle | outline-variant/30 | General cards |
| `surface` | surface-container | outline-variant/20 | Subtle cards |
| `outlined` | transparent | border-2 | Prominent borders |
| `glass` | backdrop-blur | outline-variant/20 | Overlay cards |
| `tonal` | primary-container/40 | primary/20 | Accent cards |
| `interactive` | card-idle | outline-variant/40 | Clickable cards |

**Shape Options:**
| Shape | Stationary | Hover | Focus |
|-------|------------|-------|-------|
| `default` | 24px | 36px | 48px |
| `compact` | 12px | 16px | 24px |
| `prominent` | 32px | 40px | 48px |
| `rounded` | 16px | 24px | 36px |

**Transition:**

```css
transition-[border-radius,border-color,background-color] duration-300
transition-timing-function: cubic-bezier(0.2,0,0,1)
```

### Inputs

**Variants:**
| Variant | Style | Usage |
|---------|-------|-------|
| `outline` | Clean border, focus ring | Default |
| `filled` | Container background | Alternative |
| `ghost` | Minimal border | Inline editing |

**Sizes:**
| Size | Height | Padding | Radius |
|------|--------|---------|--------|
| `sm` | 36px | px-3.5 | rounded-2xl |
| `default` | 44px | px-4 | rounded-2xl |
| `lg` | 48px | px-5 | rounded-[1.25rem] |

**States:**

```css
/* Default */
border-2 border-outline-variant/40

/* Focus */
border-primary ring-2 ring-primary/20

/* Error */
border-error ring-2 ring-error/20

/* Disabled */
opacity-50 cursor-not-allowed
```

### Badges

**Variants:** default, secondary, tertiary, error, warning, success, info, outline

**Sizes:**
| Size | Height | Padding | Font |
|------|--------|---------|------|
| `sm` | 20px | px-2 | 10px |
| `default` | 24px | px-2.5 | text-xs |
| `lg` | 28px | px-3 | text-sm |
| `dot` | 10px | — | — |

**Styling:**

```css
rounded-full
font-semibold
tracking-wide
/* Container bg at 60% opacity with border at 20-50% opacity */
```

### Chips

**Variants:** assist, filter, filter-selected, input, suggestion, success, warning, error

**Sizes:**
| Size | Height | Padding | Font |
|------|--------|---------|------|
| `sm` | 24px | px-3 | text-xs |
| `default` | 32px | px-4 | text-sm |
| `lg` | 40px | px-5 | text-base |

**Styling:**

```css
rounded-full
font-medium
border border-outline-variant/30
```

### Dialogs

**Sizes:** sm (400px), default (500px), lg (600px), xl (800px), full

**Styling:**

```css
rounded-3xl (24px)
bg-surface-container
backdrop: bg-black/60
```

### Tabs

**Variants:**
| Variant | Style |
|---------|-------|
| `underline` | Border-bottom indicator |
| `pills` | Container background |
| `segmented` | Surface-container-high bg |

**Styling:**

```css
/* Pills/Segmented container */
rounded-full
bg-surface-container
p-1.5

/* Individual tab */
rounded-full
transition-all duration-200
```

---

## Layout

### Page Structure

```
┌─────────────────────────────────────────┐
│              Main Layout                │
│  ┌──────┬───────────────────────────┐  │
│  │ Nav  │      Content Area         │  │
│  │ Rail │                           │  │
│  │ 88px │       flex-1              │  │
│  │      │    overflow-y-auto        │  │
│  │      │                           │  │
│  └──────┴───────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │    Bottom Nav (mobile only)      │  │
│  │           h-18 (72px)            │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### Navigation Rail (Desktop)

```css
width: 88px (w-22)
background: surface-container-lowest
border-right: 1px solid outline-variant/25
```

### Grid Layouts

```css
/* Card grids */
grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4

/* With 4 columns on XL */
grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6
```

### Content Containers

| Width   | Class       | Usage          |
| ------- | ----------- | -------------- |
| Max SM  | `max-w-sm`  | Narrow forms   |
| Max MD  | `max-w-md`  | Standard forms |
| Max 2XL | `max-w-2xl` | Content pages  |
| Max 4XL | `max-w-4xl` | Wide content   |
| Max 7XL | `max-w-7xl` | Full layouts   |

---

## Animation & Motion

### Durations

| Speed   | Duration  | Usage                               |
| ------- | --------- | ----------------------------------- |
| Fast    | 150ms     | Micro-interactions                  |
| Default | 200ms     | Standard transitions                |
| Smooth  | 300ms     | Shape morphing, complex transitions |
| Slow    | 400-600ms | Page transitions, emphasis          |

### Easing

```css
/* Standard */
ease-out

/* M3 Expressive (shape morphing) */
cubic-bezier(0.2, 0, 0, 1)
```

### Transition Patterns

```css
/* Button hover */
transition-all duration-200

/* Card shape morphing */
transition-[border-radius,border-color,background-color] duration-300
transition-timing-function: cubic-bezier(0.2,0,0,1)

/* Focus rings */
transition-colors duration-150
```

### Interactive States

```css
/* Hover */
hover:bg-* hover:border-*

/* Active/Press */
active:scale-[0.98]

/* Focus */
focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2
```

### Custom Animations

| Animation              | Usage               |
| ---------------------- | ------------------- |
| `animate-pulse`        | Loading skeletons   |
| `animate-float`        | Decorative elements |
| `animate-shimmer`      | Loading effects     |
| `animate-slide-up`     | Entrance animations |
| `animate-fade-in`      | Gentle entrances    |
| `animate-toast-in/out` | Toast notifications |

---

## Interaction States

### State Layers

M3 uses state layers (semi-transparent overlays) for interaction feedback:

| State | Opacity | Example                |
| ----- | ------- | ---------------------- |
| Hover | 8%      | `hover:bg-primary/8`   |
| Focus | 12%     | `focus:bg-primary/12`  |
| Press | 12%     | `active:bg-primary/12` |
| Drag  | 16%     | `bg-primary/16`        |

### Focus Indicators

```css
/* Standard focus ring */
focus-visible:ring-2
focus-visible:ring-primary/30
focus-visible:ring-offset-2

/* Focus ring on dark backgrounds */
focus-visible:ring-on-primary
```

### Disabled States

```css
opacity-50
cursor-not-allowed
pointer-events-none
```

---

## Icons

### Sizing

| Size    | Class         | Usage                    |
| ------- | ------------- | ------------------------ |
| XS      | `h-3.5 w-3.5` | Inline with small text   |
| SM      | `h-4 w-4`     | Buttons, inputs          |
| Default | `h-5 w-5`     | Standard icons           |
| MD      | `h-6 w-6`     | Navigation, emphasis     |
| LG      | `h-8 w-8`     | Feature icons            |
| XL      | `h-10+ w-10+` | Hero icons, empty states |

### Icon Buttons

| Size      | Dimensions |
| --------- | ---------- |
| `sm`      | h-8 w-8    |
| `default` | h-10 w-10  |
| `lg`      | h-12 w-12  |
| `xl`      | h-14 w-14  |

### Stroke Width

```css
/* Default */
strokeWidth: 2

/* Emphasis (checkmarks, etc.) */
strokeWidth: 3
```

---

## Dark Mode

### Implementation

Theme is applied via `data-theme` attribute on root and respects `prefers-color-scheme`:

```css
:root {
  /* light mode values */
}

.dark,
[data-theme='dark'] {
  /* dark mode values */
}
```

### Color Adjustments

In dark mode:

- Surface colors become darker
- Primary colors become lighter (better contrast)
- Shadows become more pronounced (higher opacity)
- Border opacity may increase for visibility

---

## Accessibility

### Color Contrast

- All text meets WCAG 2.1 AA standards (4.5:1 for normal text, 3:1 for large text)
- Interactive elements have visible focus indicators
- Error states use both color and icon indicators

### Touch Targets

- Minimum touch target: 44x44px (h-11)
- Recommended: 48x48px (h-12)
- Always include adequate spacing around targets

### Motion

```css
/* Respect user preferences */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Quick Reference

### Common Patterns

```css
/* Primary button */
bg-primary text-on-primary rounded-full h-11 px-6 font-semibold border-2 border-primary

/* Card */
bg-surface-container rounded-2xl border border-outline-variant/30 p-5

/* Input */
h-11 px-4 rounded-2xl border-2 border-outline-variant/40 bg-transparent

/* Badge */
rounded-full px-2.5 h-6 text-xs font-semibold bg-primary-container/60 text-on-primary-container

/* Focus ring */
focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2
```

### DO's and DON'Ts

```
✅ DO:
- Use rounded-full for all buttons and chips
- Use rounded-2xl (16px) as default for containers
- Use border-2 for component borders
- Use surface hierarchy for depth
- Apply dynamic shape on card interactions
- Use semantic color tokens
- Keep transitions under 300ms

❌ DON'T:
- Add shadows for elevation
- Use transforms (scale, translate) for depth effects
- Create gradients
- Use arbitrary colors outside the palette
- Mix incompatible on-surface/surface pairs
- Exceed 300ms for micro-interactions
- Skip focus states
```

---

## Palette Themes

The system supports multiple color palettes via `data-palette` attribute:

| Palette  | Primary Hue |
| -------- | ----------- |
| Default  | Violet      |
| `blue`   | Blue        |
| `green`  | Green       |
| `orange` | Orange      |
| `pink`   | Pink        |
| `teal`   | Teal        |

```html
<html data-palette="blue"></html>
```

---

## Survey Theme Fonts

For survey customization, these fonts are available:

| Font              | Style            | Best For         |
| ----------------- | ---------------- | ---------------- |
| Inter             | Professional     | Business surveys |
| Roboto            | Material classic | Standard forms   |
| Lato              | Clean            | Professional     |
| DM Sans           | Geometric        | Modern apps      |
| Merriweather      | Serif            | Editorial        |
| Montserrat        | Versatile        | Marketing        |
| Open Sans         | Friendly         | General use      |
| Outfit            | Rounded          | Playful          |
| Playfair Display  | Elegant serif    | Luxury           |
| Plus Jakarta Sans | Contemporary     | Tech/startup     |

---

## Frontend Project Structure

```
front/
├── index.html                  # Entry HTML
├── package.json                # Dependencies & scripts
├── vite.config.ts              # Vite configuration
├── tsconfig.json               # TypeScript config
├── eslint.config.js            # ESLint configuration
├── postcss.config.js           # PostCSS (Tailwind)
├── design.md                   # This design system doc
├── docs/                       # Frontend documentation
└── src/
    ├── App.tsx                 # Root component with routing
    ├── main.tsx                # Application entry point
    ├── index.css               # Global styles (Tailwind + CSS vars)
    │
    ├── components/             # All React components
    │   ├── ui/                 # Reusable UI primitives
    │   ├── layout/             # App shell & navigation
    │   ├── features/           # Domain-specific components
    │   ├── ErrorBoundary.tsx   # Error boundary wrapper
    │   └── ProtectedRoute.tsx  # Auth route guard
    │
    ├── pages/                  # Route-level page components
    ├── hooks/                  # Custom React hooks
    ├── stores/                 # Zustand state stores
    ├── services/               # API service layer
    ├── types/                  # TypeScript definitions
    ├── config/                 # App configuration
    ├── i18n/                   # Internationalization
    ├── lib/                    # Utility libraries
    └── utils/                  # Helper functions
```

---

## Component Architecture

### Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Pages                                   │
│  Route-level components, compose features + layout              │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌───────────────────┬───────────────────┬─────────────────────────┐
│   Layout          │   Features        │   Hooks                 │
│   App shell       │   Domain logic    │   Reusable logic        │
│   Navigation      │   Survey builder  │   State management      │
│   Page headers    │   Analytics       │   API queries           │
└───────────────────┴───────────────────┴─────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         UI Components                           │
│  Design system primitives (Button, Card, Input, Dialog, etc.)   │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌───────────────────┬───────────────────┬─────────────────────────┐
│   Stores          │   Services        │   Types                 │
│   Zustand stores  │   API client      │   TypeScript defs       │
│   App state       │   REST calls      │   Models & enums        │
└───────────────────┴───────────────────┴─────────────────────────┘
```

---

## UI Components (`/components/ui`)

Reusable, design-system aligned primitives. All components follow M3 Expressive principles with CVA (class-variance-authority) for variant management.

### Core Components

| Component  | Purpose            | Design Notes                                          |
| ---------- | ------------------ | ----------------------------------------------------- |
| `Button`   | Actions & CTAs     | Pill shape (rounded-full), 8 variants, press feedback |
| `Card`     | Content containers | Dynamic shape morphing (24px → 36px → 48px)           |
| `Input`    | Text entry         | rounded-2xl, border-2, focus ring                     |
| `Textarea` | Multi-line text    | Same styling as Input                                 |
| `Select`   | Dropdowns          | Custom styled, matches Input                          |
| `Dialog`   | Modal overlays     | rounded-3xl, backdrop blur, surface-container bg      |
| `Drawer`   | Side panels        | Slide-in from right, for detail views                 |

### Action Components

| Component    | Purpose                | Design Notes                                |
| ------------ | ---------------------- | ------------------------------------------- |
| `IconButton` | Icon-only actions      | Circular, multiple sizes (sm/default/lg/xl) |
| `FAB`        | Floating Action Button | Primary action per page, fixed position     |

### Selection Components

| Component       | Purpose                 | Design Notes                                    |
| --------------- | ----------------------- | ----------------------------------------------- |
| `Checkbox`      | Multi-select options    | rounded-lg, custom check icon                   |
| `Radio`         | Single-select options   | Circular indicator                              |
| `Switch`        | Toggle states           | Pill track with sliding thumb                   |
| `SelectionCard` | Visual option selection | Card-based radio/checkbox for prominent choices |

### Display Components

| Component       | Purpose            | Design Notes                                        |
| --------------- | ------------------ | --------------------------------------------------- |
| `Badge`         | Status indicators  | Pill shape, semantic colors (success/error/warning) |
| `Chip`          | Tags & filters     | Pill shape, dismissible variant                     |
| `Avatar`        | User/entity images | Circular, fallback initials                         |
| `Stat`          | Metric display     | Large number + label + optional trend               |
| `IconContainer` | Icon wrappers      | Tonal backgrounds, consistent sizing                |

### Feedback Components

| Component      | Purpose              | Design Notes                           |
| -------------- | -------------------- | -------------------------------------- |
| `Toast`        | Notifications        | Slide-in, auto-dismiss, action support |
| `Progress`     | Loading indicators   | Linear & circular variants             |
| `LoadingState` | Page/section loading | Skeleton placeholders                  |
| `Skeleton`     | Content placeholders | Shimmer animation                      |
| `EmptyState`   | No content fallback  | Icon + message + optional action       |

### Navigation Components

| Component     | Purpose           | Design Notes                             |
| ------------- | ----------------- | ---------------------------------------- |
| `Tabs`        | Content switching | Underline, pills, and segmented variants |
| `Menu`        | Dropdown menus    | Radix-based, keyboard navigation         |
| `Breadcrumbs` | Navigation trail  | Chevron separators                       |
| `Tooltip`     | Contextual hints  | Radix-based, delay on hover              |

### Form Components

| Component       | Purpose        | Design Notes                    |
| --------------- | -------------- | ------------------------------- |
| `DatePicker`    | Date selection | Calendar popup, presets support |
| `TimePicker`    | Time selection | Hour/minute inputs              |
| `SearchInput`   | Search fields  | Icon prefix, clear button       |
| `ImageUploader` | File uploads   | Drag & drop, preview            |

---

## Layout Components (`/components/layout`)

App shell components that provide consistent structure across all pages.

| Component           | Purpose            | Design Notes                                         |
| ------------------- | ------------------ | ---------------------------------------------------- |
| `Layout`            | Root app wrapper   | Contains nav rail + content area + mobile nav        |
| `NavigationRail`    | Desktop sidebar    | 88px wide, surface-container-lowest bg, icon + label |
| `NavigationBar`     | Mobile bottom nav  | 72px height, 5 items max                             |
| `AppBar`            | Top header bar     | Title + actions, used on mobile                      |
| `PageHeader`        | Page title section | Title + description + actions + back button          |
| `ListPageLayout`    | List page template | Toolbar + filters + content + FAB slots              |
| `NamespaceSelector` | Workspace switcher | Dropdown in nav rail                                 |
| `UserMenu`          | User account menu  | Avatar + dropdown with settings/logout               |

### Layout Pattern

```
┌─────────────────────────────────────────────────────────────────┐
│                        Layout Component                         │
│  ┌──────────┬──────────────────────────────────────────────┐   │
│  │  NavRail │              Content Area                     │   │
│  │  (88px)  │  ┌──────────────────────────────────────────┐ │   │
│  │          │  │  PageHeader / ListPageLayout             │ │   │
│  │  • Logo  │  │  - Title, description                    │ │   │
│  │  • Nav   │  │  - Action buttons                        │ │   │
│  │  • User  │  ├──────────────────────────────────────────┤ │   │
│  │          │  │  Page Content                            │ │   │
│  │          │  │  - Cards, forms, tables, etc.            │ │   │
│  │          │  │                                          │ │   │
│  │          │  └──────────────────────────────────────────┘ │   │
│  └──────────┴──────────────────────────────────────────────┘   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              NavigationBar (mobile only)                  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Feature Components (`/components/features`)

Domain-specific components organized by feature area.

### Surveys (`/features/surveys`)

| Component            | Purpose                    | Where Used                      |
| -------------------- | -------------------------- | ------------------------------- |
| `SurveyCard`         | Survey list item           | Surveys list page, dashboard    |
| `SurveyStatusBadge`  | Draft/Active/Closed status | Survey cards, detail views      |
| `CreateSurveyDialog` | New survey wizard          | Triggered from Surveys page FAB |
| `ThemePreviewPanel`  | Theme preview in builder   | Survey builder sidebar          |

### Questions (`/features/questions`)

| Component            | Purpose                   | Where Used                           |
| -------------------- | ------------------------- | ------------------------------------ |
| `QuestionCard`       | Question in builder list  | Survey builder                       |
| `QuestionEditor`     | Edit question details     | Inline in builder, drawer            |
| `QuestionPreview`    | Preview rendered question | Builder preview pane                 |
| `AddQuestionMenu`    | Add new question type     | Builder toolbar                      |
| `LogicBuilderDialog` | Conditional logic editor  | Question settings                    |
| `editors/*`          | Type-specific editors     | Multiple choice, scale, matrix, etc. |

### Responses (`/features/responses`)

| Component              | Purpose                     | Where Used                   |
| ---------------------- | --------------------------- | ---------------------------- |
| `ResponseDetailDrawer` | Individual response view    | Responses list page (drawer) |
| `ExportDialog`         | Export responses to CSV/etc | Responses page toolbar       |

### Analytics (`/features/analytics`)

Components for charts, stats, and data visualization on the Analytics page.

### Templates (`/features/templates`)

Template browsing, preview, and selection components.

### Themes (`/features/themes`)

Theme editor, color pickers, and font selectors for survey customization.

### Public Survey (`/features/public-survey`)

Respondent-facing survey renderer with question types, progress, and completion states.

---

## Pages (`/pages`)

Route-level components, each representing a full page/route.

### Authentication

| Page                 | Route              | Purpose                |
| -------------------- | ------------------ | ---------------------- |
| `LoginPage`          | `/login`           | User sign in           |
| `RegisterPage`       | `/register`        | New user registration  |
| `ForgotPasswordPage` | `/forgot-password` | Password reset request |
| `ResetPasswordPage`  | `/reset-password`  | Set new password       |

### Main Application

| Page                   | Route                    | Purpose                               |
| ---------------------- | ------------------------ | ------------------------------------- |
| `DashboardPage`        | `/`                      | Overview, recent surveys, quick stats |
| `SurveysPage`          | `/surveys`               | List all surveys, CRUD operations     |
| `SurveyBuilderPage`    | `/surveys/:id/edit`      | Build/edit survey questions           |
| `SurveyPreviewPage`    | `/surveys/:id/preview`   | Preview survey as respondent          |
| `ResponsesPage`        | `/surveys/:id/responses` | View collected responses              |
| `AnalyticsPage`        | `/analytics`             | Charts, insights, export              |
| `TemplatesPage`        | `/templates`             | Pre-made survey templates             |
| `ThemesPage`           | `/themes`                | Custom themes for surveys             |
| `DistributionsPage`    | `/distributions`         | Share links, QR codes, embed          |
| `EmailTemplatesPage`   | `/email-templates`       | Invitation/reminder emails            |
| `RecurringSurveysPage` | `/recurring-surveys`     | Scheduled survey automation           |
| `SettingsPage`         | `/settings`              | App & account settings                |

### Public

| Page               | Route          | Purpose                |
| ------------------ | -------------- | ---------------------- |
| `PublicSurveyPage` | `/s/:surveyId` | Respondent survey form |

### Admin

| Page                    | Route             | Purpose                     |
| ----------------------- | ----------------- | --------------------------- |
| `NamespacesPage`        | `/namespaces`     | Manage workspaces           |
| `NamespaceSettingsPage` | `/namespaces/:id` | Namespace-specific settings |

---

## Hooks (`/hooks`)

Custom React hooks for reusable logic patterns.

### State Hooks

| Hook               | Purpose                                       |
| ------------------ | --------------------------------------------- |
| `useDialogState`   | Boolean open/close with optional data payload |
| `useDrawerState`   | Drawer open state + selected item             |
| `useConfirmDialog` | Confirmation dialog with promise-based API    |
| `useListPageState` | Combined pagination, sorting, filtering state |

### Data Hooks

| Hook                | Purpose                                              |
| ------------------- | ---------------------------------------------------- |
| `useAuth`           | Authentication state & methods (login, logout, user) |
| `useNamespace`      | Current namespace context & switching                |
| `useFilteredList`   | Client-side list filtering                           |
| `useInfiniteScroll` | Infinite scrolling pagination                        |

### Query Hooks (`/hooks/queries`)

React Query wrappers for API calls (surveys, responses, templates, etc.)

### UI Hooks

| Hook                        | Purpose                            |
| --------------------------- | ---------------------------------- |
| `useViewTransitionNavigate` | Navigate with View Transitions API |
| `useTranslatedNav`          | Navigation items with i18n labels  |
| `useTranslatedContent`      | Content translation utilities      |

---

## Stores (`/stores`)

Zustand stores for global state management.

| Store                | Purpose                                       |
| -------------------- | --------------------------------------------- |
| `authStore`          | User authentication state, tokens             |
| `namespaceStore`     | Current workspace/namespace                   |
| `themeStore`         | App theme (light/dark), color palette         |
| `preferencesStore`   | User preferences (language, display settings) |
| `surveyBuilderStore` | Survey builder working state                  |
| `publicSurveyStore`  | Public survey response state                  |
| `searchStore`        | Global search state                           |
| `settingsStore`      | App settings cache                            |
| `shortcutsStore`     | Keyboard shortcuts state                      |
| `environmentStore`   | Runtime environment config                    |

---

## Design Decisions

### Why This Structure?

**UI Components are separate from Features**

- UI components are design-system primitives with no business logic
- Features compose UI components with domain-specific behavior
- This allows UI components to be reused across different features

**Pages are thin orchestrators**

- Pages import layouts, features, and hooks
- Minimal logic in pages — just composition
- Easy to understand what each route renders

**Hooks abstract reusable patterns**

- Complex state logic lives in hooks, not components
- Query hooks wrap React Query for consistent API patterns
- UI hooks provide common interaction patterns

**Stores for cross-cutting state**

- Auth, theme, and namespace need to be global
- Survey builder state is complex enough to warrant a store
- Preferences persist across sessions

### Component Design Principles

1. **CVA for variants** — All UI components use class-variance-authority for type-safe variant management

2. **Compound components** — Complex components (Card, SelectionCard) export sub-components for flexibility:

   ```tsx
   <Card>
     <CardHeader>...</CardHeader>
     <CardContent>...</CardContent>
   </Card>
   ```

3. **Controlled & uncontrolled** — Form components support both patterns

4. **Ref forwarding** — All components forward refs for DOM access

5. **Radix primitives** — Dialog, Menu, Tooltip, and other complex components built on Radix UI for accessibility

---

## Key Technologies

| Category      | Technology                              |
| ------------- | --------------------------------------- |
| Framework     | React 18 with TypeScript                |
| Build Tool    | Vite                                    |
| Styling       | Tailwind CSS + CSS Custom Properties    |
| Variants      | class-variance-authority (CVA)          |
| State         | Zustand (global) + React Query (server) |
| Routing       | React Router v6                         |
| Forms         | React Hook Form + Zod                   |
| i18n          | react-i18next                           |
| UI Primitives | Radix UI (Dialog, Menu, Tooltip, etc.)  |
| Icons         | Lucide React                            |
| Charts        | Recharts                                |
| Date Handling | date-fns                                |
