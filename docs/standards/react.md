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

## Responsive Design

Mobile-first approach. Design for small screens, enhance for larger ones.

### Breakpoints

Use Tailwind's default breakpoints:

| Prefix | Min Width | Target |
|--------|-----------|--------|
| (none) | 0px | Phones |
| `sm:` | 640px | Large phones / small tablets |
| `md:` | 768px | Tablets |
| `lg:` | 1024px | Desktops (sidebar breakpoint) |

### Layout Rules

- **Sidebar:** Collapsible drawer below `lg:`, fixed sidebar at `lg:` and above. Toggle via hamburger menu.
- **Page padding:** `p-4 sm:p-8` — tighter on mobile, relaxed on desktop.
- **Grids:** Always include a mobile-friendly column count (e.g., `grid-cols-3 sm:grid-cols-6` for ability scores).
- **Touch targets:** Minimum 44x44px for interactive elements (buttons, links, icons). Use `min-h-11 min-w-11` or padding.

### Patterns

- Prefer `flex-col sm:flex-row` for layouts that stack on mobile and go horizontal on desktop.
- Use `max-w-4xl` on content areas to prevent ultra-wide reading on large screens.
- Test at 375px (phone), 768px (tablet), 1280px (desktop).

## Styling

- Tailwind CSS for all styling
- **All visual values reference theme tokens** (CSS custom properties)
- Never hardcode color values, font sizes, or spacing directly in components
- Use semantic token names (`--color-primary`, `--color-surface`) not raw values

### Theme Token System

Tokens are defined in `index.css` using Tailwind v4's `@theme` directive. All components use semantic token names instead of raw Tailwind color classes.

**Surface tokens:** `bg-surface`, `bg-subtle`, `bg-base`
**Text tokens:** `text-heading`, `text-content`, `text-label`, `text-muted`
**Border tokens:** `border-edge`, `border-edge-hover`
**Accent tokens:** `text-accent`, `bg-accent`, `bg-accent-bold`, `text-accent-fg`

To add a new token:
1. Define the CSS custom property in `@theme` block in `index.css`
2. Use it in components via Tailwind class (e.g., `bg-my-token`)
3. For theme switching, provide alternate values under a class or media query

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
