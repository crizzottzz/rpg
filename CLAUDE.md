# CLAUDE.md — RPG Platform

## Overview

Tabletop RPG management app. Personal use first, potential product second. Stack: React (Vite + TypeScript) frontend on :5173, Flask backend on :5000, SQLite.

## Project Structure

```
/home/baratta/ai/rpg/
├── backend/
│   ├── venv/                     # Python virtual environment
│   ├── requirements.txt
│   ├── run.py                    # python run.py → Flask on :5000
│   ├── config.py
│   └── app/
│       ├── __init__.py           # create_app() factory
│       ├── extensions.py         # db, migrate instances
│       ├── models/               # SQLAlchemy models
│       ├── api/                  # Flask blueprints (thin routes)
│       ├── services/             # Business logic layer
│       ├── utils/                # Decorators, errors, helpers
│       └── seed/                 # CLI commands to seed data
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   └── src/
│       ├── api/                  # Axios client + endpoint modules
│       ├── hooks/                # Custom hooks (useApiCache, useTheme, etc.)
│       ├── stores/               # Zustand stores (auth, theme only)
│       ├── components/           # Shared/atomic components (Button, Modal, etc.)
│       ├── features/             # Feature-specific components (combat/, characters/, etc.)
│       ├── pages/                # Route pages
│       ├── theme/                # Theme provider, tokens, defaults
│       └── types/                # TypeScript interfaces
├── specs/                        # Feature specs and architecture decisions (markdown)
├── assets/                       # User uploads / media
└── output/                       # Generated exports
```

## Running

```bash
# Backend
cd backend && venv/bin/python run.py

# Frontend
cd frontend && npm run dev
```

## Seeded User

Username: `dm`, Password: `dungeon_master_2025`

---

## Architecture Decisions

### Data Model

- **UUIDs:** All primary keys are UUIDs (TEXT in SQLite).
- **JSON blobs:** Ruleset entity data stored as JSON. Different rulesets have different schemas — no rigid column structure.
- **Entity schema:** Each entity row stores two JSON blobs side by side: `entity_data` (the values) and `entity_schema` (field definitions — name, datatype, display hints, options). The schema blob drives dynamic UI rendering.
- **Overlays:** Base entity data is never modified. User edits create overlay records that are deep-merged over base data at read time. More specific overrides less specific. Users don't see "overlays" — they just edit data and can "reset to defaults."
- **Overlay hierarchy:** Base data → global user overlay → campaign-scoped overlay. Most specific wins.

### Schema-Driven Dynamic UI

The UI is **ruleset-agnostic**. No hardcoded entity-specific renderers (no `SpellRenderer`, `CreatureRenderer`). Instead:

1. Fetch entity data + entity schema (sibling JSON blobs, or separate endpoint)
2. Schema defines each field: name, datatype, display label, constraints, options
3. Frontend dynamically renders fields based on schema metadata:
   - `boolean` → toggle
   - `string` → text input
   - `number` → numeric input
   - `date` → date picker
   - `enum`/options → select/dropdown
   - `text` (long string) → textarea
4. Labels derived from field names (camelCase → human-readable), overridable via schema
5. Adding a new ruleset or entity type requires zero frontend code changes

### Service Layer Pattern

Routes are **thin** — validate input, call service, return response. Business logic lives in `services/`. Models are data-only (no business methods beyond serialization).

```
Route handler → validates input → calls service function → returns JSON
Service function → contains business logic → calls models/DB → returns data
```

### API Design

- **Response format:** Raw data + HTTP status codes. No envelope pattern. Paginated endpoints include pagination fields at top level.
- **Docstrings:** All route handlers have OpenAPI 3.1-compatible docstrings with:
  - Summary and description
  - Parameters (path, query) with types and descriptions
  - Request body schema with example
  - Response schema with example
  - Should be parseable to generate a valid OpenAPI spec for Swagger/Postman import
- **Error responses:** Consistent `{"error": "message", "detail": "..."}` shape on 4xx/5xx.

### Frontend Data Strategy

- **No global server-state stores.** Don't cache API data in Zustand. Zustand is for cross-cutting client state only (auth, theme).
- **Custom `useApiCache` hook:** Component-level data fetching with a simple cache layer.
  - Cache data until a mutation occurs or user explicitly refreshes
  - Invalidate cache on create/update/delete operations
  - No new dependencies — built on `useRef` + `useState`
- **Data is always fetched via API.** Frontend doesn't know about the database.

### Theming System

Full in-app theming with per-user preferences:

- **Theme cascade** (highest priority first):
  1. DB user preference (fetched after auth)
  2. `localStorage` "last good theme" (pre-auth fallback, survives DB/API failures)
  3. Default theme from JSON file (ultimate fallback, ships with app)
