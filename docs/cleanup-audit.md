# Cleanup Audit — Master To-Do List

**Created:** 2026-02-10
**Branch:** `chore/standards-audit`
**Status:** In progress

Comprehensive audit of codebase against standards docs, actual code quality, and cross-platform readiness. Items are grouped by category and prioritized within each section. Check off items as completed.

---

## Legend

- `[ ]` — Not started
- `[~]` — In progress
- `[x]` — Done
- **P1** — High priority (blocks features or breaks UX)
- **P2** — Medium priority (standards compliance, code quality)
- **P3** — Low priority (nice-to-have, future-proofing)

---

## 1. Responsive Layout & Cross-Platform (PWA)

Target: Web-first responsive design, installable as PWA. Electron/Capacitor deferred.

### P1 — Layout Fixes

- [x] **Collapsible sidebar for mobile** — `app-shell.tsx` uses fixed `w-64` (256px). On phone-width screens the main content is nearly unusable. Needs hamburger menu or drawer pattern with breakpoint toggle (e.g., `lg:` shows sidebar, below `lg:` uses overlay drawer).
- [x] **Responsive ability score grid** — `character-detail-page.tsx:97` uses `grid-cols-6` with no responsive variant. On phones, 6 columns are unreadable. Use `grid-cols-3 sm:grid-cols-6` (2 rows of 3 on mobile).
- [x] **Responsive new-character form** — `new-character-page.tsx` ability score inputs also use `grid-cols-6`. Same fix needed.
- [x] **Page padding responsive** — Most pages use `p-8`. Should be `p-4 md:p-8` for mobile breathing room.
- [x] **Touch targets** — Icon buttons (delete, edit) are small. Minimum 44x44px tap targets per WCAG. Add padding or min-w/min-h.

### P2 — PWA Setup

- [ ] **Add web app manifest** — No `manifest.json` exists. Need name, icons, theme color, display: standalone, start_url.
- [x] **App title** — Changed to "RPG Platform".
- [ ] **App icons** — Currently using default `vite.svg`. Need proper icons (192px, 512px).
- [ ] **Viewport meta** — Exists and is correct (`width=device-width, initial-scale=1.0`). No action needed.
- [ ] **Service worker** — Add via `vite-plugin-pwa` for offline caching of static assets. Not full offline support yet, just asset caching.
- [ ] **Meta tags** — Add `theme-color`, `apple-mobile-web-app-capable`, `description` meta tags.

### P3 — Future Platform Prep

- [ ] **Document platform strategy** — Add a `docs/reference/cross-platform.md` noting the PWA-first approach and future Electron/Capacitor considerations.
- [ ] **Avoid web-only APIs** — Audit for any browser-only APIs that won't work in Capacitor (currently none found, but document the rule).

---

## 2. Theming & Styling

### P1 — Theme Token System

- [x] **Define CSS custom properties** — Semantic tokens defined in `index.css` using Tailwind v4 `@theme` directive.
- [x] **Extend Tailwind config** — Mapped custom properties to Tailwind utilities (`bg-surface`, `text-accent`, etc.) via `@theme`.
- [x] **Migrate existing components** — Replaced hardcoded color classes with token-based classes across all files.

### P2 — Theme Infrastructure

- [ ] **Theme provider** — `src/theme/` directory exists in project structure docs but is empty/missing. Create the theme provider that handles DB -> localStorage -> default cascade.
- [ ] **Dark/light mode** — Currently dark-only. Theme tokens make adding light mode straightforward later. No action now, but the token system enables it.

---

## 3. Frontend Code Quality

### P1 — Bug Fixes

- [x] **Fix state mutation in render** — `ruleset-detail-page.tsx` `setActiveType()` wrapped in `useEffect`.
- [x] **Fix state mutation in render** — `new-campaign-page.tsx` `setRulesetId()` wrapped in `useEffect`.
- [x] **Fix N+1 character fetching** — Added `GET /api/characters` endpoint; `characters-page.tsx` uses single API call.
- [x] **Fix useApiCache bugs** — Rewritten with TTL (5 min), bounded cache (100 entries), dev-mode warning for unnamed fetchers, proper `enabled` guard.

### P2 — Standards Compliance

- [x] **Add error boundaries** — `ErrorBoundary` component wrapping `AppShell` in `App.tsx`.
- [x] **Form validation with React Hook Form + Zod** — Both `new-campaign-page.tsx` and `new-character-page.tsx` migrated to RHF + Zod.
- [x] **Tighten TypeScript types** — Added `ClassData`, `EquipmentItem`, `SpellEntry`, `CampaignSettings`, `EntityData` types. Kept `EntityData` as `Record<string, unknown>` (intentional — schema-driven rendering). Removed type casts in consuming code.
- [x] **Add ARIA labels** — Added `aria-label` to pagination and icon buttons.

### P3 — Polish

- [x] **Loading states** — Created `Spinner` component, replaced all "Loading..." text across pages.
- [x] **Empty states** — All list pages now have empty state treatment with icons.
- [x] **Confirm dialogs** — Created `ConfirmDialog` modal component, replaced browser `confirm()` calls.

---

## 4. Backend Code Quality

### P1 — Service Layer Refactor

- [x] **Extract campaign service** — `services/campaign_service.py` with full CRUD.
- [x] **Extract character service** — `services/character_service.py` with full CRUD + cross-campaign listing.
- [x] **Extract overlay service** — `services/overlay_service.py` with full CRUD.
- [x] **Extract auth service** — `services/auth_service.py` with login/refresh logic + specific JWT exception handling.
- [x] **Extract ruleset service** — `services/ruleset_service.py` with entity listing and overlay merging.
- [x] **Add all-characters endpoint** — `GET /api/characters` returns all characters with campaign names.

