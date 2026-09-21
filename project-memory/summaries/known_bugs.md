# Known Bugs & Historical Fixes

> Prefer live runbooks in `docs/TROUBLESHOOTING.md`. Archive paths below are
> historical only — verify against current code before acting.
> **Inventory:** `../reports/MEMORY_ANALYSIS_REPORT.md` §2.5

## Active multi-market pitfalls

| Symptom | Canonical fix | Source |
|---------|---------------|--------|
| US / regional rows appear on KR home | API `append_kr_listing_read_filter` + client `filterListingsForMarket`; data correction via `api/sql/fix_us_listings_country_code.sql` after backup | `docs/TROUBLESHOOTING.md`, `docs/ZARUSA_REGION_PHASES.md` |
| US admin “Home” drops to KR `/` | Admin back-links must use `useMarketHomePath` | `src/hooks/useMarketHomePath.js` |
| Web admin UI works, PHP listing write 403 | MySQL `users` missing/`firebase_uid` or email mismatch; PHP scope lookup is UID then email | `docs/ZARUSA_REGION_PHASES.md` |
| `/us` shows KR in country selector | US is already in `ENABLED_COUNTRIES`; lock is `lockCountrySelector` on `us.js` via `getSelectableCountryCodes()` | `src/config/countries/us.js`, `src/config/country.js` |
| Phone OTP chat permission denied | Participant emails must include phone auth variants (`resolveAuthEmail`) | `docs/CHAT_SYSTEM.md`, `docs/TROUBLESHOOTING.md` |
| Login from `/us` lands on KR `/` | Home must pass `state.from`; guarded pages must call `redirectToLogin`. Bare `/Login` is KR | `docs/TROUBLESHOOTING.md`, `Login.jsx` |
| Preview/default host indexed | Only `koreazar.vercel.app` 301s to `zarkorea.com`; sitemap has no `/us` | `vercel.json`, `docs/DEPLOYMENT.md` |

## Likely resolved / obsolete

| Symptom | Source doc | Notes |
|---------|------------|--------|
| Base44 redirect on login | `docs/archive/historical-fixes/TROUBLESHOOTING.md` | Migration-era |
| Migration status conflicts | `docs/archive/migration-snapshots/` | Snapshots may disagree with current `README.md` |
| Root README still claiming “migration in progress” | Fixed in engineering docs refresh | Use `docs/*` |

## Recurring operational issues (archive pointers)

| Symptom | Source doc | Typical cause |
|---------|------------|----------------|
| Listing “not found” after create | `docs/archive/historical-fixes/DEBUG_LISTING_CREATE.md` | Prefer current listingService + MySQL API path |
| Admin-approved listing invisible | `docs/archive/historical-fixes/DEBUG_ADMIN_APPROVE.md` | Check MySQL `status` + market filters first |
| Vercel build: `vite: command not found` | `docs/archive/historical-fixes/VERCEL_BUILD_FIX.md` | Use `npm run build` |
| Deploy not updating from GitHub | `docs/archive/historical-fixes/VERCEL_GITHUB_CONNECTION_FIX.md` | Git integration / branch |
| Storage 403 | `docs/archive/historical-fixes/FIREBASE_STORAGE_FIX.md` | Unpublished or wrong storage rules |
| Firestore index errors | `docs/archive/historical-fixes/FIRESTORE_INDEX_QUICK_FIX.md` | Missing composite index |
| Auth failures | `docs/archive/historical-fixes/LOGIN_TROUBLESHOOTING.md` | Config, cache, rules |

## Doc hygiene risks (not runtime bugs)

- Stale path `zar-746103b7/` in archived guides
- Mixed Firebase project ids (`carsmongolia-d410a` vs `koreazar-32e7a`)
- Possible secrets in `docs/archive/vercel-legacy/VERCEL_QUICK_START.md` — scrub before public share
- Root `*_FIX.md` and migration snapshots were moved to `docs/archive/` — do not treat them as current architecture
