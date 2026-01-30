# Plugin Architecture & the ABC Principle

Restated from enterprise WxS patterns for this application.

---

## Purpose

Define how the app separates core product logic from external integrations, data sources, and extensible behaviors. This ensures vendor-specific code never leaks into business logic.

---

## The ABC Principle (Adapter – Bridge – Core)

### A — Adapter Layer (External Boundary)

- Implementation-specific code
- Protocol logic, API clients, file parsers
- External data format handling
- External error semantics

**This layer changes when an external source or integration changes.**

Examples in this app:
- Open5e API client (fetches D&D 5e SRD data)
- Future: D&D Beyond importer, local JSON file parser

### B — Bridge Layer (Contracts & Normalization)

- Canonical interfaces and contracts
- Factories and resolvers
- Capability discovery
- Error normalization
- Configuration binding

**This layer changes when the app wants consistency across implementations.**

Examples in this app:
- Ruleset data source interface (`fetch_entities`)
- Auth provider interface (`get_user_context`)
- Theme resolver (DB → localStorage → default)

### C — Core Layer (Product Logic)

- Flask routes and blueprints
- Domain services
- Database models and migrations
- Authorization decisions

**This layer changes when business behavior changes.**

Examples in this app:
- Campaign CRUD service
- Character creation logic
- Overlay deep-merge service
- Entity browsing and pagination

---

## Rule of Thumb

- External source changes → **A** (adapter)
- Consistency or contract changes → **B** (bridge)
- Business behavior changes → **C** (core)

---

## Separation of Duties

### Core Routes (C)

Routes are responsible for:
- Authentication and authorization
- Request validation
- HTTP-to-domain translation
- Calling domain services
- Returning JSON responses

Routes **never**:
- Import external API clients directly
- Contain data-source-specific logic
- Branch on which adapter is active

### Domain Services (C)

Services are responsible for:
- Business rules and calculations
- Database transactions
- Calling bridge contracts for external operations

### Bridge Contracts (B)

The bridge is responsible for:
- Selecting implementations via factories
- Normalizing errors from different adapters
- Ensuring all adapters return canonical data shapes

### Adapters (A)

Adapters are responsible for:
- Executing source-specific work (API calls, file parsing)
- Translating external data into canonical format
- Handling retries, timeouts, pagination of external sources
- Declaring capabilities and limitations

---

## What Belongs in Adapters

### Allowed

- External API clients (Open5e, future sources)
- Data format translation (external JSON → canonical entity shape)
- External authentication / API key handling
- Retry and timeout logic for external calls
- Capability declarations ("this source provides spells and creatures")

### Forbidden

- Flask routes or blueprints
- Database migrations or model definitions
- Authorization decisions
- Business policy or game rules
- Direct writes to core database tables

**Hard boundary:** Adapters provide data. Core defines product behavior.

---

## Request Flow

```
User Action
    ↓
Core Route (auth + validation)
    ↓
Domain Service (business logic)
    ↓
Bridge Contract (resolve implementation)
    ↓
Adapter (external operation)
    ↓
External System (Open5e API, file, etc.)
    ↓
Canonical Result (normalized data)
    ↓
Back up through service → route → JSON response
```

---

## Current State

The app currently has one adapter (Open5e seed script) that runs at setup time, not at request time. As the app grows to support:

- Live data fetching from external sources
- Multiple ruleset importers
- User-uploaded homebrew files

...this pattern ensures each new source is an adapter behind the bridge contract, and core logic never changes.

---

## Final Principle

If core needs to know *how* something is done, the architecture is broken. Core only knows *what* should happen — never how an external system does it.
