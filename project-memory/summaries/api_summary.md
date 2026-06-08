# API Summary

> **Quick load:** `../PROJECT_MEMORY.md`
> No Swagger/OpenAPI file exists. Treat this as a source-backed route and
> collection map, then verify details in code before changing contracts.

## Backend surfaces

| Surface | Purpose | Source |
|---------|---------|--------|
| PHP/MySQL API | Listings CRUD, AI proxy, auth user sync | `api/index.php` |
| Firestore client SDK | Banners, chat, saved-listing pointers, reports/feedback, config, AI usage, push-token state | `src/services/*`, `mobile/src/services/*`, `firestore.rules` |
| Firebase Auth | Web/mobile identity and Firebase ID tokens for protected PHP API calls | `src/firebase/config.js`, `mobile/src/config/firebase.js` |
| Firebase Storage | Listing/banner image storage and delivery | upload/image services |
| Firebase Functions | Firestore triggers; currently chat push delivery | `functions/index.js` |
| Entity wrappers | Web compatibility facade over PHP and Firestore services | `src/api/entities.js` |

## PHP API route catalog

Base URL defaults:

- Web: `import.meta.env.VITE_API_BASE_URL || https://api.zarkorea.com/index.php`
- Mobile: `process.env.EXPO_PUBLIC_API_BASE_URL || https://api.zarkorea.com/index.php`

| Action | Methods | Auth | Usage |
|--------|---------|------|-------|
| `health` | `GET` | No | Database/API health check. |
| `listings` | `GET` | No | List/search listings. Supports `status`, `category`, `subcategory`, `created_by`, `customer_id`, `firebase_uid`, `limit` (max 100). |
| `listings` | `POST` | Firebase ID token | Create listing. Server resolves owner from token, enforces banned-content and promotion checks. |
| `listing` | `GET` | No | Fetch one listing by MySQL numeric `id`. |
| `listing` | `PATCH` | Firebase ID token, except view-only bump | Update listing. View count increments are explicitly allowed without auth by API logic. |
| `listing` | `DELETE` | Firebase ID token | Delete listing by MySQL numeric `id`. |
| `ai_chat` | `POST` | Firebase ID token | Backend OpenAI chat proxy for AIBot; API key stays server-side. |
| `ai_moderate` | `POST` | Firebase ID token | Backend OpenAI JSON moderation proxy for admin listing review. |
| `user_sync` | `POST` | Firebase ID token | Sync Firebase user identity into MySQL-side user/customer tables. |

## Firestore collection map

| Collection | Purpose | Common services / docs |
|------------|---------|------------------------|
| `users` | User profile, role, email/phone identity mapping | `authService`, admin screens, chat uid resolution |
| `banner_ads` | Active home banners | `src/services/bannerService.js` |
| `banner_requests` | User-submitted banner requests | `bannerService`, admin banner pages |
| `saved_listings` | Per-user pointers to MySQL listing IDs | `src/api/entities.js`, saved-listing resolver |
| `conversations` | Chat threads with email participants and `participant_uids` | `conversationService`, `firestore.indexes.json` |
| `messages` | Chat messages; function trigger source for push | `conversationService`, `functions/index.js` |
| `listing_reports` | Listing report/moderation workflow | `listingReportService` |
| `feedback` | User feedback | `feedbackService` |
| `config` | App-level toggles such as listing auto-approve | `appConfigService` |
| `ai_conversations`, `ai_messages`, `ai_usage` | AI bot history and limits | `aiService`, `aiUsageService` |
| `user_push_tokens/{uid}/devices/*` | Expo push tokens by Firebase uid | `mobile/src/services/pushTokenService.js` |

## Integration notes

| Integration | Current contract |
|-------------|------------------|
| OpenAI | Server-side PHP proxy only. Do not expose browser/mobile OpenAI keys. |
| Expo Push API | Firebase Function sends to Expo tokens after `messages` documents are created. |
| Kakao/Facebook setup docs | Setup guides exist, but confirm route/screen usage in source before claiming production support. |

## Gaps

- No generated API client SDK or OpenAPI schema.
- PHP API deployment/runbook details are separate from the Vercel SPA deploy docs.
- Avoid indexing `node_modules/**/README.md` or migration-era root guides as API source of truth.
