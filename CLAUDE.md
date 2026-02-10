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
├── docs/
│   ├── standards/                # Coding and workflow standards
│   └── reference/                # Architecture patterns and guides
├── specs/                        # Feature specs (spec → plan → execute)
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

## Guiding Principles

- **Pragmatic typing.** Type public interfaces, API boundaries, complex logic. Skip obvious internals.
- **Boundary-only error handling.** Catch at route handlers and API client/error boundaries. Internal code throws/raises naturally.
- **Minimal dependencies.** Only add packages when native solutions are unreasonably complex.
- **No over-engineering.** Solve the current problem. Don't design for hypothetical futures.
- **Parametric abstraction.** Depend on capabilities, not mechanics. No conditional logic branching on implementation type. See `docs/reference/parametric-abstraction.md`.
- **ABC principle.** Adapter (external boundary) → Bridge (contracts) → Core (product logic). See `docs/reference/plugin-architecture.md`.

---

## Standards (see `docs/standards/`)

| Document | Covers |
|----------|--------|
| [python.md](docs/standards/python.md) | Naming, typing, docstrings, error handling, project layout, service layer |
| [react.md](docs/standards/react.md) | Components, state management, data fetching, forms, styling, theming |
| [api.md](docs/standards/api.md) | Response format, status codes, OpenAPI 3.1 docstrings, route patterns |
| [git.md](docs/standards/git.md) | Branch naming, conventional commits, merge strategy |
| [architecture.md](docs/standards/architecture.md) | Schema-driven UI, overlay system, theming cascade, service layer, data model |

## Reference (see `docs/reference/`)

| Document | Covers |
|----------|--------|
| [auth.md](docs/reference/auth.md) | JWT lifecycle, token verification, provider abstraction, SPA responsibilities |
| [logging.md](docs/reference/logging.md) | Python logging architecture, handler fan-out, structured events |
| [parametric-abstraction.md](docs/reference/parametric-abstraction.md) | Interface → factory → implementation pattern, qualification test |
| [plugin-architecture.md](docs/reference/plugin-architecture.md) | ABC principle, adapter/bridge/core separation, what belongs where |

---

## Development Workflow

### Branch Safety — MANDATORY

**Before making any file changes, verify you are NOT on `main`.** If on `main`, create or switch to an appropriate branch first. No exceptions — this applies to docs, config, code, and any other tracked file. Use `git branch --show-current` to check. Branch naming follows `docs/standards/git.md`.

### Spec → Plan → Execute

1. **Spec** — Feature described at high level. Markdown written in `specs/` with behavior, scope, and acceptance criteria.
2. **Plan** — Technical design: API changes, DB changes, component structure. User approves before implementation.
3. **Execute** — Build on a feature branch. Merge to main when complete.

See `docs/standards/git.md` for branch naming, conventional commits, and merge strategy.

---

## Key Architecture Decisions

- **Schema-driven dynamic UI** — No hardcoded entity renderers. Schema blob alongside data blob drives field rendering. See `docs/standards/architecture.md`.
- **Overlay system** — Base data never modified. User edits stored as overlays, deep-merged at read time. Users see "edit" and "reset to defaults", not overlays.
- **Theming** — DB → localStorage → default JSON cascade. CSS custom properties via Tailwind. All components use theme tokens.
- **Service layer** — Routes are thin. Business logic in `services/`. Models are data-only.
- **Auth** — Local JWT now, provider abstraction for future swap. See `docs/reference/auth.md`.
- **Environment** — dotenv parameterized for future containerization.

## Database Tables

users, rulesets, ruleset_entities, user_overlays, campaigns, characters

Future: user_preferences (theme, settings)

## Frontend Stack

Vite 7, React 19, TypeScript, React Router v7, Zustand, Axios, Tailwind CSS v4, React Hook Form + Zod, Lucide React

## Session Notes

### Voice Interaction

The user often enables spoken responses via a reverse SSH tunnel. **After context compaction, re-check the parent CLAUDE.md for voice interaction instructions** — the speak-chat-speak pattern, TTS via `curl -s --connect-timeout 2 -X POST -d "message" http://localhost:7777`, and rules about when to use it. This note exists because compaction tends to lose this context.

### Theming — Current State

Theme tokens are defined in `frontend/src/index.css` via Tailwind v4's `@theme` directive. All components use semantic token utilities (`bg-surface`, `text-heading`, etc.) — no hardcoded color classes. At runtime, overriding `--color-*` custom properties on `:root` via JavaScript will re-theme the entire app instantly. The DB → localStorage → default cascade and theme provider/store are not yet implemented.
