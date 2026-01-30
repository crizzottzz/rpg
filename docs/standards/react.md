# React / TypeScript Coding Standards

## Naming

- `camelCase` for functions and variables
- `PascalCase` for components, types, and interfaces
- `kebab-case` for file names (e.g., `ability-score-grid.tsx`)
- Prefix custom hooks with `use` (e.g., `useApiCache`)

## Type Safety

Pragmatic approach:

- Type all component props
- Type API response shapes
- Type complex logic and utility functions
- Lean on inference for obvious internals (event handlers, local state)
- Use Zod schemas at API boundaries for runtime validation on complex forms

## Components

- Functional components only. No class components.
- Keep components focused — if a component does too many things, split it.

### Organization

```
src/
  components/     # Shared, feature-agnostic (Button, Modal, Card, DataTable)
  features/       # Feature-specific, grouped by domain
                  #   features/combat/InitiativeTracker.tsx
                  #   features/characters/AbilityScoreGrid.tsx
  pages/          # Route-level components, compose from features + shared
```

- `components/` uses atomic design for reusable primitives
- `features/` groups by domain — components only used within that feature's pages
- `pages/` are thin orchestrators that compose features and shared components

## State Management

- **Minimize global state.** Local component state (`useState`) is the default.
- **Zustand** only for truly cross-cutting client concerns: auth, theme.
- **No server-state stores.** Don't cache API data in Zustand.
- Use the `useApiCache` custom hook for data fetching with cache-until-mutation strategy.

## Data Fetching

- All API calls go through the Axios client (`src/api/client.ts`)
- Use `useApiCache` hook — no scattered `useEffect` + `fetch` patterns
- Cache data until a mutation occurs or user explicitly refreshes
- Invalidate cache on create/update/delete operations

## Forms

- **React Hook Form + Zod** for complex forms (character creation, entity editing, overlay management)
- **Native controlled inputs** for simple forms (login, search, filters)
- Zod schemas provide both TypeScript types and runtime validation

## Styling

- Tailwind CSS for all styling
- **All visual values reference theme tokens** (CSS custom properties)
- Never hardcode color values, font sizes, or spacing directly in components
- Use semantic token names (`--color-primary`, `--color-surface`) not raw values

## Error Handling

Boundary-only:

- API client interceptor handles 401 (token refresh) and network errors
- Top-level error boundary catches rendering errors
- Components don't individually try/catch unless graceful degradation is needed

## Comments

- Self-documenting code preferred
- Only comment non-obvious "why" decisions
- No boilerplate docstrings on components

## Dependencies

- Minimalist. Only install packages when there isn't a native React/browser solution.
- Evaluate necessity before adding any npm dependency.
