# Koreazar / Zarkorea

Mongolian-language classifieds platform: **Zarkorea** (Korea) and **ZAR-USA** (Washington DC / DMV). Web and Expo mobile share Firebase Auth/Firestore/Storage and a PHP + MySQL listings API.

## Stack

| Layer | Technology |
|-------|------------|
| Web | React 18 + Vite 6 + Tailwind — repo root → Vercel (`dist/`) |
| Mobile | Expo / React Native — `mobile/` only |
| Auth / chat / storage | Firebase project `koreazar-32e7a` |
| Listings API | PHP + MySQL at `api.zarkorea.com` (`api/`) |
| Push | Cloud Functions → Expo Push |

## Quick start (web)

```bash
npm install
cp .env.example .env   # fill VITE_FIREBASE_* and VITE_API_BASE_URL
npm run dev
```

- Root `/` is the KR home. Market routes: `/kr`, `/us` (JP is scaffolded at `/jp`).
- Production web: https://zarkorea.com · API: https://api.zarkorea.com/index.php

Mobile setup: `mobile/` + [`mobile/docs/`](./mobile/docs/). ZAR-USA builds use the `production-us` EAS profile.

## Documentation (canonical)

| Doc | Topic |
|-----|--------|
| [`docs/PROJECT_MEMORY.md`](./docs/PROJECT_MEMORY.md) | Product/stack overview and doc map |
| [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) | System design, markets, data flows |
| [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) | Vercel, Firebase, EAS, PHP API deploy |
| [`docs/FIREBASE.md`](./docs/FIREBASE.md) | Auth, Firestore, Storage, Functions |
| [`docs/TROUBLESHOOTING.md`](./docs/TROUBLESHOOTING.md) | Common failures and fixes |
| [`docs/ZARUSA_REGION_PHASES.md`](./docs/ZARUSA_REGION_PHASES.md) | ZAR-USA region + scoped admin RBAC |
| [`docs/ZARUSA_STAGING_DEPLOY.md`](./docs/ZARUSA_STAGING_DEPLOY.md) | US staging checklist and DB gates |
| [`project-memory/`](./project-memory/) | Agent workflows, QA playbooks, summaries |

Historical / superseded guides live under [`docs/archive/`](./docs/archive/) — not canonical.

Secondary root guides that are still useful: [`FIREBASE_VERCEL_SETUP.md`](./FIREBASE_VERCEL_SETUP.md), [`VERCEL_ENV_SETUP.md`](./VERCEL_ENV_SETUP.md), [`GITHUB_SETUP.md`](./GITHUB_SETUP.md).

## Multi-market notes (developers)

- Public selector: `ENABLED_COUNTRIES` in `src/config/country.js` (currently `KR` + `US`).
- `/us` locks the country selector via `lockCountrySelector` on the US config.
- Listing writes use **URL** country (`resolveRouteCountryCode`), not `localStorage`. Unprefixed `/CreateListing` tags KR — use `/us/CreateListing` for ZAR-USA.
- Banner requests (`/RequestBannerAd`) stay unprefixed and use `useActiveCountry()` for Storage. Approving a request without `country_code` shows the banner on KR; set market on `/AdminBanners`.
- KR feeds are isolated by API (`append_kr_listing_read_filter`) and client (`filterListingsForMarket`). US listing **detail** 404s outside active `washington-dc`.
- Admin pages are unprefixed; back-links use `useMarketHomePath` so US admins return to `/us`.
- `/Login` is unprefixed. After auth, return to `state.from` / `?redirect=` / `sessionStorage.loginRedirect`, else KR `/`. Login from `/us` Home should return to `/us`.
- Canonical host is `https://zarkorea.com` (`vercel.json` 301 from `koreazar.vercel.app`; `/mn` → `/kr`). Sitemap/canonical do not currently list `/us`.

## License

Copyright © 2026 KHASH Co Ltd
