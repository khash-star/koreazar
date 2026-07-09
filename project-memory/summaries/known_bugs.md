# Known Bugs & Historical Fixes

> AI memory placeholder — incident docs archived under `docs/archive/`; not canonical architecture.  
> **Full inventory:** `../reports/MEMORY_ANALYSIS_REPORT.md` §2.5

## Likely resolved / obsolete

| Symptom | Source doc | Notes |
|---------|------------|--------|
| Base44 redirect on login | `docs/archive/historical-fixes/TROUBLESHOOTING.md` | Migration-era; likely obsolete |
| Migration status conflicts | `docs/archive/migration-snapshots/` | Snapshots may disagree with `README.md` |

## Recurring operational issues

| Symptom | Source doc | Typical cause |
|---------|------------|----------------|
| Listing “not found” after create | `docs/archive/historical-fixes/DEBUG_LISTING_CREATE.md`, `TROUBLESHOOTING_LISTING.md` | Routing, Firestore write, or rules |
| Admin-approved listing invisible | `docs/archive/historical-fixes/DEBUG_ADMIN_APPROVE.md` | Status filter / query index |
| Vercel build: `vite: command not found` | `docs/archive/historical-fixes/VERCEL_BUILD_FIX.md` | Use `npm run build`, not bare `vite` |
| Deploy not updating from GitHub | `docs/archive/historical-fixes/VERCEL_GITHUB_CONNECTION_FIX.md` | Git integration / branch |
| Storage 403 | `docs/archive/historical-fixes/FIREBASE_STORAGE_FIX.md` | Unpublished or wrong storage rules |
| Firestore index errors | `docs/archive/historical-fixes/FIRESTORE_INDEX_QUICK_FIX.md` | Missing composite index |
| Permissions denied | `docs/archive/firebase-legacy/FIREBASE_RULES_SETUP_NOW.md` | Rules not published or wrong project |
| Auth failures | `docs/archive/historical-fixes/LOGIN_TROUBLESHOOTING.md`, `QUICK_FIX_AUTH.md` | Config, cache, rules |
| Data missing after project switch | `docs/archive/firebase-legacy/FIREBASE_RESTORE_*.md` | Wrong Firebase project id |

## Doc hygiene risks (not runtime bugs)

- Stale path `zar-746103b7/` in archived guides
- Mixed Firebase project ids (`carsmongolia-d410a` vs `koreazar-32e7a`)
- Possible secrets in `docs/archive/vercel-legacy/VERCEL_QUICK_START.md` — scrub before public share

## Placeholder slots

- [ ] Active production bugs (date + owner)
- [ ] Regression checklist link → `TESTING_FLOW.md`
