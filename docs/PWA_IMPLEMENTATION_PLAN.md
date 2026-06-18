# PWA implementation notes

PWA support is implemented for the Vite web app. This document records the
current source-backed setup and the checks to run when PWA behavior changes.

## Current state

| Item | Current value | Source |
|------|---------------|--------|
| Framework | Vite 6 + React 18 SPA on Vercel | `package.json`, `vite.config.js` |
| Plugin | `vite-plugin-pwa` with `registerType: 'autoUpdate'` | `vite.config.js` |
| Plugin order | `react()`, `nonBlockingCss()`, then `VitePWA(...)` | `vite.config.js` |
| Manifest filename | `manifest.json` (intentional; some hosts mishandle `*.webmanifest`) | `vite.config.js` |
| App name | `Zarkorea - Солонгос дахь Монголчуудын зарын сайт` | `vite.config.js` |
| Theme color | `#ea580c` | `vite.config.js` |
| Start/scope | `/` | `vite.config.js` |
| Icons | `/icon-192.png`, `/icon-512.png`; generated before build | `vite.config.js`, `scripts/generate-pwa-icons.mjs` |
| Build command | `npm run sync-listings && npm run generate-pwa-icons && vite build` | `package.json` |

## Workbox behavior

- Static precache includes `js`, `css`, `html`, `ico`, `png`, and `svg` build
  artifacts.
- SPA navigations fall back to `/index.html`.
- Service worker, Workbox, register, and manifest assets are excluded from
  navigation fallback.
- Firebase Storage image URLs are runtime-cached with `CacheFirst` and bounded
  by entry count/age.

## Data constraints

- The service worker does **not** make the app offline-first.
- Listings still require the PHP/MySQL API (`api/index.php`).
- Banner/chat/saved/config/report data still require Firestore permissions and
  network access unless Firebase SDK caching is explicitly added later.
- Native chat push is not web push; it is handled by Expo + Firebase Functions
  for the Expo mobile app.

## Verification checklist

Run this when changing `vite.config.js`, PWA assets, CSP headers, or deploy
behavior:

1. `npm run build`
2. Confirm `dist/manifest.json`, `dist/sw.js`, `dist/registerSW.js`, and
   Workbox assets exist.
3. `npm run preview`
4. Open `/`, `/Login`, and a deep SPA route such as `/ListingDetail?id=1`.
5. Browser DevTools -> Application:
   - Manifest loads from `/manifest.json`.
   - Service worker is registered and active.
   - Storage image runtime cache appears after viewing image-backed content.
6. Confirm online data still loads from both backends:
   - listings via PHP API;
   - banners/chat/etc. via Firestore.

## TWA note

If the legacy/alternate TWA path is used, Bubblewrap should point to:

```bash
npx @bubblewrap/cli init --manifest=https://zarkorea.com/manifest.json
```

Keep `public/.well-known/assetlinks.json` synchronized with the real signing
fingerprint for the TWA package.

## Rollback

If a PWA change causes a production regression:

1. Revert the commit that changed `vite.config.js`, icon generation, or CSP.
2. Rebuild with `npm run build`.
3. Redeploy the previous known-good Vercel build if needed.
4. Instruct testers to unregister the service worker or clear site data when
   validating the rollback locally.
