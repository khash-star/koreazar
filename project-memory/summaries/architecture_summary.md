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
- Writes use URL-only country resolution. Unprefixed `/CreateListing` (and
  other `null` route codes) tags KR. US defaults to the sole active
  `washington-dc` region and DC/VA/MD state set.
- Unprefixed `/RequestBannerAd` uses `useActiveCountry()` for Storage (may
  follow localStorage). Admin approve currently creates `banner_ads` without
  `country_code` (Home treats missing as KR).
- `GET listing&id=` 404s US rows outside active `washington-dc`. Non-admins
  cannot self-assign `featured`/`vip`.
- Market-prefixed pages: Home, Create/Edit/Detail, Profile, My/Saved
  listings, Messages, Chat. Auth, AIBot, Privacy, monetization, and admin
  stay unprefixed. Web has no `/AdminUsers` page (role UI is on `AdminPanel`).
- `/Login` is unprefixed. Return path: `state.from` → `?redirect=` →
  `sessionStorage.loginRedirect` → KR `/`. Phone OTP list follows the
  redirect path (`/us` → `+1`).
- `index.html` canonical is always `https://zarkorea.com/`. Sitemap is KR
  public URLs only; `useMarketPageMeta` does not rewrite canonical.
- API scope is authoritative; `listingCountry.js` in web/mobile is a second
  feed guard.
- Region registry sync points: `src/config/regions/us.js`,
  `mobile/src/config/regions/us.js`, `api/regions.php`.

## Shared operational contracts

| Concern | Source of truth |
|---------|-----------------|
| Listing/category constants | `src/constants/listings.js` → `npm run sync-listings` |
| Admin roles/scope helpers | `src/constants/adminRoles.js` → `npm run sync-admin-roles` |
| Admin market home links | `src/hooks/useMarketHomePath.js` (scoped US → `/us`) |
| Home title / SEO / icons | `src/hooks/useMarketPageMeta.js` + country config |
| Storage paths | `src/utils/storagePaths.js` + mobile mirror |
| Phone auth email identity | `src/utils/emailNormalize.js` (`resolveAuthEmail`, KR/US variants) |
| Agent listing/auth/chat playbooks | `WORKFLOW_LISTINGS.md`, `WORKFLOW_AUTH.md`, `WORKFLOW_CHAT.md` |
| Firestore/MySQL fields | `docs/FIRESTORE_SCHEMA.md` |
| ZAR-USA rollout | `docs/ZARUSA_REGION_PHASES.md` |
| Chat and push | `docs/CHAT_SYSTEM.md`, `mobile/docs/CHAT_PUSH_SETUP.md` |
| Historical incident notes | `docs/archive/` (not canonical) |
