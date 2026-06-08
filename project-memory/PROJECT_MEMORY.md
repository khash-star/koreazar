# Koreazar — AI Project Memory

> **Source:** Canonical project-authored docs in `docs/` only (4 files).  
> **Updated:** 2026-05-28 · See `summaries/` and `reports/` for broader inventory.  
> **Before code changes:** Read `CODING_SAFETY_CHECKLIST.md`.  
> **Complex work** (reviews, architecture, production-sensitive): Read `SENIOR_DEVELOPER_SYSTEM.md`.  
> **After code changes:** Run `reviews/self-review-workflow.md`; see `reports/AI_SELF_REVIEW_SYSTEM.md` for production-sensitive review.  
> **PR / release / deploy / rollback:** Use `devops/README.md` and playbooks (`pull-request-workflow.md`, `deployment-gates.md`, `release-workflow.md`, `rollback-workflow.md`).  
> **QA / testing:** After code changes run applicable `qa/` playbooks (`qa/README.md`, `qa/test-strategy.md`); before release use `qa/pre-release-qa-checklist.md`; fill `templates/test-report.md`.  
> **Full agent order:** `AGENT_TASK_WORKFLOW.md` (Task → memory → code → review → QA → DevOps → memory update).

---

## Project overview

- **Product:** Koreazar (Zarkorea) — Mongolian-language classified ads for users in South Korea.
- **Web app:** Vite 6 + React 18 SPA (`react-router`), built to `dist/`, hosted on **Vercel** at **https://zarkorea.com**.
- **Data:** Hybrid backend. Listings are served by the PHP/MySQL API at `api/index.php`; Firestore remains active for users, banners, chat, saved-listing pointers, reports/feedback, config, AI usage/history, and push-token state. Firebase Storage serves images.
- **Mobile distribution:** Expo React Native app in `mobile/` is the active native path. TWA/Bubblewrap docs remain as a legacy/alternate web-wrapper path.
- **Privacy:** Play Store flow expects https://zarkorea.com/Privacy.

---

## Architecture overview

### Web runtime

| Layer | Choice |
|-------|--------|
| UI | React 18 SPA |
| Build | Vite 6 |
| Routing | Client-side (`/`, `/Login`, `/ListingDetail?id=...`, etc.) |
| Hosting | Vercel → `dist/` |

### Home page data path (performance-critical)

1. Load `index.html` → JS bundle → mount `Home`.
2. `useQuery` fetches **banner ads** through Firestore (`banner_ads`) and **listings** through `entities.Listing.filter()` → `src/services/listingService.js` → PHP `action=listings`.
3. Only after banner/listing rows return are image URLs known; browser then fetches Firebase Storage image URLs.

**Bottleneck:** Image loading cannot start until the data round-trip (Firestore banners and PHP listings) returns image URLs.

### PWA

- **Implemented** via `vite-plugin-pwa` in `vite.config.js`, after `nonBlockingCss`.
- Build emits `manifest.json` (intentional `.json`, not `.webmanifest`), service worker, and Workbox/register assets.
- Workbox precaches static assets, uses `navigateFallback: '/index.html'`, and runtime-caches Firebase Storage images.
- Manifest branding: `Zarkorea`, theme `#ea580c`, `start_url: '/'`.

### Firestore query indexes

Defined in **`firestore.indexes.json`** (see `docs/FIRESTORE_INDEXES.md`):

| Use case | Fields |
|----------|--------|
| Active listing fallback / legacy Firestore listing queries | `status` ASC, `created_date` DESC |
| My listings fallback / legacy Firestore listing queries | `created_by` ASC, `created_date` DESC |
| Category listing fallback / legacy Firestore listing queries | `category` ASC, `status` ASC, `created_date` DESC |
| VIP/featured listing fallback / legacy Firestore listing queries | `listing_type` ASC, `status` ASC, `created_date` DESC |
| Banners and banner requests | `banner_ads.is_active/order`; `banner_requests.created_by/created_date` |
| Chat and saved listings | conversation participant indexes, message conversation index, saved-listing owner index |

---

## Deployment notes

### Web (Vercel)

- Build output: `dist/` (`index.html` + hashed assets).
- PWA output: expect `manifest.json`, `sw.js`, `registerSW.js`, and Workbox assets in `dist/`.
- Deploy Firestore indexes: `firebase deploy --only firestore:indexes` (or create via Console link on index errors).

### PHP API

- Web and mobile listings default to `https://api.zarkorea.com/index.php` unless `VITE_API_BASE_URL` / `EXPO_PUBLIC_API_BASE_URL` overrides are set.
- `api/index.php` handles `health`, listings CRUD, AI proxy actions, and `user_sync`.
- Protected API actions use Firebase ID tokens in the `Authorization` header; OpenAI/MySQL secrets stay server-side.

### Firebase Functions

- `functions/index.js` exports `onChatMessageCreatedPush` in `asia-northeast3`.
- Chat push requires deployed Firestore rules/function, Expo push credentials, and mobile EAS builds.

### Android Play Store

- **Current native path:** Expo RN app (`mobile/`) with EAS production env and store QA docs.
- **Legacy/alternate TWA path:**

1. PWA live on Vercel with valid **manifest** + **service worker**.
2. `npx @bubblewrap/cli init --manifest=https://zarkorea.com/manifest.json`
3. App ID: `com.zarkorea.twa`; start URL `/`; theme `#ea580c`.
4. Update **`public/.well-known/assetlinks.json`** with real **SHA-256** signing fingerprint from Bubblewrap init.
5. Redeploy web so `assetlinks.json` is served; verify Digital Asset Links.

