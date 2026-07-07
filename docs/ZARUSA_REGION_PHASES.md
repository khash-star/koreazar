# Zarusa region rollout — phased plan

Washington DC / DMV is the **only active US region** in Phase 1. Chicago, New York, Seattle, and Louisiana exist in the shared registry with `active: false` and are **not shown in UI**.

## Phase 1 — Washington DC / DMV MVP (this branch)

**Goal:** Single Zarusa app behaves as DC/DMV-only while schema and API stay multi-region-ready.

| Layer | Behavior |
|-------|----------|
| Registry | `src/config/regions/us.js`, `mobile/src/config/regions/us.js`, `api/regions.php` |
| DB (SQL only, not run) | `api/sql/migration_region_dmv_mvp.sql` |
| API reads | `country_code=US` → defaults to `washington-dc`; strict `region_code` filter (NULL/unscoped US rows hidden) |
| API writes | US listings forced to `region_code=washington-dc`; state must be DC/VA/MD |
| Mobile | `production-us` / `EXPO_PUBLIC_ACTIVE_COUNTRY=US` → `washington-dc`; no region selector |
| Invite | `DMV` / `DMV2026` → `home_country_code=US`, `home_region_code=washington-dc` |
| Admin | Same admin UX; US listing queries scoped to active region via mobile API params |
| Banners | **Country-scoped only** (unchanged) — see Phase 2 |
| Web | US **not** enabled publicly (`ENABLED_COUNTRIES` unchanged) |

**Critical:** Region filtering is enforced **server-side** on all US listing reads. Do not rely on client-only filters.

### Activation checklist (after approval)

1. Run `api/sql/migration_region_dmv_mvp.sql` on **staging** first.
2. Deploy PHP API (`api/index.php`, `api/regions.php`).
3. Verify: `npm run verify:zarusa-registry` and `npm run smoke:zarusa-api`
4. EAS `production-us` build (separate approval — not part of this PR).
5. Smoke-test invite + listing create/read.

---

## Phase 1b — Invite code lock (extensions)

Optional follow-ups without schema churn:

- Per-code `max_uses`, expiry, revoke in admin UI
- Rate-limit `invite_redeem`
- Firestore rules: reject client writes to `home_*` fields (MySQL remains source of truth)
- Stricter gate: require invite before any API access (currently: invite gate blocks app UI; API still region-filters public reads)

---

## Phase 2 — Region admin scope

**TODO:** Implement scoped roles (not in Phase 1):

| Role | Scope |
|------|--------|
| `super_admin` | All countries/regions |
| `country_admin` | e.g. all US |
| `region_admin` | e.g. `washington-dc` only |

Also:

- Optional `region_code` on Firestore `banner_ads` (with composite index)
- Admin UI region filter when multiple US regions are active

---

## Phase 3 — Activate Chicago / New York / Seattle / Louisiana

Per region:

1. Set `active: true` in registry (web + mobile + PHP)
2. Choose onboarding: `invite` vs `self_select` per region config
3. Assign `region_admin` users
4. Seed region-specific invite codes if needed
5. No listing schema migration required if Phase 1 SQL already applied

---

## Phase 4 — Optional “All Zarusa” browse tab

Cross-region browse within US (e.g. tab showing all active US regions). Requires:

- Product decision on default vs opt-in browse scope
- API: explicit `region_code=all` or multi-region query (never unscoped US)
- UI: region labels on cards; still no silent cross-region posting

---

## Sync points (keep aligned)

| File | Purpose |
|------|---------|
| `src/config/regions/us.js` | Web/shared registry |
| `mobile/src/config/regions/us.js` | Mobile registry mirror |
| `api/regions.php` | Server registry + enforce helpers |

---

## Protections (do not change without explicit approval)

- `mobile/app.json`, EAS `production`, `submit.production`
- `com.zarkorea.twa`, `com.zarusa.app`
- KR / Zarkorea behavior
- Production DB migration, deploy, EAS build/submit from this branch
