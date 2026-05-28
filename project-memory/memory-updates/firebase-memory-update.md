# Firebase Memory Update Workflow

## When required

- `firestore.rules` or `storage.rules` changed (with user approval)  
- `firestore.indexes.json` or query shapes changed  
- Firebase project ID or env var names changed  
- Auth providers (email, Kakao, Facebook) added or changed  
- Storage paths, upload rules, or FCM behavior changed  

## What to record

- Collections / indexes affected (names + field order)  
- Rule behavior in plain language (who can read/write)  
- Deploy command: `firebase deploy --only firestore:indexes` etc.  
- Console verification steps  

## How to summarize

- Mirror `docs/FIRESTORE_INDEXES.md` for indexes — keep in sync  
- One table for index definitions; no full rules paste unless policy requires  

## Files to update

| Target | Action |
|--------|--------|
| `docs/FIRESTORE_INDEXES.md` | **If indexes changed** (user task — memory workflow flags need) |
| `../summaries/deployment_summary.md` | Firebase deploy notes |
| `../summaries/api_summary.md` | Integration surface |
| `../decisions/DECISION_LOG.md` | Project switch, auth model, rules policy |
| `SECURITY.md` | **Suggest** user update repo root doc — do not edit unless asked |

## Avoid

- Wrong project ID from legacy docs (`carsmongolia-d410a`)  
- Documenting test-mode rules as production  

## Verify against

- `firestore.indexes.json`, `firestore.rules`, `storage.rules`  
- `../reviews/firebase-review.md`  

**Source of truth:** committed rules/index files + Firebase Console.
