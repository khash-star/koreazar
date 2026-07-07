# Zarusa region rollout — phased plan

Washington DC / DMV is the **only active US region**. Chicago, New York, Seattle, Louisiana exist in the shared registry with `active: false` and are **not shown in UI**.

## Phase 1 — Washington DC / DMV MVP (current)

**Goal:** US Zarusa app behaves as DC/DMV-only via **build default region** — no city picker, **no invite code**.

| Layer | Behavior |
|-------|----------|
| Registry | `src/config/regions/us.js`, `mobile/src/config/regions/us.js`, `api/regions.php` |
| DB (SQL only, not run) | `api/sql/migration_region_dmv_mvp.sql` — `listings.region_code` + index |
| API reads | `country_code=US` → defaults to `washington-dc`; strict `region_code` filter |
| API writes | US listings forced to `region_code=washington-dc`; state must be DC/VA/MD |
| Mobile | `production-us` / `EXPO_PUBLIC_ACTIVE_COUNTRY=US` → default `washington-dc` |
| Web | US **not** enabled publicly (`ENABLED_COUNTRIES` unchanged) |
| KR | **Unchanged** |

**Critical:** US listing reads are filtered **server-side** by `region_code`. Never rely on client-only filters.

### Activation checklist (after approval)

1. Run `api/sql/migration_region_dmv_mvp.sql` on **staging** first.
2. Deploy PHP API (`api/index.php`, `api/regions.php`).
3. Verify: `npm run verify:zarusa-registry` and `npm run smoke:zarusa-api`
4. EAS `production-us` build (separate approval).
5. Smoke-test US listing read/create on staging.

---

## Phase 2 — Region admin scope

TODO: `super_admin`, `country_admin`, `region_admin` when multiple US regions are active.

Optional: `region_code` on Firestore banners.

---

## Phase 3 — Activate Chicago / New York / Seattle / Louisiana

Per region:

1. Set `active: true` in registry (web + mobile + PHP)
2. Assign region admins
3. No listing schema change if Phase 1 SQL already applied

---

## Phase 4 — Optional “All Zarusa” browse tab

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
