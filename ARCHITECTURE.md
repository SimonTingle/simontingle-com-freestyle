# Site Architecture Documentation

## Overview
Simon Tingle's portfolio website is built with **Next.js 15** (App Router), **React 19**, **TypeScript**, **Tailwind CSS**, **Three.js**, and **Framer Motion**. The site features an interactive 3D terrain background, dynamic configuration panel, multi-language support, and responsive design.

---

## Project Structure

```
├── app/
│   ├── page.tsx                 # Main page (hero + sections)
│   ├── layout.tsx               # Root layout
│   ├── blog/                    # Blog section (future)
│   └── globals.css              # Global styles
│
├── components/
│   ├── Hero3D.tsx               # 3D hero scene with terrain & trees
│   ├── ProceduralTerrainScene.tsx # Alternative procedural terrain
│   ├── About.tsx                # About section with tech stack
│   ├── Navigation.tsx           # Top navigation bar
│   ├── FlipClock.tsx            # Time display (HH:MM DAY DATE)
│   ├── ProjectShowcase.tsx      # Project portfolio grid
│   ├── Contact.tsx              # Contact form section
│   ├── Footer.tsx               # Footer
│   └── SceneConfigPanel.tsx     # Settings panel for scene configuration
│
├── hooks/
│   └── useI18n.ts               # Multi-language translation hook
│
├── utils/
│   └── translate.ts             # Translation & language detection
│
├── public/
│   └── locales/                 # Translation files (en, es, fr, etc.)
│
└── [config files]
    ├── tsconfig.json
    ├── tailwind.config.js
    ├── next.config.js
    └── package.json
```

---

## Component Hierarchy

```
Home (app/page.tsx)
├── ProceduralTerrainScene (fixed background)
├── SceneConfigPanel (floating settings)
├── Navigation
│   ├── FlipClock (upper left)
│   └── Language selector
├── Hero Section (h1 + subtitle + scroll indicator)
├── About
│   ├── Description text
│   ├── Tech stack grid
│   └── CTA buttons (Get in Touch, GitHub, LinkedIn)
├── ProjectShowcase
└── Contact
└── Footer
```

---

## Key Features & Recent Changes

### 1. **3D Terrain with Level of Detail (LOD) System**
   - **Location**: `components/Hero3D.tsx`
   - **Feature**: Procedural rolling hills terrain with 4 geometry quality levels
   - **LOD Levels**:
     - 0-8 units: 120×120 segments (ultra high detail)
     - 8-25 units: 60×60 segments (high detail)
     - 25-50 units: 30×30 segments (medium detail)
     - 50+ units: 12×12 segments (low detail)
   - **Benefit**: Smooth performance degradation based on camera distance
   - **Status**: ✅ Recently implemented

### 2. **Interactive Trees with Wind Effect**
   - **Location**: `components/Hero3D.tsx` - `Trees` component
   - **Features**:
     - Instanced mesh rendering (cone foliage + cylinder trunks)
     - Wind effect applied to trees within 0-50 units of camera
     - Sine/cosine wave animation for natural swaying motion
   - **Control**: Wind strength slider in Scene Settings panel (0-100%)
   - **Status**: ✅ Recently implemented

### 3. **Scene Configuration Panel**
   - **Location**: `components/SceneConfigPanel.tsx`
   - **Access**: Gear icon (top right corner)
   - **Sections**:
     - **Terrain**: Height scale, roughness, color, LOD quality
     - **Time of Day**: Manual/automatic cycle, sun/moon intensity
     - **Atmosphere**: Fog density, sky presets
     - **Water**: Level, wave height, ripple strength, colors
     - **Vegetation**: Tree density, scale, tree line, Fir/Deciduous ratio, **wind strength**
     - **Birds**: Enable/disable, scale, speed, flock size (future feature)
     - **Performance**: Shadows, antialiasing options
   - **Reset**: One-click reset to defaults
   - **Status**: ✅ Fully functional with wind strength control

