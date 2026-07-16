# Tools-Set — UI/UX Improvement Plan

> Status: **v2 — Phase 1 shipped, plan refined after implementation audit**
> Branch: `add-more-tools` · Last updated: 2026-07-13
>
> A phased architecture plan to evolve Tools-Set from 18 independently-styled pages
> into one coherent product. Each phase is independently shippable; later phases
> build on earlier ones. No functional tool behavior changes — this is a UI/UX layer.
>
> **v2 changes:** Phase 1 (design system + page migration) landed in commits
> `e0949be` + `70021a6`. This revision records what was verified working, adds a
> consistency punch list for what the migration missed, and re-orders the remaining
> phases by user-visible value per unit of effort.

---

## 0. Goals & Design Principles

**Goals**

1. Every tool feels like part of one product (shared visual language, navigation, actions).
2. Ship dark mode completely (styles are now in place but the toggle is still disabled).
3. Make tools discoverable (categories, search everywhere, favorites, recents, ⌘K).
4. Win organic search traffic (per-tool SEO meta — currently zero).
5. Raise baseline polish: real loading feedback, consistent toasts, share UX, empty states.
6. Meet a reasonable accessibility bar (labels, focus, keyboard paths).

**Principles**

- **Metadata-driven**: `data/tools.json` is the single source of truth for a tool's
  name, description, icon, category, SEO, and layout mode. Components consume it;
  nothing duplicates it.
- **Primitives before pages**: shared components (`Base*`, `ToolLayout`) carry the
  design decisions (colors, spacing, dark mode, focus states) so pages never
  re-implement them.
- **Incremental migration**: pages adopt the new system one at a time, simplest first.
- **No new heavy dependencies**: Tailwind + Headless UI (already installed) +
  VueUse (already installed) cover everything below.

---

## 1. Implementation Audit — 2026-07-13 (verified against running app)

### 1.1 Shipped and verified ✅

| Item | Evidence |
|------|----------|
| Design tokens (`primary`, `accent`, `surface`, `rounded-card`) | `tailwind.config.js` |
| 9 base primitives, dark-ready, a11y-by-construction | `components/base/*` — `BaseInput` auto-wires `id`/`label` via `useId()`; `BaseButton` has focus-visible rings + variants |
| Tool scaffolding | `components/tool/{ToolLayout,ToolHeader,ToolActions}.vue`; resolves tool from route via `useTools()` |
| Nuxt layouts | `layouts/default.vue` (container) + `layouts/fullscreen.vue` (`h-[calc(100vh-4rem)]`); `app.vue` slimmed to NavBar + Toast + NuxtLayout |
| `composables/useTools.ts` | `byPath / currentTool / popular / categories / search` + `CATEGORY_LABELS` |
| `tools.json` v2 schema | All 17 tools have `category`, `keywords`, `layout`, `popular`, `seo` — no missing keys |
| Page migration | 15 of 17 tool pages use `ToolLayout` + `Base*`; 5 canvas pages declare `layout: 'fullscreen'` via `definePageMeta` |
| NavBar popular list derived from tools.json | `NavBar.vue:265–268` — hardcoded list removed |
| Toast z-index bug fixed | `Toast.vue` — `index` now declared in `v-for` |
| Dark styling actually works | Verified visually: forced `.dark` on `<html>` → homepage, JSON Formatter, Kanban all render correctly in dark |

### 1.2 Gaps found (drive the phases below)

