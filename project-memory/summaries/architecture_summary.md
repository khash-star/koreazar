# Architecture Summary

> AI memory placeholder — expand from repo sources over time.  
> **Quick load:** `../PROJECT_MEMORY.md`

## Stack (web)

- React 18 + Vite 6 + TailwindCSS SPA on Vercel
- Firebase Auth, Firestore, Storage
- Vercel serverless functions (backend functions exist at repo root; no OpenAPI catalog)

## Key subsystems (source docs)

| Topic | Canonical source (repo root unless noted) |
|-------|---------------------------------------------|
| Messaging / chat (web) | `MESSAGE_SYSTEM_ARCHITECTURE.md` |
| Messaging / chat (mobile, phone OTP, push) | `mobile/docs/MOBILE_CHAT.md`, `mobile/docs/CHAT_PUSH_SETUP.md`, `mobile/docs/PHONE_OTP_NATIVE_SETUP.md` |
| Admin message reply flow | `ADMIN_MESSAGE_REPLY_FLOW.md` |
| Image load performance | `docs/IMAGE_LOAD_ANALYSIS.md` |
| PWA plan | `docs/PWA_IMPLEMENTATION_PLAN.md` |
| Migration target arch | `MIGRATION_ANALYSIS.md` |

## Repo layout

- **Web:** repository root (`src/`, `public/`)
- **Mobile:** `mobile/` only (Expo RN) — do not mix with web `src/`

## Firestore chat identity snapshot

- Web and mobile share `conversations` and `messages` collections.
- Mobile phone OTP users use synthetic emails (`phone_*@phone.zarkorea.com`) plus
  `participant_uids` for conversation visibility.
- Conversation indexes are documented in `docs/FIRESTORE_INDEXES.md`; legacy
  conversation UID backfill is documented in `mobile/docs/MOBILE_CHAT.md`.

## Placeholder slots

- [ ] Service layer map (`src/services/*`)
- [ ] Firestore collection schema cheat sheet
- [ ] Auth flow (web + mobile)
