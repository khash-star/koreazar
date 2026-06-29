# Deployment Summary

> Source-backed summary. Canonical details live in `docs/DEPLOYMENT.md`.  
> **Quick load:** `../PROJECT_MEMORY.md`

## Web hosting

- **Platform:** Vercel
- **Build:** `npm run build` → `dist/`
- **Config:** `vercel.json` (`framework: vite`, output `dist/`, SPA fallback to `/index.html`)
- **Env vars:** `VITE_FIREBASE_*`, `VITE_API_BASE_URL` on Vercel (see `docs/DEPLOYMENT.md`)

## Firebase ops

| Asset | Deploy / config |
|-------|-----------------|
| Firestore indexes | `firebase deploy --only firestore:indexes` · `docs/FIRESTORE_INDEXES.md` |
| Firestore rules | `firestore.rules` · `SECURITY.md` summary |
| Storage rules | Publish via Console · `STORAGE_RULES_GUIDE.md` |

## DNS / domain

- Production domain is **zarkorea.com**.
- Vercel default host **koreazar.vercel.app** redirects permanently to `https://zarkorea.com/`.
- Root `/` and `/:path+` redirects are separate in `vercel.json`; keep both when editing redirects.
- Cloudflare + Vercel: `CLOUDFLARE_VERCEL_DNS.md`, `DOMAIN_SETUP_GUIDE.md`; canonical runbook is `docs/DEPLOYMENT.md`.
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
