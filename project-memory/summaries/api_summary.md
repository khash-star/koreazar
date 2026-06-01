# API Summary

> No formal Swagger/OpenAPI file exists. Verify route behavior in source before changing clients.

## Backend surface

| Layer | Notes |
|-------|-------|
| **PHP MySQL API** | `api/index.php` is the primary listing API and server-side OpenAI proxy. |
| **Firestore client SDK** | Active for banners, chat, saved-listing pointers, users, feedback/reports, and push-token state. |
| **Firebase Auth** | Email/password and phone OTP; clients pass Firebase ID tokens to protected PHP API actions. |
| **Firebase Storage** | Listing image uploads; stored URLs are persisted on MySQL listing rows. |
| **Cloud Functions** | `functions/index.js` sends Expo chat push notifications on new Firestore `messages` docs. |
| **Entity wrappers** | `src/api/entities.js` adapts page code to service modules; `Listing` now delegates to the PHP-backed listing service. |

## PHP API route catalog

Base URL is configured by `VITE_API_BASE_URL` on web and `EXPO_PUBLIC_API_BASE_URL` on mobile. Both fall back to `https://api.zarkorea.com/index.php`.

| Action | Methods | Auth | Used by |
|--------|---------|------|---------|
| `health` | `GET` | None | Operational checks. |
| `listings` | `GET` | None | Home/category/search/my-listings fetches with query filters. |
| `listings` | `POST` | Firebase Bearer token | Listing create flows. |
| `listing` | `GET` | None | Listing detail and saved-listing resolution. |
| `listing` | `PATCH`/`PUT` | Firebase Bearer token except public view-count increment | Listing edit, promotion/status changes, view bump. |
| `listing` | `DELETE` | Firebase Bearer token | Listing deletion. |
| `user_sync` | `POST`/`PUT`/`PATCH` | Firebase Bearer token | Mirrors Firebase users into MySQL and returns `customer_id`. |
| `ai_chat` | `POST` | Firebase Bearer token | AIBot chat completion proxy. |
| `ai_moderate` | `POST` | Firebase Bearer token | Listing moderation/classification proxy. |

Full architecture reference: `../../docs/DATA_ARCHITECTURE.md`.

## Third-party integrations

| Integration | Source doc / code |
|-------------|-------------------|
| OpenAI (AIBot) | Server proxy in `api/index.php`; legacy setup notes in `OPENAI_SETUP.md` may be stale. |
| Kakao login | `KAKAO_LOGIN_SETUP.md` |
| Facebook login | `FACEBOOK_LOGIN_SETUP.md` |
| Expo push | `mobile/docs/CHAT_PUSH_SETUP.md`, `functions/index.js` |

## Gaps / cautions

- No generated client SDK docs.
- PHP API deployment is separate from Vercel; coordinate `api/` changes with `api.zarkorea.com` hosting.
- Do **not** index `node_modules/**/README.md` as project API memory.
