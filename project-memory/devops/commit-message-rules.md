# Commit Message Rules

## Format

```text
<type>(<scope>): <short summary>

[optional body]

[optional footer]
```

## Types

| Type | Use |
|------|-----|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation / project-memory only |
| `refactor` | Code change, no behavior change |
| `chore` | Tooling, deps (avoid vendor churn without reason) |
| `mobile` | Mobile-only change (scope hint) |

## Scope (examples)

`web`, `mobile`, `firebase`, `admin`, `listings`, `auth`, `deploy`, `memory`

## Summary line

- Imperative mood: “add”, “fix”, not “added”, “fixed”  
- ≤72 characters  
- No period at end  

## Examples

```text
fix(web): correct listing detail route after create
feat(mobile): pull-to-refresh on saved listings
docs(memory): add deployment gates playbook
```

## Body (when needed)

- **Why** before **what**  
- Note Firebase index/rule deploy if separate from code merge  
- Reference issue: `Fixes #123`  

## Avoid

- `WIP`, `fix fix`, empty commits  
- Secrets or env values in messages  
