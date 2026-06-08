# Release Workflow

Use for production web deploy and/or mobile store submission.

## Pre-release (all)

- [ ] `main` green; PR merged with full template  
- [ ] `../reviews/self-review-workflow.md` completed  
- [ ] `../memory-updates/AUTO_MEMORY_UPDATE_RULES.md` evaluated  
- [ ] No uncommitted secrets; `.env` not in repo  

---

## Build checks (web)

- [ ] `npm install` (root)  
- [ ] `npm run build` → `dist/` without errors  
- [ ] Build command on Vercel is `npm run build` (not bare `vite`)  
- [ ] Output directory `dist`  

---

## Firebase checks

- [ ] Correct production project (verify Console — e.g. `koreazar-32e7a`)  
- [ ] `firestore.indexes.json` deployed: `firebase deploy --only firestore:indexes`  
- [ ] `firestore.rules` / `storage.rules` published if changed  
- [ ] No test-mode rules in production  
- [ ] Auth providers enabled as required  

See `../reviews/firebase-review.md`, `docs/FIRESTORE_INDEXES.md`.

---

## Vercel checks

- [ ] `VITE_FIREBASE_*` set for Production (and Preview if used)  
- [ ] `VITE_API_BASE_URL` set only if overriding the default PHP API host  
- [ ] Custom domain `zarkorea.com` resolves  
- [ ] Latest commit deployed  
- [ ] PWA: `manifest.json` + SW if feature enabled (`docs/PWA_IMPLEMENTATION_PLAN.md`)  
- [ ] TWA: `public/.well-known/assetlinks.json` real SHA-256 if Android shell updated  

See `../reviews/deployment-review.md`, `../runbooks/production-verification.md`.

---

## Play Store / App Store (if mobile affected)

- [ ] `npm run sync-listings` from repo root if web `listings.js` changed  
- [ ] `mobile/docs/EAS_PRODUCTION_ENV.md` — production Firebase env in EAS  
- [ ] `mobile/docs/IOS_ANDROID_RELEASE_CHECKLIST.md` signed off  
- [ ] Push claims match implemented scope: chat push only unless another push flow was added/tested  
- [ ] TWA vs RN path clear: `docs/PLAY_STORE_SETUP.md` vs `mobile/docs/PLAY_STORE_RN_REPLACE_TWA.md`  

---

## Deploy / tag (team practice)

- Web: merge to `main` → Vercel production deploy (or manual promote)  
- Mobile: EAS build + store submit per team process  
- Optional git tag: `vYYYY.MM.DD` or semver  

---

## Post-release verification

- [ ] `../runbooks/production-verification.md`  
- [ ] Home, auth, create/view listing, admin spot-check  
- [ ] Mobile smoke on TestFlight / internal track if applicable  
- [ ] Monitor Firebase/Vercel for errors 24h  
- [ ] Log release in `../decisions/DECISION_LOG.md` or memory update if major  

---

## Rollback

If verification fails → `rollback-workflow.md` immediately.
