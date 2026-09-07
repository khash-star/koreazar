# API Summary

> No OpenAPI/generated SDK exists.
> **Quick load:** `../PROJECT_MEMORY.md`
> **Canonical detail:** `../../docs/ARCHITECTURE.md`,
> `../../docs/FIRESTORE_SCHEMA.md`

## Backend surface

| Layer | Notes |
|-------|-------|
| **PHP/MySQL** | Listings, user sync, AI proxy, scoped admin role sync; hosted separately at `api.zarkorea.com` |
| **Firestore** | Users, banners, chat, saved pointers, reports/feedback, AI state, config, push-token state |
| **Firebase Auth** | Identity and Bearer tokens for PHP writes |
| **Firebase Storage** | Country-aware listing/banner paths plus profile and legacy paths |
| **Cloud Functions** | Firestore message-create trigger sends Expo chat push |
| **Entity wrappers** | `src/api/entities.js` is the page-facing API wrapper |

## PHP actions and market parameters

| Action | Method / access |
|--------|-----------------|
| `health` | GET, public |
| `listings` | GET public: `category`, `subcategory`, `created_by`, `customer_id`, `firebase_uid`, `status` (default `active`), `country_code`, `state_code`, `region_code`, `limit` (1–100, default 50) |
| `listings` | POST Bearer create; required `title` + `category`; server sets `created_by` |
| `listing` | GET public; PUT/PATCH Bearer except public `views` +1; DELETE Bearer |
| `user_sync` | POST/PUT/PATCH, Bearer |
| `admin_set_user_role` | POST, super admin only |
| `ai_chat`, `ai_moderate` | POST, Bearer |

`api/regions.php` is part of the API contract: US reads/writes default to
`washington-dc`, inactive regions return no rows, and KR reads exclude
regional rows. Schema migrations are documented in
`docs/MULTI_COUNTRY_DB_MIGRATION_PLAN.md` and
`docs/ZARUSA_STAGING_DEPLOY.md`.

Admin API authority (`get_app_admin_scope`): `APP_ADMIN_UIDS` override, then
MySQL `users.firebase_uid`, then legacy `users.email`. Keep Firestore and
MySQL role/scope mirrored via `admin_set_user_role` / `user_sync`.

KR feed isolation: `append_kr_listing_read_filter` (API) plus client
`filterListingsForMarket`. Deploy helpers and smoke order:
`docs/ZARUSA_STAGING_DEPLOY.md`.

## Client configuration

- Web API base: `VITE_API_BASE_URL`
- Mobile API base: `EXPO_PUBLIC_API_BASE_URL`
- Server secrets: names only in `docs/PROJECT_MEMORY.md`; never copy values
  into docs or client env.

Do **not** treat vendor README files as project API documentation.
