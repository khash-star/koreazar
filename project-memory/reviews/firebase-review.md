# Firebase Review

Use when changes touch **Auth, Firestore, Storage, FCM**, or security rules/indexes.

---

## Project & config

- [ ] Correct Firebase project (verify Console — prefer `koreazar-32e7a`; ignore stale `carsmongolia-d410a` in old docs)  
- [ ] Web: `VITE_*` env vars only; not hardcoded in source  
- [ ] Mobile: `mobile/.env` local only; EAS secrets for production builds  
- [ ] No service account keys or private keys in repo  

---

## Firestore

### Reads / writes

- [ ] Writes go through existing services where possible  
- [ ] No client write to admin-only collections without rules + UI guard  
- [ ] Conversations/messages: participant rules respected  
- [ ] Listings: create/update/delete match ownership rules  

### Indexes

- [ ] Every compound `where` + `orderBy` has index in `firestore.indexes.json`  
- [ ] `docs/FIRESTORE_INDEXES.md` still accurate  
- [ ] Console index build finished (not stuck “Building”)  

### Rules (user-approved only)

- [ ] `firestore.rules` diff reviewed for over-permissive `allow read, write`  
- [ ] `isAdmin()` / `users.role` checks intact for banners and admin paths  
- [ ] Messages `is_read` update rules allow receiver (see `FIRESTORE_RULES_UPDATE.md` if relevant)  
- [ ] Test mode rules **not** left in production  

---

## Storage

- [ ] Rules published in Console (`STORAGE_RULES_GUIDE.md`)  
- [ ] Upload paths match rules (`/images/` etc.)  
- [ ] 403 errors not introduced for legitimate user uploads  
- [ ] Image compression / validation before upload preserved  

---

## Authentication

- [ ] Email/password validation unchanged unless requested  
- [ ] Session persistence paths correct (web vs `AsyncStorage` mobile)  
- [ ] No disabled auth checks on protected operations  
- [ ] OAuth redirect URIs match deployment domain if OAuth touched  

---

## FCM / messaging

- [ ] Token handling not logging PII unnecessarily  
- [ ] Push only changed when explicitly in scope  
- [ ] No store metadata claiming push if not implemented  

---

## Unsafe patterns (reject or fix)

- `allow read, write: if true` in production rules  
- Queries without indexes on production  
- Direct `setDoc` on `users` role elevation from client without admin gate  
- Cross-project config copy-paste from old migration docs  

---

## Verification

- [ ] Firebase Console → Authentication: test user flow  
- [ ] Firestore → Data: sample listing CRUD  
- [ ] Storage: upload test image  
- [ ] Browser console: no permission-denied on happy path  
