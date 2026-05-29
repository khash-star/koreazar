# Known Bugs & Historical Fixes

> AI memory placeholder — incident docs at repo root; not canonical architecture.  
> **Full inventory:** `../reports/MEMORY_ANALYSIS_REPORT.md` §2.5

## Likely resolved / obsolete

| Symptom | Source doc | Notes |
|---------|------------|--------|
| Base44 redirect on login | `TROUBLESHOOTING.md` | Migration-era; likely obsolete |
| Migration status conflicts | `CURRENT_STATUS.md`, `MIGRATION_COMPLETE.md` | Snapshots may disagree with `README.md` |

## Recurring operational issues

| Symptom | Source doc | Typical cause |
|---------|------------|----------------|
| Listing “not found” after create | `DEBUG_LISTING_CREATE.md`, `TROUBLESHOOTING_LISTING.md` | Routing, Firestore write, or rules |
| Admin-approved listing invisible | `DEBUG_ADMIN_APPROVE.md` | Status filter / query index |
| Vercel build: `vite: command not found` | `VERCEL_BUILD_FIX.md` | Use `npm run build`, not bare `vite` |
| Deploy not updating from GitHub | `VERCEL_GITHUB_CONNECTION_FIX.md` | Git integration / branch |
| Storage 403 | `FIREBASE_STORAGE_FIX.md` | Unpublished or wrong storage rules |
| Firestore index errors | `FIRESTORE_INDEX_QUICK_FIX.md` | Missing composite index |
| Permissions denied | `FIREBASE_RULES_SETUP_NOW.md` | Rules not published or wrong project |
| Auth failures | `LOGIN_TROUBLESHOOTING.md`, `QUICK_FIX_AUTH.md` | Config, cache, rules |
| Data missing after project switch | `FIREBASE_RESTORE_*.md` | Wrong Firebase project id |

## Resolved critical regressions

| Date | Symptom / impact | Root cause | Fix / verification |
|------|------------------|------------|--------------------|
| 2026-05-29 | Any authenticated user could read `saved_listings`; any authenticated user could read/create arbitrary chat `messages`; mobile phone-account deletion could purge data before stale Auth sessions were rejected. | `firestore.rules` allowed broad message/saved reads/writes, `users/{uid}` self-delete was admin-only during deletion cleanup, and phone delete had no recent-login preflight. | Tightened saved/message rules to owner/conversation participants, allowed self profile delete for account cleanup, deleted chat messages before conversations, and preflighted phone delete auth recency. Verified with `npm run build`, changed-file ESLint, JS syntax checks, and Firestore emulator rules parse. |

## Doc hygiene risks (not runtime bugs)

- Stale path `zar-746103b7/` in many guides
- Mixed Firebase project ids (`carsmongolia-d410a` vs `koreazar-32e7a`)
- Possible secrets in `VERCEL_QUICK_START.md` — scrub before public share

## Placeholder slots

- [ ] Active production bugs (date + owner)
- [ ] Regression checklist link → `TESTING_FLOW.md`
