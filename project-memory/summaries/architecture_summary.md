# Architecture Summary

> **Quick load:** `../PROJECT_MEMORY.md`
> **Source wins:** verify behavior in `src/`, `mobile/`, `api/`, and `functions/` before editing docs or code.

## Stack

- Web: React 18 + Vite 6 + TailwindCSS SPA on Vercel.
- Mobile: Expo React Native in `mobile/` only.
- Auth/storage/realtime state: Firebase Auth, Firestore, Firebase Storage.
- Listings backend: PHP API (`api/index.php`) backed by MySQL.
- Push backend: Firebase Cloud Functions in `functions/`.

## Current data split

| Domain | Primary system | Source paths |
|--------|----------------|--------------|
| Listings | MySQL through PHP API | `api/index.php`, `src/services/listingService.js`, `mobile/src/services/listingService.js` |
| Listing images | Firebase Storage URLs stored on MySQL listing rows | listing create/update flows, storage services |
| Users / identity | Firebase Auth + Firestore `users` + MySQL user mirror | `src/services/authService.js`, `mobile/src/services/authService.js`, `api/index.php?action=user_sync` |
| Banners | Firestore | `src/services/bannerService.js` |
| Chat | Firestore conversations/messages | web/mobile `conversationService.js`, `functions/index.js` |
| Saved listings | Firestore pointers to MySQL listing IDs | `src/services/savedListingsResolve.js`, `mobile/src/services/savedListingService.js` |
| AI chat/moderation | PHP API proxy to OpenAI | `api/index.php?action=ai_chat|ai_moderate`, `src/services/aiService.js` |

Full reference: `../../docs/DATA_ARCHITECTURE.md`.

## Identity constraints

- Firebase UID is the durable user key across web, mobile, Firestore rules, and MySQL sync.
- Phone OTP users use synthetic email values when Firebase token email is absent:
  `phone_<digits>@phone.zarkorea.com`.
- `users/{uid}.email` must stay populated for Firestore rules, chat participant lookup, saved listings, and push receiver resolution.
- MySQL listing rows store both `firebase_uid` and resolved `created_by`; do not trust client-supplied owner fields.

## Key subsystem docs

| Topic | Canonical source (repo root unless noted) |
|-------|---------------------------------------------|
| Current data architecture | `docs/DATA_ARCHITECTURE.md` |
| Firestore indexes | `docs/FIRESTORE_INDEXES.md` |
| Messaging / chat | `MESSAGE_SYSTEM_ARCHITECTURE.md` |
| Admin message reply flow | `ADMIN_MESSAGE_REPLY_FLOW.md` |
| Image load performance | `docs/IMAGE_LOAD_ANALYSIS.md` |
| PWA plan/status | `docs/PWA_IMPLEMENTATION_PLAN.md` |
| Mobile phone OTP setup | `mobile/docs/PHONE_OTP_NATIVE_SETUP.md` |
| Chat push setup | `mobile/docs/CHAT_PUSH_SETUP.md` |

## Repo layout

- **Web:** repository root (`src/`, `public/`).
- **Mobile:** `mobile/` only (Expo RN) — do not mix with web `src/`.
- **PHP API:** `api/`, deployed separately from the Vercel web build.
- **Cloud Functions:** `functions/`, deployed with Firebase tooling.
