# Koreazar — Project Memory

> Canonical developer reference for the Koreazar (Zarkorea) monorepo.  
> **Updated:** 2026-06-29 · Derived from repository scan (`MEMORY_ANALYSIS_REPORT.md`) and live codebase.  
> **Related docs:** [ARCHITECTURE.md](./ARCHITECTURE.md) · [FIREBASE.md](./FIREBASE.md) · [CHAT_SYSTEM.md](./CHAT_SYSTEM.md) · [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## Product overview

| Item | Value |
|------|--------|
| **Product** | Koreazar / Zarkorea — Mongolian-language classified ads for users in South Korea |
| **Public web** | https://zarkorea.com (Vercel) |
| **Vercel default host** | `koreazar.vercel.app` redirects permanently to `zarkorea.com` |
| **API** | https://api.zarkorea.com/index.php (PHP + MySQL) |
| **Privacy policy** | https://zarkorea.com/Privacy |
| **Repository layout** | Web at repo root; mobile at `mobile/` |
| **GitHub** | `khash-star/koreazar` |

---

## Technology stack

### Web (`package.json` at repo root)

| Layer | Technology | Version (from `package.json`) |
|-------|------------|-------------------------------|
| UI | React | ^18.2.0 |
| Build | Vite | ^6.4.1 |
| Routing | react-router-dom | ^7.2.0 |
| Styling | Tailwind CSS | ^3.4.17 |
| Data fetching | @tanstack/react-query | ^5.90.16 |
| Firebase client | firebase | ^12.7.0 |
| PWA | vite-plugin-pwa | ^1.2.0 |
| Hosting | Vercel | `vercel.json` → `dist/` |

### Mobile (`mobile/package.json`)

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Expo | ~55.0.24 |
| React Native | react-native | 0.83.6 |
| React | react | 19.2.0 |
| Firebase | firebase + @react-native-firebase/* | ^12.10.0 / ^24.0.0 |
| Builds | EAS CLI | `eas.json` profiles: development, preview, production |
| App ID | `com.zarkorea.twa` | iOS + Android (`mobile/app.json`) |

### Backend services

| Service | Location | Purpose |
|---------|----------|---------|
| **Firebase** | Project `koreazar-32e7a`, region `asia-northeast3` | Auth, Firestore, Storage, Cloud Functions |
| **PHP API** | `api/` → hosted at `api.zarkorea.com` | Listings CRUD (MySQL), AI proxy, user sync |
| **Cloud Functions** | `functions/` | Chat push notifications (`onChatMessageCreatedPush`) |

---

## Repository structure

```
koreazar/
├── src/                    # Web app (Vite + React)
│   ├── pages/              # Route pages (lazy-loaded)
│   ├── components/         # UI + feature components
│   ├── services/           # Data layer (Firestore, PHP API, auth)
│   ├── contexts/           # AuthContext
│   ├── constants/          # Shared web constants (`appUrls.js`, listing options)
│   ├── firebase/           # config.js (from VITE_* env)
│   └── api/entities.js     # Entity wrappers for pages
├── mobile/                 # Expo React Native app (separate client)
├── api/                    # PHP MySQL API (deployed separately)
├── functions/              # Firebase Cloud Functions (Node 20)
├── firestore.rules         # Firestore security rules
├── firestore.indexes.json  # Composite indexes (deploy via Firebase CLI)
├── storage.rules           # Firebase Storage rules
├── firebase.json           # Firestore + Functions config
├── vercel.json             # Web hosting, SPA rewrites, security headers
├── docs/                   # Canonical documentation (this folder)
└── project-memory/         # AI agent workflows and extended memory
```

---

## Data architecture (summary)

The platform uses a **hybrid backend**:

1. **Listings** — Primary store is **MySQL** via `api/index.php` (`listingService.js` → `VITE_API_BASE_URL`). Firebase ID token sent as `Authorization: Bearer` on writes.
2. **Banners, chat, saved listings, AI, config** — **Firestore** (`bannerService.js`, `conversationService.js`, etc.).
3. **Images** — **Firebase Storage** (`storageService.js`, paths under `images/`, `listings/`, `banners/`, `public/`).
4. **Auth** — **Firebase Authentication** (email/password, phone OTP on mobile, Facebook on web).

See [ARCHITECTURE.md](./ARCHITECTURE.md) for request flows and [FIREBASE.md](./FIREBASE.md) for collections and rules.

---

## Environment variables (names only)

Never commit secrets. Use `.env` locally and platform dashboards in production.

### Web (Vite — prefix `VITE_`)

| Variable | Purpose |
|----------|---------|
| `VITE_FIREBASE_API_KEY` | Firebase web SDK |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Storage bucket name |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | FCM sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |
| `VITE_API_BASE_URL` | PHP API entry (default `https://api.zarkorea.com/index.php`) |
| `VITE_OPENAI_API_KEY` | Optional client-side OpenAI (prefer server proxy) |
| `VITE_FIREBASE_PHONE_TEST_MODE` | Dev only — skip SMS reCAPTCHA with Console test numbers |

Template: `.env.example` at repo root. Firebase init template: `src/firebase/config.js.example`.

### Mobile (Expo — prefix `EXPO_PUBLIC_`)

| Variable | Purpose |
|----------|---------|
| `EXPO_PUBLIC_FIREBASE_API_KEY` | Firebase SDK |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | Auth domain (must match Console) |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | Project ID |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` | Storage bucket (must match Console) |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Sender ID |
| `EXPO_PUBLIC_FIREBASE_APP_ID` | App ID |
| `EXPO_PUBLIC_API_BASE_URL` | PHP API base URL |

EAS file env (not `EXPO_PUBLIC_`): `GOOGLE_SERVICES_JSON`, `GOOGLE_SERVICE_INFO_PLIST`.  
See `mobile/docs/EAS_PRODUCTION_ENV.md`.

### PHP API (`api/.env`)

| Variable | Purpose |
|----------|---------|
| `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` | MySQL connection |
| `APP_DEBUG` | Error detail in JSON responses |
| `FIREBASE_WEB_API_KEY` | Verify Firebase ID tokens on write endpoints |
| `OPENAI_API_KEY`, `OPENAI_MODEL` | AI chat/moderation proxy |
| `APP_ADMIN_UIDS` | Comma-separated Firebase UIDs with listing admin rights |

Template: `api/.env.example`.

---

## Engineering decisions

| Decision | Rationale |
|----------|-----------|
| **Hybrid listings (MySQL + Firestore)** | Listings migrated to PHP/MySQL API; chat/banners remain Firestore-native |
| **Firestore-before-images on home** | Banner/listing image URLs come from API/Firestore responses; LCP depends on data round-trip |
| **PWA via vite-plugin-pwa** | `manifest.json`, Workbox SW, `registerType: 'autoUpdate'`; prerequisite for Play/TWA path |
| **Canonical SEO host** | `index.html`, `robots.txt`, `sitemap.xml`, and Vercel redirects all point crawlers/users to `zarkorea.com` |
| **Official app URL constants** | Play Store link/package live in `src/constants/appUrls.js`; footer UI imports `PLAY_STORE_URL` |
| **Indexes as code** | `firestore.indexes.json` deployed with `firebase deploy --only firestore:indexes` |
| **Mobile in `mobile/`** | Separate Expo app; constants synced via `npm run sync-listings` from web `src/constants/listings.js` |
| **Chat push via Cloud Function** | `onChatMessageCreatedPush` on `messages/{messageId}` create → Expo Push API |
| **Security headers on Vercel** | CSP, HSTS, X-Frame-Options in `vercel.json` |

---

## Admin access

Admin role is stored in Firestore `users/{uid}.role == 'admin'`. Grant via Firebase Console (see root `ADMIN_SETUP_GUIDE.md`). Admin pages: `/AdminPanel`, `/AdminAllListings`, `/AdminNewListings`, `/AdminBanners`, `/AdminBannerRequests`, `/AdminListingReports`.

---

## Known risks and stale-doc warnings

| Risk | Mitigation |
|------|------------|
| Missing Firestore composite indexes | Deploy `firestore.indexes.json`; use Console link from query errors |
| Wrong `EXPO_PUBLIC_FIREBASE_*` on EAS | Match Firebase Console exactly; `eas env:push` from `mobile/.env` |
| `google-services.json` missing on EAS build | Upload via `GOOGLE_SERVICES_JSON` file env |
| Android push without FCM V1 on Expo | Configure in `eas credentials` — see `mobile/docs/CHAT_PUSH_SETUP.md` |
| Stale root-level markdown (52 files) | Prefer `docs/*` and this file; many root docs reference obsolete paths/domains |
| `storage.rules` not in `firebase.json` | Deploy storage rules separately: `firebase deploy --only storage` |

---

## Documentation map

| Doc | Topic |
|-----|--------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System design, routes, services, data flows |
| [FIREBASE.md](./FIREBASE.md) | Project config, collections, rules, indexes, functions |
| [FIRESTORE_SCHEMA.md](./FIRESTORE_SCHEMA.md) | Firestore + MySQL schema, fields, indexes, relations |
| [CHAT_SYSTEM.md](./CHAT_SYSTEM.md) | Messaging, push, Firestore schema |
| [SECURITY.md](./SECURITY.md) | Headers, auth, rules, secrets policy, checklist |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Vercel, Firebase CLI, EAS, API hosting |
| [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) | Common issues and fixes |
| `docs/FIRESTORE_INDEXES.md` | Index deploy quick reference |
| `docs/PLAY_STORE_SETUP.md` | TWA / Play Store (Bubblewrap) |
| `docs/PWA_IMPLEMENTATION_PLAN.md` | PWA rollout notes |
| `docs/IMAGE_LOAD_ANALYSIS.md` | Home page LCP analysis |
| `mobile/docs/*` | Mobile-specific setup (OTP, EAS, push, store) |
| `project-memory/` | AI agent workflows, checklists, runbooks |
| `MEMORY_ANALYSIS_REPORT.md` | Full 66-file markdown inventory (2026-05-28) |

---

## CI

GitHub Actions: `.github/workflows/node.js.yml` — `npm ci`, `npm run build`, `npm test` on Node 18/20/22 for pushes and PRs to `main`.
