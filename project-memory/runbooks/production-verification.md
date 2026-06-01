# Production Verification (template)

Run after web deploy or when validating production behavior. **Confirm URLs and project IDs in console — do not trust stale docs.**

## Web (Vercel)

- [ ] https://zarkorea.com loads  
- [ ] Home: listings + banners load (no index errors in browser console)  
- [ ] Login / logout works  
- [ ] Listing create → detail navigation works  
- [ ] Admin pages reachable only for `role: admin`  

## Firebase

- [ ] Project ID matches production (`koreazar-32e7a` — verify in console)  
- [ ] Firestore indexes **Enabled** for banner/chat/saved-listing queries  
- [ ] Storage rules published if image upload tested  
- [ ] No widespread `permission-denied` in console  

## PWA / TWA (if applicable)

- [ ] `manifest.json` served  
- [ ] Service worker registered  
- [ ] `public/.well-known/assetlinks.json` has real SHA-256 (not placeholder)  

## Mobile (if release-related)

- [ ] EAS build used production env (`mobile/docs/EAS_PRODUCTION_ENV.md`)  
- [ ] `IOS_ANDROID_RELEASE_CHECKLIST.md` sign-off  

## Rollback trigger

- Index missing → deploy indexes or hotfix query  
- Rules too strict → review `firestore.rules` with explicit approval  
- Auth broken → check `VITE_*` on Vercel and Firebase Auth providers  
