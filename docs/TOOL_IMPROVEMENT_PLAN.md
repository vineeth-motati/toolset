# Tools-Set — Tool Functionality Improvement Plan

> Status: **v1 — analysis complete, nothing implemented**
> Branch: `ui/phase-1.5-consistency` · Date: 2026-07-14
>
> Companion to `UI_UX_IMPROVEMENT_PLAN.md`. That plan covers the UI layer;
> this one covers **what each tool actually does** — per-tool limitations,
> confirmed bugs (file:line verified), improvements, and expansions, followed
> by a phased execution plan.
>
> Method: full code read of all 17 tool pages + their components, composables,
> server endpoints, and `package.json`.

---

## 0. Executive Summary

The 17 tools fall into three buckets:

| Bucket | Tools | Verdict |
|---|---|---|
| **Solid core, missing depth** | Kanban, Markdown, Flexbox, Animation, JSONGrid, Draw, Convert, Transcriptor | Real functionality, but each stops 1–2 features short of being genuinely useful |
| **Thin veneer** | QR, Image Tools, CSS Converter, JSON Formatter, Code Editor, Notes, Palette, Sheets, API | Name/description over-promises; core is a single default-settings operation or has correctness bugs |
| **Shared infra** | Share system, tool registry, deps | Share links are **ephemeral in production**; secrets leak into share payloads; multiple undeclared/unused dependencies |

**Worst offenders (name vs reality):**
- **Image Tools** (plural) = one hardcoded compress preset (1MB/1920px), wrong file extension on download, silent failures. The user's complaint is fully justified.
- **CSS Unit Converter** = `%↔vh↔vw` conversions literally stubbed to `1` (wrong answers), hardcoded 16px base.
- **Code Editor** promises "many languages" (keyword: "monaco") = 3 fixed HTML/CSS/JS panes on Ace; Monaco is installed but unused.
- **Sheets** promises formulas = one-shot arithmetic, **no recalculation** when referenced cells change, no ranges/functions.
- **API client** = no CORS proxy (most external APIs fail), and **shares auth tokens/passwords in plaintext** via share links.

**Data-corruption / correctness bugs found (fix first):**
1. `pages/tools/jsongrid.vue:716` — editing a cell while a search filter is active writes to the **wrong row** (filtered index used as source index).
2. `pages/tools/convert/[converter].vue` — conversion options (OCR language, bitrate, etc.) are **never sent to the API**: `paramValues` is built but never `provide()`d; `BaseConverter.vue:414` `inject`s and always gets `{}`.
3. `pages/tools/palette.vue:239-254` — "Complementary" scheme computes the complement then **never uses it**; returns a monochromatic ramp.
4. `pages/tools/image.vue:111` — compressed PNG downloads as `.jpg` (library preserves source MIME; extension hardcoded).
5. `pages/tools/sheets.vue:172` — stray `debugger;` in `importFile`; halts app when devtools open.
6. `pages/tools/api.vue:377` — share payload includes `auth.token/username/password` in plaintext, stored world-readable in SQLite.
7. `server/utils/db.js:5-24` — production copies SQLite to `/tmp` → **all share links silently vanish** on cold start / between serverless instances.
8. `pages/tools/css.vue:137-160` — `%/vh/vw` cross-rates stubbed to `1`; converter returns wrong numbers.

---

## 1. Cross-Cutting Issues (affect every tool)

### 1.1 Share system — broken in production
- **Ephemeral storage**: `server/utils/db.js` copies `db/links.db` to `/tmp` in prod. Vercel/serverless `/tmp` is per-instance + wiped on cold start. Links die silently.
- **No expiry, no size cap, no revoke**; `Access-Control-Allow-Origin: *` on both endpoints.
- **Destructive load**: opening a `?share=` link **overwrites local data with no confirmation** (`kanban.vue:93-95`, `sheets.vue:310-313`, others).
- **No payload schema/versioning**: each tool wraps its own key (`{css:…}`, `{qrCode:…}`, raw object); a link opened on the wrong tool no-ops silently.
- **Base URL bug**: `utils/baseUrl.ts:5` checks `config.public.baseUrl` (defaults to `https://tools-set.vercel.app`) **before** `window.location` → dev/self-hosted share links point at prod; `plugins/axios.js` POSTs to prod from dev.
- Not wired at all: **Image Tools**, **Convert** (all 69 sub-converters).