### 4. **Typography & Text Effects**
   - **Hero Title & Subtitle**: Soft black glow highlight
     - Text-shadow: `0 0 10px rgba(0, 0, 0, 0.3), 0 0 20px rgba(0, 0, 0, 0.15)`
     - Creates subtle depth without harsh shadows
   - **Tech Stack Glow** (About section): Increased brightness
     - Text-shadow: `0 0 20px rgba(255, 255, 255, 0.73), 0 0 40px rgba(255, 255, 255, 0.36)`
   - **Status**: ✅ Recently refined

### 5. **Navigation & UI Elements**
   - **FlipClock**: Displays time, day, and date in upper-left corner
     - Updates every second
     - Responsive (hidden on mobile)
     - Custom flip-clock styling
   - **Language Selector**: Multi-language support (detected from browser)
   - **LinkedIn Button**: Added to About section with LinkedIn branding
   - **Status**: ✅ Fully implemented

### 6. **Multi-Language Support**
   - **Hook**: `useI18n` for component-level translations
   - **Supported Languages**: English, Spanish, French, German, Portuguese, etc.
   - **Detection**: Automatic browser language detection
   - **Storage**: localStorage persistence
   - **Status**: ✅ Functional

---

## Technical Stack

| Technology | Purpose |
|-----------|---------|
| **Next.js 15** | React framework with SSR/SSG |
| **React 19** | UI library |
| **TypeScript** | Type safety |
| **Tailwind CSS** | Utility-first styling |
| **Three.js** | 3D graphics & terrain |
| **React Three Fiber** | React wrapper for Three.js |
| **Framer Motion** | UI animations |
| **@react-three/drei** | Helpful 3D utilities |

---

## State Management

### Page-Level Config (app/page.tsx)
```typescript
const [config, setConfig] = useState<SceneConfig>(defaultConfig);
```
- Manages scene configuration
- Passed to `ProceduralTerrainScene` and `SceneConfigPanel`
- Updates propagate to 3D scene in real-time

### Component-Level State
- **Hero3D**: `windStrength` state (also synced with config panel)
- **Navigation**: `isOpen` (mobile menu), `langOpen` (language dropdown), `currentLang`
- **FlipClock**: `time` (hours, minutes, day, date)

---

## Performance Optimizations

1. **LOD System**: Geometry resolution decreases with distance
2. **InstancedMesh**: Trees rendered efficiently with single draw call
3. **useMemo**: Terrain geometries cached and reused
4. **Framer Motion**: GPU-accelerated animations
5. **Next.js Image Optimization**: Automatic image optimization
6. **Code Splitting**: Components lazy-loaded as needed

---

## Recent Changes Summary (This Session)

| Feature | File | Change |
|---------|------|--------|
| LOD Terrain | Hero3D.tsx | Added 4-level geometry LOD system |
| Trees | Hero3D.tsx | Added instanced trees with trunks |
| Wind Effect | Hero3D.tsx | Implemented wind animation (0-50 units) |
| Wind Control | SceneConfigPanel.tsx | Added wind strength slider to Vegetation section |
| Text Glow | app/page.tsx | Added subtle black glow to hero text |
| Text Glow | About.tsx | Increased Tech Stack text brightness |
| Input Fix | SceneConfigPanel.tsx | Fixed controlled/uncontrolled input warning |

---

## Future Enhancements

- [ ] Birds flocking system
- [ ] ProceduralTerrainScene full implementation
- [ ] Water shader improvements
- [ ] Mobile-optimized 3D rendering
- [ ] Blog section with articles
- [ ] Project filtering/search
- [ ] Dark mode toggle (currently dark)
- [ ] Performance metrics dashboard

---

## How to Extend

### Adding a New Config Option
1. Add property to `SceneConfig` interface in `SceneConfigPanel.tsx`
2. Add to `defaultConfig` object
3. Add UI control (Slider, Toggle, Pills, etc.) in appropriate Section
4. Pass to scene component via props

### Adding a New Component Section
1. Create component in `components/`
2. Import in `app/page.tsx`
3. Wrap with appropriate z-index and pointer-events
4. Add section ID for navigation links

