# Deployment Summary

> AI memory placeholder — expand from repo sources over time.  
> **Quick load:** `../PROJECT_MEMORY.md`

## Web hosting

- **Platform:** Vercel
- **Build:** `npm run build` → `dist/`
- **Canonical deploy guides (pick 1–2):** `VERCEL_DEPLOYMENT_GUIDE.md`, `VERCEL_ENV_SETUP.md`
- **Env vars:** `VITE_FIREBASE_*` on Vercel (see `FIREBASE_VERCEL_SETUP.md`)

## Firebase ops

| Asset | Deploy / config |
|-------|-----------------|
| Firestore indexes | `firebase deploy --only firestore:indexes` · `docs/FIRESTORE_INDEXES.md` |
| Firestore rules | `firestore.rules` · `SECURITY.md` summary |
| Storage rules | Publish via Console · `STORAGE_RULES_GUIDE.md` |

## DNS / domain

- Production domain documented as **zarkorea.com**
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
