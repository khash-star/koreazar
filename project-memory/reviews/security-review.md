# Security Review

Use for auth, admin, uploads, rules, env, API, and production-facing changes.  
Align with repo root `SECURITY.md`.

---

## Firebase config exposure

- [ ] Only public web API keys in `VITE_*` (expected for Firebase web SDK)  
- [ ] No Admin SDK keys or service account JSON in repo  
- [ ] Example keys in old markdown (`VERCEL_QUICK_START.md`) not copied into code  
- [ ] `.env` / `.env.local` gitignored; not in change set  

---

## Firestore writes

- [ ] Client cannot write arbitrary fields on others’ `users` documents  
- [ ] Listings: only owner (or admin) can update/delete  
- [ ] Messages: sender/receiver constraints enforced in rules  
- [ ] No new collection with open `read, write: if request.auth != null` without field validation  
- [ ] Batch writes do not bypass ownership checks  

---

## Auth bypass risks

- [ ] Protected routes still check auth state before render/action  
- [ ] API/PHP endpoints (`api/`) require same auth model if touched  
- [ ] No “skip auth for debug” left enabled  
- [ ] JWT/session not exposed in URLs or logs  

---

## Admin RBAC regressions

- [ ] Admin UI hidden/disabled for `role !== 'admin'`  
- [ ] Firestore rules require admin for `banner_ads` and admin-only ops  
- [ ] Cannot self-assign `role: admin` from client without existing admin path  
- [ ] Admin message broadcast restricted to admin users  

---

## Unsafe uploads

- [ ] MIME/type check (JPG, PNG, WEBP)  
- [ ] Size cap (~5MB) enforced client-side (and rules where applicable)  
- [ ] Filenames/paths sanitized; no directory traversal  
- [ ] User content not executed as HTML without sanitization (`src/utils/security.js`)  

---

## Hardcoded secrets

- [ ] No OpenAI, OAuth client secrets, or private keys in source  
- [ ] Serverless/API uses env vars for secrets  
- [ ] No passwords or tokens in commit messages or project-memory examples  

---

## Deployment mistakes

- [ ] CSP / security headers in `vercel.json` not weakened  
- [ ] HTTPS enforced (Vercel default)  
- [ ] CORS not opened to `*` without justification  
- [ ] `assetlinks.json` and manifest served over HTTPS on production domain  
- [ ] Firestore/Storage rules published to **production** project, not test-only  

---

## Input & XSS

- [ ] Forms use validation helpers where applicable  
- [ ] `dangerouslySetInnerHTML` only where already justified (e.g. static chart CSS)  
- [ ] External URLs validated (`sanitizeURL`, `isValidURL`)  

---

## Sign-off

- [ ] No critical findings OR findings documented in change audit with mitigation  
- [ ] User informed if rules/env/deploy must change in Console/Vercel  
