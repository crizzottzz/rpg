# Parking Lot — RPG Platform

**Last updated:** 2026-02-11
**Branch:** `main` — all features merged and current.

---

## Recently Completed

| Feature | Branch | Status |
|---------|--------|--------|
| Standards audit (Categories 1–7) | various (`chore/standards-audit`, etc.) | Merged to main |
| Live log streaming + browser viewer | `feat/log-streaming` | Merged to main |
| Stable JWT secrets + env-var config | `feat/source-editions` | Merged to main |
| Source/edition awareness | `feat/source-editions` | Merged to main |

### Source/Edition Awareness (latest)

- `document_key` column on `ruleset_entities`, backfilled from `entity_data` JSON
- Source metadata in ruleset `source_config` with priority ordering (23 Open5e sources)
- Smart default: deduplicates by preferring default source (srd-2024) + unique 3rd-party content
- Three filter modes: default (smart), all sources, specific source
- `GET /api/rulesets/<id>/sources` endpoint with per-type counts
- Source dropdown on ruleset detail page, source badge on entity detail page

---

## Backlog

Carried forward from `docs/cleanup-audit.md`. None are blocking.

### PWA & HTTPS
- Web app manifest, app icons, service worker, meta tags
- HTTPS via Caddy + Let's Encrypt
- httpOnly cookies for auth tokens
- Blocked on Caddy setup — do together

### Theme Infrastructure
- Theme provider (`src/theme/`) with DB -> localStorage -> default cascade
- Dark/light mode toggle — token system is ready, needs alternate values
- 7 fantasy-inspired palettes designed (plan at `.claude/plans/cheerful-orbiting-haven.md`)
- Backend `user_preferences` table + API

### Future Ideas (no plan yet)
- Schema-driven entity rendering improvements
- Campaign management enhancements
- Character builder workflow
