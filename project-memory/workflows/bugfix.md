# Workflow: Bugfix

## Preconditions

- [ ] Check `../summaries/known_bugs.md` for prior incidents  
- [ ] Reproduce or trace from user report / logs  

## Steps

1. **Root cause** — Confirm in source, not only in `DEBUG_*.md` or `*_FIX.md` at repo root.  
2. **Minimal fix** — Target the failing path; no unrelated refactors.  
3. **Side effects** — Auth session, admin visibility, listing queries, image load order (Firestore before images).  
4. **Regression** — Note what else could break; suggest focused retest.  
5. **Report** — Use `../templates/change-report.md`.  

## Common areas (see known_bugs summary)

- Listing not found after create  
- Admin-approved listing not visible  
- Permissions / missing indexes  
- Vercel build command (`npm run build`, not bare `vite`)  
