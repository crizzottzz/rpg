# RPG Platform

Tabletop RPG campaign and character management app. Browse ruleset data, create campaigns, build characters, and customize game content with transparent overlays that never modify base data.

## Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Zustand, Axios
- **Backend:** Flask, SQLAlchemy, SQLite, JWT auth
- **Data:** D&D 5e SRD via Open5e (8,600+ entities across 8 types)

## Setup

### Prerequisites

- Python 3.10+
- Node.js 18+
- npm

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Copy and edit environment config
cp .env.example .env

# Create database and run migrations
flask db upgrade

# Seed default user and D&D 5e SRD data
flask seed
```

### Frontend

```bash
cd frontend
npm install

# Copy and edit environment config
cp .env.example .env

npm run dev
```

### Running

```bash
# Terminal 1 — Backend (port 5000)
cd backend && source venv/bin/activate && python run.py

# Terminal 2 — Frontend (port 5173)
cd frontend && npm run dev
```

The frontend proxies `/api` requests to the backend, so access the app at `http://localhost:5173`.

### Default Login

- **Username:** `dm`
- **Password:** `dungeon_master_2025`

## Architecture

### Data Model

All primary keys are UUIDs. Ruleset entity data is stored as JSON blobs, allowing different rulesets (D&D 5e, 3.5e, Pathfinder, etc.) to coexist with different schemas.

### Overlays

Base ruleset data is never modified. When a user customizes an entity (spell, creature, item, etc.), their changes are stored as an overlay record. At read time, overlays are deep-merged over the base data. Users can always reset to defaults.

**Overlay hierarchy:** Base data -> global user overlay -> campaign-scoped overlay. Most specific wins.

### Schema-Driven UI

The UI is designed to be ruleset-agnostic. Entity schemas define field names, types, and display hints. The frontend dynamically renders fields based on schema metadata rather than hardcoded renderers per entity type.

### API

RESTful JSON API with JWT authentication. All endpoints documented with OpenAPI 3.1-compatible docstrings.

| Resource    | Endpoints                          |
|-------------|-------------------------------------|
| Auth        | login, refresh, me                  |
| Rulesets    | list, get, entities (paginated)     |
| Campaigns   | CRUD                                |
| Characters  | CRUD (scoped to campaign)           |
| Overlays    | CRUD (scoped to user)               |

## Project Structure

```
backend/
  app/
    api/          # Flask blueprints (thin route handlers)
    models/       # SQLAlchemy models
    services/     # Business logic
    utils/        # Auth, errors, helpers
    seed/         # CLI commands for seeding data
  config.py       # Environment-driven configuration
  run.py          # Entry point

frontend/
  src/
    api/          # Axios client and endpoint modules
    components/   # Shared/atomic UI components
    features/     # Feature-specific components by domain
    hooks/        # Custom React hooks
    pages/        # Route-level page components
    stores/       # Zustand stores (auth, theme)
    theme/        # Theme provider, tokens, defaults
    types/        # TypeScript interfaces
```

## Environment Variables

See `backend/.env.example` and `frontend/.env.example` for all available configuration.

## License

Private project.
