# Koreazar — Architecture

> System design for the web SPA, mobile app, PHP API, and Firebase backend.  
> **Stack versions:** Vite ^6.4.1 · React ^18.2.0 (web) · Expo ~55.0.24 · React Native 0.83.6 (mobile)

---

## High-level diagram

```mermaid
flowchart TB
  subgraph clients [Clients]
    Web["Web SPA\n(Vite + React)\nzarkorea.com"]
    Mobile["Mobile App\n(Expo RN)\niOS / Android"]
  end

  subgraph vercel [Vercel]
    Dist["dist/\nindex.html + assets\nmanifest.json + SW"]
  end

  subgraph firebase [Firebase koreazar-32e7a]
    Auth[Firebase Auth]
    FS[Firestore]
    Storage[Firebase Storage]
    CF[Cloud Functions\nasia-northeast3]
  end

  subgraph api_host [api.zarkorea.com]
    PHP["api/index.php\nPHP + MySQL"]
  end

  Web --> Dist
  Web --> Auth
  Web --> FS
  Web --> Storage
  Web --> PHP
  Mobile --> Auth
  Mobile --> FS
  Mobile --> Storage
  Mobile --> PHP
  FS --> CF
  CF --> ExpoPush[Expo Push API]
  Mobile --> ExpoPush
```

---

## Web application

### Entry and providers

| File | Role |
|------|------|
| `src/main.jsx` | React DOM mount |
| `src/App.jsx` | `QueryClientProvider` (3 min `staleTime`), `AuthProvider`, `Pages`, `Toaster` |
| `src/contexts/AuthContext.jsx` | Firebase auth state; lazy-loads `authService`; syncs `users/{uid}` for rules |
| `src/pages/index.jsx` | React Router v7; lazy-loaded page components |

### Routing

Client-side routes (path = component):

| Path | Page | Layout |
|------|------|--------|
| `/` | `Home` | Yes |
| `/Login`, `/Register` | Auth | No |
| `/ListingDetail` | Listing detail | Yes |
| `/CreateListing`, `/EditListing`, `/MyListings` | Listing management | Yes |
| `/SavedListings` | Saved listings | Yes |
| `/Messages`, `/Chat` | Messaging | Yes |
| `/Profile` | User profile | Yes |
| `/AIBot` | AI assistant | Yes |
| `/Privacy` | Privacy policy | Yes |
| `/AdminPanel`, `/AdminAllListings`, `/AdminNewListings`, `/AdminBanners`, `/AdminBannerRequests`, `/AdminListingReports` | Admin | Yes |
| `/RequestBannerAd`, `/UpgradeListing` | Monetization | Yes |

Vercel SPA fallback: all non-file paths rewrite to `/index.html` (`vercel.json`).

### Service layer (`src/services/`)

| Service | Backend | Responsibility |
|---------|---------|----------------|
| `listingService.js` | PHP API (`VITE_API_BASE_URL`) | Listings CRUD, filters, view counts |
| `bannerService.js` | Firestore `banner_ads` | Homepage banners |
| `conversationService.js` | Firestore `conversations`, `messages` | User-to-user chat |
| `authService.js` | Firebase Auth + Firestore `users` + PHP `user_sync` | Login, registration, profile |
| `storageService.js` | Firebase Storage | Image upload/compress |
| `savedListingsResolve.js` | Firestore `saved_listings` | Saved listing refs |
| `aiService.js`, `aiConversationService.js`, `aiUsageService.js` | Firestore + PHP `ai_chat` | AI bot |
| `listingReportService.js` | Firestore `listing_reports` | Report listings |
| `feedbackService.js` | Firestore `feedback_messages` | Footer feedback |
| `appConfigService.js` | Firestore `config` | App-wide settings |
| `facebookAuthService.js` | Firebase Auth (Facebook) | Social login |
| `accountDeletion.js` | Auth + Firestore | Account removal |

Entity wrappers in `src/api/entities.js` expose a stable API (`Listing`, `Conversation`, `Message`, `BannerAd`, etc.) to pages.

### PHP API (`api/`)

Hosted separately at `https://api.zarkorea.com/index.php`. Actions (from `api/index.php`):

| Action | Method | Auth | Purpose |
|--------|--------|------|---------|
| `health` | GET | No | DB connectivity check |
| `listings` | GET | No | List/filter listings |
| `listing` | GET/PATCH/DELETE | Bearer for writes | Single listing |
| `user_sync` | POST | Bearer | Sync Firebase user to MySQL |
| `ai_chat` | POST | Bearer | OpenAI proxy |
| `ai_moderate` | POST | Bearer | Content moderation proxy |

