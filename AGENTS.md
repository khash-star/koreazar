# AGENTS.md

## Cursor Cloud specific instructions

This repo contains three independent npm projects plus a PHP API. The **primary
product is the web app at the repo root** (Vite + React PWA). `mobile/` (Expo)
and `functions/` (Firebase Cloud Functions) are separate, optional products that
need extra toolchains/credentials and are not required to develop the web app.

### Web app (repo root) — primary scope
- Dev server: `npm run dev` → http://localhost:5173 (Vite binds `0.0.0.0`, so the
  Network URL also works). Scripts live in `package.json` (`dev`, `build`, `lint`,
  `preview`). `npm test` is a no-op placeholder ("No tests configured").
- **Critical gotcha — blank page without `.env`:** `src/firebase/config.js` calls
  `getAuth(app)` at module load. If `VITE_FIREBASE_*` env vars are missing/empty,
  Firebase throws `auth/invalid-api-key` and the **entire app renders a blank
  white page** (not just auth features). A `.env` with *present* `VITE_FIREBASE_*`
  values (even placeholders) is required for the app to boot. `.env` is gitignored
  — copy `.env.example` and fill it in. Real Firebase web credentials are only
  needed for auth/chat/storage/posting; placeholders are enough to render and browse.
- **Listings & AI come from a public PHP API**, not Firebase: defaults to
  `https://api.zarkorea.com/index.php` (override via `VITE_API_BASE_URL`). So
  browsing/viewing listings works with no Firebase setup, as long as `.env` exists
  so the app boots.
- Vite reads env at startup — **restart the dev server after editing `.env`**.
- `npm run lint` (eslint) runs but reports 2 pre-existing errors (`fetchpriority`
  casing) and many `no-unused-vars` warnings in existing code; these are not
  environment problems.
- `npm run build` runs `sync-listings` + PWA icon generation (uses native `sharp`)
  before `vite build`; outputs to `dist/`.

### mobile/ (Expo, optional)
- Install with `npm install` inside `mobile/` (`postinstall` runs `patch-package`;
  `prestart` runs `../scripts/sync-listings.mjs`). Start with `npm start`
  (Metro on 8081). Running on a device/emulator needs Expo + native toolchains;
  native Firebase modules require a dev client build (Expo Go is limited).

### functions/ (Firebase Cloud Functions, optional)
- Node 20 (pinned via `engines`). Install with `npm install` inside `functions/`.
  Runs in Firebase (push notifications); not needed for local web dev.

### api/ (PHP + MySQL, optional locally)
- The web app uses the hosted API by default, so a local PHP/MySQL stack is not
  required. To run locally: `php -S localhost:8000 -t api` with `api/.env`
  configured, then point `VITE_API_BASE_URL` at it.
