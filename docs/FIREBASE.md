# Koreazar — Firebase

> Firebase project configuration, services, collections, rules, and deployment.  
> **Project ID:** `koreazar-32e7a` (from `.firebaserc`)  
> **Region:** `asia-northeast3` (Firestore location in `firebase.json`; Cloud Functions global option)

---

## Project overview

| Item | Value |
|------|--------|
| **Default project** | `koreazar-32e7a` |
| **Auth domain** | `koreazar-32e7a.firebaseapp.com` (must match `VITE_FIREBASE_AUTH_DOMAIN` / `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`) |
| **Storage bucket** | `koreazar-32e7a.firebasestorage.app` (must match env `*_STORAGE_BUCKET`) |
| **Firestore database** | `(default)` |
| **Functions runtime** | Node 20 (`functions/package.json`) |
| **Functions SDK** | firebase-functions ^6.3.0, firebase-admin ^13.0.2 |

---

## Client configuration

### Web (`src/firebase/config.js`)

Initialized from Vite environment variables (see `src/firebase/config.js.example`):

```javascript
// Pattern only — values come from env at build time
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};
```

Exports: `auth`, `db`, `storage`, default `app`.

### Mobile

| File | Platform |
|------|----------|
| `mobile/src/config/firebase.native.js` | iOS / Android (`EXPO_PUBLIC_FIREBASE_*`) |
| `mobile/src/config/firebase.web.js` | Expo web dev |

Native Firebase files (gitignored, supplied via EAS or local):

- `mobile/google-services.json` (Android)
- `mobile/GoogleService-Info.plist` (iOS)

`mobile/app.config.js` reads EAS file env `GOOGLE_SERVICES_JSON` and `GOOGLE_SERVICE_INFO_PLIST`.

---

## Environment variables (names only)

### Web (Vercel / local `.env`)

| Variable | Maps to `firebaseConfig` |
|----------|--------------------------|
| `VITE_FIREBASE_API_KEY` | `apiKey` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `authDomain` |
| `VITE_FIREBASE_PROJECT_ID` | `projectId` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `storageBucket` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
| `VITE_FIREBASE_APP_ID` | `appId` |
| `VITE_FIREBASE_PHONE_TEST_MODE` | Dev-only phone auth bypass |

### Mobile (EAS / `mobile/.env`)

