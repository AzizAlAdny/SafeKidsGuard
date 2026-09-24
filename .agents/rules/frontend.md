# Safe Kids Guard — Frontend Rules (Next.js 15 + Tailwind CSS v4)

## Stack
- **Next.js 15** — App Router, TypeScript, Server Components where possible
- **Tailwind CSS v4** — CSS-first config via `@theme {}` in `globals.css` (no `tailwind.config.ts`)
- **shadcn/ui** — accessible component library (built on Radix UI)
- **Recharts** — data visualization (activity charts, risk gauges)
- **TanStack Query (React Query v5)** — server state management
- **Zustand** — lightweight client/UI state (auth session, sidebar toggle)
- **Axios** — HTTP client with JWT interceptor
- **Supabase JS client** — real-time subscriptions (alerts feed, activity updates)
- **Custom JWT auth** — JWT stored in HttpOnly cookie; no NextAuth dependency
- **`@ducanh2912/next-pwa`** — PWA support (installable dashboard, reliable push on mobile)
- **`firebase/messaging`** — FCM Web Push Service Worker (fallback when WhatsApp not configured)

---

## Project Structure (App Router)

```
client/Dashboard/
├── app/
│   ├── layout.tsx              ← Root layout: fonts, providers, metadata
│   ├── middleware.ts           ← RBAC route guard (redirect unauthorized)
│   ├── (auth)/                 ← Public auth routes (no layout sidebar)
│   │   ├── login/page.tsx
│   │   └── register/page.tsx   ← Includes WhatsApp phone field (required)
│   ├── (parent)/               ← Parent-role protected routes
│   │   ├── layout.tsx          ← Sidebar + header layout
│   │   ├── dashboard/page.tsx
│   │   ├── activity/page.tsx
│   │   ├── alerts/page.tsx
│   │   ├── policies/page.tsx
│   │   ├── reports/page.tsx
│   │   ├── children/page.tsx
│   │   └── notifications/page.tsx ← WhatsApp phone + web push toggle
│   └── (admin)/                ← Admin-role protected routes
│       ├── layout.tsx
│       └── admin/
│           ├── users/page.tsx
│           ├── models/page.tsx
│           ├── health/page.tsx
│           └── blacklist/page.tsx
├── components/
│   ├── ui/                     ← shadcn/ui generated components
│   ├── charts/
│   ├── tables/
│   └── alerts/
├── lib/
│   ├── api.ts                  ← Axios instance with interceptors
│   ├── auth.ts                 ← Auth helpers
│   ├── supabase.ts             ← Supabase browser client
│   └── notifications.ts        ← FCM web push token registration
├── public/
│   ├── firebase-messaging-sw.js ← FCM Web Push Service Worker
│   └── manifest.json            ← PWA manifest (Arabic RTL, brand colors)
├── next.config.ts              ← next-pwa config
└── hooks/
```

---

## Architecture Rules

- **Use React Server Components (RSC)** for data fetching pages where SEO or initial load performance matters. Mark client-interactive components with `"use client"` only when necessary.
- **TanStack Query** manages all async server state (data fetching, caching, invalidation). Do not use `useState` + `useEffect` for API calls.
- **Zustand** manages auth token, user profile, and UI state (sidebar open/close, theme). Keep the store minimal.
- All API calls go through `lib/api.ts` — never call `fetch` directly in components.

---

## RBAC Rules

```typescript
// middleware.ts — enforce role-based access
// Parent routes: role === 'parent'
// Admin routes: role === 'admin'
// Child cannot access the dashboard (mobile app only)
```

- `middleware.ts` must redirect unauthenticated users to `/login`
- `middleware.ts` must redirect wrong-role users to `/403` or back to their dashboard
- **Server Actions** that mutate data must re-validate the JWT role server-side — never trust client-sent role claims

---

## RTL & Arabic Support

- Set `<html lang="ar" dir="rtl">` in `app/layout.tsx` when Arabic locale is active
- Use `tailwindcss-rtl` plugin for automatic RTL utility classes (`ms-`, `me-`, `ps-`, `pe-`)
- Import Arabic fonts from Google Fonts:
  ```typescript
  import { Cairo, Tajawal } from 'next/font/google'
  ```
