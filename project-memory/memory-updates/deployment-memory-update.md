# Deployment Memory Update Workflow

## When required

- Vercel project settings, build command, or env vars changed  
- Custom domain, Cloudflare, or DNS changes  
- PWA / manifest / service worker shipped or changed  
- TWA `assetlinks.json` or Play Store deploy path updated  
- EAS profile, `app.json`, or mobile release process changed  

Skip if deploy configs unchanged (even if app code changed).

## What to record

- Production URL(s) and canonical domain  
- Build command (`npm run build`) and output dir (`dist/`)  
- Required `VITE_*` vars (names only — **no secret values**)  
- PWA/TWA prerequisites and verification URLs  
- EAS / store checklist pointers  

## How to summarize

- Bullet facts; link to `docs/PLAY_STORE_SETUP.md` or `docs/PWA_IMPLEMENTATION_PLAN.md` when still accurate  
- Note stale legacy names (`zarmongolia.com`, `zar-746103b7/`) if correcting memory  

## Files to update

| Target | Action |
|--------|--------|
| `../summaries/deployment_summary.md` | Update canonical deploy pointers |
| `../PROJECT_MEMORY.md` | Only if user approves — deployment section is high-traffic |
| `../runbooks/production-verification.md` | Add/remove verification steps |
| `../decisions/DECISION_LOG.md` | New deploy platform or domain strategy |

## Avoid

- Copying secrets into memory  
- Duplicating entire `VERCEL_*.md` clusters — summarize one canonical path  

## Verify against

- `vercel.json`, `vite.config.js`, `public/.well-known/assetlinks.json` (read-only check)  
- Live Vercel / Firebase consoles when possible  
