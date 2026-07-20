# Architecture Summary

> **Quick load:** `../PROJECT_MEMORY.md`  
> **Canonical detail:** `../../docs/ARCHITECTURE.md`

## Runtime shape

- Web: React 18 + Vite 6 SPA at repo root; Vercel serves `dist/`.
- Mobile: Expo/React Native under `mobile/`; keep native and web bundles
  separate.
- Listings: shared PHP/MySQL API (`api/index.php`) for both clients.
- Firebase: Auth, Firestore adjunct data, Storage, and chat push Functions.

## Market model

- Root `/` is KR. `/kr`, `/us`, and `/jp` mount the main listing workflow.
- KR and US are enabled; JP is route-testable but not publicly selectable.
- Writes use URL-only country resolution. US defaults to the sole active
  `washington-dc` region and DC/VA/MD state set.
- API scope is authoritative; `listingCountry.js` in web/mobile is a second
  feed guard.
- Region registry sync points: `src/config/regions/us.js`,
  `mobile/src/config/regions/us.js`, `api/regions.php`.

## Shared operational contracts

| Concern | Source of truth |
|---------|-----------------|
| Listing/category constants | `src/constants/listings.js` → `npm run sync-listings` |
| Admin roles/scope helpers | `src/constants/adminRoles.js` → `npm run sync-admin-roles` |
| Storage paths | `src/utils/storagePaths.js` + mobile mirror |
| Firestore/MySQL fields | `docs/FIRESTORE_SCHEMA.md` |
| ZAR-USA rollout | `docs/ZARUSA_REGION_PHASES.md` |
| Chat and push | `docs/CHAT_SYSTEM.md`, `mobile/docs/CHAT_PUSH_SETUP.md` |