### Modifying Terrain
- **LOD distances**: Edit `lodRef.current.addLevel()` calls in Hero3D.tsx
- **Terrain function**: Modify `generateTerrainGeometry()` in Hero3D.tsx
- **Tree placement**: Edit `treePositions` useMemo in Trees component

---

## Styling Conventions

- **Tailwind CSS**: Primary styling method
- **Inline styles**: Used for dynamic values and complex animations
- **CSS-in-JS**: Used in component files for global animations (@keyframes)
- **Dark theme**: Primary theme (slate-900, slate-950 backgrounds)
- **Color palette**: Blues, whites, and earth tones

---

## UI Positioning & Styling Details

### Header & Navigation (Navigation.tsx)
**Container**: `fixed top-0 w-full z-50 bg-gradient-to-b from-slate-900/80 to-transparent backdrop-blur-sm`

#### Flip Clock Positioning
- **Location**: Upper-left corner
- **Position**: `absolute` with `top: calc(1rem + 10px)` and `left: calc(1rem + 40px)`
- **Scaling**: `transform: scale(1.5)` with `transformOrigin: 'top-left'`
- **Opacity**: `0.5` (50% transparent)
- **Responsive**: Hidden on mobile (`hidden md:block`)
- **File**: `components/FlipClock.tsx`
- **Styles**:
  ```css
  .flip-digit {
    width: 1.25rem;
    height: 1rem;
    background: linear-gradient(to bottom, #1f2937 0%, #111827 100%);
    color: #ffffff;
    font-size: 0.75rem;
    text-shadow: 0 0 5px rgba(255, 255, 255, 0.5);
    border: 1px solid #374151;
    border-radius: 0.25rem;
  }
  ```
- **Time Update**: `setInterval(updateTime, 1000)` - updates every second
- **Format**: `HH:MM` with `DAY DATE` below

#### Logo (ST)
- **Position**: Relative within flex container
- **Styling**: `text-2xl font-bold text-white`
- **Margin**: `marginLeft: '40px'` (moved 40px right from default)
- **Link**: `href="/"`

#### Language Selector
- **Position**: Top-right corner of navigation
- **Button Style**: Flex layout with flag emoji and language name
- **Active State**: `bg-blue-600 text-white`
- **Inactive State**: `text-gray-300 hover:bg-slate-700`
- **Dropdown**: Animated with Framer Motion (`initial={{ opacity: 0, y: -10 }}`)
- **Z-Index**: `z-50`

### Hero Section (app/page.tsx)
**Container**: `relative h-[92vh] flex items-center justify-center pointer-events-none`

#### Hero Title (H1)
- **Text**: `text-6xl md:text-8xl font-bold text-white tracking-wider`
- **Text-Shadow** (soft black glow):
  ```javascript
  textShadow: '0 0 10px rgba(0, 0, 0, 0.3), 0 0 20px rgba(0, 0, 0, 0.15)'
  ```
- **Effect**: Two-layer shadow creating subtle depth highlight
- **Z-Index**: Relative positioning above 3D background

#### Subtitle (P)
- **Text**: `text-lg md:text-xl text-orange-100/90 tracking-wide mt-4`
- **Text-Shadow** (same as title):
  ```javascript
  textShadow: '0 0 10px rgba(0, 0, 0, 0.3), 0 0 20px rgba(0, 0, 0, 0.15)'
  ```
- **Color**: `text-orange-100/90` (warm orange with slight transparency)

#### Scroll Indicator
- **Position**: `absolute bottom-0 left-1/2 -translate-x-1/2`
- **Animation**: `animate-bounce` (Tailwind)
- **Content**: Chevron SVG icon
- **Color**: `text-white/40 hover:text-white/60`
- **Padding**: `pb-6`

### About Section (About.tsx)
**Container**: `py-20 px-4 md:px-8 lg:px-16 bg-slate-900/75 backdrop-blur-md border-t border-slate-700/50`

#### Section Title (H2)
- **Text**: `text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-8`
- **Text-Shadow**:
  ```javascript
  textShadow: '0 0 20px rgba(255, 255, 255, 0.6), 0 0 40px rgba(255, 255, 255, 0.3)'
  ```
- **Effect**: White glow highlight on dark background

