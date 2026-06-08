# Document 04 — UI/UX Design Brief

## Curalink — Visual & Interaction Design Guide

---

### Aesthetic

**Dark-mode first, glassmorphism-accented, medical-professional feel.** Clean, premium, data-dense but not cluttered. Inspired by the visual language of Linear, Vercel, and Raycast — but with a warm medical/scientific identity through teal-purple gradients and DNA iconography.

---

### Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--bg` | `#0a0a0f` | Page background |
| `--b1` | `#111118` | Card/panel background |
| `--b2` | `#1a1a24` | Elevated surfaces (sidebar, input panel) |
| `--b3` | `#22222e` | Hover states, borders |
| `--p` (Primary) | `#2dd4bf` | Teal accent — CTAs, links, active states |
| `--p-dim` | `#1a8a7a` | Dimmed primary for subtle accents |
| `--p-bg` | `rgba(45, 212, 191, 0.08)` | Primary background tint |
| `--sec` (Secondary) | `#818cf8` | Indigo — secondary actions, badges |
| `--sec-dim` | `#5b63d3` | Dimmed secondary |
| `--sec-bg` | `rgba(129, 140, 248, 0.08)` | Secondary background tint |
| `--t1` | `#f5f5f7` | Primary text (headings) |
| `--t2` | `#d1d1d6` | Body text |
| `--t3` | `#8e8e93` | Muted text |
| `--t4` | `#48484a` | Disabled/hint text |
| `--err` | `#ff6b6b` | Error states |
| `--ok` | `#34d399` | Success states |
| `--amber` | `#fbbf24` | Warnings, bookmarks |
| `--pubmed` | `#38bdf8` | PubMed source indicator |
| `--openalex` | `#818cf8` | OpenAlex source indicator |
| `--clinical` | `#f472b6` | Clinical trials source indicator |

### Gradients

- **Hero gradient**: `linear-gradient(135deg, #2dd4bf 0%, #818cf8 50%, #f472b6 100%)` — used for gradient text and welcome icon halo
- **Card shine**: Subtle `linear-gradient` overlay for glassmorphism cards
- **Activity bars**: `linear-gradient(180deg, var(--p), var(--sec-dim))` — vertical data bars

---

### Typography

| Element | Font | Size | Weight |
|---------|------|------|--------|
| Headings | Inter | 20–28px | 700 |
| Body text | Inter | 14–15px | 400 |
| Small text / labels | Inter | 11–12px | 500–600 |
| Code / stats | System monospace | 12px | 500 |
| Brand name | Inter | 17px | 700 |

**Font import**: `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');`

---

### Component Style

| Property | Value |
|----------|-------|
| Border Radius | 12px (cards), 8px (buttons, inputs), 20px (pills) |
| Borders | 1px solid `rgba(255,255,255,0.06)` |
| Card Shadows | `0 8px 32px rgba(0,0,0,0.3)` for elevated elements |
| Glassmorphism | `backdrop-filter: blur(24px)` + semi-transparent backgrounds |
| Button Padding | 10px 20px (standard), 12px 28px (CTA) |
| Input Fields | Dark background (`var(--b2)`), 1px border, 8px radius |
| Focus Rings | 2px `var(--p)` outline with 2px offset |
| Transition | `all 0.2s ease` on interactive elements |

### Sidebar

- Width: 280px (desktop), full-screen slide-in (mobile)
- Background: `var(--b2)` with glass effect
- Session items: hover → `var(--b3)` background, active → teal left border accent
- Footer: user avatar (initial letter), email, logout button

### Message Bubbles

- **User messages**: Right-aligned, gradient background (`var(--p)` to `var(--sec-dim)`), white text
- **AI responses**: Left-aligned, full-width card with `var(--b1)` background, structured sections

### Input Panel

- Fixed at bottom of chat area
- Tab switcher between "Structured Input" and "Quick Chat"
- Structured form: 2-column grid of labeled fields
- Quick chat: Single-line textarea with send button
- Voice input button with pulsing animation when listening

---

### Dark/Light Mode

**Dark mode is the only mode.** The entire design system is built around dark backgrounds. No light mode toggle — the medical/research context benefits from reduced eye strain in dark environments.

---

### Reference Apps

| App | Inspiration Taken |
|-----|-------------------|
| **Linear** | Clean dark UI, keyboard shortcuts, collapsible sections |
| **Vercel** | Card design, deployment-status-like badges, minimal chrome |
| **Notion** | Sidebar with session list, search, tabs |
| **Raycast** | Quick-action feel, premium micro-animations |
| **ChatGPT** | Chat message layout, typing indicator, session history |

---

### Animations & Micro-Interactions

| Element | Animation |
|---------|-----------|
| Welcome DNA icon | Pulsing halo + rotating ring (CSS keyframes) |
| Typing indicator | 3 bouncing dots with staggered delay |
| Toast notifications | Slide-in from top-right, auto-dismiss after 3.5s |
| Sidebar open/close | `translateX` slide with 0.3s ease |
| Collapsible sections | Chevron rotation (180°) on toggle |
| Submit button | Spinner animation when loading |
| Auth background | Floating orbs with slow drift animation |
| Session item hover | Smooth background color transition |
| Activity chart bars | Height grows on render |
| Voice button | Red pulse animation when listening |

---

### Mobile Responsiveness

| Breakpoint | Behavior |
|------------|----------|
| ≥ 768px | Sidebar visible by default, 2-column form layout |
| < 768px | Sidebar hidden (hamburger toggle), single-column form, backdrop overlay |
| ≥ 375px | Minimum supported width |

- Input panel and header stack vertically on small screens
- Context pills in header hide on mobile
- Form fields switch to single-column stack
- Chat messages use full width

---

### Accessibility Considerations

- **Color Contrast**: All text meets WCAG 2.1 AA minimum (4.5:1 for body text, 3:1 for large text)
- **Focus Indicators**: Visible focus rings on all interactive elements
- **Keyboard Navigation**: Full tab navigation, Enter/Space activation
- **Screen Readers**: ARIA labels on icon-only buttons, semantic HTML structure
- **Reduced Motion**: Respects `prefers-reduced-motion` media query
- **Font Sizing**: Base 14px, all text uses relative units for zoom support
