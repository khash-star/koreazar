# Firebase Tests

Verify against **correct project** in Firebase Console (confirm ID — do not trust stale docs).

---

## Authentication

| Check | Pass | Fail | Notes |
|-------|:----:|:----:|-------|
| Email/password register | ☐ | ☐ | |
| Login / logout | ☐ | ☐ | |
| Auth user visible in Console | ☐ | ☐ | |
| Invalid password rejected | ☐ | ☐ | |
| OAuth (Kakao/Facebook) if scope | ☐ | ☐ | |

---

## Firestore reads

| Check | Pass | Fail | Notes |
|-------|:----:|:----:|-------|
| Home listings query succeeds | ☐ | ☐ | `status` + `created_date` |
| My listings query | ☐ | ☐ | `created_by` + `created_date` |
| Category-filtered query | ☐ | ☐ | Composite index |
| Banner ads read | ☐ | ☐ | |
| Messages / conversations (if touched) | ☐ | ☐ | |
| No index error in client console | ☐ | ☐ | |

---

## Firestore writes

| Check | Pass | Fail | Notes |
|-------|:----:|:----:|-------|
| Create listing | ☐ | ☐ | |
| Update own listing | ☐ | ☐ | |
| Cannot update another user's listing | ☐ | ☐ | |
| Admin-only write blocked for non-admin | ☐ | ☐ | |
| Message create / `is_read` update | ☐ | ☐ | If touched |

---

## Storage uploads

| Check | Pass | Fail | Notes |
|-------|:----:|:----:|-------|
| Upload on create listing | ☐ | ☐ | |
| File appears in Console Storage | ☐ | ☐ | |
| No 403 permission denied | ☐ | ☐ | Rules published |
| Delete image on listing delete (if applicable) | ☐ | ☐ | |

---

## Indexes

| Check | Pass | Fail | Notes |
|-------|:----:|:----:|-------|
| `firestore.indexes.json` matches new queries | ☐ | ☐ | |
| Deploy: `firebase deploy --only firestore:indexes` | ☐ | ☐ | |
| Console shows indexes **Enabled** | ☐ | ☐ | |

---

## Security rules

| Check | Pass | Fail | Notes |
|-------|:----:|:----:|-------|
| Rules published to production project | ☐ | ☐ | |
| Guest cannot write protected data | ☐ | ☐ | |
| Test-mode open rules **not** in production | ☐ | ☐ | |

See `../reviews/firebase-review.md`, `docs/FIRESTORE_INDEXES.md`.