### 1.2 Dependency hygiene
- **Used but undeclared**: `uuid` (`flexbox.vue:562`), `react` + `react-dom` (`TldrawWrapper.vue:48-52`) — survive only via transitive hoisting; a clean `npm ci` or tldraw bump can break both tools.
- **Declared but unused**: `monaco-editor` + `@monaco-editor/loader` (dead ~weight; Code Editor uses Ace), `sharp` (never imported), `express`/`cors` (legacy `server/server.mjs`), `particles.js`, `prismjs` (highlight.js used instead).
- **4 syntax-highlight stacks installed** (monaco, ace, prismjs, highlight.js) — pick one strategy.

### 1.3 Dead code / scaffolding rot
- `prisma/` (no schema, empty migration), `src/main/java/...` (Java scaffold!), `backend/`, `lib/`, `scripts/` — all empty/dead.
- 0-byte components: `components/flexbox/Flexbox{ContainerControls,DefaultsControls,ItemEditor}.vue`; unused `FlexboxPreview.vue`.
- Dead server endpoint: `server/api/youtube-transcript.get.js` (never called; contains the *only* typed error handling — the live endpoint has none).
- Dead env vars: `CONVERSION_TOOLS_API_TOKEN`, `DATABASE_URL`, `DB_PATH`. Dead file: `server/server.mjs`, `.bolt/config.json`.
- Stray debug: `sheets.vue:172` `debugger;`, `animation.vue:735` `console.log`, `[converter].vue:169,175,186` `console.log`s.

### 1.4 `marked` v12 regression (2 tools)
`marked.setOptions({ highlight })` was removed in marked v5; project pins v12. The option is dead in `notes.vue:79-86` **and** `components/markdown/Preview.vue:23-28`. Markdown tool works only because of a separate `hljs.highlightElement` pass; Notes has no fallback → **code blocks never highlighted in Notes**. Fix: `marked-highlight` package. Also: `notes.vue:72` imports SSR-unsafe `dompurify` (Markdown correctly uses `isomorphic-dompurify`).

### 1.5 Licensing
`draw.vue:111-113` hides the tldraw v3 watermark via CSS (`.tl-watermark_SEE-LICENSE{display:none}`). tldraw's license requires the watermark or a purchased key. Buy a key or restore the watermark.

### 1.6 Registry gap
The 69 Convert sub-converters exist only in `config/converters.js` — invisible to `useTools()` search and the ⌘K palette.

---

## 2. Per-Tool Analysis

Format: **Now** → **Bugs** (verified, file:line) → **Gaps** → **Plan** (P1 = do first).

### 2.1 Kanban Board — `pages/tools/kanban.vue`
- **Now**: 4 hardcoded columns, drag-drop via vuedraggable, task = `{text}` only, modal add/edit.
- **Bugs**: tasks created **without `id`** but `item-key="id"` (`:136-138` vs `:18-19`) → every key `undefined`, drag/render glitches with duplicate text. Edit/delete rely on object identity (`:114-116`, `:132-134`). Shared load trusts payload shape blindly.
- **Gaps**: no custom/multiple columns, no boards, no card fields (description/labels/due dates/checklists), no search/filter, no export, no undo, awkward mobile drag.
- **Plan**:
  - P1: stable `nanoid` ids; card model `{id,title,description,labels[],dueDate,checklist[]}`; editable/add/reorder columns.
  - P2: multiple boards + switcher; card detail modal; search/filter; column counts + WIP limits; JSON export/import.
  - P3: templates, calendar view, activity log; live-collab via upgraded share backend.

### 2.2 Notes — `pages/tools/notes.vue`
- **Now**: card grid, title+textarea, marked preview, drag reorder.
- **Bugs**: dead `highlight` option (§1.4); SSR-unsafe `dompurify` import (`:72`); `id: Date.now()` collisions (`:106`); `renderMarkdown` re-parses on every render, unmemoized (`:42`).
- **Gaps**: no search, tags, folders, pinning, export; preview locked to `h-32`; heavy overlap with Markdown Editor (two markdown note tools, different storage keys).
- **Plan**:
  - P1: fix highlight + isomorphic-dompurify + nanoid ids; full-text search; pin + tags.
  - P2: **decide product split** — Notes = quick cards, Markdown = long-form docs — or merge them. Export MD; `updatedAt`; sort.
  - P3: backlinks/graph, templates, daily notes.

