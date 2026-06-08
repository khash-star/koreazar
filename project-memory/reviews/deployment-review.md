# Deployment Review

Pre-deploy and post-deploy verification. **Requires explicit user approval** before changing deployment configs.

---

## Pre-deploy checklist

### Build success

- [ ] `npm run build` completes (repo root)  
- [ ] Output in `dist/` (`index.html`, hashed assets)  
- [ ] No `vite: command not found` on Vercel — build command is `npm run build`  
- [ ] **Mobile (if releasing):** EAS build profile documented; `mobile/docs/EAS_PRODUCTION_ENV.md`  

### Firebase indexes

- [ ] `firestore.indexes.json` matches all production queries  
- [ ] `firebase deploy --only firestore:indexes` run or indexes **Enabled** in Console  
- [ ] See `docs/FIRESTORE_INDEXES.md`  

### Vercel env vars

- [ ] `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, etc. set for Production + Preview  
- [ ] No secrets committed in repo markdown or source  
- [ ] Project root directory correct (repo root, not legacy `zar-746103b7/`)  

### PWA: manifest.json

- [ ] `dist/manifest.json` present if PWA enabled  
- [ ] `name`, `short_name`, `theme_color`, `start_url` correct  
- [ ] Icons 192/512 reachable on production domain  
- [ ] `vite-plugin-pwa` config matches `docs/PWA_IMPLEMENTATION_PLAN.md` if applicable  

### TWA: assetlinks.json

- [ ] `public/.well-known/assetlinks.json` deployed  
- [ ] `sha256_cert_fingerprints` matches signing key (not placeholder `00:00:...`)  
- [ ] Package name matches TWA (`com.zarkorea.twa` per Play docs)  
- [ ] Verify: Digital Asset Links / Bubblewrap fingerprint  

### Expo / EAS compatibility

- [ ] `mobile/app.json` unchanged unless release task  
- [ ] Production env vars in EAS secrets, not git  
- [ ] `npm run sync-listings` run if web categories changed before mobile release  
- [ ] Store checklist: `mobile/docs/IOS_ANDROID_RELEASE_CHECKLIST.md`  

### Cache issues

- [ ] Hard refresh / incognito test after deploy  
- [ ] Vercel deployment shows latest commit  
- [ ] Service worker update (`autoUpdate`) does not trap stale shell — verify one cold load  
- [ ] Expo: `npx expo start -c` if Metro bundle stale locally (dev only)  

---

## Post-deploy

- [ ] Run `../runbooks/production-verification.md`  
- [ ] Spot-check https://zarkorea.com (Home, auth, one listing)  
- [ ] Monitor Firebase Console for permission-denied spikes  

---

## Rollback strategy (document in change audit)

| Failure | Rollback |
|---------|----------|
| Bad web deploy | Redeploy previous Vercel deployment |
| Bad indexes | Revert `firestore.indexes.json` + redeploy indexes (careful) |
| Bad rules | Revert `firestore.rules` in Console/CLI with approval |
| Bad mobile release | Previous store version / EAS build |

---

## Stop deploy if

- Indexes not enabled for new queries  
- `assetlinks.json` still placeholder  
- Env vars missing on Vercel  
- Build uses wrong root or build command  