| # | Gap | Evidence | Fixed in |
|---|-----|----------|----------|
| G1 | **Dark mode unreachable by users** — toggle still commented out; `initTheme()` has zero call sites, so system preference is never applied; no pre-hydration script (`app.head.script: []`) | `NavBar.vue:90–105`, `nuxt.config.ts:22`, verified: no toggle in rendered DOM | Phase 2 |
| G2 | **`fluid` prop inverted** — 16 of 17 pages pass `fluid`; only `qr.vue` uses the `max-w-3xl` default. Wide pages then stretch edge-to-edge on large monitors (JSON textarea ~1500px wide at 1800px viewport) | `grep fluid pages/` | Phase 1.5 |
| G3 | `animation.vue` still off-brand: green Play / dark-gray Reset / blue Copy Code buttons; category tabs overflow clipped ("Ath…") | Verified visually + `grep bg-blue` | Phase 1.5 |
| G4 | `convert/[converter].vue` + `convert/settings.vue` hand-roll `<h1>` headers instead of `ToolLayout` (they're dynamic sub-pages not in tools.json — but `ToolLayout` supports `title`/`description` overrides for exactly this) | grep ToolLayout | Phase 1.5 |
| G5 | `tools.json` `layout` key is decorative — nothing consumes it; the 5 fullscreen pages each hand-declare `definePageMeta` | grep definePageMeta | Phase 1.5 |
| G6 | Homepage still a flat unordered grid — no hero copy, no on-page search, no categories/favorites/recents; imports `tools.json` directly instead of `useTools()` | `pages/index.vue` | Phase 3 |
| G7 | Zero SEO — every page's `document.title` is "Tools-Set"; no `useSeoMeta` anywhere; no `error.vue`; no sitemap | verified in browser | Phase 4 |
| G8 | `PageLoading.vue` still fakes progress with `setInterval` | `PageLoading.vue:33` | Phase 5 |
| G9 | Share is still silent-copy with no non-secure-context fallback | `qr.vue` `shareQRCode()` | Phase 5 |
| G10 | Leftover cruft: `backgroundColor.dark` / `textColor.dark` one-off extensions in `tailwind.config.js` duplicate the `surface` tokens | `tailwind.config.js:29–35` | Phase 1.5 |

---

## 2. Target Architecture (unchanged, one addition)

```
data/tools.json (v2 schema — single source of truth)
        │
        ├─► pages/index.vue ──────────── category sections, search, favorites, recents
        ├─► components/NavBar.vue ────── search + popular (✅ derived, not hardcoded)
        ├─► components/CommandPalette ── ⌘K quick-open
        ├─► composables/useTools.ts ──── ✅ lookup, search, categories, current-tool
        ├─► composables/useToolMeta.ts ─ per-page SEO from tool entry
        └─► layouts/{default,fullscreen} + components/tool/ToolLayout.vue  ✅
                    │
                    └─► pages/tools/*.vue (thin: metadata + tool body only)  ✅
                              │
                              └─► components/base/* (Button, Input, Card, …)  ✅
                                        └─ owns colors, spacing, focus, dark: variants
```

**Addition:** a global route middleware reads `tool.layout` from tools.json and calls
`setPageLayout()` — so the `layout` key becomes real (G5) and new tools never need
`definePageMeta` boilerplate.

---

## 3. Phase 1.5 — Consistency Punch List  *(small PR, do first)*

Finishes what the migration started. All items are mechanical; no design decisions left.

1. **Fix the width API (G2).** Replace `fluid: Boolean` on `ToolLayout` with
   `size: 'narrow' | 'wide' | 'full'`, **default `wide`**:
   - `narrow` → `max-w-3xl` (QR, and future single-input tools)
   - `wide` → `max-w-6xl` (the default — JSON, API, Markdown, CSS, Notes, …
     stops content stretching absurdly on big monitors)
   - `full` → no constraint (canvas tools: Draw, Kanban, Sheets, Flexbox, JSONGrid)
   Sweep pages: delete every `fluid`, add `size="full"` on the 5 canvas pages +
   `size="narrow"` on `qr.vue`; everything else uses the default.
2. **Re-skin `animation.vue` (G3):** Play/Reset/Copy → `BaseButton` variants
   (`primary`/`secondary`); make the category tabs horizontally scrollable with no
   clipped labels (reuse the pattern in `Tabs.vue` if adequate).
3. **Adopt `ToolLayout` in `convert/[converter].vue` and `convert/settings.vue` (G4)**
   using the `title`/`description` override props.
4. **Consume `tools.json.layout` (G5):** add `middleware/tool-layout.global.ts`
   (~6 lines: look up route path via `useTools().byPath`, `setPageLayout(tool.layout)`),
   delete the 5 `definePageMeta({ layout: 'fullscreen' })` lines.
5. **`pages/index.vue` uses `useTools()`** instead of importing `tools.json` (G6, partial).
6. **Clean `tailwind.config.js` (G10):** drop the ad-hoc `backgroundColor.dark` /
   `textColor.dark` extensions; `surface` tokens already cover it.

**Exit criteria:** zero `fluid` usages; zero raw `bg-blue-*`/`bg-green-*` on
interactive elements under `pages/`; every page (incl. convert sub-pages) renders
`ToolHeader`; `definePageMeta` layout boilerplate gone.

---

## 4. Phase 2 — Ship Dark Mode  *(highest value-per-effort: styles already exist)*

The `dark:` sweep already landed with the migration and is verified working.
What's left is only the activation path (G1):

1. **Pre-hydration script** in `nuxt.config.ts` `app.head.script` (inline, `tagPosition:
   'head'`): read the `dark-theme` localStorage key — note `useLocalStorage` stores the
   boolean as the string `"true"`/`"false"`, and *absent key* must fall back to
   `matchMedia('(prefers-color-scheme: dark)')` — then set `document.documentElement.
   classList` before first paint. This both kills the light-flash **and** replaces the
   never-called `initTheme()`.
2. **Uncomment the toggle** in `NavBar.vue:90–105` (imports are already wired:
   `isDark`/`toggleTheme` at line 262). Wrap in `<ClientOnly>` to avoid a
   hydration mismatch on the sun/moon icon.
3. **Simplify `useTheme.js`:** with the pre-hydration script owning first-paint and
   system-preference fallback, the composable shrinks to `isDark` + `toggleTheme` +
   the localStorage watch; delete `initTheme` and the media-query listener.
4. **Editor special cases:** Monaco/Ace (`code`, `json` viewer) and tldraw (`draw`)
   have their own theme APIs — bind them to `isDark`.
5. **Visual sweep:** walk all 17 tools dark + light; fix stragglers (likely candidates:
   animation preview panel, sheets grid, transcriptor).

**Exit criteria:** toggle visible and persistent; no flash on reload; system
preference respected on first visit; every page usable in dark.

---

## 5. Phase 3 — Discovery, Homepage & Navigation  *(the "good-looking app" phase)*

The homepage is the product's face and is currently its weakest screen (G6).

### 5.1 Homepage redesign (`pages/index.vue`)

Top-to-bottom:

1. **Compact hero**: product name + one-liner ("Free, private, in-browser tools") +
   **on-page search input** reusing `useTools().search()` — search currently exists
   only in the navbar.
2. **Continue where you left off** — recents row (hidden on first visit).
3. **Favorites** — star toggle on each card, persisted; section hidden when empty.
4. **Category sections** — from `useTools().categories()` with `BaseBadge` chips as
   anchor filters. Order: dev, productivity, convert, design, media.
5. Card polish: one hover spec (shadow + 150ms ease-out translate), consistent icon
   treatment — extract the card into `components/tool/ToolCard.vue` so the 404 page
   (Phase 4) and RelatedTools reuse it.

### 5.2 `useToolUsage.ts`

```ts
// localStorage-backed via VueUse
recents: { path, lastUsed }[]   // updated by ToolLayout on mount, capped at 6
favorites: string[]             // toggled from cards + a star in ToolHeader
```

### 5.3 Command palette (`⌘K` / `Ctrl+K`)

Headless UI `Combobox` in a `Dialog`; fuzzy match over `name + keywords + description`;
recents shown when the query is empty; global shortcut via VueUse `useMagicKeys`.
The navbar search input gets a `⌘K` hint chip.

### 5.4 Escape the dead end

`RelatedTools` strip (3–4 same-category `ToolCard`s) rendered by `ToolLayout` below
the tool body — **`default`-layout pages only** (fullscreen canvas tools have no
scroll room; skip them there).

**Exit criteria:** a user can reach any tool in ≤2 interactions from anywhere;
homepage communicates what the product is before scrolling.

---

## 6. Phase 4 — SEO & Page Identity

1. **`useToolMeta.ts`** — called inside `ToolLayout` so every migrated page gets it
   automatically: `useSeoMeta` with title (`{seo.title} · Tools-Set`), description,
   canonical URL from `runtimeConfig.public.baseUrl`, OG/Twitter tags.
   (`tools.json` `seo` entries already exist for all 17 tools — this phase just
   consumes them.)
2. **OG image**: one branded static image in `public/` first (per-tool images later).
3. **`error.vue`** at project root: 404 with search box + popular `ToolCard` grid.
4. **Sitemap**: `server/api/sitemap.xml.get.ts` (or `@nuxtjs/sitemap`) generated from
   `tools.json`; reference from `public/robots.txt`.
5. **Structured data**: `WebApplication` JSON-LD per tool page (emitted by `useToolMeta`).

**Exit criteria:** each tool has unique title/description/canonical/OG (spot-check
`document.title` ≠ "Tools-Set"); 404 recovers users; sitemap submitted.

---

## 7. Phase 5 — Feedback & Polish

| Item | Change |
|------|--------|
| Real loading bar (G8) | Delete `PageLoading.vue`; use Nuxt's `<NuxtLoadingIndicator color="…" />` in `app.vue` (tracks actual page lifecycle) |
| Toast polish | Max-visible cap (3) + pause-dismiss-on-hover; `role="status"` per toast (z-index bug already fixed ✅) |
| `ShareModal.vue` (G9) | Replaces silent copy: shows the generated URL, copy button with confirmation state, QR code of the link (qrcode dep already installed). Used by all tools that call `useShareLink` |
| `useClipboard.ts` (G9) | Wraps `navigator.clipboard` with `document.execCommand('copy')` fallback (non-HTTPS/older browsers); all copy actions route through it |
| Empty states | `BaseEmptyState` (✅ exists, used in `qr.vue`) + "Load example" buttons for JSON Formatter, API Tester, JSONGrid, Transcriptor, Markdown |
| Micro-consistency | One transition spec for hover/focus (150ms ease-out) documented in the tailwind config comment block |

---

## 8. Phase 6 — Accessibility & Mobile Audit

**A11y checklist** (much is already fixed by construction in `Base*`):

- [x] Every `Base*` input has an associated label (auto `id`/`for` via `useId`)
- [ ] Inputs *not* yet on `BaseInput` (search fields in NavBar, canvas tool inline inputs) — sweep
- [ ] Skip-to-content link before NavBar
- [ ] Focus-visible rings on all interactive elements (`Base*` ✅; sweep raw buttons left in canvas pages)
- [ ] Scope/remove the global `::-webkit-scrollbar { display: none }` in `NavBar.vue`
- [ ] Search results keyboard-navigable — Combobox gives this free in ⌘K; retrofit navbar
- [ ] Modal focus trap + Escape (verify `Modal.vue`; consider Headless UI `Dialog`)
- [ ] Kanban: keyboard alternative for drag-and-drop (move-via-menu is acceptable)
- [ ] Contrast pass on gray-on-white text (`text-gray-400` placeholders are borderline)
- [ ] Run `web-design-guidelines` / Lighthouse a11y per page; fix to ≥90

**Mobile**

- [ ] Audit each tool at 375px; simple tools fully usable
- [ ] Canvas tools: friendly "best on desktop" banner where a real mobile layout isn't worth it
- [ ] Mobile nav: full categorized tool list (currently only popular tools), driven by tools.json

---

## 9. Rollout & Verification

- **PR sequence:** Phase 1.5 (small) → Phase 2 (small) → Phase 3 (the big visual PR,
  may split 3.1–3.2 / 3.3–3.4) → Phase 4 → Phase 5 → Phase 6.
- **Verification per phase**: run the app, walk every affected page in light + dark,
  375px + desktop; Lighthouse (SEO + a11y) before/after on `index`, `json`, `kanban`.
- **Regression guard**: tool behavior untouched — verify share links, downloads, and
  localStorage persistence on touched pages.
- Commit `db/links.db` changes separately/never — it's runtime data, not source
  (currently showing as modified in the working tree; consider gitignoring it).

## 10. Non-Goals (this plan)

- No new tools, no backend changes (share API/sqlite stays as-is).
- No component library dependency (no Vuetify/PrimeVue/nuxt-ui migration).
- No PWA/offline yet — natural Phase 7 candidate once the layout system is stable.
- Per-tool generated OG images, usage analytics — later.

---

## Appendix A — File Change Map (remaining work)

| File | Action | Phase |
|------|--------|-------|
| `components/tool/ToolLayout.vue` | `fluid` → `size` prop; mount-hook for recents; render `RelatedTools`; call `useToolMeta` | 1.5 / 3 / 4 |
| `pages/tools/*.vue` | drop `fluid`, add `size` where non-default | 1.5 |
| `pages/tools/animation.vue` | Base* buttons, scrollable tabs | 1.5 |
| `pages/tools/convert/{[converter],settings}.vue` | adopt ToolLayout w/ overrides | 1.5 |
| `middleware/tool-layout.global.ts` (new) | `setPageLayout` from tools.json | 1.5 |
| `nuxt.config.ts` | pre-hydration theme script | 2 |
| `components/NavBar.vue` | uncomment toggle in `<ClientOnly>`; scope scrollbar CSS | 2 / 6 |
| `composables/useTheme.js` | simplify (drop `initTheme`, media listener) | 2 |
| `pages/index.vue` | hero + search + recents + favorites + categories | 3 |
| `components/tool/ToolCard.vue` (new) | shared card for home/404/related | 3 |
| `composables/useToolUsage.ts` (new) | favorites + recents | 3 |
| `components/palette/CommandPalette.vue` (new) | ⌘K | 3 |
| `composables/useToolMeta.ts` (new) | SEO from tools.json | 4 |
| `error.vue` (new) | 404 page | 4 |
| `server/api/sitemap.xml.get.ts` (new) | sitemap | 4 |
| `components/ui/PageLoading.vue` | delete → `NuxtLoadingIndicator` | 5 |
| `components/tool/ShareModal.vue`, `composables/useClipboard.ts` (new) | share UX | 5 |
