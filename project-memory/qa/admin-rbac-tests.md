# Admin & RBAC Tests

Admin access via Firestore `users.role === 'admin'` (`ADMIN_SETUP_GUIDE.md` at repo root).

---

## Route guard (web)

| Check | Pass | Fail | Notes |
|-------|:----:|:----:|-------|
| Guest cannot open `/Admin*` routes (redirect or block) | ☐ | ☐ | |
| Regular user (`role: user`) blocked from admin UI | ☐ | ☐ | |
| Admin user sees admin nav / pages | ☐ | ☐ | |
| Direct URL to admin route without role fails | ☐ | ☐ | |

---

## Role checks

| Check | Pass | Fail | Notes |
|-------|:----:|:----:|-------|
| Non-admin cannot set `role: admin` via client alone | ☐ | ☐ | |
| Admin can access banner management | ☐ | ☐ | |
| Admin approve listing → visible in expected queries | ☐ | ☐ | |
| Admin message / broadcast (if feature) admin-only | ☐ | ☐ | |

---

## Unsafe access prevention

| Check | Pass | Fail | Notes |
|-------|:----:|:----:|-------|
| Firestore rules deny non-admin banner writes | ☐ | ☐ | Console test |
| API/PHP admin endpoints (if `api/` touched) require auth | ☐ | ☐ | |
| No admin API keys in client bundle | ☐ | ☐ | |

---

## Mobile (if admin in app)

| Check | Pass | Fail | Notes |
|-------|:----:|:----:|-------|
| Admin screens hidden for non-admin | ☐ | ☐ | |
| Same `users.role` source as web | ☐ | ☐ | |

---

## Regression risks

| Check | Pass | Fail | Notes |
|-------|:----:|:----:|-------|
| Logout → admin routes inaccessible | ☐ | ☐ | |
| Role change in Console reflected after re-login | ☐ | ☐ | |

See `../reviews/security-review.md`, `DEBUG_ADMIN_APPROVE.md` (historical).
