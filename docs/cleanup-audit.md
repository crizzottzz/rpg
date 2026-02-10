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

- [ ] **Collapsible sidebar for mobile** — `app-shell.tsx` uses fixed `w-64` (256px). On phone-width screens the main content is nearly unusable. Needs hamburger menu or drawer pattern with breakpoint toggle (e.g., `lg:` shows sidebar, below `lg:` uses overlay drawer).
- [ ] **Responsive ability score grid** — `character-detail-page.tsx:97` uses `grid-cols-6` with no responsive variant. On phones, 6 columns are unreadable. Use `grid-cols-3 sm:grid-cols-6` (2 rows of 3 on mobile).
- [ ] **Responsive new-character form** — `new-character-page.tsx` ability score inputs also use `grid-cols-6`. Same fix needed.
- [ ] **Page padding responsive** — Most pages use `p-8`. Should be `p-4 md:p-8` for mobile breathing room.
- [ ] **Touch targets** — Icon buttons (delete, edit) are small. Minimum 44x44px tap targets per WCAG. Add padding or min-w/min-h.

### P2 — PWA Setup

- [ ] **Add web app manifest** — No `manifest.json` exists. Need name, icons, theme color, display: standalone, start_url.
- [ ] **App title** — `index.html` title is "frontend". Change to actual app name.
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

- [ ] **Define CSS custom properties** — Standards doc says "all visual values reference theme tokens." Currently every Tailwind class is hardcoded (`bg-gray-900`, `text-amber-400`, etc.). Define a token layer in `index.css` or a `theme.css`:
  ```css
  :root {
    --color-surface: theme(colors.gray.900);
    --color-surface-alt: theme(colors.gray.800);
    --color-border: theme(colors.gray.800);
    --color-text-primary: theme(colors.gray.100);
    --color-text-secondary: theme(colors.gray.400);
    --color-text-muted: theme(colors.gray.500);
    --color-accent: theme(colors.amber.400);
    --color-accent-hover: theme(colors.amber.500);
    /* etc. */
  }
  ```
- [ ] **Extend Tailwind config** — Map custom properties to Tailwind utilities so components use `bg-surface` instead of `bg-gray-900`. Tailwind v4 supports this natively via `@theme`.
- [ ] **Migrate existing components** — Replace hardcoded color classes with token-based classes across all files. This is a bulk find-and-replace per color value.

### P2 — Theme Infrastructure

- [ ] **Theme provider** — `src/theme/` directory exists in project structure docs but is empty/missing. Create the theme provider that handles DB -> localStorage -> default cascade.
- [ ] **Dark/light mode** — Currently dark-only. Theme tokens make adding light mode straightforward later. No action now, but the token system enables it.

---

## 3. Frontend Code Quality

### P1 — Bug Fixes

- [ ] **Fix state mutation in render** — `ruleset-detail-page.tsx` calls `setActiveType()` inside the component body (not in useEffect). This causes React strict-mode double-renders and is an anti-pattern. Move to `useEffect`.
- [ ] **Fix state mutation in render** — `new-campaign-page.tsx` has the same pattern with `setRulesetId()`.
- [ ] **Fix N+1 character fetching** — `characters-page.tsx` loops through all campaigns, calling `listCharacters(campaignId)` for each. Should use a single `/api/characters` endpoint (see Backend section).
- [ ] **Fix useApiCache bugs** — The `enabled` option doesn't fully prevent fetching. Cache key uses `fetcher.name` which can be empty for arrow functions. Add TTL support and bounded cache size.

### P2 — Standards Compliance

- [ ] **Add error boundaries** — No error boundaries exist. Add at least one wrapping the main content area in `App.tsx`. Consider per-page boundaries for graceful degradation.
- [ ] **Form validation with React Hook Form + Zod** — Standards require this for complex forms. Currently `new-character-page.tsx` and `new-campaign-page.tsx` use raw `useState`. Migrate these two forms.
- [ ] **Tighten TypeScript types** — `entity_data` is `Record<string, unknown>` (too loose). `class_data` same. Define more specific types or use Zod schemas shared between validation and types.
- [ ] **Add ARIA labels** — Icon-only buttons (delete, edit) lack accessible labels. Add `aria-label` attributes.

### P3 — Polish

