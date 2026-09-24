# Safe Kids Guard — Design System Rules

## Source of Truth
- Color scales come from **`docs/pallte_taiwindv4.md`** — this is the official palette file.
- Exact brand hex values were pixel-sampled from **`docs/logo.jpeg`**.
- The two are **complementary**: the palette scale names are used as Tailwind tokens; their 500-level shades closely match the logo colors.
- **Tailwind v4** uses `@theme {}` in CSS — there is NO `tailwind.config.ts`. All tokens go in `app/globals.css` under `@theme`.

---

## Tailwind v4 Token System (`@theme` in globals.css)

```css
/* ✅ CORRECT for Tailwind v4 — goes in app/globals.css */
@import "tailwindcss";

@theme {
  /* ── From pallte_taiwindv4.md (full scales) ── */
  --color-blue-green-50:       #e8f9fc;
  --color-blue-green-100:      #d1f3fa;
  --color-blue-green-200:      #a4e7f4;
  --color-blue-green-300:      #76dbef;
  --color-blue-green-400:      #48cfea;
  --color-blue-green-500:      #1bc3e4;  /* ≈ Logo #0AC7E3 — shield cyan */
  --color-blue-green-600:      #159cb7;  /* ≈ Logo #06B0B7 — "Guard" text */
  --color-blue-green-700:      #107589;
  --color-blue-green-800:      #0b4e5b;
  --color-blue-green-900:      #05272e;
  --color-blue-green-950:      #041b20;

  --color-yale-blue-50:        #e7f3fd;
  --color-yale-blue-100:       #d0e7fb;
  --color-yale-blue-200:       #a0cff8;
  --color-yale-blue-300:       #71b7f4;
  --color-yale-blue-400:       #419ff1;
  --color-yale-blue-500:       #1287ed;
  --color-yale-blue-600:       #0e6cbe;
  --color-yale-blue-700:       #0b518e;  /* ≈ Logo #125DA0 — shield body */
  --color-yale-blue-800:       #07365f;  /* ≈ Logo #0B264D — "Safe Kids" navy */
  --color-yale-blue-900:       #041b2f;  /* Dark mode page background */
  --color-yale-blue-950:       #021321;

  --color-thistle-50:          #f1eef6;
  --color-thistle-100:         #e3ddee;
  --color-thistle-200:         #c8bbdd;
  --color-thistle-300:         #ac99cc;
  --color-thistle-400:         #9077bb;
  --color-thistle-500:         #7455aa;  /* ≈ Logo #6847C7 — violet accent */
  --color-thistle-600:         #5d4488;
  --color-thistle-700:         #463366;
  --color-thistle-800:         #2f2244;
  --color-thistle-900:         #171122;
  --color-thistle-950:         #100c18;

  --color-prussian-blue-50:    #e6f1fe;
  --color-prussian-blue-100:   #cde2fe;
  --color-prussian-blue-200:   #9cc6fc;
  --color-prussian-blue-300:   #6aa9fb;
  --color-prussian-blue-400:   #388cfa;
  --color-prussian-blue-500:   #066ff9;
  --color-prussian-blue-600:   #0559c7;
  --color-prussian-blue-700:   #044395;
  --color-prussian-blue-800:   #032d63;  /* Dark surface background */
  --color-prussian-blue-900:   #011632;
  --color-prussian-blue-950:   #011023;

  --color-alice-blue-50:       #edf5f8;
  --color-alice-blue-100:      #daebf1;
  --color-alice-blue-200:      #b5d7e3;  /* Light border */
  --color-alice-blue-300:      #90c3d5;
  --color-alice-blue-400:      #6baec7;
  --color-alice-blue-500:      #469ab9;
  --color-alice-blue-600:      #387b94;  /* Muted text */
  --color-alice-blue-700:      #2a5d6f;
  --color-alice-blue-800:      #1c3e4a;
  --color-alice-blue-900:      #0e1f25;
  --color-alice-blue-950:      #0a161a;

  /* ── Emerald Green (logo checkmark — not in pallte_taiwindv4.md, added here) ── */
  --color-emerald-50:          #eaf9ef;
  --color-emerald-100:         #c6eed1;
  --color-emerald-200:         #8edda5;
  --color-emerald-300:         #56cb79;
  --color-emerald-400:         #3bc562;
  --color-emerald-500:         #2abe50;  /* Logo exact: #2ABE50 */
  --color-emerald-600:         #228f3c;
  --color-emerald-700:         #1a6f2f;
  --color-emerald-800:         #114a1f;
  --color-emerald-900:         #092510;
  --color-emerald-950:         #051a0b;

  /* ── Semantic fixed colors (not in any scale) ── */
  --color-danger:              #E33A0A;
  --color-warning:             #F0A83D;

  /* ── Typography ── */
  --font-arabic:               'Cairo', 'Tajawal', sans-serif;
  --font-latin:                'Inter', system-ui, sans-serif;
  --font-mono:                 'JetBrains Mono', monospace;

  /* ── Border radius ── */
  --radius-sm:   8px;
  --radius-md:   12px;
  --radius-lg:   16px;
  --radius-xl:   24px;
  --radius-card: 16px;
}
```

