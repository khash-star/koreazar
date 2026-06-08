# AI Self-Review System

How Cursor should **audit its own work** on Koreazar before handoff. Infrastructure only — no runtime code.

---

## Purpose

- Catch architecture, Firebase, routing, and deploy regressions before merge
- Enforce a consistent **change audit** in every coding reply
- Reduce duplicate logic and production incidents from stale docs or wrong project IDs

---

## When reviews are required

| Change type | Minimum review |
|-------------|----------------|
| Any `src/`, `mobile/`, `api/` code | `self-review-workflow.md` + `regression-review.md` |
| Auth, admin, uploads, rules, env | + `security-review.md` |
| Firestore, Storage, Auth, FCM, indexes | + `firebase-review.md` |
| Vercel, PWA, TWA, EAS, release | + `deployment-review.md` |
| Project-memory / docs only | Optional; no self-review required |

Also read before coding:

1. `../PROJECT_MEMORY.md`
2. `../CODING_SAFETY_CHECKLIST.md`
3. `../SENIOR_DEVELOPER_SYSTEM.md` (complex / production-sensitive tasks)

---

## Recommended workflow order

```text
1. Intake     → PROJECT_MEMORY + CODING_SAFETY_CHECKLIST + relevant summaries
2. Plan       → senior-developer/TASK_WORKFLOW.md or workflows/*.md
3. Implement  → minimal diff; no vendor/deploy edits without approval
4. Self-review→ reviews/self-review-workflow.md (all 8 dimensions)
5. Deep-dive  → regression | security | firebase | deployment (as triggered)
6. Pre-merge  → reviews/pre-merge-checklist.md
7. Handoff    → templates/change-report.md + required audit fields (below)
8. Deploy     → runbooks/production-verification.md (if shipped)
```

---

## How Cursor should self-review

1. **Assume production is live** at `https://zarkorea.com` with real Firebase data.
2. **Trace the change** in source — do not rely only on root `*_FIX.md` guides.
3. **Walk dimensions** in `self-review-workflow.md`: architecture, deploy, Firebase, routing, mobile/web, regressions, duplicates, performance.
4. **Run specialized checklists** when triggers match (security, firebase, deployment).
5. **Produce the change audit** in the agent reply (not optional for code tasks).

### Required change audit fields

| Field | Description |
|-------|-------------|
| Files changed | Paths only |
| Why changed | Intent per file/group |
| Risks introduced | What could break |
| Rollback strategy | Revert deploy, git revert, or config rollback |
| Test plan | Commands + manual steps |
| Production verification | From `runbooks/production-verification.md` if deploy-related |

---

## Review playbook index

| File | Role |
|------|------|
| `../reviews/self-review-workflow.md` | Master self-review + audit format |
| `../reviews/regression-review.md` | Routing, Firestore, uploads, auth, admin, mobile, PWA |
| `../reviews/security-review.md` | Secrets, RBAC, rules, uploads, XSS |
| `../reviews/firebase-review.md` | Indexes, rules, Auth, Storage, FCM |
| `../reviews/deployment-review.md` | Build, Vercel env, manifest, assetlinks, EAS, cache |
| `../reviews/pre-merge-checklist.md` | Final gate before merge |

---

## Preventing production regressions

1. **Never ship** new Firestore query shapes without indexes deployed.
2. **Never weaken** admin or auth guards “temporarily.”
3. **Verify** Firebase project ID and Vercel env in Console, not old markdown.
4. **Keep** Home data-before-images behavior predictable: PHP listings and Firestore banners must return image URLs before image fetch/preload.
5. **Sync** listing constants web → mobile before store builds.
6. **Document** rollback in every change audit for non-trivial diffs.
7. **Ignore** vendor markdown and `node_modules` for context (see `.cursorignore`).

---

## Integration with Senior Developer System

- Workflows: `../workflows/` (feature, bugfix, firebase, mobile)
- Templates: `../templates/change-report.md`, `pr-description.md`
- Decisions: `../decisions/` for ADRs on major arch changes

After a major architecture change, propose an ADR and run full self-review + security + firebase checklists.

---

## Quick reference: 8 self-review dimensions

1. Architecture impact
2. Deployment impact
3. Firebase impact
4. Routing impact
5. Mobile/web compatibility
6. Regression risks
7. Duplicate logic risks
8. Performance risks

*Detail: `../reviews/self-review-workflow.md`*
