# QA & Testing Automation

Manual and agent-driven test playbooks for Koreazar. **Documentation only** — no test runners added to the repo.

## When to use

After code changes, before PR merge, and on release day. Pair with:

- `../CODING_SAFETY_CHECKLIST.md`
- `../reviews/self-review-workflow.md`
- `../devops/deployment-gates.md`
- `../devops/release-workflow.md`

## Playbooks

| Doc | Scope |
|-----|--------|
| `test-strategy.md` | What Cursor should test after changes |
| `web-regression-tests.md` | Vite/React SPA |
| `mobile-regression-tests.md` | Expo `mobile/` |
| `firebase-tests.md` | Auth, Firestore, Storage, indexes, rules |
| `pwa-twa-tests.md` | Manifest, SW, assetlinks, TWA |
| `admin-rbac-tests.md` | Admin routes and `users.role` |
| `image-upload-tests.md` | Upload, preview, detail, lightbox |
| `push-notification-tests.md` | FCM / Expo push (if in scope) |
| `pre-release-qa-checklist.md` | Pass/fail gate before ship |

## Report

`../templates/test-report.md` — handoff after test pass.

## Legacy reference

Root `TESTING_FLOW.md` (auth + listing flow) — still valid; QA docs extend it.

**Source of truth:** When QA docs and code disagree, **source code wins** — verify routes and services in repo.
