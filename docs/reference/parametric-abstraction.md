# Parametric Abstraction Pattern

Adapted from prior enterprise architecture experience.

---

## Core Principle

> **The application should depend on capabilities, not mechanics.**

When the app needs to:

- Authenticate a user
- Fetch ruleset data
- Resolve a theme
- Retrieve configuration

...it should do so through a **stable internal interface**, while the actual implementation is selected at runtime or configuration time.

This allows the app to:

- Support multiple implementations (local auth vs Auth0, Open5e vs file import)
- Switch implementations without refactoring business logic
- Operate consistently across different deployment environments
- Remain extensible without coupling to specific vendors or data sources

---

## Pattern Anatomy

Every parametric abstraction follows the same structure:

```
[ Caller / App Code ]
        |
        v
[ Stable Internal Interface ]
        |
        v
[ Factory / Resolver ]
        |
        v
[ Concrete Implementation ]
```

**The caller never knows (or cares) which concrete implementation is being used.**

---

## Examples in This App

### Authentication

**What the app wants:** "Validate this request and give me a user context"

**What the app doesn't care about:** Where tokens come from, how they're validated, whether identity is local or external.

**Pattern:**
- A `@jwt_required` decorator is the stable interface
- Auth provider selected by configuration
- Providers implement the same contract
- Routes and services never branch on auth type

**Result:** Switching from local JWT to Auth0 doesn't change route code.

### Ruleset Data Sources

**What the app wants:** "Give me D&D 5e spells"

**What the app doesn't care about:** Whether data comes from Open5e API, a local JSON file, or manual entry.

**Pattern:**
- A data source interface defines `fetch_entities(ruleset, entity_type)`
- Factory selects the source based on ruleset configuration (`source_type`)
- Sources implement the same contract
- Seeds and services call the interface, not the source directly

### Theme Resolution

**What the app wants:** "Give me the current user's theme"

**What the app doesn't care about:** Whether the theme came from the database, localStorage, or a default JSON file.

**Pattern:**
- Theme cascade defines priority: DB → localStorage → default
- Theme provider resolves the active theme
- Components consume theme tokens, never query the source

---

## Qualification Test

Use this pattern when **any** of the following are true:

- Multiple implementations exist (now or likely later)
- Behavior differs by deployment or configuration
- External systems or credentials are involved
- The logic is environment-dependent
- You can imagine a future adapter being written for it

**Don't** use this pattern when:

- It's pure domain logic with no external dependency
- It's a trivial helper or utility
- It will never vary across environments
- It would add indirection without flexibility

---

## Design Rules

### 1. Stable Interface First

- Define the interface before the implementation
- Interface lives in a neutral, core location
- No implementation-specific naming in interfaces

### 2. No Conditional Logic in App Code

Bad:
```python
if auth_type == "auth0":
    validate_auth0_token(request)
else:
    validate_local_token(request)
```

Good:
```python
user = auth_provider.get_user_context(request)
```

### 3. Factories Are the Only Switch Point

- All selection logic lives in one place (the factory)
- Factories may read config, environment, or database
- Factories return fully-formed implementations
- App code never imports concrete implementations directly

### 4. Capability-Based Design

- Prefer `provider.capabilities()` over `isinstance(provider, SpecificType)`
- Let callers ask what is supported, not who this is

---

## Summary

> **The app is a system of contracts, not implementations.**

- The app asks *what*, not *how*
- Implementations are replaceable
- Configuration drives behavior
- Abstractions are intentional, not accidental

If you are about to add logic that branches on implementation type, vendor, or environment — **stop**. You are likely missing a parametric abstraction.