### Environment

- Web Firebase keys via Vite `VITE_FIREBASE_*` env vars on Vercel (not duplicated here).
- Optional web API override: `VITE_API_BASE_URL`.
- Mobile uses `EXPO_PUBLIC_*` env plus EAS file/credential configuration.
- Server-only values (MySQL, OpenAI, Firebase verification details) must remain outside public web/mobile env.

---

## Admin system notes

The four canonical `docs/` files **do not** define admin RBAC. For AI tasks involving admin:

- Treat admin as **out of scope** in this memory file until `ADMIN_SETUP_GUIDE.md` (repo root) is ingested separately.
- Product areas that typically need admin (banners, listing moderation, broadcast messages) are not specified in the `docs/` quartet.

---

## Important engineering decisions

| Decision | Rationale |
|----------|-----------|
| **Indexes as code** | `firestore.indexes.json` + CLI deploy; `docs/FIRESTORE_INDEXES.md` is canonical over root `FIRESTORE_INDEXES.md`. |
| **Hybrid listing backend** | Listings are PHP/MySQL-backed for web and mobile; Firestore still owns chat, banners, saved pointers, reports, config, AI usage/history, and push tokens. |
| **Data-before-images** | Listing/banner rows carry image URLs; no image fetch until PHP/Firestore data returns. |
| **Mitigations for LCP** | `preconnect` to `firestore.googleapis.com`; React Query `staleTime` 2–5 min; `loading="eager"` on first two cards. |
| **PWA via vite-plugin-pwa** | Implemented; plugin order after `nonBlockingCss` in `vite.config.js`; manifest file is `manifest.json`. |
| **Expo RN mobile path** | Native app in `mobile/` is separate from web and must preserve Expo compatibility. |
| **TWA as alternate wrapper path** | Reuses web app; requires correct `assetlinks.json` + manifest URL if used. |
| **SPA + Workbox fallback** | All navigations serve `index.html` except SW/workbox assets. |

---

## Known deployment risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **PHP API unavailable** | Listings, listing writes, AI proxy, and user sync fail on web/mobile | Verify `GET ?action=health`, API env, and host DNS before releases |
| **Missing Firestore composite indexes** | Banners, chat, saved listings, or legacy listing queries fail at runtime | Deploy `firestore.indexes.json`; use Console link from error |
| **Wrong or placeholder `assetlinks.json` fingerprint** | TWA / Play integrity fails | Replace `00:00:00:...` with Bubblewrap SHA-256; redeploy |
| **PWA artifacts not deployed before TWA** | Bubblewrap init or store review fails | Ship `manifest.json` + SW on production domain first |
| **Manifest URL mismatch** | Init uses wrong origin or filename | Use `https://zarkorea.com/manifest.json` unless config changes |
| **Chat push deploy mismatch** | Mobile token exists but notifications do not arrive | Deploy Firestore rules/functions and verify Expo FCM/APNs credentials |
| **Stale documentation elsewhere in repo** | Wrong paths (`zar-746103b7/`), domains (`zarmongolia.com`), or Firebase project IDs | Prefer this file + `docs/*`; verify against live Vercel/Firebase console |
| **Doc vs code drift on hybrid backend** | Old docs claim listings are Firestore-only | Confirm listing path in `src/services/listingService.js`, `mobile/src/services/listingService.js`, and `api/index.php` |

---

## Memory layout

| Path | Purpose |
|------|---------|
| `AGENT_TASK_WORKFLOW.md` | Canonical step order for every task |
| `CODING_SAFETY_CHECKLIST.md` | Pre-change safety checklist for Cursor |
| `SENIOR_DEVELOPER_SYSTEM.md` | Senior dev workflows, templates, reviews (complex tasks) |
| `reviews/self-review-workflow.md` | Post-change self-review and change audit |
| `reports/AI_SELF_REVIEW_SYSTEM.md` | When/how to run review workflows |
| `devops/README.md` | GitHub DevOps index (PR, release, gates, rollback) |
| `devops/pull-request-workflow.md` | Open, review, merge PRs |
| `devops/deployment-gates.md` | Pre-merge / production gates |
| `devops/release-workflow.md` | Release checklist (web + mobile) |
| `devops/rollback-workflow.md` | Rollback Vercel, Firebase, stores |
| `qa/README.md` | QA playbooks index |
| `qa/test-strategy.md` | What to test after changes |
| `qa/pre-release-qa-checklist.md` | Pass/fail gate before ship |
| `templates/test-report.md` | QA/regression handoff report |
| `summaries/architecture_summary.md` | Deeper architecture pointers |
| `summaries/deployment_summary.md` | Deploy / infra pointers |
| `summaries/api_summary.md` | API / integration surface |
| `summaries/known_bugs.md` | Historical issues index |
| `reports/MEMORY_ANALYSIS_REPORT.md` | Full 66-file markdown audit |

**Canonical doc sources for this file:**  
`docs/FIRESTORE_INDEXES.md` · `docs/IMAGE_LOAD_ANALYSIS.md` · `docs/PWA_IMPLEMENTATION_PLAN.md` · `docs/PLAY_STORE_SETUP.md` · `mobile/docs/CHAT_PUSH_SETUP.md` · `mobile/docs/EAS_PRODUCTION_ENV.md`
