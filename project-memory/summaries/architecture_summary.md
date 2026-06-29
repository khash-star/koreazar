# Architecture Summary

> Source-backed summary. Canonical details live in `docs/ARCHITECTURE.md`.
> **Quick load:** `../PROJECT_MEMORY.md`

## Stack (web)

- React 18 + Vite 6 + TailwindCSS SPA on Vercel
- Listings through PHP/MySQL API (`api/index.php`) via `VITE_API_BASE_URL`
- Firebase Auth, Firestore, Storage, and Cloud Functions for auth-adjacent data, chat, banners, saved listings, images, and push
- PWA via `vite-plugin-pwa`, output manifest is `manifest.json`

## Key subsystems (source docs)

| Topic | Canonical source |
|-------|------------------|
| System design, routes, services | `docs/ARCHITECTURE.md` |
| Firebase collections, rules, functions | `docs/FIREBASE.md` |
| Messaging / chat | `docs/CHAT_SYSTEM.md` |
| Image load performance | `docs/IMAGE_LOAD_ANALYSIS.md` |
| PWA plan / TWA context | `docs/PWA_IMPLEMENTATION_PLAN.md`, `docs/PLAY_STORE_SETUP.md` |
| SEO and app distribution URLs | `index.html`, `public/robots.txt`, `public/sitemap.xml`, `src/constants/appUrls.js` |

## Repo layout

- **Web:** repository root (`src/`, `public/`)
- **Mobile:** `mobile/` only (Expo RN) — do not mix with web `src/`
- **Shared listing constants:** author in `src/constants/listings.js`, sync via `npm run sync-listings`

## Notes

- Service layer map and auth flow are documented in `docs/ARCHITECTURE.md`.
- Firestore/MySQL schemas are documented in `docs/FIRESTORE_SCHEMA.md`.
- Play Store URL and package constants live in `src/constants/appUrls.js`; footer UI imports `PLAY_STORE_URL`.
