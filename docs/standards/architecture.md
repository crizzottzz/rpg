# Architecture Standards

## Service Layer Pattern

```
Route handler → validates input → calls service function → returns JSON
Service function → contains business logic → calls models/DB → returns data
Model → data definition + serialization (to_dict) → no business logic
```

- **Routes** are thin: extract input, validate, call service, return JSON
- **Services** contain all business logic: calculations, overlay merging, entity operations
- **Models** define data structure and serialization only

## Schema-Driven Dynamic UI

The UI is **ruleset-agnostic**. No hardcoded entity-specific renderers.

### How It Works

1. Each entity row stores two JSON blobs: `entity_data` (values) and `entity_schema` (field definitions)
2. Schema defines each field: name, datatype, display label, constraints, options
3. Frontend dynamically renders fields based on schema metadata:
   - `boolean` → toggle
   - `string` → text input
   - `number` → numeric input
   - `date` → date picker
   - `enum`/options → select/dropdown
   - `text` (long string) → textarea
4. Labels derived from field names (camelCase → human-readable), overridable via schema
5. Adding a new ruleset or entity type requires **zero frontend code changes**

### Why

- Different rulesets (D&D 5e, 3.5e, Pathfinder) have different data shapes
- The app should work with any tabletop RPG system without code changes
- New entity types are just new data + schema, not new React components

## Overlay System

Base entity data is **never modified**. User customizations are stored as overlay records that are deep-merged over base data at read time.

### Hierarchy (most specific wins)

1. Base data (from ruleset seed)
2. Global user overlay (applies across all campaigns)
3. Campaign-scoped overlay (applies to one campaign)

### User Experience

- Users don't see "overlays" — they just edit data
- Edit icon puts a record in edit mode
- Changes are saved as overlay records transparently
- "Reset to defaults" restores the base data by removing the overlay

## Theming System

Full in-app theming with per-user preferences.

### Theme Cascade (highest priority first)

1. **DB user preference** — fetched after authentication
2. **localStorage "last good theme"** — pre-auth fallback, survives DB/API failures
3. **Default theme JSON** — ships with the app, ultimate fallback

### Theme Tokens

- CSS custom properties defined via Tailwind config
- All components reference tokens, never hardcoded values
- Customizable: primary, secondary, tertiary, accent colors, fonts, icon set (Lucide names)

### Implementation

- Tailwind CSS extensions + JS variables work together
- Theme provider component loads values and injects into DOM
- Theme changes apply immediately via CSS variable updates

## Environment & Configuration

- **dotenv** for environment variables
- Parameterized for future containerization (Docker/Kubernetes YAML injection)
- Frontend `.env` for API base URL, allowed hosts, feature flags
- Backend `config.py` reads from environment with sensible defaults
- Never hardcode secrets or environment-specific values in source

## Data Model Principles

- **UUIDs** for all primary keys (TEXT in SQLite)
- **JSON blobs** for flexible data (entity_data, core_data, class_data)
- **Entity schema** as sibling JSON blob alongside entity data
- **Migrations** via Alembic — one per feature, squash periodically
