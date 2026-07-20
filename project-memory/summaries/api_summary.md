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
| `listings` | GET, public; `country_code`, `state_code`, `region_code` filters |
| `listing` | GET public; PATCH/DELETE Bearer; create is POST `listings` |
| `user_sync` | POST/PUT/PATCH, Bearer |
| `admin_set_user_role` | POST, super admin only |
| `ai_chat`, `ai_moderate` | POST, Bearer |

`api/regions.php` is part of the API contract: US reads/writes default to
`washington-dc`, inactive regions return no rows, and KR reads exclude
regional rows. Schema migrations are documented in
`docs/MULTI_COUNTRY_DB_MIGRATION_PLAN.md` and
`docs/ZARUSA_STAGING_DEPLOY.md`.

## Client configuration

- Web API base: `VITE_API_BASE_URL`
- Mobile API base: `EXPO_PUBLIC_API_BASE_URL`
- Server secrets: names only in `docs/PROJECT_MEMORY.md`; never copy values
  into docs or client env.

Do **not** treat vendor README files as project API documentation.
