# Regression Review

Checklist after code changes. Use with `self-review-workflow.md`.

---

## Routing

- [ ] `/` (Home) loads without console errors  
- [ ] `/Login`, `/Register` redirect behavior correct when authenticated / guest  
- [ ] `/ListingDetail?id=` opens correct listing  
- [ ] Admin routes (`Admin*`) unreachable without `role: admin`  
- [ ] Browser back/forward works on SPA routes  
- [ ] Mobile: tab/stack navigation reaches same logical screens  
- [ ] Deep links `zarkorea://` (mobile) if navigation code changed  

---

## Firestore queries & indexes

- [ ] Home: PHP API listings load and Firestore banners load
- [ ] My listings: PHP API filters by `firebase_uid` / `customer_id` / `created_by` as applicable
- [ ] Chat/saved-listing Firestore queries succeed
- [ ] No `failed-precondition` / index errors in console  
- [ ] `firestore.indexes.json` updated if query shape changed  
- [ ] Banner ads query (`banner_ads`, `is_active`) works  

---

## Image uploads

- [ ] Create/edit listing upload succeeds  
- [ ] Images appear in Storage and on detail view  
- [ ] Format validation (JPG, PNG, WEBP) still enforced  
- [ ] Size limit (~5MB) respected  
- [ ] No 403 from unpublished storage rules (production)  
- [ ] Mobile native vs web storage shims still used correctly  

---

## Push notifications (FCM)

- [ ] **If not implementing push:** no new FCM permission prompts or store claims  
- [ ] **If FCM touched:** token registration, foreground/background behavior documented  
- [ ] No broken auth flow from notification handlers  

_Note: mobile chat push is implemented through Expo push tokens and `functions/index.js`; listing/status push is not implemented._

---

## Auth & session logic

- [ ] Register creates Auth user + Firestore `users` doc  
- [ ] Login persists session (web refresh; mobile AsyncStorage on native)  
- [ ] Logout clears state and protected routes  
- [ ] Password reset email flow (if touched)  
- [ ] OAuth flows (Kakao/Facebook) unchanged unless task scope  
- [ ] No auth bypass on API or Firestore writes  

---

## Admin guards

- [ ] `users.role === 'admin'` required for admin UI/actions  
- [ ] Non-admin cannot mutate `banner_ads` or admin-only collections  
- [ ] Admin approve listing → visible in expected queries  
- [ ] Admin messaging / broadcast (if touched) still restricted  

---

## Mobile app compatibility

- [ ] `npx expo start` / platform target builds  
- [ ] Same Firebase project as web (env not committed)  
- [ ] Listing constants match web after sync if constants changed  
- [ ] Reanimated only on native bundles  
- [ ] Account deletion flow (if touched) per store requirements  

---

## PWA / TWA behavior

- [ ] `manifest.json` served on production (if PWA enabled)
- [ ] Service worker registers; offline fallback acceptable for scope  
- [ ] `start_url` `/` loads app shell  
- [ ] `public/.well-known/assetlinks.json` valid for TWA (real SHA-256)  
- [ ] No broken navigate fallback for SPA routes  

---

## Quick smoke (minimum)

```text
Web:  npm run dev → Home → Login → one listing → logout
Mobile (if touched): cd mobile && npx expo start → Home → Login → one listing
```
