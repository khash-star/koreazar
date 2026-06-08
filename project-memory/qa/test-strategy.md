# Test Strategy

What Cursor should test after changes to this repository.

---

## When testing is required

| Change | Minimum scope |
|--------|----------------|
| `src/` (web) | `web-regression-tests.md` + affected Firebase/image/admin sections |
| `mobile/` | `mobile-regression-tests.md` + shared Firebase/image sections |
| Firebase rules/indexes | `firebase-tests.md` |
| PWA / TWA / `public/` | `pwa-twa-tests.md` |
| Admin / auth | `admin-rbac-tests.md` + auth in web/mobile |
| Upload / images | `image-upload-tests.md` |
| Push / FCM | `push-notification-tests.md` only if in scope |
| Release candidate | `pre-release-qa-checklist.md` (full) |

Skip deep QA for **project-memory / docs-only** PRs.

---

## Test environments

| Env | Use |
|-----|-----|
| **Local dev** | `npm run dev` (web), `cd mobile && npx expo start` |
| **Local build** | `npm run build` — catch Vite errors |
| **Staging / preview** | Vercel preview URL if available |
| **Production** | Post-release only — `../runbooks/production-verification.md` |

Record environment in `../templates/test-report.md`.

---

## Cursor workflow

1. Read `../PROJECT_MEMORY.md` — know critical paths (hybrid PHP/Firestore data-before-images on Home).  
2. Identify **blast radius** from diff (routes, services, rules, mobile).  
3. Run playbooks listed above (checklists, pass/fail).  
4. Fill `../templates/test-report.md` in the agent reply.  
5. If production-sensitive → `../reviews/self-review-workflow.md` + `../devops/deployment-gates.md`.  

---

## Priority order (time-boxed)

1. **Smoke** — app launches, Home loads, no console red errors  
2. **Changed feature** — paths touched in PR  
3. **Regression** — auth, listing create→detail, admin guard  
4. **Firebase** — if data layer changed  
5. **PWA/TWA / store** — only if deploy or `public/` changed  

---

## What not to claim

- “All tests pass” without listing checks run  
- Push notifications tested beyond implemented chat push scope  
- Production Firebase tested against wrong project ID from stale docs  

---

## Automation note

This repo has **no mandated E2E suite** in QA memory. CI may run build/lint (`.github/workflows/`). Manual/agent checklists are the default until team adds Playwright/Detox etc.