### 2.3 Code Editor — `pages/tools/code.vue`
- **Now**: 3 fixed Ace panes (HTML/CSS/JS) + iframe preview, manual Run.
- **Bugs**: `sandbox="allow-scripts allow-same-origin"` (`:71`) — the unsafe combo, framed doc can escape sandbox; user JS containing `</script>` breaks out of injection (`:162-177`); runtime errors invisible.
- **Gaps**: not "many languages"; no console panel, no auto-run, no CDN packages, no export/format, Monaco installed but unused.
- **Plan**:
  - P1: fix sandbox (drop `allow-same-origin`, use `postMessage`); console panel capturing `console.*` + errors; auto-run toggle (debounced); escape user JS properly.
  - P2: per-pane language dropdown on Monaco (already a dep — or drop Monaco and stay Ace, but then fix the keyword/description); TS/JSX via esbuild-wasm; CDN package manager; export `.html`.
  - P3: multi-file projects, framework playgrounds, named snippets.

### 2.4 JSON Formatter — `pages/tools/json.vue`
- **Now**: textarea + JSON5 tolerant parse, format/minify/paste/copy, shallow tree viewer, load from file/URL.
- **Bugs**: tree is only ~2 levels deep — `parseObject` (`:331-353`) stringifies children, never recurses; expand state mutates non-reactive computed output (`:355-358`) and resets on any edit; invalid JSON → console error only, no inline message (`:322-326`); URL load uses raw `fetch().json()` — CORS-bound + skips JSON5 (`:246-249`).
- **Gaps**: no sort-keys, no JSON↔YAML/CSV/XML, no JSONPath/jq, no schema validation, no diff, no line numbers, no export.
- **Plan**:
  - P1: inline validation with line/column; fully recursive collapsible tree (virtualized); deep search.
  - P2: sort keys, JSON↔YAML/CSV conversion, JSONPath query box, download; CodeMirror/Monaco pane for line numbers + folding.
  - P3: two-pane diff, JSON→TypeScript types, schema inference. (Overlaps JSONGrid — consider one "JSON Studio" with tabs.)

### 2.5 JSONGrid — `pages/tools/jsongrid.vue`
- **Now**: Ace editor + editable grid, nested expand, deep search, cell→line highlight. Most capable dev tool in the app.
- **Bugs**: **filtered edits write to wrong row** (`:111` renders `filteredGridData` but `:716` indexes the unfiltered array) — data corruption; blank cell edit coerces to `0` (`:711,740`; `NestedObjectView.vue:341`), large ints lose precision; heuristic line-mapping (`:925-1184`) breaks on minified JSON; `isValidJson` computed mutates state (`:368`); `JSON.parse` re-runs per reactive read; every edit resets editor cursor + collapses expansion (`renderKey` hack `:349,866`); `useJsonGrid.js` mostly dead (only `validateJson` used).
- **Plan**:
  - P1: fix filtered-index write; fix `0`-coercion; delete or use dead composable fns.
  - P2: replace line heuristics with `jsonc-parser` AST offsets; patch-don't-rewrite editing model (keep caret); CSV/XLSX export (`papaparse`/`exceljs` already installed); add/delete rows/columns; column sort (fn exists, unwired).
  - P3: virtualization for huge arrays, undo/redo, CSV import.

### 2.6 API Client — `pages/tools/api.vue`
- **Now**: URL+method+headers(JSON textarea)+body, auth (Bearer/Basic/custom), cURL import, response status/headers/body.
- **Bugs**: **no CORS proxy** — browser-direct axios, most third-party APIs fail with opaque "Network Error"; **secrets shared + persisted in plaintext** (`:377`, localStorage `api`); body always `JSON.parse`d regardless of content type (`:337-341`); HTML responses rendered `v-html` **unsanitized** (`:135`) — XSS; naive cURL parser (no single quotes, `--header`, `--data-raw`, `-u`, multi `-d`) (`:228-266`); persisted `loading:true` can permanently disable Send (`:105,207`).
- **Plan**:
  - P1: Nitro proxy route (forward method/headers/body, return raw response + timing); strip secrets from share + stop persisting `loading`/`response`; DOMPurify the HTML preview.
  - P2: history + saved collections; key-value editors for params/headers; response time/size + syntax highlight; all body types (form-data, urlencoded, raw); robust cURL parse; timeout/cancel.
  - P3: environments/variables, OpenAPI import, code-gen snippets, GraphQL.