#### Description Text
- **Text**: `text-lg text-gray-600 dark:text-gray-100 mb-4` and `mb-6`
- **Color**: `dark:text-gray-100` (very light gray in dark mode)
- **Brightness**: Increased from default gray-700 for better contrast

#### Tech Stack Title (H3)
- **Text**: `text-2xl font-bold text-gray-900 dark:text-white mb-6`
- **Text-Shadow** (brightest):
  ```javascript
  textShadow: '0 0 20px rgba(255, 255, 255, 0.73), 0 0 40px rgba(255, 255, 255, 0.36)'
  ```
- **Effect**: Enhanced white glow for emphasis
- **Margin**: `marginTop: '-80px'` (overlaps with left column)

#### Tech Stack Grid
- **Grid**: `grid grid-cols-2 gap-3`
- **Item Styling**: `px-4 py-3 bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg`
- **Text**: `text-gray-900 dark:text-blue-200 font-semibold text-center`

#### CTA Buttons
**Get in Touch Button**:
- **Style**: `px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors`
- **Link**: `href="#contact"`

**GitHub Button**:
- **Style**: `px-6 py-3 border-2 border-gray-400 dark:border-gray-500 text-white hover:bg-gray-100 dark:hover:bg-gray-700 font-semibold rounded-lg transition-colors`
- **CSS Class**: `github-button-glow` with animation
- **Animation**:
  ```css
  @keyframes textGlow {
    0%, 100% { text-shadow: 0 0 10px rgba(255, 255, 255, 0.5), 0 0 20px rgba(255, 255, 255, 0.3); }
    50% { text-shadow: 0 0 20px rgba(255, 255, 255, 0.8), 0 0 40px rgba(255, 255, 255, 0.5); }
  }
  ```
- **Hover Effect**: Color changes to `#9ca3af` with `textGlowGray` animation
- **Link**: `href="https://github.com/SimonTingle"` with `target="_blank" rel="noopener noreferrer"`

**LinkedIn Button**:
- **Style**: `px-8 py-2 border-2 rounded transition-colors linkedin-button flex items-center justify-center font-bold text-white`
- **CSS**: 
  ```css
  .linkedin-button {
    background-color: #0A66C2;
    border-color: #0A66C2;
  }
  .linkedin-button:hover {
    background-color: #084B93;
    border-color: #084B93;
  }
  ```
- **Link**: `href="https://www.linkedin.com/in/simontingle/"` with `target="_blank" rel="noopener noreferrer"`

### Scene Configuration Panel (SceneConfigPanel.tsx)
**Container**: `fixed top-4 right-4 z-50 flex flex-col items-end gap-3 pointer-events-auto`

#### Panel
- **Panel Style**: `w-80 bg-slate-950/92 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-[0_8px_60px_rgba(0,0,0,0.8)]`
- **Position**: Slides in from right with Framer Motion
- **Max Height**: `max-h-[85vh] overflow-y-auto`

#### Toggle Button (Gear Icon)
- **Size**: `w-11 h-11`
- **Style**: `rounded-full flex items-center justify-center shadow-lg border transition-colors`
- **Closed**: `bg-slate-950/80 backdrop-blur-md border-slate-700/60 text-slate-400 hover:text-white`
- **Open**: `bg-blue-600 border-blue-400 text-white`
- **Animation**: Icon rotates 60° when open

#### Slider Control
- **Style**: `w-full h-1.5 rounded-full appearance-none cursor-pointer accent-blue-500`
- **Value Display**: Label shows formatted value (e.g., "Wind Strength: 50%")
- **Range**: Min/max values specified per control

### 3D Canvas Elements (Hero3D.tsx)
**Canvas Container**: `absolute inset-0`
- **Camera**: `position: [0, 8, 15], fov: 50`
- **DPR**: `[1, 1.5]` (device pixel ratio)
- **Antialiasing**: `false` (performance optimization)

---

## Browser Support

- Chrome/Edge: Full support (including WebGL)
- Firefox: Full support
- Safari: Full support (may require polyfills for newer CSS)
- Mobile: Responsive design, optimized for touch

---

*Last updated: April 2026*
