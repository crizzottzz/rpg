# Git Workflow Standards

## Branch Strategy

- **Never commit directly to `main`.** All work happens on branches.
- Merge to `main` when feature is complete and verified.

### Branch Naming

| Prefix | Purpose | Example |
|--------|---------|---------|
| `feature/` | New functionality | `feature/theme-system` |
| `bugfix/` | Bug fixes | `bugfix/token-refresh-loop` |
| `chore/` | Tooling, config, docs, refactoring | `chore/env-parameterization` |

## Merging

- Always use `--no-ff` to create merge commits. No rebasing.
- Squash migrations before merging when applicable.
- Delete feature branches after merge (optional, keep for reference if desired).

## Conventional Commits

All commit messages follow the Conventional Commits specification.

### Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer]
Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

### Types

| Type | Usage |
|------|-------|
| `feat` | New feature or functionality |
| `fix` | Bug fix |
| `refactor` | Code restructuring without behavior change |
| `chore` | Tooling, config, dependency updates |
| `docs` | Documentation only |
| `style` | Formatting, whitespace (no logic change) |
| `test` | Adding or updating tests |

### Scope

Optional but encouraged. Identifies the area of the codebase:

```
feat(characters): add ability score validation
fix(auth): prevent token refresh loop on expired sessions
refactor(overlays): extract merging into service layer
chore(frontend): update Tailwind to v4.2
```

### Breaking Changes

Use `!` after the type/scope:

```
feat!: replace entity renderers with schema-driven UI
```

### Examples

```
feat: add theme provider and CSS custom properties
fix: prevent duplicate overlay creation for same entity
refactor: move campaign logic from route to service layer
chore: add .env.example files for backend and frontend
docs: update README with setup instructions
```
