# Architecture Summary

> **Quick load:** `../PROJECT_MEMORY.md`  
> Source wins over stale markdown. Verify against `src/`, `mobile/`, `api/`,
> `functions/`, `firestore.rules`, and `firestore.indexes.json` before changing
> behavior.

## Runtime stack

| Area | Current shape | Source of truth |
|------|---------------|-----------------|
| Web app | React 18 + Vite 6 + TailwindCSS SPA on Vercel | `src/`, `vite.config.js` |
| Mobile app | Expo React Native app with EAS builds | `mobile/` |
| Auth | Firebase Auth; email users plus phone OTP users represented through `users/{uid}` profile data | `src/services/authService.js`, `mobile/src/context/AuthContext.js` |
| Listings API | PHP/MySQL API; web and mobile both call `api.zarkorea.com/index.php` by default | `api/index.php`, `src/services/listingService.js`, `mobile/src/services/listingService.js` |
| Firestore data | Banners, banner requests, chat, saved-listing pointers, feedback/reports, config, AI usage/conversations, push tokens | `src/services/*`, `firestore.rules`, `firestore.indexes.json` |
| Storage | Listing/banner images via Firebase Storage URLs | `src/utils/imageUrl.js`, upload services |
| Push | Native chat push through Expo Push API and Firebase Functions | `functions/index.js`, `mobile/docs/CHAT_PUSH_SETUP.md` |
| PWA | Implemented with `vite-plugin-pwa`; build emits `manifest.json` and service worker assets | `vite.config.js`, `package.json` |

## Data flow map

| Workflow | Data path | Constraints |
|----------|-----------|-------------|
| Home listings | `Home.jsx` -> `entities.Listing.filter()` -> `src/services/listingService.js` -> PHP `action=listings` | Server supports category/subcategory/status/customer/user filters; web applies some filters and VIP sorting client-side. |
| Mobile latest listings | `mobile/src/services/listingService.js` -> shared PHP API contract | Mobile keeps short in-memory caches for latest/detail reads. |
| Listing create/update/delete | Web/mobile services send Firebase ID token to PHP API | Authenticated writes require `Authorization: Bearer <Firebase ID token>`; view-count-only PATCH is allowed unauthenticated by API logic. |
| Banners | `BannerAd` entity -> `bannerService.js` -> Firestore `banner_ads` / `banner_requests` | Firestore index/rules changes must stay in sync with docs. |
| Saved listings | Firestore `saved_listings` stores pointers; listing bodies are resolved from MySQL API | Do not assume saved docs contain full listing payloads. |
| Chat | Firestore `conversations` + `messages` with email fields and `participant_uids` for phone users | Keep legacy email participant queries and uid-based rules/indexes compatible. |
| Chat push | Mobile stores Expo tokens in `user_push_tokens/{uid}/devices/*`; function sends on `messages/{messageId}` create | Requires deployed function, Firestore rules, EAS project ID, and Expo FCM/APNs credentials. |
| AI bot/moderation | Web calls PHP `action=ai_chat` / `action=ai_moderate`; usage metadata remains in Firestore | OpenAI key is server-side, not a `VITE_*` browser secret. |

## Repo layout

- **Web:** repository root (`src/`, `public/`).
- **Mobile:** `mobile/` only (Expo RN). Do not mix React Native code into web `src/`.
- **PHP API:** `api/` contains the MySQL entry point and helpers; deploy separately from Vercel SPA unless the hosting setup explicitly changes.
- **Firebase Functions:** `functions/` contains backend triggers such as chat push.
- **Shared listing constants:** `src/constants/listings.js`; run `npm run sync-listings` after changing web constants.

## Key subsystem docs

| Topic | Current doc |
|-------|-------------|
| Messaging / chat | `MESSAGE_SYSTEM_ARCHITECTURE.md` plus `mobile/docs/CHAT_PUSH_SETUP.md` for native push |
| Admin message reply flow | `ADMIN_MESSAGE_REPLY_FLOW.md` |
| Image load performance | `docs/IMAGE_LOAD_ANALYSIS.md` |
| PWA current config | `docs/PWA_IMPLEMENTATION_PLAN.md` |
| Firestore indexes | `docs/FIRESTORE_INDEXES.md` |
| Mobile release / QA | `mobile/docs/IOS_ANDROID_RELEASE_CHECKLIST.md`, `mobile/docs/MOBILE_QA_IOS_READINESS.md` |
