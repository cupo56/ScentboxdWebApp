---
version: 1.0.0
theme:
  mode: "dark"
colors:
  background:
    primary: "#0a0a0f"
    secondary: "#12121a"
    card: "#16161f"
    cardHover: "#1c1c28"
    elevated: "#1e1e2a"
  text:
    primary: "#f0f0f5"
    secondary: "#8888a0"
    muted: "#55556a"
  accent:
    base: "#a78bfa"
    hover: "#c4b5fd"
    dim: "rgba(167, 139, 250, 0.15)"
    gold: "#f5c842"
    goldDim: "rgba(245, 200, 66, 0.15)"
  status:
    success: "#34d399"
    danger: "#f87171"
    warning: "#fbbf24"
  border:
    default: "rgba(255, 255, 255, 0.06)"
    hover: "rgba(255, 255, 255, 0.12)"
typography:
  fontFamilies:
    primary: "'Inter', system-ui, -apple-system, sans-serif"
  weights:
    light: 300
    regular: 400
    medium: 500
    semibold: 600
    bold: 700
    extrabold: 800
spacing:
  container:
    maxWidth: "1280px"
    padding: "24px"
  page:
    paddingY: "32px"
    navHeight: "64px"
radii:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  pill: "99px"
  circle: "50%"
shadows:
  card: "0 2px 12px rgba(0, 0, 0, 0.3)"
  elevated: "0 8px 32px rgba(0, 0, 0, 0.5)"
  glow: "0 0 20px rgba(167, 139, 250, 0.4)"
motion:
  durations:
    fast: "0.2s"
    medium: "0.25s"
    slow: "0.4s"
    spin: "0.6s"
    shimmer: "1.5s"
  easings:
    default: "ease"
    out: "ease-out"
---

# Scentboxd Design System

## Core Identity & Aesthetics
Scentboxd is a social platform for perfume enthusiasts, inspired by Letterboxd. The design language is decidedly **premium, moody, and luxurious**, matching the high-end nature of the fragrance world. It is built strictly as a dark-mode first experience, drawing users into a deep, immersive environment that lets the colorful perfume bottles and brand imagery stand out.

## Backgrounds & Depth
The application builds depth using a carefully stepped scale of deep, almost-black violet-tinted grays:
- The absolute base (`#0a0a0f`) acts as an infinite canvas.
- Structural elements sit slightly above (`#12121a`).
- Interactive surfaces like cards and inputs rest higher (`#16161f`), rising further (`#1c1c28`) on hover to create physical depth.
- Floating elements like dropdowns, modals, and toasts sit at the highest elevation (`#1e1e2a`) and are supported by heavy, soft drop shadows (`shadow-elevated`).

## Color & Accents
The primary accent is a soft, elegant lavender/purple (`#a78bfa`), reflecting creativity and luxury. 
- **Interactive Accents:** Buttons and links use the purple accent. Hover states lighten the color slightly while emitting a subtle, glowing box-shadow to feel tactile.
- **Gold for Prestige:** Gold (`#f5c842`) is used sparingly but purposefully for badges, ratings, and highlights to indicate premium status or top-rated items.
- **Dimmed Backgrounds:** Badges and active states frequently pair the solid accent text color with a 15% opacity background of the same hue (e.g., `accent-dim`), creating a soft, glass-like chip effect without overwhelming the dark theme.

## Borders & Glassmorphism
Hard, solid borders are avoided. Instead, boundaries are defined by ultra-sheer white strokes (`rgba(255, 255, 255, 0.06)`). On interactive elements (cards, buttons), hovering increases the border opacity slightly (`0.12`), simulating a light catching the edge of a glass pane.

## Typography
The UI relies entirely on the **Inter** typeface. It is utilized across a wide range of weights (300 to 800) to establish strong hierarchy:
- Primary text is a crisp, cool off-white (`#f0f0f5`).
- Secondary details, meta-information, and captions use muted grays (`#8888a0` and `#55556a`) to recede into the background.
- Section titles are bold (`700`) and slightly larger, often paired with an accent-colored icon to anchor the content.

## Motion & Interaction
Animations are subtle but crucial for a high-end feel:
- **Loading:** Instead of jarring spinners for main content areas, a continuous, smoothly sweeping shimmer gradient travels across skeleton loaders.
- **Hover States:** Cards translate upward slightly (`-2px`) with a fast, smooth transition (`0.25s ease`), while borders brighten and shadows deepen. Primary buttons depress slightly (`-1px`) and emit a soft glow.
- **Entrance:** Toast notifications and new list items slide up and fade in (`fadeIn` keyframe, `0.4s ease-out`), ensuring the UI feels responsive and fluid rather than instantaneous and harsh.
