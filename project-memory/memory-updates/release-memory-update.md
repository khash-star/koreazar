# Release Memory Update Workflow

## When required

- Major feature shipped (web and/or mobile)  
- App Store / Play Store submission or RN replacing TWA  
- Breaking change for users or admins  
- New env requirements for production builds  

## What to record

- Feature name and user-visible behavior  
- Platforms affected (web, iOS, Android)  
- Store version / build number if relevant  
- `npm run sync-listings` or other release rituals  
- What **not** to claim in store listing (e.g. push if absent)  

## How to summarize

- Release notes style: 3–7 bullets  
- Link checklists: `mobile/docs/IOS_ANDROID_RELEASE_CHECKLIST.md`  

## Files to update

| Target | Action |
|--------|--------|
| `../summaries/architecture_summary.md` | Feature pointers |
| `../summaries/deployment_summary.md` | EAS / store paths |
| `../decisions/DECISION_LOG.md` | Release strategy (TWA vs RN, etc.) |
| `../incidents/` | If release caused incident |

## Avoid

- Duplicating full store setup guides  
- Marking migration “in progress” if `MIGRATION_COMPLETE.md` says done — verify code  

## Verify against

- `mobile/README.md`, `mobile/app.json` (read-only)  
- Production site smoke test per `../runbooks/production-verification.md`  