> **Usage:** After defining `--color-blue-green-500` in `@theme`, Tailwind v4 automatically generates `bg-blue-green-500`, `text-blue-green-500`, `border-blue-green-500`, etc.
> ❌ Do NOT write a `tailwind.config.ts` for color tokens — that is Tailwind v3 syntax.

---

## Role → Token Mapping (Semantic Aliases)

| Semantic Role | Palette Token | HEX | Logo Reference |
|---|---|---|---|
| **Primary / CTA** | `blue-green-500` | `#1BC3E4` | Shield cyan |
| **Primary hover** | `blue-green-400` | `#48CFEA` | — |
| **Primary dark** | `blue-green-600` | `#159CB7` | "Guard" text |
| **Primary subtle bg** | `blue-green-100` | `#D1F3FA` | — |
| **Heading / Navy** | `yale-blue-800` | `#07365F` | "Safe Kids" text |
| **Body link / Icon** | `yale-blue-700` | `#0B518E` | Shield body |
| **Accent / Violet** | `thistle-500` | `#7455AA` | Girl character |
| **Accent dark** | `thistle-700` | `#463366` | — |
| **Safe indicator** | `emerald-500` | `#2ABE50` | Checkmark |
| **Dark surface** | `prussian-blue-800` | `#032D63` | — |
| **Dark page bg** | `yale-blue-900` | `#041B2F` | — |
| **Border (light)** | `alice-blue-200` | `#B5D7E3` | — |
| **Muted text** | `alice-blue-600` | `#387B94` | — |
| **Danger** | `danger` | `#E33A0A` | — |
| **Warning** | `warning` | `#F0A83D` | — |

---

## Content Category → Token Mapping

| Category | Token | HEX |
|---|---|---|
| ✅ SAFE | `emerald-500` | `#2ABE50` |
| 🟣 CYBERBULLYING | `thistle-500` | `#7455AA` |
| 🔴 SEXUAL | `danger` | `#E33A0A` |
| 🟠 VIOLENCE | `warning` | `#F0A83D` |
| 🔵 HATE_SPEECH | `yale-blue-700` | `#0B518E` |

---

## Gradients (use palette tokens)

