# Deployment Summary

> **Quick load:** `../PROJECT_MEMORY.md`  
> **Canonical detail:** `../../docs/DEPLOYMENT.md`

## Web and API

- Vercel builds the web root with `npm run build` and serves `dist/`.
- Production canonical domain is `https://zarkorea.com`; the Vercel default
  host redirects there.
- PHP is deployed separately to `api.zarkorea.com`; do not assume a Vercel
  deploy updates `api/index.php` or `api/regions.php`.
- Keep environment values in Vercel/cPanel/EAS; docs list names only.

## Database gates

| Change | Runbook |
|--------|---------|
| Listing `country_code` / `state_code` | `docs/MULTI_COUNTRY_DB_MIGRATION_PLAN.md` |
| US `region_code` + index | `docs/ZARUSA_STAGING_DEPLOY.md` |
| Scoped admin columns | `docs/ZARUSA_REGION_PHASES.md` (includes MySQL syntax warning) |

Always back up and verify the target database on staging. Repository state
does not prove that a production migration ran.

## Firebase ops

| Asset | Deploy / config |
|-------|-----------------|
| Firestore indexes | `firebase deploy --only firestore:indexes` · `docs/FIRESTORE_INDEXES.md` |
| Firestore rules | `firebase deploy --only firestore:rules` · `firestore.rules` |
| Storage rules | `firebase deploy --only storage` · `storage.rules` |
| Functions | `firebase deploy --only functions` · chat push pipeline |

## Mobile release

| Profile | Identity | Guide |
|---------|----------|-------|
| `production` | Zarkorea, `com.zarkorea.twa` | `mobile/docs/IOS_ANDROID_RELEASE_CHECKLIST.md` |
| `production-us` | ZAR-USA, `com.zarusa.app` | `mobile/docs/ZARUSA_BUILD.md` |

Both profiles share the Expo project slug. `production-us` selects US at
build time with `EXPO_PUBLIC_ACTIVE_COUNTRY=US`; it is not an in-app toggle.
Native Firebase file env resolution is documented in
`mobile/docs/ZARUSA_BUILD.md`.