### 2.7 QR Generator — `pages/tools/qr.vue`
- **Now**: text→PNG data URL on keystroke, download, share. Library defaults only.
- **Bugs**: unhandled promise rejection on capacity overflow (`:61`) — no try/catch, no feedback, stale QR remains; no debounce; no persistence (plain ref).
- **Gaps**: no colors/size/margin/EC level, no logo, no SVG export, no structured types (WiFi/vCard/email/SMS), no decoder.
- **Plan**:
  - P1: options panel (size, margin, fg/bg, EC level — all native `qrcode` opts); SVG + PNG export; try/catch + toast; debounce; persist input.
  - P2: structured builders (URL/WiFi/vCard/SMS/geo); logo overlay (auto EC=H); copy-image.
  - P3: decoder tab (BarcodeDetector/jsQR); dynamic QR (editable redirect via existing share store); bulk CSV→ZIP.

### 2.8 Image Tools — `pages/tools/image.vue` ⚠ user-flagged
- **Now**: ONE operation — compress to hardcoded `{maxSizeMB:1, maxWidthOrHeight:1920}`. Name plural, keyword "resize" — both false.
- **Bugs**: downloads any format as `.jpg` (`:111`) while bytes keep source MIME → mismatched file; errors `console.error` only (`:103-105`); `URL.createObjectURL` never revoked (`:91,102`) — leak; `formatSize` breaks ≥1GB (`:81`); can inflate already-optimized images with no "keep smaller" guard; no share, no persistence.
- **Plan — rebuild as an actual suite (flagship item)**:
  - P1: quality slider + target-size/dimension controls; explicit **resize** (px/%, aspect lock); **format convert** (PNG/JPEG/WebP via canvas); correct extension from output MIME; toasts; revoke URLs; keep-smaller guard.
  - P2: crop + rotate/flip; EXIF strip toggle; batch multi-file → ZIP; before/after slider zoom (squoosh-style).
  - P3: base64/data-URI tool, favicon-set generator, SVG optimizer, watermark. Optionally route AVIF/heavy encodes through server `sharp` (installed, unused) — or drop `sharp`.

### 2.9 Markdown Editor — `pages/tools/markdown.vue`
- **Now**: split textarea+preview (hljs works here), 6 toolbar actions, saved notes list, nanoid ids, createdAt/updatedAt.
- **Bugs**: save is silent — no toast (`:117-128`); `grid-cols-2` never stacks → broken on mobile (`:37`); shared note loaded but not persisted — lost on nav (`:180-186`); selection restore ignores suffix (`:151-155`); global `marked.setOptions` collision with notes.vue (§1.4).
- **Gaps**: no export (`.md`/HTML/PDF — jspdf installed!), no scroll sync, no Ctrl+B/I, Tab leaves textarea, no autosave, no GFM tables/task lists, no word count.
- **Plan**:
  - P1: export `.md`/HTML/PDF; autosave + saved indicator + toast; responsive stacking; keyboard shortcuts + Tab indent.
  - P2: scroll sync; toolbar additions (table, image, task list, strikethrough, blockquote); GFM; word count; search saved notes.
  - P3: Mermaid + KaTeX; TOC; slide mode. (Coordinate with Notes consolidation, §2.2.)

### 2.10 CSS Unit Converter — `pages/tools/css.vue`
- **Now**: 7 units, bidirectional dropdowns, 6 presets.
- **Bugs**: `%↔vh↔vw` rates stubbed to `1` — **returns wrong answers** (`:137-160`); matrix not invertible (`px→vh = 100/937` but `vh→px = 9.37`); base font hardcoded 16px; `em` treated as `rem`; viewport dims hardcoded (937×1920).
- **Plan**:
  - P1: canonical model (everything → px → target) with **configurable base font, parent font (em), viewport w/h**; disable pairs that are undefined without context instead of faking them.
  - P2: one-value→all-units table; copy result; more units (`ch,in,cm,mm,pt,pc`).
  - P3: `clamp()` fluid-typography generator (the modern draw for this tool category).