- All table columns displaying Arabic content must set `dir="rtl"` on the cell
- Test all UI pages with Arabic text to verify RTL layout does not break

---

## Real-Time Rules

```typescript
// lib/supabase.ts — Supabase realtime subscription pattern
const channel = supabase
  .channel('alerts')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'alerts', filter: `parent_id=eq.${userId}` },
    (payload) => { /* update TanStack Query cache or Zustand store */ }
  )
  .subscribe()
```

- Real-time subscriptions must be cleaned up on component unmount (`useEffect` cleanup / `channel.unsubscribe()`)
- Use Supabase Realtime for: alerts feed, activity log live updates
- **Do not poll** — use subscriptions for live data

---

## Component Rules

- All data tables must:
  - Support pagination (from API — not client-side all-at-once)
  - Support column filtering (by date, by category, by verdict)
  - Display Arabic text with correct RTL alignment
  - Show loading skeleton while data is fetching
- All forms must use **react-hook-form** + **zod** for validation
- All modal dialogs must use shadcn/ui `Dialog` (accessible, keyboard-navigable)
- Error states must show user-friendly Arabic messages (not raw API errors)

---

## Styling Rules

- **Tailwind v4 `@theme` only** — all color/font/radius tokens go in `@theme {}` inside `globals.css`. No `tailwind.config.ts` for tokens.
- Use palette scale utility classes: `bg-blue-green-500`, `text-yale-blue-800`, `border-alice-blue-200` etc. — generated automatically by Tailwind v4 from `@theme`.
- Dark mode via `dark:` Tailwind variant (e.g. `dark:bg-yale-blue-900`)
- Minimum font size: `14px` for body text; `12px` for small labels
- Use `text-right` and `rtl:` variants for Arabic text alignment
- ❌ Never write inline `style={{color: '#1bc3e4'}}` — always use Tailwind classes
- ❌ Never create `tailwind.config.ts` for color tokens — this is Tailwind v3 syntax

---

## Performance Rules

- All images use Next.js `<Image>` component (automatic optimization, lazy loading)
- Data-heavy pages (Activity Log, Reports) must use virtual scrolling for >100 rows
- Use `Suspense` boundaries with skeleton fallbacks for all async page content
- Bundle size: check with `next build --profile` — avoid importing large libs (moment.js, etc.)

---

## Notification UI Rules

### Registration page (`/register`)
- Must include a **WhatsApp phone number field** — input type `tel`, dir `ltr`, placeholder `+966XXXXXXXXX`
- Validate Saudi format: `966` prefix, 9 digits after, strip `+` before sending to API
- Mark it as **required** (WhatsApp is the primary alert channel)
- Show helper text in Arabic: `"سيتم إرسال التنبيهات إلى هذا الرقم عبر واتساب"`

### Notification preferences page (`/notifications`)
```
┌────────────────────────────────────────────────┐
│  تنبيهات واتساب                            │
│  ┌─────────────────────────────────────┐  │
│  │ رقم واتساب  [+966__________]   │  │
│  │ تفعيل تنبيهات واتساب       [Toggle] │  │
│  └─────────────────────────────────────┘  │
│                                              │
│  تنبيهات المتصفح (احتياطي)                   │
│  ┌─────────────────────────────────────┐  │
│  │ تفعيل تنبيهات المتصفح     [Toggle] │  │
│  │ [تفعيل تنبيهات المتصفح]          │  │
│  └─────────────────────────────────────┘  │
└────────────────────────────────────────────────┘
```

### PWA + Service Worker
- `public/manifest.json` must include: `name` (Arabic + English), `theme_color: "#1BC3E4"`, `background_color: "#041B2F"`, `dir: "rtl"`, `lang: "ar"`, `display: "standalone"`
- `public/firebase-messaging-sw.js` handles background FCM push when tab is closed
- Show a non-intrusive "Install App" banner on mobile after first login (using `beforeinstallprompt` event)
- All notification permission requests must show Arabic UI explanation before browser prompt

---

## Testing

- Use **Playwright** for E2E tests: login flow, policy configuration, alert receipt
- Use **Vitest** + **React Testing Library** for unit/component tests
- Every page must have at minimum: renders without crash + RBAC redirect test
