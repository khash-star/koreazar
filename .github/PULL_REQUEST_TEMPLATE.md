## Summary

<!-- What and why (1–3 sentences) -->

## Files changed

<!-- List main paths or groups -->

## Risk level

- [ ] Low — docs, copy, isolated UI
- [ ] Medium — behavior change, single subsystem
- [ ] High — auth, admin, Firebase, deploy, cross-platform

## Impact

| Area | Impact (none / low / high) | Notes |
|------|----------------------------|-------|
| Firebase | | Auth, Firestore, Storage, indexes, rules |
| Deployment | | Vercel, env, PWA, TWA, EAS |
| Mobile | | `mobile/` |
| Web | | `src/` |

## Test plan

- [ ] `npm run build` (root)
- [ ] `npm run dev` — routes: 
- [ ] `mobile/`: `npx expo start` (if mobile touched): 
- [ ] Auth / admin / listings / messaging as applicable

## Rollback plan

<!-- Revert commit, Vercel promote previous deploy, rules rollback, store rollback -->

## Memory update needed?

- [ ] No
- [ ] Yes — see `project-memory/memory-updates/AUTO_MEMORY_UPDATE_RULES.md`

## Agent / contributor checklist

- [ ] Read `project-memory/PROJECT_MEMORY.md`
- [ ] Read `project-memory/CODING_SAFETY_CHECKLIST.md`
- [ ] `project-memory/SENIOR_DEVELOPER_SYSTEM.md` (if complex / production-sensitive)
- [ ] `project-memory/reviews/self-review-workflow.md` (code changes)
