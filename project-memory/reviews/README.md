# Reviews

AI self-review, regression, and pre-deploy checklists. Use with `../templates/change-report.md`.

## Self-review system

| File | When |
|------|------|
| `self-review-workflow.md` | **Required** after code changes — 8 dimensions + change audit |
| `regression-review.md` | Routing, Firestore, uploads, auth, admin, mobile, PWA |
| `security-review.md` | Auth, RBAC, rules, uploads, secrets, deploy security |
| `firebase-review.md` | Firestore, Storage, Auth, FCM, indexes, rules |
| `deployment-review.md` | Pre/post deploy: build, Vercel, manifest, assetlinks, EAS |

Overview: `../reports/AI_SELF_REVIEW_SYSTEM.md`

## Merge gate

| File | When |
|------|------|
| `pre-merge-checklist.md` | Final check before PR / task complete |