Listings use numeric MySQL IDs (`parseMysqlListingId` in `listingService.js`).

### PWA (`vite.config.js`)

- **Plugin:** `vite-plugin-pwa` ^1.2.0, `registerType: 'autoUpdate'`
- **Manifest:** `manifest.json` (not `.webmanifest`) — name `Zarkorea`, theme `#ea580c`, `start_url: /`
- **Workbox:** precache JS/CSS/HTML; `navigateFallback: /index.html`; runtime cache for Firebase Storage URLs
- **Performance:** `nonBlockingCss()` plugin defers CSS for LCP

Build script: `npm run build` → `sync-listings` + `generate-pwa-icons` + `vite build` → `dist/`.

---

## Mobile application (`mobile/`)

### Layout

| Path | Purpose |
|------|---------|
| `mobile/src/config/firebase.native.js` | Firebase init (native) |
| `mobile/src/config/firebase.web.js` | Firebase init (Expo web) |
| `mobile/src/services/` | Parallel services to web (listings via `apiClient.js`) |
| `mobile/app.config.js` | Resolves `GOOGLE_SERVICES_JSON` / `GOOGLE_SERVICE_INFO_PLIST` for EAS |
| `mobile/app.json` | Expo config: slug `zarkorea-app`, scheme `zarkorea`, version `1.0.4` |

### Platform split

- **Native:** `@react-native-firebase/auth` for phone OTP; `storageService.native.js`; Reanimated in `CategoryStrip.native.js`
- **Web (Expo):** `firebase.web.js`; `storageService.web.js`; `CategoryStrip.web.js`
- **Push:** `pushTokenService.js` → `user_push_tokens/{uid}/devices/{tokenId}`

### Constants sync

Categories and locations are authored in `src/constants/listings.js` (web). Before mobile builds:

```bash
npm run sync-listings   # from repo root
```

Copies to `mobile/src/constants/listings.js`.

---

## Authentication flow

```mermaid
sequenceDiagram
  participant User
  participant Client as Web or Mobile
  participant Auth as Firebase Auth
  participant FS as Firestore users
  participant API as PHP user_sync

  User->>Client: Login (email or phone OTP)
  Client->>Auth: signIn / verify OTP
  Auth-->>Client: ID token + uid
  Client->>FS: ensure users/{uid} doc (email for rules)
  Client->>API: POST user_sync (Bearer token)
  API-->>Client: MySQL user row synced
```

Phone OTP users get synthetic emails (`phoneToAuthEmail`) so Firestore chat rules can match participants.

---

## Home page data path (performance-critical)

1. Browser loads `index.html` → Vite bundle → `Home` mounts.
2. React Query fetches **banners** (Firestore) and **listings** (PHP API).
3. Image URLs from responses trigger Firebase Storage / CDN fetches.

**Bottleneck:** Images cannot load until listing/banner API responses return. Mitigations documented in `docs/IMAGE_LOAD_ANALYSIS.md` (preconnect, `staleTime`, eager loading on first cards).

---

## Image pipeline

| Step | Location |
|------|----------|
| Client compression | `src/components/utils/imageCompressor.jsx` |
| Upload | `storageService.js` → paths `listings/{id}/`, `images/`, `banners/` |
| URL helpers | `src/utils/imageUrl.js` |
| Storage rules | `storage.rules` — public read, auth write |

---

## AI assistant

- **Web page:** `src/pages/AIBot.jsx`
- **Storage:** Firestore `ai_conversations`, `ai_messages`, `ai_usage`
- **Inference:** PHP `action=ai_chat` proxies to OpenAI (`OPENAI_API_KEY`, `OPENAI_MODEL` on server)

---

## Security architecture

| Layer | Implementation |
|-------|----------------|
| Transport | HTTPS (Vercel HSTS; API TLS) |
| Headers | `vercel.json` CSP, X-Frame-Options, etc. |
| Auth | Firebase ID tokens; Bearer on API writes |
| Data | `firestore.rules`, `storage.rules` |
| Input | `src/utils/security.js`, `bannedContent.js` |
| RBAC | Firestore `users.role == 'admin'` |

Details: root `SECURITY.md`.

---

## Shared vs platform-specific code

| Concern | Shared pattern |
|---------|----------------|
| Listings | Both clients call same PHP API |
| Chat | Both use `conversationService` (web `src/`, mobile `mobile/src/`) |
| Firebase config | Separate env prefixes: `VITE_*` vs `EXPO_PUBLIC_*` |
| UI | Web: Radix + Tailwind; Mobile: React Navigation + RN components |

Do not merge web and mobile into one bundle; keep `mobile/` isolated per `mobile/README.md`.