### 2.11 Animations — `pages/tools/animation.vue`
- **Now**: genuinely rich — keyframe timeline (dblclick add, % editor), 11 properties, 127 presets/10 categories, live preview, CSS copy.
- **Bugs**: deep watcher `console.log`s + restarts animation on **every keystroke** (`:732-739`); injected `<style>` never cleaned up — stale global `@keyframes` leak across navigation (`:662-673`); preset timing strings (`steps(40,end)`, custom beziers) don't match the `<select>` options → UI state diverges from output (`:429-438` vs `useAnimationPresets.ts`); `element.style.animation = null` (`:626`).
- **Plan**:
  - P1: remove log/auto-replay; scope + cleanup style tag; make timing select handle arbitrary strings (show "custom" + reveal bezier editor).
  - P2: visual cubic-bezier curve editor; delay + fill-mode controls; preview target switcher (box/text/SVG — text & SVG presets currently render wrong); download `.css`.
  - P3: Web Animations API JS export, Tailwind keyframes export, timeline scrubber, per-keyframe easing; scroll-driven animations.

### 2.12 Color Palette — `pages/tools/palette.vue`
- **Now**: 7 scheme types via values.js + HSL rotation, click-to-copy hex.
- **Bugs**: **complementary scheme broken** — complement computed then unused, returns mono ramp (`:239-254`); generic "Invalid color value" catch masks errors (`:359-361`); persisted `colors` always overwritten on mount (`:82,388`).
- **Gaps**: no contrast checker, no export (CSS vars/Tailwind/SCSS/JSON/PNG), no lock/pin, no per-swatch edit, hex-only display, no image→palette.
- **Plan**:
  - P1: fix complementary; copy-all + export CSS variables / Tailwind config / SCSS / JSON.
  - P2: WCAG contrast grid + text preview; lock/pin + regenerate; RGB/HSL readouts; per-color 50–950 shade ramps.
  - P3: image→palette extraction; color-blindness simulation; named/shareable palettes.

