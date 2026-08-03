# Admin & RBAC Tests

Phase 2 scoped roles (`src/constants/adminRoles.js` → `npm run sync-admin-roles` → mobile).

| Role | Required fields | Access |
|------|-----------------|--------|
| `super_admin` (legacy `admin`) | — | Global KR + US + all regions; role assignment |
| `country_admin` | `admin_country_code` | One country, all active regions |
| `region_admin` | `admin_region_code` (+ US) | One region (e.g. `washington-dc`) |

Canonical plan: `docs/ZARUSA_REGION_PHASES.md` Phase 2.  
PHP scope lookup: `APP_ADMIN_UIDS` → MySQL `firebase_uid` → legacy `email`.

---

## Route guard (web)

| Check | Pass | Fail | Notes |
|-------|:----:|:----:|-------|
| Guest cannot open `/Admin*` routes (redirect or block) | ☐ | ☐ | |
| Regular user (`role: user`) blocked from admin UI | ☐ | ☐ | |
| `super_admin` / legacy `admin` sees full admin nav | ☐ | ☐ | |
| `country_admin` / `region_admin` sees admin nav | ☐ | ☐ | `useAdminAccess` / `isAppAdmin` |
| Direct URL to admin route without role fails | ☐ | ☐ | |
| US scoped admin "home" link returns to `/us` | ☐ | ☐ | `useMarketHomePath` |

---

## Scoped role checks

| Check | Pass | Fail | Notes |
|-------|:----:|:----:|-------|
| Non-admin cannot set `role` / `admin_*` via client alone | ☐ | ☐ | Rules + protected fields |
| Only `super_admin` can assign roles (UI / rules) | ☐ | ☐ | |
| `region_admin` + `washington-dc` moderates DC listings only | ☐ | ☐ | |
| `region_admin` gets 403 outside region (PHP + UI) | ☐ | ☐ | |
| `country_admin` + `US` sees all active US regions | ☐ | ☐ | |
| `country_admin` cannot moderate KR listings | ☐ | ☐ | |
| `region_admin` cannot manage users / broadcast | ☐ | ☐ | Super-only surfaces |
| Banner / report admin queries honor scope | ☐ | ☐ | Web + mobile |
| MySQL role parity after Firestore assign | ☐ | ☐ | `admin_set_user_role` / sync scripts |
| Firestore-only role without MySQL row → PHP listing admin denied | ☐ | ☐ | Email/`firebase_uid` lookup |

---

## Unsafe access prevention

| Check | Pass | Fail | Notes |
|-------|:----:|:----:|-------|
| Firestore rules deny non-admin banner writes | ☐ | ☐ | Console test |
| Scoped rules: `adminCanModerateListing` (not binary `isAdmin` alone) | ☐ | ☐ | |
| API/PHP admin endpoints require Bearer + scope | ☐ | ☐ | |
| No admin API keys in client bundle | ☐ | ☐ | |
| `APP_ADMIN_UIDS` still grants super scope | ☐ | ☐ | Env override |

---

## Mobile (if admin in app)

| Check | Pass | Fail | Notes |
|-------|:----:|:----:|-------|
| Admin screens hidden for non-admin | ☐ | ☐ | |
| Same role constants as web after `sync-admin-roles` | ☐ | ☐ | |
| Banner create respects region admin scope | ☐ | ☐ | |

---

## Regression risks

| Check | Pass | Fail | Notes |
|-------|:----:|:----:|-------|
| Logout → admin routes inaccessible | ☐ | ☐ | |
| Role change in Console reflected after re-login | ☐ | ☐ | |
| Legacy `role: admin` still treated as `super_admin` | ☐ | ☐ | `normalizeAdminRole` |
| KR production admin flows unchanged for super | ☐ | ☐ | |

See `../reviews/security-review.md`, `docs/SECURITY.md`, `docs/ZARUSA_REGION_PHASES.md`.
