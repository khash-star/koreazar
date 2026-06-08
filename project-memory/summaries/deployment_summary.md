# Deployment Summary

> **Quick load:** `../PROJECT_MEMORY.md`  
> Verify project IDs, secrets, and hosting targets in the relevant console before
> release work. Do not copy values from stale migration guides.

## Web hosting

- **Platform:** Vercel.
- **Build:** `npm run build` -> `dist/`.
- **Build side effects:** runs `npm run sync-listings` and `npm run generate-pwa-icons` before `vite build`.
- **PWA output:** `vite-plugin-pwa` emits `manifest.json`, `sw.js`, and Workbox/register assets.
- **Canonical deploy guides (pick 1-2):** `VERCEL_DEPLOYMENT_GUIDE.md`, `VERCEL_ENV_SETUP.md`.

## Runtime endpoints and env

| Runtime | Key env/config | Source |
|---------|----------------|--------|
| Web SPA | `VITE_FIREBASE_*`, optional `VITE_API_BASE_URL` | `src/firebase/config.js`, `src/services/listingService.js` |
| Mobile Expo | `EXPO_PUBLIC_FIREBASE_*`, optional `EXPO_PUBLIC_API_BASE_URL`, EAS credentials/files | `mobile/src/config/firebase.js`, `mobile/src/services/apiClient.js`, `mobile/docs/EAS_PRODUCTION_ENV.md` |
| PHP API | MySQL connection env, Firebase verification setup, `OPENAI_API_KEY`, optional `OPENAI_MODEL`, `APP_DEBUG` | `api/bootstrap.php`, `api/index.php` |
| Firebase Functions | Firebase project selection, Expo push delivery network access | `functions/index.js`, `mobile/docs/CHAT_PUSH_SETUP.md` |

## Firebase ops

| Asset | Deploy / config |
|-------|-----------------|
| Firestore indexes | `firebase deploy --only firestore:indexes` · `docs/FIRESTORE_INDEXES.md` |
| Firestore rules | `firebase deploy --only firestore:rules` · `firestore.rules` |
| Chat push function | `cd functions && npm install && cd ..` then `firebase deploy --only functions` (or combined with rules per push doc) |
| Storage rules | Publish via Console or Firebase CLI when explicitly in scope · `STORAGE_RULES_GUIDE.md` |

## PHP API deployment gate

- Web and mobile listing flows depend on `api/index.php`; verify the API host before deploys that touch listings, AI, or user sync.
- `GET ?action=health` should return JSON with `ok: true` and `db: connected`.
- Protected routes require a valid Firebase ID token; do not move OpenAI keys or MySQL credentials into `VITE_*` / `EXPO_PUBLIC_*` variables.

## DNS / domain

- Production web domain documented as **zarkorea.com**.
- Listings API default is **https://api.zarkorea.com/index.php**.
- Cloudflare + Vercel: `CLOUDFLARE_VERCEL_DNS.md`, `DOMAIN_SETUP_GUIDE.md`.
- **Risk:** older docs mention `zarmongolia.com` or old Firebase project IDs; verify live DNS/project settings.

## Mobile release

| Path | Doc |
|------|-----|
| Expo RN production path | `mobile/README.md`, `mobile/docs/EAS_PRODUCTION_ENV.md` |
| RN replaces TWA | `mobile/docs/PLAY_STORE_RN_REPLACE_TWA.md` |
| Store QA checklist | `mobile/docs/IOS_ANDROID_RELEASE_CHECKLIST.md` |
| Chat push setup | `mobile/docs/CHAT_PUSH_SETUP.md` |
| Legacy/alternate Play Store TWA | `docs/PLAY_STORE_SETUP.md` |

## Remaining gaps

- Single Vercel project settings snapshot (root dir, build command, output).
- Confirmed production Firebase project ID and EAS profile names from console.
- PHP API host deployment runbook (outside the Vercel SPA deploy path).
