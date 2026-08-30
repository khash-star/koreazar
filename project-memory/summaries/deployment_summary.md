# Deployment Summary

> AI memory placeholder — expand from repo sources over time.  
> **Quick load:** `../PROJECT_MEMORY.md`

## Web hosting

- **Platform:** Vercel
- **Build:** `npm run build` → `dist/`
- **Canonical domain:** `https://zarkorea.com`
- **Preview host redirect:** `koreazar.vercel.app` permanently redirects same-path requests to `zarkorea.com` via `vercel.json`
- **Canonical deploy guides (pick 1–2):** `VERCEL_DEPLOYMENT_GUIDE.md`, `VERCEL_ENV_SETUP.md`
- **Env vars:** `VITE_FIREBASE_*` on Vercel (see `FIREBASE_VERCEL_SETUP.md`)
- **SEO/public artifacts:** `index.html` canonical/OG/JSON-LD, `public/robots.txt`, `public/sitemap.xml`, `src/constants/appUrls.js`

## Firebase ops

| Asset | Deploy / config |
|-------|-----------------|
| Firestore indexes | `firebase deploy --only firestore:indexes` · `docs/FIRESTORE_INDEXES.md` |
| Firestore rules | `firestore.rules` · `SECURITY.md` summary |
| Storage rules | Publish via Console · `STORAGE_RULES_GUIDE.md` |

## DNS / domain

- Production domain documented as **zarkorea.com**
- Vercel preview host **koreazar.vercel.app** should not index separately; verify permanent redirect after deploy
- Cloudflare + Vercel: `CLOUDFLARE_VERCEL_DNS.md`, `DOMAIN_SETUP_GUIDE.md`
- **Risk:** older docs mention `zarmongolia.com` — verify live DNS

## Mobile release

| Path | Doc |
|------|-----|
| Play Store TWA | `docs/PLAY_STORE_SETUP.md` |
| RN replaces TWA | `mobile/docs/PLAY_STORE_RN_REPLACE_TWA.md` |
| EAS production env | `mobile/docs/EAS_PRODUCTION_ENV.md` |
| Store QA checklist | `mobile/docs/IOS_ANDROID_RELEASE_CHECKLIST.md` |

## Placeholder slots

- [ ] Single Vercel project settings snapshot (root dir, build cmd)
- [ ] EAS profile names and bundle IDs
- [ ] Production Firebase project ID (confirm `koreazar-32e7a` vs stale docs)