| Variable | Maps to `firebaseConfig` |
|----------|--------------------------|
| `EXPO_PUBLIC_FIREBASE_API_KEY` | `apiKey` |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | `authDomain` |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | `projectId` |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` | `storageBucket` |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
| `EXPO_PUBLIC_FIREBASE_APP_ID` | `appId` |

### Server-side (PHP API — token verification)

| Variable | Purpose |
|----------|---------|
| `FIREBASE_WEB_API_KEY` | Verify Firebase ID tokens on protected PHP endpoints |

---

## Firebase services in use

| Service | Used for | Primary code paths |
|---------|----------|-------------------|
| **Authentication** | Email/password, phone OTP (mobile), Facebook (web) | `authService.js`, `mobile/src/services/phoneAuth.native.js` |
| **Firestore** | Chat, banners, saved listings, users, AI, config, push tokens | `src/services/*`, `firestore.rules` |
| **Storage** | Listing/banner/user images | `storageService.js`, `storage.rules` |
| **Cloud Functions** | Chat push on new message | `functions/index.js` |

**Note:** Primary **listings** data lives in **MySQL** (PHP API), not Firestore. Legacy `listings` indexes remain in `firestore.indexes.json` for any remaining Firestore queries.

---

## Firestore collections

| Collection | Access pattern | Rules summary |
|------------|----------------|---------------|
| `users/{userId}` | Profile read (public); owner/admin write | Owners cannot self-promote `role` to admin |
| `listings/{listingId}` | Legacy Firestore listings if any | Public read; owner/admin write |
| `banner_ads/{id}` | Homepage banners | Public read; admin write |
| `banner_requests/{id}` | User banner requests | Auth create/read; admin update |
| `listing_reports/{id}` | Listing reports | Owner or admin read |
| `feedback_messages/{id}` | Footer feedback | Auth create; admin read |
| `saved_listings/{id}` | Saved listings | Owner by `user_uid` or email |
| `conversations/{id}` | Chat threads | Participants or admin |
| `messages/{id}` | Chat messages | Auth read/create; sender/receiver update |
| `ai_conversations/{id}` | AI bot threads | Owner by `user_email` |
| `ai_messages/{id}` | AI messages | Owner by `user_email` |
| `ai_usage/{id}` | AI quota tracking | Owner by `user_email` |
| `user_push_tokens/{uid}/devices/{id}` | Expo push tokens | Owner read/write only |
| `config/{docId}` | App config (e.g. listing auto-approve) | Auth read; admin write |

Rules file: `firestore.rules` (version `2`).

### Helper functions in rules

- `isAdmin()` — `users/{uid}.role == 'admin'`
- `authEmailLower()` — token email or `users/{uid}.email` (supports phone OTP users)
- `isConversationParticipant()` — match by `participant_uids` or `participant_1` / `participant_2` email
- `isMessageSenderOrReceiver()` — match `sender_email` / `receiver_email`

---

## Composite indexes

Defined in `firestore.indexes.json`. Deploy:

```bash
firebase deploy --only firestore:indexes
```

| Collection | Fields | Use case |
|------------|--------|----------|
| `banner_ads` | `is_active` ASC, `order` ASC | Active banners |
| `banner_requests` | `created_by` ASC, `created_date` DESC | User requests |
| `conversations` | `participant_1` ASC, `last_message_date` DESC | Inbox (side 1) |
| `conversations` | `participant_2` ASC, `last_message_date` DESC | Inbox (side 2) |
| `conversations` | `participant_uids` CONTAINS, `last_message_date` DESC | UID-based inbox |
| `listings` | `status` ASC, `created_date` DESC | Active listings |
| `listings` | `created_by` ASC, `created_date` DESC | My listings |
| `listings` | `status` ASC, `category` ASC, `created_date` DESC | Category filter |
| `listings` | `listing_type` ASC, `status` ASC, `created_date` DESC | Type filter |
| `messages` | `conversation_id` ASC, `created_date` DESC | Chat history |
| `saved_listings` | `created_by` ASC, `created_date` DESC | Saved list |

See also `docs/FIRESTORE_INDEXES.md`.

---

## Firebase Storage

Rules: `storage.rules`

| Path pattern | Read | Write |
|--------------|------|-------|
| `images/**` | Public | Authenticated |
| `public/**` | Public | Authenticated |
| `users/{userId}/**` | Public | Owner (`uid` match) |
| `listings/{listingId}/**` | Public | Authenticated |
| `banners/**` | Public | Authenticated |
| All other paths | Denied | Denied |

`firebase.json` does **not** include storage rules. Deploy separately:

```bash
firebase deploy --only storage
```

---

## Cloud Functions

**File:** `functions/index.js`  
**Region:** `asia-northeast3` (`setGlobalOptions`)

### `onChatMessageCreatedPush`

- **Trigger:** `onDocumentCreated` on `messages/{messageId}`
- **Flow:**
  1. Read `receiver_email`, `sender_email`, `conversation_id`, `message`
  2. Resolve receiver UID via `users` collection (`email` query)
  3. Load Expo tokens from `user_push_tokens/{uid}/devices/*`
  4. POST to `https://exp.host/--/api/v2/push/send`
  5. Prune invalid tokens (`DeviceNotRegistered`, `InvalidCredentials`)

Deploy:

```bash
cd functions && npm install && cd ..
firebase deploy --only functions
```

Often deployed together with rules:

```bash
firebase deploy --only firestore:rules,functions
```

### Maintenance scripts

`functions/scripts/backfill-conversation-participant-uids.js` — backfill `participant_uids` on conversations.

---

## Authentication providers

| Provider | Web | Mobile |
|----------|-----|--------|
| Email/password | Yes (`Login.jsx`, `Register.jsx`) | Yes |
| Phone OTP | Limited (web reCAPTCHA) | Yes — EAS build + native Firebase (`PHONE_OTP_NATIVE_SETUP.md`) |
| Facebook | Yes (`facebookAuthService.js`) | Planned |

After auth, `authService` ensures `users/{uid}` exists with email for Firestore rule matching. PHP `user_sync` mirrors user to MySQL.

---

## Admin role

Set in Firestore Console:

```
users/{firebaseUid}
  role: "admin"
```

Checked by `isAdmin()` in `firestore.rules` and admin UI gates. See root `ADMIN_SETUP_GUIDE.md`.

---

## `firebase.json` reference

```json
{
  "firestore": {
    "database": "(default)",
    "location": "asia-northeast3",
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "functions": [{ "source": "functions", "codebase": "default" }]
}
```

CLI project selection: `.firebaserc` → `"default": "koreazar-32e7a"`.

---

## Operational checklist

| Task | Command / location |
|------|-------------------|
| Deploy Firestore rules | `firebase deploy --only firestore:rules` |
| Deploy indexes | `firebase deploy --only firestore:indexes` |
| Deploy functions | `firebase deploy --only functions` |
| Deploy storage rules | `firebase deploy --only storage` |
| Verify web env | Vercel → Production → `VITE_FIREBASE_*` |
| Verify mobile env | expo.dev → zarkorea-app → Environment variables |
| Monitor | Firebase Console → Auth, Firestore, Functions logs |

---

## Related documentation

- [CHAT_SYSTEM.md](./CHAT_SYSTEM.md) — messaging schema and push
- [DEPLOYMENT.md](./DEPLOYMENT.md) — Vercel + EAS deploy steps
- `mobile/docs/EAS_PRODUCTION_ENV.md` — production Firebase env for mobile
- `mobile/docs/CHAT_PUSH_SETUP.md` — FCM V1 + Expo push setup
- Root `FIREBASE_VERCEL_SETUP.md`, `FIREBASE_SETUP_CHECKLIST.md` — extended setup guides