```css
--gradient-primary: linear-gradient(135deg, var(--color-blue-green-500) 0%, var(--color-yale-blue-700) 100%);
--gradient-hero:    linear-gradient(135deg, var(--color-yale-blue-800) 0%, var(--color-yale-blue-700) 40%, var(--color-blue-green-500) 100%);
--gradient-cta:     linear-gradient(90deg,  var(--color-blue-green-600) 0%, var(--color-blue-green-500) 100%);
--gradient-safe:    linear-gradient(90deg,  var(--color-emerald-500) 0%, var(--color-blue-green-500) 100%);
--gradient-danger:  linear-gradient(90deg,  var(--color-danger) 0%, var(--color-warning) 100%);
--gradient-glass:   linear-gradient(135deg, rgba(27,195,228,0.15) 0%, rgba(72,207,234,0.08) 100%);
```

---

## Typography Rules

- **Arabic / Primary:** `Cairo` (weights: 300, 400, 500, 600, 700, 800) — Google Fonts
- **Arabic / Fallback:** `Tajawal` — Google Fonts
- **Latin / UI:** `Inter` — Google Fonts
- **Monospace:** `JetBrains Mono` — URLs, logs, hashes
- Import via `next/font/google` in `app/layout.tsx` — never use `<link>` tags
- **Never** use browser default system fonts for Arabic text

---

## Design Rules

1. ✅ Define all color tokens in `@theme {}` in `globals.css` — not in `tailwind.config.ts`
2. ✅ Use `bg-blue-green-500` utilities — Tailwind v4 generates these automatically from `@theme`
3. ✅ Page headers always use `gradient-hero`
4. ✅ CTA buttons always use `gradient-cta`
5. ✅ Never hard-code hex values in component files — always use a Tailwind class or CSS var
6. ✅ Dark mode: use `dark:` Tailwind variant; swap to `prussian-blue-800`/`yale-blue-900` surfaces
7. ✅ Arabic text: `font-arabic` token → Cairo/Tajawal; set `dir="rtl"` on containers
8. ✅ Cards: `rounded-card` (16px) + `shadow-md` or glassmorphism with `backdrop-blur-md`
9. ❌ Never use raw `blue`, `green`, `red`, `purple` Tailwind defaults — use brand scale names
10. ❌ Never create a `tailwind.config.ts` file for color tokens (Tailwind v3 only)

---

## Android Compose Color Tokens

```kotlin
// ui/theme/Color.kt — Named to match pallte_taiwindv4.md scales

// blue-green scale (Primary / Cyan)
val BlueGreen500 = Color(0xFF1BC3E4)  // Primary brand
val BlueGreen600 = Color(0xFF159CB7)  // Primary dark
val BlueGreen400 = Color(0xFF48CFEA)  // Hover / light
val BlueGreen100 = Color(0xFFD1F3FA)  // Pale background

// yale-blue scale (Structure / Navy)
val YaleBlue800  = Color(0xFF07365F)  // Headings
val YaleBlue700  = Color(0xFF0B518E)  // Links, icons
val YaleBlue900  = Color(0xFF041B2F)  // Dark background

// thistle scale (Accent / Violet)
val Thistle500   = Color(0xFF7455AA)  // Accent
val Thistle700   = Color(0xFF463366)  // Accent dark

// prussian-blue scale (Dark surfaces)
val PrussianBlue800 = Color(0xFF032D63)

// alice-blue scale (Muted / Borders)
val AliceBlue200 = Color(0xFFB5D7E3)  // Border
val AliceBlue600 = Color(0xFF387B94)  // Muted text

// emerald (Safe — added, not in pallte file)
val Emerald500   = Color(0xFF2ABE50)

// Semantic
val DangerRed    = Color(0xFFE33A0A)
val WarningOrange= Color(0xFFF0A83D)
```

---

## Brand Color Tokens

### Primary Palette

