# Self-Review Workflow

Standard post-implementation review for Cursor **before** marking a task complete.  
Use with `../CODING_SAFETY_CHECKLIST.md`, `../templates/change-report.md`, and domain playbooks below.

---

## When required

- Any application code change (`src/`, `mobile/`, `api/`)
- Architecture or routing changes
- Firebase, auth, admin, or deploy-adjacent changes
- Mobile **and** web touched in the same task

Skip only for **project-memory / docs-only** edits with no runtime impact.

---

## Review dimensions

Complete each section. Mark **N/A** with one-line reason if not applicable.

### 1. Architecture impact

- [ ] Fits web-at-root / `mobile/`-only layout  
- [ ] No duplicate service, API wrapper, or data layer  
- [ ] Query/service logic separate from display/UI components  
- [ ] Agents SQL (or PHP/service layer) not merged into presentation-only code  
- [ ] Shared constants synced if `src/constants/listings.js` changed (`npm run sync-listings`)  

### 2. Deployment impact

- [ ] No unintended edits to `vercel.json`, `app.json`, EAS profiles, rules, indexes  
- [ ] Build still `npm run build` → `dist/` (not bare `vite`)  
- [ ] Env assumptions documented (`VITE_*`; mobile `.env` not committed)  
- [ ] If deploy-related → run `deployment-review.md`  

### 3. Firebase impact

- [ ] Auth / Firestore / Storage / FCM paths unchanged or intentionally updated  
- [ ] New queries have matching indexes in `firestore.indexes.json`  
- [ ] Rules changes explicit and user-approved  
- [ ] If Firebase touched → run `firebase-review.md`  

### 4. Routing impact

- [ ] SPA routes (`react-router`) still resolve; no broken deep links  
- [ ] Protected routes and admin routes still guarded  
- [ ] `ListingDetail?id=...` and similar query-param patterns preserved  
- [ ] Mobile navigation stacks unchanged or intentionally updated  

### 5. Mobile / web compatibility

- [ ] Web-only vs mobile-only code in correct trees  
- [ ] Native vs web splits respected (Reanimated, `firebase.web.js`, storage shims)  
- [ ] Feature parity called out if only one platform changed  

### 6. Regression risks

- [ ] Home listings + banners load  
- [ ] Listing create → detail flow  
- [ ] Auth login / logout / register  
- [ ] Saved listings, messaging (if touched)  
- [ ] See `regression-review.md` for full checklist  

### 7. Duplicate logic risks

- [ ] No second implementation of same Firestore access pattern  
- [ ] No parallel auth client or listing fetch path  
- [ ] Reused `src/services/*`, `src/api/entities.js`, mobile services  

### 8. Performance risks

- [ ] Firestore-before-images pattern not broken on Home  
- [ ] No unbounded queries or missing pagination where list size matters  
- [ ] No new blocking work on critical path without reason  
- [ ] Image upload size/format limits preserved (see `SECURITY.md`)  

---

## Change audit format (required in reply)

After self-review, report using this structure:

| Section | Content |
|---------|---------|
| **Files changed** | Bullet list of paths |
| **Why changed** | One line per file or group |
| **Risks introduced** | Regressions, security, deploy, platform drift |
| **Rollback strategy** | Revert commit, flag revert, config rollback, or “single-file revert” |
| **Test plan** | Commands + manual steps (web and/or mobile) |
| **Production verification** | Steps from `../runbooks/production-verification.md` if deploy-related |

Template: `../templates/change-report.md` (add rollback + production verification sections there mentally if not filled).

---

## Domain deep-dives (run when applicable)

| Playbook | Trigger |
|----------|---------|
| `regression-review.md` | Always for code changes |
| `security-review.md` | Auth, admin, uploads, rules, env, user data |
| `firebase-review.md` | Firestore, Storage, Auth, FCM, indexes, rules |
| `deployment-review.md` | Vercel, PWA, TWA, EAS, env, release |

---

## Sign-off

- [ ] All applicable dimensions reviewed  
- [ ] Change audit format included in handoff  
- [ ] `pre-merge-checklist.md` satisfied  