- **Theme tokens:** CSS custom properties defined in Tailwind config. All components reference tokens, never hardcoded color/font values.
- **Customizable properties:** Primary, secondary, tertiary, accent colors. Fonts. Icon set (Lucide icon names as theme-configurable references).
- **In-app switcher:** Full theme editor UI (future). Theme changes apply immediately via CSS variable updates.
- **Implementation:** Tailwind CSS extensions + JS variables work together. Theme provider component loads values and injects into DOM.

### Environment & Configuration

- **dotenv** for environment variables, parameterized with future containerization in mind (Docker/Kubernetes YAML injection).
- Frontend `.env` variables for API base URL, feature flags, etc.
- Backend `config.py` reads from environment with sensible defaults.

### Auth

- Hardcoded local user + JWT for now.
- AuthProvider interface designed for future swap to Auth0/social.
- Token refresh handled by Axios interceptor.

---

## Coding Guidelines

### General Principles

- **Pragmatic typing.** Type public interfaces, API boundaries, complex logic. Skip obvious internals.
- **Boundary-only error handling.** Catch at route handlers (backend) and API client/error boundaries (frontend). Let internal code throw/raise naturally.
- **Minimal dependencies.** Only add packages when native solutions don't exist or are unreasonably complex.
- **No over-engineering.** Solve the current problem. Don't design for hypothetical futures.

### Python / Backend

- Follow conventions in the parent `CLAUDE.md` for general Python style.
- Route handlers: thin. Validate → delegate to service → return response.
- Service functions: contain business logic. Receive validated data, return results.
- Models: data definitions + serialization (`to_dict()`). No business logic.
- Migrations: one per feature during development. Squash periodically to clean baseline.
- OpenAPI docstrings on every route handler.

### React / Frontend

- Follow conventions in the parent `CLAUDE.md` for general React/TS style.
- **Component organization:**
  - `components/` — shared, feature-agnostic components (Button, Modal, Card, DataTable). Atomic design for reusable primitives.
  - `features/` — feature-specific components grouped by domain (`features/combat/InitiativeTracker.tsx`, `features/characters/AbilityScoreGrid.tsx`). Only used within that feature's pages.
  - `pages/` — route-level components. Compose from features + shared components.
- **All UI values go through theme tokens.** No hardcoded colors, font sizes, or spacing values in components.
- **Forms:** React Hook Form + Zod for complex forms (character creation, entity editing, overlays). Native controlled inputs for simple forms (login, search, filters).
- **Data fetching:** Use the `useApiCache` custom hook. No `useEffect` + `fetch` patterns scattered through components.

---

## Development Workflow

### Spec → Plan → Execute

Features follow a structured pipeline:

1. **Spec** (high-level): User describes the feature. A markdown spec is written in `specs/` capturing behavior, scope, and acceptance criteria.
2. **Plan** (technical): Explore the codebase, design the approach — API changes, DB changes, component structure. Documented in plan mode or appended to the spec. User approves before implementation.
3. **Execute**: Build the feature. Commit on feature branch. Merge to main when complete.

This workflow is compatible with GitHub spec-kit methodology.

### Git Workflow

- **Never commit directly to `main`.** All work happens on branches.
- **Branch naming:**
  - `feature/<name>` — new functionality (e.g., `feature/theme-system`)
  - `bugfix/<name>` — bug fixes (e.g., `bugfix/token-refresh-loop`)
  - `chore/<name>` — tooling, config, docs, refactoring (e.g., `chore/env-parameterization`)
- **Merge to `main`** when complete. Always use `--no-ff` (merge commits, no rebasing). Squash migrations before merging when applicable.
- **Conventional Commits** for all commit messages:
  - `feat: add theme provider and CSS custom properties`
  - `fix: prevent token refresh loop on expired sessions`
  - `refactor: extract overlay merging into service layer`
  - `chore: add .env.example files`
  - `docs: update README with setup instructions`
  - Scope is optional but encouraged: `feat(characters): add ability score validation`
  - Breaking changes: `feat!: replace entity renderers with schema-driven UI`

### Specs Directory

Feature specs live in `specs/` as markdown files. Each spec includes:
- Feature name and summary
- User-facing behavior description
- Technical approach (API, DB, UI changes)
- Acceptance criteria

---

## Database Tables

users, rulesets, ruleset_entities, user_overlays, campaigns, characters

Future: user_preferences (theme, settings), entity_schemas (if separated from entity rows)

## Frontend Stack

Vite 7, React 19, TypeScript, React Router v7, Zustand, Axios, Tailwind CSS v4, React Hook Form + Zod, Lucide React
