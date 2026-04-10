# Simon Tingle Portfolio - Complete Architecture & Construction Guide

## Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Core Systems](#core-systems)
5. [Components & Pages](#components--pages)
6. [Styling & Design](#styling--design)
7. [Internationalization (i18n)](#internationalization-i18n)
8. [Build & Deployment](#build--deployment)
9. [Key Implementation Details](#key-implementation-details)
10. [Recent Changes & Current State](#recent-changes--current-state)

---

## Project Overview

**Project Name:** Simon Tingle Creative Developer Portfolio
**Framework:** Next.js 15 (App Router)
**Language:** TypeScript (TSX for components)
**Styling:** Tailwind CSS + Custom CSS animations
**Purpose:** Showcase creative development skills with interactive 3D terrain, project portfolio, and multi-language support

**Key Features:**
- Interactive 3D procedural terrain visualization (Three.js)
- Multi-language support (8 languages: EN, ES, FR, DE, IT, PT, JA, ZH)
- Responsive design with dark mode support
- Animated sections with Framer Motion
- DJ Tingle music production tools showcase
- Street Driver 3D game showcase
- Live Fuel Tracker energy monitoring dashboard
- Contact form with multi-language support

---

## Technology Stack

### Frontend
- **React 19** - UI framework
- **Next.js 15** - Full-stack React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **Three.js** - 3D graphics library
- **React Three Fiber** (implied) - React renderer for Three.js

### Styling
- **Tailwind CSS** - Primary utility-based styling
- **CSS-in-JS** - Inline styles for dynamic styling (text-shadow glows, etc.)
- **Custom keyframe animations** - Defined in component files
- **Dark mode support** - Using Tailwind's dark: prefix

### Build & Development
- **npm** - Package manager
- **TypeScript compiler** - Type checking
- **ESLint** - Code linting
- **Next.js Dev Server** - Development environment on port 3000

---

## Project Structure

```
SIMONTINGLE-COM/
├── app/
│   ├── page.tsx                 # Main home page (hero + all sections)
│   ├── layout.tsx              # Root layout
│   ├── blog/
│   │   └── page.tsx            # Blog page (referenced but not detailed)
│   └── (other routes)
│
├── components/
│   ├── ProceduralTerrainScene.tsx   # 3D terrain background (Three.js)
│   ├── SceneConfigPanel.tsx         # Terrain config controls
│   ├── Navigation.tsx               # Header with language selector
│   ├── Footer.tsx                  # Footer component
│   ├── About.tsx                   # About section with Tech Stack
│   ├── Contact.tsx                 # Contact form section
│   ├── ProjectShowcase.tsx         # Project portfolio section
│   └── (other UI components)
│
├── hooks/
│   └── useI18n.ts              # Custom i18n hook for translations
│
├── utils/
│   ├── i18n.ts                 # Translation engine & utilities
│   ├── translate.ts            # Language detection & storage
│   └── (other utilities)
│
├── public/
│   └── locales/
│       ├── en.json             # English translations
│       ├── es.json             # Spanish translations
│       ├── fr.json             # French translations
│       ├── de.json             # German translations
│       ├── it.json             # Italian translations
│       ├── pt.json             # Portuguese translations
│       ├── ja.json             # Japanese translations
│       └── zh.json             # Chinese translations
│
├── docs/
│   └── TRANSLATIONS.md          # Translation key documentation
│
├── scripts/
│   └── validate-translations.js # Script to validate i18n completeness
│
├── README.md                    # Standard Next.js README
├── CLAUDE.md                    # Claude Code instructions
├── AGENTS.md                    # Agent instructions (breaking changes)
├── ARCHITECTURE.md              # This file
│
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.js
└── .claude/
    └── (Claude Code settings)
```

---

## Core Systems

### 1. Internationalization (i18n) System

#### How It Works
The i18n system provides 8-language support with a 3-level fallback hierarchy:
1. **Requested language** → 2. **English fallback** → 3. **Formatted key name**

#### File Locations
- **Translation keys:** `/utils/i18n.ts`
- **Language detection:** `/utils/translate.ts`
- **React hook:** `/hooks/useI18n.ts`
- **JSON data:** `/public/locales/*.json` (8 language files)
- **Validation:** `/scripts/validate-translations.js`
- **Documentation:** `/docs/TRANSLATIONS.md`

#### Key Components

**`/utils/translate.ts` - Language Management**
```typescript
SUPPORTED_LANGUAGES = {
  en: { name: "English", flag: "🇬🇧", code: "en" },
  es: { name: "Español", flag: "🇪🇸", code: "es" },
  fr: { name: "Français", flag: "🇫🇷", code: "fr" },
  de: { name: "Deutsch", flag: "🇩🇪", code: "de" },
  it: { name: "Italiano", flag: "🇮🇹", code: "it" },
  pt: { name: "Português", flag: "🇵🇹", code: "pt" },
  ja: { name: "日本語", flag: "🇯🇵", code: "ja" },
  zh: { name: "中文", flag: "🇨🇳", code: "zh" }
}
```
- **British flag** for English (🇬🇧, not 🇺🇸)
- `detectUserLanguage()` - Checks localStorage → browser settings → defaults to English
- `setUserLanguage()` - Persists user preference to localStorage

**`/utils/i18n.ts` - Translation Engine**
- `t(key, language)` - Get translation with fallback
- `loadLanguage(language)` - Async load language JSON
- `preloadLanguage(language)` - Cache language for performance
- `validateTranslations(language)` - Check for missing/extra keys
- Translation caching to avoid repeated API calls

**`/hooks/useI18n.ts` - React Hook**
```typescript
const { translated, language, isLoading, error } = useI18n("key");
```
- Listens for `languageChange` custom events
- Loads translations asynchronously
- Provides 3-level fallback (requested → English → formatted key)
- Auto-formats key names: "hero.title" → "Hero Title"
- Additional hooks: `useCurrentLanguage()`, `useTranslationValidation()`

#### Translation Keys Structure
Keys follow dot notation organized by section:
- **Navigation:** `nav.*`
- **Hero:** `hero.title`, `hero.subtitle`
- **About:** `about.title`, `about.description.p1/p2`, `about.cta.*`, `about.techStack`
- **Contact:** `contact.title`, `contact.form.*`, `contact.alternate`, `contact.github`
- **Footer:** `footer.*`
- **Projects:** `projects.title`, `projects.description`

#### JSON File Format (e.g., `/public/locales/en.json`)
```json
{
  "hero.title": "SIMON TINGLE",
  "hero.subtitle": "Building interactive experiences with code",
  "about.title": "About Me",
  "about.description.p1": "I'm a creative developer...",
  ...
}
```

#### Language Switching Flow
1. User clicks language flag in Navigation dropdown
2. Dispatcher fires `languageChange` custom event
3. `useI18n` hook detects event → updates language state
4. Fetches translations for new language
5. Components re-render with new text
6. Preference saved to localStorage

#### Validation & Updates
- Run `npm run validate-translations` to check for missing keys
- **Console warnings** appear during dev if key is missing
- **Fallback display:** Formatted key name shown if translation fails
- **To add new content:** Add key to all 8 JSON files in `/public/locales/`

---

### 2. 3D Terrain Visualization System

#### Component: `ProceduralTerrainScene.tsx`

**Purpose:** Renders animated 3D procedural terrain as fixed background

**Key Parameters:**
- **Heightmap:** 1024×1024 pixels, procedurally generated
- **World Size:** 40,000 units
- **Elevation Scale:** 35 (raw height values × 35)
- **Water Level:** 500 units
- **Camera Position:** [0, 3000, 5000]
- **Camera Near/Far:** 10 / 50000

**Features:**
- Flat-shaded terrain with muted green color (#558833)
- Procedural water with wave simulation
- Trees: Fir and deciduous with trunks (InstancedMesh)
- Day/night cycle with animated sky
- Moon and sun lighting
- Exponential fog for atmospheric effect (FogExp2)
- Interactive scene config panel

**Important Code Locations:**
- Geometry generation: Heightmap to vertices
- Water shader: Custom GLSL shader for displacement & color
- Tree placement: Shore buffer & elevation-based distribution
- Lighting: Sun/moon directional lights with animated intensity

---

### 3. Responsive Layout System

#### Main Page Structure (`/app/page.tsx`)

```
Hero Section (92vh)
  ├── Title & Subtitle (with i18n)
  ├── Animated scroll indicator
  └── Fixed background: ProceduralTerrainScene

About Section (#about)
  ├── About Me title (with white glow)
  ├── Description paragraphs
  ├── CTA buttons (Get in Touch, GitHub)
  └── Tech Stack (2-column grid)
      ├── All 11 skills with white glow header
      └── Positioned 80px higher (-marginTop)

Projects Section (#projects)
  ├── Project cards
  └── Live demo links

Contact Section (#contact)
  ├── Contact form
  ├── Email input
  ├── Message textarea
  └── Social links (Email, GitHub, LinkedIn)

Footer
  └── Links & copyright
```

#### Grid Layout (About & Tech Stack)
```
Grid: md:grid-cols-2 gap-12 items-start
├── Column 1 (Left)
│   ├── About Me text
│   ├── Buttons
│   └── etc.
└── Column 2 (Right)
    ├── Tech Stack title (h3 with glow)
    └── 2-column skill grid
```

**Alignment Details:**
- Grid uses `items-start` (both columns align to top)
- Tech Stack has `self-start` class
- Tech Stack has `marginTop: -80px` to position higher
- All components respond to `md:` breakpoint

---

## Components & Pages

### Layout Components

#### 1. **Navigation** (`/components/Navigation.tsx`)
- Header with ST logo (links home)
- Menu links: Home, Projects, Blog, Contact
- **Language Selector Dropdown:**
  - Shows 8 languages with flags
  - Desktop: Dropdown menu
  - Mobile: Language buttons in sidebar menu
  - Dispatches `languageChange` custom event on selection
  - Saves preference to localStorage via `setUserLanguage()`

#### 2. **Footer** (`/components/Footer.tsx`)
- Copyright & credits
- Navigation links (repeated)
- Social links (GitHub, LinkedIn, Twitter, Email)
- Uses i18n for translated content

### Page Sections

#### 1. **Hero Section** (`/app/page.tsx`)
- Full height: 92vh
- Title: "SIMON TINGLE"
- Subtitle: "Building interactive experiences with code"
- Both use `useI18n()` hook
- Animated scroll indicator (chevron + gradient)
- Fixed background: ProceduralTerrainScene

#### 2. **About Section** (`/components/About.tsx`)

**Layout:**
- Max width: 4xl
- Title: "About Me" (h2 with white glow)
- 2-column grid:
  - **Left:** Description text + CTA buttons
  - **Right:** Tech Stack

**Tech Stack Grid:**
- Heading: "Tech Stack" (h3 with white glow)
- 2×6 grid (11 items, last row has 1 item)
- Current skills:
  1. React
  2. TypeScript
  3. Next.js
  4. Three.js
  5. Web Audio API
  6. Node.js
  7. TailwindCSS
  8. Framer Motion
  9. Terraform
  10. AWS Cloud
  11. Python

**White Glow Effects:**
- "About Me": `textShadow: '0 0 20px rgba(255, 255, 255, 0.6), 0 0 40px rgba(255, 255, 255, 0.3)'`
- "Tech Stack": Same shadow effect

**Positioning:**
- Tech Stack positioned `-80px` higher via `marginTop: '-80px'`
- Both columns align to start (`items-start`)

**Styling:**
- Tech Stack items: Blue background, dark mode support
- Text: Responsive typography (text-2xl for h3, text-lg for body)

#### 3. **Projects Section** (`/components/ProjectShowcase.tsx`)
- Title: "Selected Projects"
- Subtitle describing project collection
- Project cards (3 featured projects)
- Each card has:
  - Project image
  - Title
  - Description
  - Tech stack tags
  - Live demo link

**Featured Projects:**
1. **DJ Tingle** - Web-based digital audio workstation
   - Stack: React, Web Audio API, TypeScript, Tailwind CSS
   - URL: djtingle-0326-production.up.railway.app

2. **Street Driver Radio Edition** - 3D driving game
   - Stack: React, Three.js, TypeScript, Socket.io, Prisma, PostgreSQL, Tailwind CSS, Vite
   - URL: street-driver-radio-edition-production.up.railway.app

3. **Live Fuel Tracker** - Energy monitoring dashboard
   - Stack: Next.js 15, TypeScript, Tailwind CSS, EIA API, OWID CSV, World Bank API, Nitter RSS, MARAD
   - URL: international-energy-production.up.railway.app

#### 4. **Contact Section** (`/components/Contact.tsx`)
- Title: "Let's Work Together"
- Subtitle: "Have an idea for a project? I'd love to hear about it."
- **Contact Form:**
  - Email input (required)
  - Message textarea (required)
  - Submit button (calls `handleSubmit`)
- **Alternative Contact Methods:**
  - Email: hello@simontingle.com
  - GitHub: github.com/SimonTingle
  - LinkedIn: linkedin.com
- Success message displays for 5 seconds after submission
- All text uses i18n hooks

---

## Styling & Design

### Color Scheme
- **Primary:** Slate/Gray with dark backgrounds
- **Accent:** Blue (#0066cc / blue-600)
- **Text:** 
  - Light mode: Gray-900
  - Dark mode: White
- **Borders:** Slate-700/50

### Tailwind CSS Classes Used
- **Typography:**
  - `text-4xl md:text-5xl` - Main headings
  - `text-2xl` - Section headings
  - `text-lg` - Body text
  - `font-bold` - Emphasis

- **Colors:**
  - `bg-slate-900/75` - Sections
  - `bg-blue-600 hover:bg-blue-700` - Buttons
  - `dark:text-white` - Dark mode text
  - `dark:border-gray-600` - Dark mode borders

- **Layout:**
  - `grid md:grid-cols-2` - 2-column on medium+ screens
  - `gap-12` - Column spacing
  - `items-start` - Align to top
  - `max-w-4xl mx-auto` - Content constraint
  - `flex justify-center` - Horizontal centering

- **Effects:**
  - `backdrop-blur-md` - Frosted glass effect
  - `border-t border-slate-700/50` - Top border
  - `transition-colors` - Smooth hover effects
  - `rounded-lg` - Border radius

### Custom Animations

**Framer Motion animations used throughout:**
- Entry animations: `opacity: 0 → 1`, `y: 20 → 0`
- Staggered delays for sequential reveals
- `viewport={{ once: true }}` - Animation plays once when in view
- Sidebar animations (mobile menu)

**Custom CSS animations (in components):**
- Scroll indicator chevron: `animate-bounce`
- Glow effects: text-shadow with white RGBA
- Background gradients: Fade-out effects

---

## Key Implementation Details

### Recent Changes & Current State

#### 1. I18n System Fix (Critical)
- **Issue:** useI18n hook was returning `translation` property but components expected `translated`
- **Fix:** Changed hook return to use `translated` property name
- **Impact:** All page text now displays properly in all languages

#### 2. Language Switching
- **Status:** Fully functional ✅
- All 8 languages can be selected
- Text updates instantly
- Flag in header updates to match language
- Preference persists via localStorage

#### 3. About Section Alignment
- **Issue:** Tech Stack was vertically centered, not aligned to top
- **Fix 1:** Changed grid from `items-center` to `items-start`
- **Fix 2:** Added `self-start` class to Tech Stack div
- **Fix 3:** Added `marginTop: '-80px'` to position higher
- **Result:** Tech Stack now properly aligned with About Me text

#### 4. White Glow Effects
- **"About Me" heading:** `textShadow: '0 0 20px rgba(255, 255, 255, 0.6), 0 0 40px rgba(255, 255, 255, 0.3)'`
- **"Tech Stack" heading:** Identical glow effect
- **Effect:** Subtle luminous quality behind text

#### 5. Tech Stack Updates
- **Added items:**
  - Terraform (infrastructure as code)
  - AWS Cloud (cloud services)
  - Python (programming language)
- **Total:** 11 skills now displayed

#### 6. Flag Changes
- **English flag:** Changed from 🇺🇸 (USA) to 🇬🇧 (UK)
- **Location:** `/utils/translate.ts` line 9

---

## Build & Deployment

### Development
```bash
npm run dev
# Runs Next.js dev server on port 3000
# Auto-reloads on file changes
# TypeScript compilation happens automatically
```

### Build
```bash
npm run build
# Creates optimized production build
# Compiles TypeScript
# Bundles assets
```

### Scripts
- `npm run validate-translations` - Check i18n completeness

### Environment
- **Node version:** Check package.json
- **Package manager:** npm (or yarn/pnpm/bun)
- **Next.js version:** 15
- **React version:** 19

---

## Important Notes for Future AI

### Critical File Locations
- **Main page:** `/app/page.tsx` (Hero + all sections)
- **Components:** `/components/` (About, Contact, Navigation, etc.)
- **Styles:** Tailwind in className attributes + inline styles
- **Translations:** `/public/locales/*.json` (add to all 8 files)
- **Hooks:** `/hooks/useI18n.ts` (always use for text)

### Common Tasks

**Adding new text content:**
1. Add key to all 8 JSON files in `/public/locales/`
2. Use `useI18n("key")` hook in component
3. Access with `.translated` property
4. Run `validate-translations.js` to verify

**Changing layout:**
- Modify grid/flexbox classes in component
- Use `md:` breakpoint for responsive behavior
- Update `/components/About.tsx` for section layout

**Adding white glow to text:**
```jsx
<h2 style={{
  textShadow: '0 0 20px rgba(255, 255, 255, 0.6), 0 0 40px rgba(255, 255, 255, 0.3)'
}}>
  Your text here
</h2>
```

**Moving elements vertically:**
- Use `style={{ marginTop: 'Xpx' }}` for negative margins
- Or use Tailwind `mt-X` / `-mt-X` classes

### Grid System Reference
- `grid md:grid-cols-2` - 2 columns on medium+ screens
- `gap-12` - 48px gap between columns
- `items-start` - Align all items to top
- `self-start` - Align individual item to top

### Color Classes Reference
- `text-gray-900 dark:text-white` - Responsive text color
- `bg-slate-900/75` - Slate background with 75% opacity
- `border-slate-700/50` - Border with transparency
- `bg-blue-100 dark:bg-blue-900/30` - Light/dark variant

---

## Conclusion

This portfolio is built with:
- **Modern React & TypeScript** for type safety
- **Next.js App Router** for file-based routing
- **Tailwind CSS** for responsive styling
- **Framer Motion** for smooth animations
- **Three.js** for immersive 3D graphics
- **Custom i18n system** for 8-language support
- **Responsive design** that works on all devices

All text content uses the i18n system, making it easy to update text in any language. The layout is highly customizable through Tailwind classes and inline styles. The 3D background adds visual interest while the structured component hierarchy keeps the code maintainable.

For any future modifications, refer to this document and the specific component files for implementation details.