### P2 — Data Integrity

- [x] **Add UserOverlay unique constraint** — Added `UNIQUE(user_id, ruleset_id, entity_type, source_key, campaign_id)` via Alembic migration.
- [x] **Add User timestamps** — Added `created_at`, `updated_at` to User model via migration.
- [x] **Add Ruleset timestamps** — Added `created_at`, `updated_at` to Ruleset model via migration.
- [ ] **Validate JSON payloads** — No validation on `core_data`, `class_data`, `equipment`, `spells` JSON blobs. Add Pydantic or Marshmallow schemas for request validation, at least on write endpoints.
- [x] **Consistent return types** — Standardized delete handlers to `tuple[Response, int]`.

### P3 — Code Cleanup

- [x] **Specific exception handling** — `auth_service.py` catches `jwt.ExpiredSignatureError` and `jwt.InvalidTokenError` specifically.
- [ ] **Model `to_dict()` return types** — Currently typed as `-> dict`. Use TypedDict for better IDE support.
- [x] **Seed error handling** — `open5e.py` catches `requests.RequestException` instead of bare `Exception`.

---

## 5. Standards & Documentation

### P2 — Standards Gaps

- [ ] **Add responsive/mobile standards** — No mention of responsive design, breakpoints, or mobile-first in `docs/standards/react.md`. Add a section covering: mobile-first approach, breakpoint conventions, touch target sizes, sidebar behavior.
- [ ] **Add cross-platform standards** — Document PWA requirements, platform-agnostic API usage, and the decision to avoid platform-specific browser APIs.
- [ ] **Update architecture.md** — Add responsive layout section. The schema-driven UI and overlay system are well-documented, but layout architecture is missing.
- [ ] **Document theme token system** — Once implemented, add to `docs/standards/react.md` the specific token names and usage patterns.

### P3 — Doc Refinements

- [ ] **Flasgger version note** — `requirements.txt` uses flasgger 0.9.7.1 (from 2021). `docs/standards/api.md` references OpenAPI 3.1 but Flasgger may not fully support it. Verify compatibility or consider alternatives.
- [ ] **Service layer patterns** — `docs/standards/python.md` mentions the service layer but doesn't show patterns. Add examples once the refactor is done.
- [ ] **Config class split** — `config.py` has one Config class. Document (or implement) dev/test/prod splits.

---

## 6. Security & Auth

### P2 — Hardening

- [x] **Rate limiting on login** — In-memory rate limiter: 5 failed attempts per IP per 15-min window, returns 429.
- [x] **Token refresh retry guard** — Axios interceptor coalesces concurrent refresh attempts into single request.
- [x] **Input size limits** — Added `MAX_CONTENT_LENGTH = 2MB` in Flask config.

### P3 — Future Hardening

- [ ] **HTTPS enforcement** — Currently no HTTPS. Fine for dev behind firewall, but document the expectation that a reverse proxy (nginx/Caddy) handles TLS in production.
- [ ] **httpOnly cookies** — Auth doc mentions this as a future consideration for XSS mitigation. Not urgent for personal use but note it.

---

## 7. DevEx & Tooling

### P2 — Developer Experience

- [ ] **Add logging** — `docs/reference/logging.md` exists with full architecture but no logging is actually implemented. Add `init_logging()` call in `create_app()` with at least a StreamHandler.
- [ ] ~~**Ruff setup**~~ — Deferred; codebase already follows PEP 8. Minimal dependency preference.
- [ ] **ESLint config** — `eslint.config.js` exists with basic setup. Consider adding rules for: no-console (warn), consistent return types, import ordering.

### P3 — Nice-to-Have

- [x] **Hot reload for backend** — Verified: `run.py` with `debug=True` auto-reloads in tmux.
- [ ] **Database seeding idempotency** — `seed-user` creates user but `seed` overwrites entities. Document the expected seed flow and make it safe to run repeatedly.

---

## Execution Order (Suggested)

Work through categories in this order to maximize impact and minimize conflicts:

1. **Responsive layout** (Category 1 P1) — Unblocks mobile usage immediately
2. **Theme tokens** (Category 2 P1) — Establishes the token system before more UI work
3. **Frontend bug fixes** (Category 3 P1) — Fix render-time state mutations and cache bugs
4. **Service layer refactor** (Category 4 P1) — Backend cleanup before adding features
5. **All-characters endpoint** (Category 4 P1) — Eliminates frontend N+1
6. **PWA setup** (Category 1 P2) — Makes app installable
7. **Standards docs** (Category 5 P2) — Update docs to reflect new patterns
8. **Everything else** — P2 and P3 items in any order

---

## Session Context

### Tmux Layout

Dev servers run in tmux so they persist across Claude sessions. Standard window layout:

| Window | Name | Purpose |
|--------|------|---------|
| 0 | claude | Claude Code (this session) |
| 1 | bash | User's general shell |
| 2 | python3 | Flask backend on :5000 |
| 3 | npm | Vite frontend on :5173 |

Use `tmux send-keys -t 0:2 "command" Enter` to manage servers. Never start servers in Claude's own process.

### Voice Access

Voice dictation and TTS are configured in the parent `CLAUDE.md` (`/home/baratta/ai/CLAUDE.md`) and apply to all projects including this one. When the user says "I'm listening," send spoken summaries via:
```bash
curl -s --connect-timeout 2 -X POST -d "message" http://localhost:7777
```
Do not background the curl. If connection fails, continue silently.

---

## Notes

- Each category should be its own branch off `main` (e.g., `chore/responsive-layout`, `chore/theme-tokens`, `refactor/service-layer`).
- This doc lives at `docs/cleanup-audit.md` and should be updated as items are completed.
- Items may spawn feature specs in `specs/` if they grow beyond simple fixes.