| Token Name | HEX | HSL | Usage |
|---|---|---|---|
| `--color-cyan` | `#0AC7E3` | `hsl(187, 91%, 46%)` | Shield dominant, primary buttons, highlights |
| `--color-cyan-dark` | `#06B0B7` | `hsl(182, 93%, 37%)` | "Guard" text, pressed button state |
| `--color-sky` | `#3DAAF0` | `hsl(203, 85%, 59%)` | Shield gradient, hover states, links |
| `--color-navy` | `#0B264D` | `hsl(215, 74%, 17%)` | "Safe Kids" text, headings, sidebar bg |
| `--color-royal` | `#125DA0` | `hsl(208, 79%, 34%)` | Shield body, icon fills, body text links |
| `--color-violet` | `#6847C7` | `hsl(255, 53%, 52%)` | Cyberbullying badge, accent |
| `--color-emerald` | `#2ABE50` | `hsl(135, 63%, 45%)` | Safe indicator, checkmarks, success states |

### Semantic Colors

| Purpose | HEX | Rule |
|---|---|---|
| Danger / Blocked | `#E33A0A` | Use ONLY for blocked content and critical alerts |
| Warning | `#F0A83D` | Use ONLY for moderate-risk and suspicious content |
| Info | `#3DAAF0` | Same as `--color-sky` |
| Safe | `#2ABE50` | Same as `--color-emerald` |

---

## Mandatory Gradients

```
Primary:  linear-gradient(135deg, #0AC7E3 0%, #3DAAF0 50%, #125DA0 100%)
Hero:     linear-gradient(135deg, #0B264D 0%, #125DA0 40%, #0AC7E3 100%)
CTA Btn:  linear-gradient(90deg, #06B0B7 0%, #0AC7E3 100%)
Safe:     linear-gradient(90deg, #2ABE50 0%, #0AC7E3 100%)
Danger:   linear-gradient(90deg, #E33A0A 0%, #F0A83D 100%)
Glass:    linear-gradient(135deg, rgba(10,199,227,0.15) 0%, rgba(61,170,240,0.08) 100%)
```

---

## Light / Dark Mode Surfaces

| Token | Light | Dark |
|---|---|---|
| Page background | `#F0FAFC` | `#061625` |
| Card/surface | `#FFFFFF` | `#0D2840` |
| Border | `#C8EEF4` | `#1A3A55` |
| Text primary | `#0B264D` | `#E8F4FD` |
| Text secondary | `#4A6FA5` | `#8AB3D0` |

---

## Content Category → Color Mapping

| Category | Color Name | HEX |
|---|---|---|
| ✅ SAFE | Emerald Green | `#2ABE50` |
| 🟣 CYBERBULLYING | Electric Violet | `#6847C7` |
| 🔴 SEXUAL | Danger Red | `#E33A0A` |
| 🟠 VIOLENCE | Warning Orange | `#F0A83D` |
| 🔵 HATE_SPEECH | Royal Blue | `#125DA0` |

---

## Typography

- **Arabic / Primary font:** `Cairo` (weights: 300, 400, 500, 600, 700, 800)
- **Arabic / Fallback:** `Tajawal`
- **Latin / UI:** `Inter`
- **Monospace (URLs, logs):** `JetBrains Mono`
- Load from Google Fonts. Never use browser default fonts for Arabic text.

---

## Rules

1. Page headers always use `gradient-hero`
2. Primary action buttons always use `gradient-cta`
3. Never use plain `blue`, `green`, `red` — always use brand tokens
4. Brand logo text: "Safe Kids" = `#0B264D`, "Guard" = `#06B0B7`
5. Dark mode: swap surface tokens only; brand colors stay the same
6. All Arabic text must use `font-family: Cairo, Tajawal`
7. Cards default to `border-radius: 16px` with `--shadow-card`
8. Glassmorphism cards: use `gradient-glass` + `backdrop-filter: blur(12px)`

---

## Android Compose Tokens (quick ref)

```kotlin
val BrandCyan    = Color(0xFF0AC7E3)
val BrandNavy    = Color(0xFF0B264D)
val BrandRoyal   = Color(0xFF125DA0)
val BrandViolet  = Color(0xFF6847C7)
val BrandEmerald = Color(0xFF2ABE50)
val DangerRed    = Color(0xFFE33A0A)
```
