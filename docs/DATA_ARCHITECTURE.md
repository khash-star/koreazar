# Data Architecture

This page describes the current production data split for the web app and
Expo mobile app. It is verified against source code and should be preferred
over older Firebase-only migration notes.

## System of record by domain

| Domain | System of record | Main codepaths | Notes |
|--------|------------------|----------------|-------|
| Listings | MySQL via PHP API | `api/index.php`, `src/services/listingService.js`, `mobile/src/services/listingService.js` | Listing IDs are MySQL integer primary keys returned as strings in clients. |
| Listing images | Firebase Storage URLs stored on listing rows | listing create/update services, Storage upload services | The MySQL `listings.images` value is normalized to an array by the API/client services. |
| Users / profiles | Firebase Auth + Firestore `users` + MySQL `users` mirror | `src/services/authService.js`, `mobile/src/services/authService.js`, `api/index.php?action=user_sync` | Firebase UID is the durable identity key; MySQL `customer_id` is cached back to Firestore. |
| Banners / banner requests | Firestore | `src/services/bannerService.js` | Firestore indexes are still required for ordered/filter banner queries. |
| Chat conversations / messages | Firestore | `src/services/conversationService.js`, `mobile/src/services/conversationService.js`, `functions/index.js` | Conversations keep email participants and `participant_uids` for phone OTP users. |
| Saved listings | Firestore pointers to MySQL listing IDs | `src/api/entities.js`, `src/services/savedListingsResolve.js`, `mobile/src/services/savedListingService.js` | Saved rows are resolved through `?action=listing`; stale saves are deleted on 404. |
| Feedback / reports | Firestore | `src/services/feedbackService.js`, listing report services | Firestore rules must support Firebase UID and resolved email identity. |
| AI chat / moderation | PHP API proxy to OpenAI | `api/index.php?action=ai_chat`, `api/index.php?action=ai_moderate`, `src/services/aiService.js` | Requires a Firebase ID token; the OpenAI key belongs on the server, not in the Vite client. |

## PHP MySQL API

Default endpoint:

- Web: `VITE_API_BASE_URL`, falling back to `https://api.zarkorea.com/index.php`
- Mobile: `EXPO_PUBLIC_API_BASE_URL`, falling back to `https://api.zarkorea.com/index.php`

The PHP API is an action-based JSON API:

| Action | Methods | Auth | Purpose |
|--------|---------|------|---------|
| `health` | `GET` | None | Database connectivity check. |
| `listings` | `GET` | None | List/filter listings by `status`, `category`, `subcategory`, `created_by`, `customer_id`, `firebase_uid`, `limit`. |
| `listings` | `POST` | Firebase Bearer token | Create a listing. Server sets `firebase_uid` and resolves `created_by`; client-supplied owner fields are not trusted. |
| `listing` | `GET` | None | Fetch one listing by MySQL `id`. |
| `listing` | `PATCH`/`PUT` | Firebase Bearer token, except public view-count increment | Update a listing after ownership and promotion checks. |
| `listing` | `DELETE` | Firebase Bearer token | Delete a listing after ownership check. |
| `user_sync` | `POST`/`PUT`/`PATCH` | Firebase Bearer token | Mirror Firebase user profile data into MySQL and return `customer_id`. |
| `ai_chat` | `POST` | Firebase Bearer token | Proxy chat completion requests to OpenAI. |
| `ai_moderate` | `POST` | Firebase Bearer token | Proxy moderation/classification prompts to OpenAI. |

Authentication is validated by sending the Firebase ID token to Google Identity
Toolkit using the server-side `FIREBASE_WEB_API_KEY` from `api/.env`.

## Identity rules

- Use Firebase UID for durable ownership checks whenever possible.
- Email/password users normally have `auth.currentUser.email`.
- Phone OTP users may not have a token email. The shared synthetic email format is:

  ```text
  phone_<digits>@phone.zarkorea.com
  ```

- Web/mobile auth services keep `users/{uid}.email` populated so Firestore
  rules and chat lookups can resolve the same identity value.
- `user_sync` persists the Firebase UID in MySQL and stores returned
  `customer_id` in the Firestore user document.

## Firestore responsibilities

Firestore remains active for cross-platform realtime/application state:

- `users`
- `banner_ads`
- `banner_requests`
- `conversations`
- `messages`
- `saved_listings`
- feedback/report collections
- `user_push_tokens`

See `docs/FIRESTORE_INDEXES.md` for the current index inventory. Listing
indexes may still exist in `firestore.indexes.json` for legacy data or migration
fallbacks, but primary web/mobile listing reads and writes go through the PHP
MySQL API.

## Developer workflow and pitfalls

1. Do not add a second listing data path. Use the existing listing services for
   web and mobile.
2. Treat route query IDs such as `/ListingDetail?id=123` as MySQL listing IDs.
3. When changing listing ownership, preserve both `firebase_uid` and resolved
   email behavior so phone OTP users keep access to their listings.
4. When adding Firestore queries, update `firestore.indexes.json` and
   `docs/FIRESTORE_INDEXES.md` together.
5. The PHP API deployment is separate from the Vercel web build. Coordinate
   `api/` changes with the hosting environment for `api.zarkorea.com`.
