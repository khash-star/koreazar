# Branch Strategy

## Default branches

| Branch | Purpose |
|--------|---------|
| `main` | Production-aligned; deploys to Vercel production when connected |
| Feature branches | Short-lived work off `main` |

## Naming

```text
feature/<short-description>
fix/<short-description>
docs/<short-description>
mobile/<short-description>
```

Examples: `feature/listing-filters`, `fix/admin-listing-visibility`, `mobile/chat-refresh`

## Rules

- Branch from latest `main` before starting  
- Keep PRs small and focused  
- Do not force-push `main` without team agreement  
- Mobile-only work may touch only `mobile/` when possible  
- Web-only work stays in repo root `src/`  

## Merge target

- All PRs → **`main`** unless explicitly using a release branch (team decision)

## What not to commit

- `.env`, secrets, keystores (`android.keystore`, `upload-keystore.jks`)  
- `node_modules/`, `dist/`, `mobile/.expo/`  
- Machine-specific `local.properties`  

See root `.gitignore`.
