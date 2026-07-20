# ZAR-USA region rollout — phased plan

Washington DC / DMV is the **only active US region**. Chicago, New York, Seattle, Louisiana exist in the shared registry with `active: false` and are **not shown in UI**.

## Phase 1 — Washington DC / DMV MVP (current)

**Goal:** ZAR-USA behaves as DC/DMV-only via the default region — no region
picker and **no invite code**.

| Layer | Behavior |
|-------|----------|
| Registry | `src/config/regions/us.js`, `mobile/src/config/regions/us.js`, `api/regions.php` |
| DB (migration-gated) | `api/sql/migration_region_dmv_mvp.sql` — `listings.region_code` + country/region index; verify each target DB |
| API reads | `country_code=US` → defaults to `washington-dc`; strict `region_code` filter |
| API writes | US listings forced to `region_code=washington-dc`; state must be DC/VA/MD |
| Mobile | `production-us` / `EXPO_PUBLIC_ACTIVE_COUNTRY=US` → default `washington-dc` |
| Web | US is enabled in `ENABLED_COUNTRIES`; `/us` is selector-locked to ZAR-USA |
| KR | API and client guards exclude US/JP and any row with a non-empty `region_code` |

**Critical:** US listing reads are filtered **server-side** by `region_code`. Never rely on client-only filters.

### Deployment checklist

1. Run `api/sql/migration_region_dmv_mvp.sql` on **staging** first.
2. Deploy PHP API (`api/index.php`, `api/regions.php`).
3. Verify: `npm run verify:zarusa-registry` and `npm run smoke:zarusa-api`
4. EAS `production-us` build (separate approval).
5. Smoke-test US listing read/create on staging and `/us`.

Do not infer migration status from the repository. Before each deploy, verify:

```sql
SHOW COLUMNS FROM listings LIKE 'region_code';
SHOW INDEX FROM listings WHERE Key_name = 'listings_country_region_index';
```

### KR feed isolation

Market isolation is enforced twice:

- `append_kr_listing_read_filter()` in `api/regions.php` removes US/JP rows and
  rows with a non-empty `region_code` from KR reads.
- `filterListingsForMarket()` in web and mobile removes them again before
  rendering the feed.

If a legacy US row still has `country_code=KR` (or blank) and a non-empty
`region_code`, back up the table and review
`api/sql/fix_us_listings_country_code.sql` before running it. The runtime
guards keep that row off the KR feed while data correction is pending.

---

## Phase 2 — Region admin scope (implemented)

Roles on Firestore `users/{uid}` (and MySQL `users` for API parity):

| Role | Fields | Access |
|------|--------|--------|
| `super_admin` (legacy: `admin`) | — | Global KR + US + all regions |
| `country_admin` | `admin_country_code` | One country, all active regions |
| `region_admin` | `admin_region_code` (+ implicit US) | One region (e.g. `washington-dc`) |

Shared logic: `src/constants/adminRoles.js` → `npm run sync-admin-roles` → mobile.

| Layer | Behavior |
|-------|----------|
| Web/mobile admin UI | Scoped listing/banner/report queries |
| Firestore rules | `adminCanModerateListing`, banner scope, super-only role assignment |
| PHP API | `get_app_admin_scope()`, `admin_can_moderate_listing()`, `admin_set_user_role` |
| MySQL | `api/sql/migration_admin_rbac_phase2.sql` |

**Assign US DC admin (Firebase Console → Firestore `users/{uid}`):**

```json
{
  "role": "region_admin",
  "admin_country_code": "US",
  "admin_region_code": "washington-dc"
}
```

When **Chicago** activates: assign a separate `region_admin` with `admin_region_code: "chicago"`.

Region admins cannot manage users, broadcast messages, or change global
config. Banners have country scope but no region field, so a region admin can
moderate US banners; listing moderation remains region-specific.

**MySQL compatibility:** `migration_admin_rbac_phase2.sql` currently uses
`ADD COLUMN IF NOT EXISTS`, which Oracle MySQL does not support. Confirm the
target database engine before execution. On MySQL, use
`INFORMATION_SCHEMA`-guarded prepared statements like
`migration_listings_country_code.sql`.

---

## Phase 3 — Activate Chicago / New York / Seattle / Louisiana

Per region:

1. Set `active: true` in registry (web + mobile + PHP)
2. Assign region admins
3. No listing schema change if Phase 1 SQL already applied

---

## Phase 4 — Optional “All ZAR-USA” browse tab

Cross-region US browse (explicit opt-in; never unscoped US reads).

---

## Sync points

| File | Purpose |
|------|---------|
| `src/config/regions/us.js` | Web/shared registry |
| `mobile/src/config/regions/us.js` | Mobile mirror |
| `api/regions.php` | Server registry + enforce helpers |

---

## Protections

- Do not change `mobile/app.json`, EAS production, bundle IDs without approval
- Do not run production migration / deploy / EAS submit from feature work without approval
- KR / Zarkorea behavior must remain unchanged