- [ ] **Loading states** — Current loading is bare `<div className="p-8 text-gray-400">Loading...</div>`. Consider skeleton screens or at least a spinner component.
- [ ] **Empty states** — CampaignsPage has a good empty state with icon. Other pages (characters, rulesets) could use similar treatment.
- [ ] **Confirm dialogs** — Using browser `confirm()` for deletes. Replace with a modal component for consistent UX (and cross-platform compatibility — `confirm()` looks different everywhere).

---

## 4. Backend Code Quality

### P1 — Service Layer Refactor

- [ ] **Extract campaign service** — Move campaign CRUD logic from `api/campaigns.py` into `services/campaign_service.py`. Routes become thin HTTP handlers that call service methods.
- [ ] **Extract character service** — Same for `api/characters.py` -> `services/character_service.py`.
- [ ] **Extract overlay service** — Same for `api/overlays.py` -> `services/overlay_service.py`. The overlay deep-merge logic especially belongs in a service.
- [ ] **Extract auth service** — Token creation/validation logic in `utils/auth.py` is fine, but login/refresh business logic should move from `api/auth.py` to `services/auth_service.py`.
- [ ] **Extract ruleset service** — Entity listing with overlay merging in `api/rulesets.py` is complex enough to warrant a service.
- [ ] **Add all-characters endpoint** — `GET /api/characters` that returns all characters for the current user across campaigns. Eliminates the N+1 problem on the frontend.

### P2 — Data Integrity

- [ ] **Add UserOverlay unique constraint** — Missing `UNIQUE(user_id, ruleset_id, entity_type, source_key, campaign_id)`. Currently allows duplicate overlays. Needs an Alembic migration.
- [ ] **Add User timestamps** — `created_at`, `updated_at` missing on User model. Add via migration.
- [ ] **Add Ruleset timestamps** — Same, missing `created_at`, `updated_at`.
- [ ] **Validate JSON payloads** — No validation on `core_data`, `class_data`, `equipment`, `spells` JSON blobs. Add Pydantic or Marshmallow schemas for request validation, at least on write endpoints.
- [ ] **Consistent return types** — Route handlers have inconsistent return annotations (`tuple[Response, int] | Response`). Standardize to always return `tuple[Response, int]`.

### P3 — Code Cleanup

- [ ] **Specific exception handling** — `api/auth.py` refresh endpoint catches bare `Exception`. Should catch `jwt.ExpiredSignatureError`, `jwt.InvalidTokenError` specifically.
- [ ] **Model `to_dict()` return types** — Currently typed as `-> dict`. Use TypedDict for better IDE support.
- [ ] **Seed error handling** — `open5e.py` catches generic `Exception` on fetch. Handle `requests.RequestException` specifically. Add retry logic for transient failures.

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

- [ ] **Rate limiting on login** — No protection against brute-force. Add `flask-limiter` or simple counter on `POST /api/auth/login`.
- [ ] **Token refresh retry guard** — Frontend Axios interceptor can loop if refresh keeps failing. Add a flag to prevent concurrent refresh attempts and a max retry count.
- [ ] **Input size limits** — No max size on JSON payloads (entity_data, etc.). Add `MAX_CONTENT_LENGTH` in Flask config.

### P3 — Future Hardening

- [ ] **HTTPS enforcement** — Currently no HTTPS. Fine for dev behind firewall, but document the expectation that a reverse proxy (nginx/Caddy) handles TLS in production.
- [ ] **httpOnly cookies** — Auth doc mentions this as a future consideration for XSS mitigation. Not urgent for personal use but note it.

---

## 7. DevEx & Tooling

### P2 — Developer Experience

- [ ] **Add logging** — `docs/reference/logging.md` exists with full architecture but no logging is actually implemented. Add `init_logging()` call in `create_app()` with at least a StreamHandler.
- [ ] **Ruff setup** — Standards mention ruff for linting/formatting but it's not configured. Add `ruff.toml` or `pyproject.toml` section.
- [ ] **ESLint config** — `eslint.config.js` exists with basic setup. Consider adding rules for: no-console (warn), consistent return types, import ordering.

### P3 — Nice-to-Have

- [ ] **Hot reload for backend** — `run.py` uses `app.run(debug=True)` which enables reloader. Verify this works in the tmux setup.
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
