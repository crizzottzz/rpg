# Cleanup Audit — Master To-Do List

**Created:** 2026-02-10
**Status:** Categories 1–4, 6 complete. Backlog remaining.

Comprehensive audit of codebase against standards docs, actual code quality, and cross-platform readiness.

---

## Completed Categories

### 1. Responsive Layout (P1) — DONE

All P1 layout fixes shipped: collapsible sidebar, responsive grids, page padding, touch targets. App title updated.

**Branch:** `chore/standards-audit`

### 2. Theming — P1 DONE

CSS custom properties defined via Tailwind v4 `@theme`. All components migrated from hardcoded colors to semantic tokens (`bg-surface`, `text-accent`, etc.).

**Branch:** `chore/theme-tokens`

### 3. Frontend Code Quality — DONE

All P1/P2/P3 complete: render-time state mutation fixes, useApiCache rewrite (TTL + bounded cache), N+1 character fetch eliminated, error boundary, RHF+Zod forms, TypeScript types tightened, ARIA labels, Spinner component, ConfirmDialog modal, empty states on all list pages.

**Branch:** `fix/frontend-audit`

### 4. Backend Code Quality — DONE

All P1/P2/P3 complete: service layer extracted (5 modules), routes thinned, all-characters endpoint, Alembic migration (timestamps + unique constraint), JSON payload validation, TypedDict return types, specific exception handling, seed error handling.

**Branch:** `refactor/service-layer`, `chore/close-audit-categories`

### 6. Security & Auth (P2) — DONE

Login rate limiting (5 attempts/15min per IP), token refresh coalescing in Axios interceptor, `MAX_CONTENT_LENGTH = 2MB`.

**Branch:** `chore/quick-audit-fixes`

---

## Backlog

Remaining items from the audit, organized by theme. Pick these up as needed — none are blocking.

### PWA & HTTPS (from Categories 1, 6)

Blocked on Caddy/HTTPS setup. Do these together when ready.

- [ ] **Add web app manifest** — `manifest.json` with name, icons, theme color, `display: standalone`, `start_url`
- [ ] **App icons** — Replace default `vite.svg` with proper icons (192px, 512px)
- [ ] **Service worker** — `vite-plugin-pwa` for offline asset caching
- [ ] **Meta tags** — `theme-color`, `apple-mobile-web-app-capable`, `description`
- [ ] **HTTPS enforcement** — Caddy reverse proxy with auto Let's Encrypt certs
- [ ] **httpOnly cookies** — Future XSS mitigation for auth tokens

### Theme Infrastructure (from Category 2)

- [ ] **Theme provider** — `src/theme/` with DB -> localStorage -> default cascade
- [ ] **Dark/light mode** — Token system is ready; just needs alternate token values

### Standards & Documentation (Category 5)

- [ ] **Add responsive/mobile standards** — Section in `docs/standards/react.md`: mobile-first approach, breakpoints, touch targets, sidebar behavior
- [ ] **Add cross-platform standards** — PWA requirements, platform-agnostic API usage
- [ ] **Update architecture.md** — Add responsive layout section
- [ ] **Document theme token system** — Token names and usage patterns in `docs/standards/react.md`
- [ ] **Service layer patterns** — Add examples to `docs/standards/python.md`
- [ ] **Flasgger version note** — Verify OpenAPI 3.1 compatibility with flasgger 0.9.7.1
- [ ] **Config class split** — Document or implement dev/test/prod config

### ~~DevEx & Tooling (Category 7)~~ — DONE

- [x] **Add logging** — `init_logging()` in `create_app()`, structured console output, auth event logging
- [x] **ESLint config** — Added no-console (warn), consistent-type-imports, sort-imports rules
- [x] **Database seeding idempotency** — Already idempotent; documented flow in `seed/commands.py`

### Declined

- ~~**Ruff setup**~~ — Codebase follows PEP 8; minimal dependency preference
- ~~**Viewport meta**~~ — Already correct
- ~~**Avoid web-only APIs**~~ — None found; document rule when PWA work begins

---

## Notes

- Each category used its own branch off `main` per `docs/standards/git.md`.
- Items may spawn feature specs in `specs/` if they grow beyond simple fixes.
