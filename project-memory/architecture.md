# Koreazar Project Architecture

> Pointer file for agents. Canonical design: `docs/ARCHITECTURE.md`.
> Quick load: `summaries/architecture_summary.md`.

## Stack

* Web: React 18 + Vite 6 (repo root) → Vercel `dist/`
* Mobile: Expo / React Native in `mobile/` only
* Listings API: PHP + MySQL (`api/` → `api.zarkorea.com`)
* Firebase Auth, Firestore (chat/banners/users), Storage, Cloud Functions
* Expo Push via `onChatMessageCreatedPush`

## Shared systems

* Same PHP listings API for web and mobile
* Shared Firebase Auth / Firestore chat / Storage
* Shared listing constants (`npm run sync-listings`) and admin roles (`npm run sync-admin-roles`)
* Country registry: `src/config/country.js` (KR + US enabled; `/us` uses `lockCountrySelector`)

## Critical rules

* Never break Expo compatibility or mix `mobile/` into web `src/`
* Preserve Firebase auth (including phone OTP email variants)
* Writes use URL country (`resolveRouteCountryCode`), not `localStorage` (unprefixed create → KR)
* Do not weaken KR/US feed isolation or scoped admin RBAC
* Preserve push notification and SEO/market meta flows

## Deployment

* Web: Vercel
* Mobile: EAS (`production` KR, `production-us` ZAR-USA)
* API: separate PHP host — not Vercel. Windows: `npm run deploy:zarusa-api`. Linux/macOS: copy `index.php` + `regions.php`, then `smoke:zarusa-api`
* Firebase rules/indexes/functions via Firebase CLI

## Known risks

* Cross-market listing leaks if API or client filters are skipped
* Firestore vs MySQL admin scope drift (`firebase_uid` / email)
* EAS Firebase env / native config mismatch
* Metro cache and Expo dependency conflicts