### 2.13 Draw — `pages/tools/draw.vue` + `TldrawWrapper.vue`
- **Now**: full tldraw v3 canvas (React root inside Vue), theme sync, snapshot share.
- **Bugs**: **three competing persistence layers** (tldraw IndexedDB via `storagePrefix`, manual `localStorage.getItem('draw')`, Vue `useLocalStorage('draw')`) fighting over one concept; full snapshot serialized to localStorage **on every stroke** (`draw.vue:53-58`) — jank + 5MB quota; watermark hidden by CSS — license issue (§1.5); react/react-dom undeclared (§1.2).
- **Plan**:
  - P1: single persistence path (tldraw's own IndexedDB); debounced share-snapshot only on demand; declare deps; resolve watermark/license.
  - P2: explicit export menu (PNG/SVG, PDF via jspdf); document library (multiple named drawings + thumbnails).
  - P3: `@tldraw/sync` multiplayer rooms; read-only embed links; templates.

### 2.14 Sheets — `pages/tools/sheets.vue` + `components/sheets/`
- **Now**: multi-sheet 100×26 grid, contenteditable cells, `=A1+B2` arithmetic via mathjs, font/align/bold formatting, CSV+XLSX import/export.
- **Bugs**: `debugger;` (`:172`); **no recalculation** — formulas evaluate once at entry, referenced-cell changes leave stale results (`:128-149`); only single-cell refs — no `SUM(A1:A10)`, no functions (`useSheetsFormulas.ts:11`); formula bar column labels break past Z (`FormulaBar.vue:32-33`); every click enters edit mode, select-only path is dead code (`:111-126`); drag-selection overlay computed + rendered but drives nothing (`Grid.vue:53-58,148-171`); empty cells coerce to `0`; XLSX import renders dates/richtext as `[object Object]` (`:215`); CSV import breaks grid rectangularity (`:179`); grid/formula bar have no dark-mode styles.
- **Plan**:
  - P1: remove `debugger`; select-vs-edit click model; fix column labels; dark-mode grid.
  - P2: **real formula engine — adopt HyperFormula** (dependency graph, recalc, 400+ functions, ranges) instead of growing mathjs; arrow/Tab navigation; row/col insert/delete/resize.
  - P3: range copy/paste + fill handle, undo/redo, number/date formats, freeze panes (state fields already exist), sort/filter; charts later.
  - Honest alternative: if HyperFormula is too big a lift, rename capability ("simple grid with arithmetic") — current "formulas" claim is misleading.

### 2.15 YT-Transcriptor — `pages/tools/transcriptor.vue` + server endpoints
- **Now**: URL→transcript, embedded player with click-to-seek + active-segment highlight, timestamps toggle, TXT/PDF export, localStorage + share. Most complete media tool — but fragile.
- **Bugs**: video details are **fabricated** — oEmbed only; `publishedAt: new Date()` shows *today* as publish date, views "N/A" (`server/api/youtube-details.js:14-32`); "YouTube API fallback" is dead — `parseCaptionData` stub returns `[]`, fallback re-calls the same failed lib (`youtube-transcript-env.get.js:238-277`); frontend branches on `errorType` the live endpoint never sets (`transcriptor.vue:392-417`) → users always get generic errors; unused duplicate endpoint `youtube-transcript.get.js`; scraping lib is **blocked from server IPs (Vercel)** — tool often dead in production (acknowledged in code comments `:76-89`); PDF garbles non-Latin scripts.
- **Plan**:
  - P1: fix transport — real HTTP status + `errorType`, delete dead endpoint; drop fake metadata fields or use YouTube Data API `videos.list`; make deploy-viability explicit (feature-flag if blocked).
  - P2: replace/augment transcript fetch with a maintained approach (timedtext parsing) that survives server-IP blocking; language picker; SRT/VTT export; in-transcript search.
  - P3: AI summary/chapters/translation (differentiator); playlist batch; Whisper upload for arbitrary audio.

### 2.16 Convert — `pages/tools/convert/*` (69 converters, 11 categories)
- **Now**: uniform wrapper around paid third-party `conversiontools.io` API; user must bring own API key (localStorage); upload→task→poll→download; URL mode; per-converter options UI; settings + debugger pages.
- **Bugs**: **options never reach the API** — missing `provide('paramValues')` (§0 bug 2); `html-to-pdf` and `website-to-pdf` share `apiType: convert.website_to_pdf` — file-upload variant mismapped (`converters.js:256,660`); 100MB limit display-only, never enforced (`converterApi.js:10`); progress UI expects statuses the poller never emits (`BaseConverter.vue:501-510`); large duplicate extension fallback map (`converterApi.js:382-450`); dead `CONVERSION_TOOLS_API_TOKEN` env; leftover console.logs.
- **Plan**:
  - P1: fix provide/inject; give html-to-pdf its own apiType; enforce size limit pre-upload.
  - P2: **client-side free tier** — JSON/CSV/YAML/XML, image re-encode (canvas), Excel (`exceljs`), CSV (`papaparse`) run locally at zero cost; reserve the paid API for video/office/OCR/ebook. Register sub-converters in the searchable registry (§1.6).
  - P3: server-side proxy with app-owned token (option), batch queue, conversion history, cloud-storage import.

---

## 3. Execution Plan (phased)

Each phase independently shippable. Effort: S <½day · M 1–2d · L 3d+.

### Phase 0 — Correctness & hygiene (no design decisions, do immediately)
| # | Item | Effort |
|---|---|---|
| 0.1 | JSONGrid filtered-index write bug + `0`-coercion | S |
| 0.2 | Convert `provide('paramValues')` + html-to-pdf apiType + size-limit enforcement | S |
| 0.3 | Palette complementary fix | S |
| 0.4 | Image download extension from output MIME + error toasts + revoke object URLs | S |
| 0.5 | Remove `debugger;`, `console.log`s; animation watcher log/auto-replay; style-tag cleanup | S |
| 0.6 | Kanban/Notes stable `nanoid` ids | S |
| 0.7 | `marked-highlight` migration + isomorphic-dompurify in Notes | S |
| 0.8 | API tool: strip secrets from share, stop persisting `loading`/`response`, DOMPurify HTML preview | S |
| 0.9 | Code editor: fix iframe sandbox + `</script>` escaping | S |
| 0.10 | CSS converter: remove/gate the stubbed-to-1 conversions (stop returning wrong numbers) | S |
| 0.11 | Declare `react`, `react-dom`; replace `uuid` with `nanoid`; remove unused deps (monaco?, sharp?, express, cors, prismjs, particles.js — decide keep-list first) | M |
| 0.12 | Delete dead dirs/files (`prisma/`, `src/`, `backend/`, `lib/`, `scripts/`, empty flexbox stubs, `server/server.mjs`, dead endpoint, dead env vars, `.bolt/`) | S |
| 0.13 | Resolve tldraw watermark/license | S |

### Phase 1 — Shared infrastructure
| # | Item | Effort |
|---|---|---|
| 1.1 | **Durable share store** (Turso/libSQL or Vercel KV/Postgres) + expiry + payload size cap + schema `{tool, version, data}` | M |
| 1.2 | Confirm-before-overwrite on shared-link load (all tools) + validate payload shape | S |
| 1.3 | Fix `getBaseUrl` precedence (window.location first in browser) | S |
| 1.4 | Shared `useDownload` util (blob→file) — unlocks export everywhere | S |
| 1.5 | Register Convert sub-converters in search/⌘K index | S |
| 1.6 | Transcriptor transport fix (status codes, errorType, delete dead endpoint, drop fake metadata) | M |

### Phase 2 — Quick wins (small feature, big perceived value; one PR per tool)
| Tool | Win | Effort |
|---|---|---|
| QR | Options panel (size/colors/EC/margin) + SVG export + error handling + persistence | M |
| Palette | Copy-all + CSS-vars/Tailwind/SCSS/JSON export + contrast checker | M |
| Markdown | Export .md/HTML/PDF + autosave/toast + mobile stacking + shortcuts | M |
| JSON Formatter | Recursive tree + inline line/col errors + sort-keys + download | M |
| CSS Converter | Canonical px-based model + configurable base font/viewport + all-units table | M |
| Code Editor | Console output panel + auto-run toggle | M |
| Sheets | Select-vs-edit click, keyboard nav, column-label fix, dark grid | M |
| Kanban | Card fields (desc/labels/due) + editable columns + search | M |
| Animation | Timing-select fix + bezier curve editor + .css download | M |
| Flexbox | Expose padding/minHeight/bgColor controls + Tailwind output + decimal DimensionInput + delete dead code | M |
| JSONGrid | CSV/XLSX export + row/col add/delete + wire column sort | M |
| Notes | Search + pin + tags | M |

### Phase 3 — Flagship rebuilds (ranked by value; pick order deliberately)
| # | Item | Effort |
|---|---|---|
| 3.1 | **Image Tools → real suite**: resize/crop/convert/quality/batch/EXIF (user-flagged; worst name-vs-reality gap) | L |
| 3.2 | **API client**: Nitro CORS proxy + history + collections + param/header editors + body types | L |
| 3.3 | **Sheets**: HyperFormula engine (recalc, ranges, functions) + range ops + undo | L |
| 3.4 | **Convert**: client-side free tier for data/image formats | L |
| 3.5 | **Code Editor**: Monaco multi-language + CDN packages (or commit to Ace and fix metadata) | L |
| 3.6 | **JSONGrid**: AST-based line mapping (`jsonc-parser`) + caret-preserving edit model | L |
| 3.7 | **Transcriptor**: deploy-proof transcript fetch + language picker + SRT/VTT | L |

### Phase 4 — Expansion & consolidation (product decisions first)
- **Notes vs Markdown**: merge or differentiate (quick cards vs long-form docs). Decide before investing in both.
- **JSON Formatter vs JSONGrid**: converge toward one "JSON Studio" (text/tree/grid tabs) — currently split across two half-tools.
- QR decoder + dynamic QR; Draw multiplayer (`@tldraw/sync`); Kanban boards/templates; Palette image-extraction; Transcriptor AI summaries; Flexbox+Grid unified layout builder; `clamp()` generator.
- New-tool candidates that fit existing deps: Base64 studio, JWT decoder, regex tester, diff checker, favicon generator, lorem ipsum, hash generator.

---

## 4. Suggested sequencing

1. **Phase 0 entirely** (1–2 days) — pure correctness; every item small.
2. **Phase 1.1–1.3** — share system is the app's signature feature and is broken in prod.
3. **Phase 2 in value order**: QR → Palette → Markdown → JSON → CSS (cheapest reputation wins), then rest.
4. **One Phase 3 flagship at a time**, starting with **3.1 Image Tools** (the user-flagged embarrassment).
5. Phase 4 decisions (merges) before any further investment in overlapping tools.
