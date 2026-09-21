# Koreazar — AI Project Memory

> **Canonical product/stack:** `docs/PROJECT_MEMORY.md` and `docs/ARCHITECTURE.md` (code wins over this file).
> **Updated:** 2026-09-21 · Agent workflows stay in this folder; product facts live in `docs/`.
> **Before code changes:** Read `CODING_SAFETY_CHECKLIST.md`.
> **Complex work** (reviews, architecture, production-sensitive): Read `SENIOR_DEVELOPER_SYSTEM.md`.
> **After code changes:** Run `reviews/self-review-workflow.md`; see `reports/AI_SELF_REVIEW_SYSTEM.md` for production-sensitive review.
> **PR / release / deploy / rollback:** Use `devops/README.md` and playbooks (`pull-request-workflow.md`, `deployment-gates.md`, `release-workflow.md`, `rollback-workflow.md`).
> **QA / testing:** After code changes run applicable `qa/` playbooks (`qa/README.md`, `qa/test-strategy.md`); before release use `qa/pre-release-qa-checklist.md`; fill `templates/test-report.md`.
> **Full agent order:** `AGENT_TASK_WORKFLOW.md` (Task → memory → code → review → QA → DevOps → memory update).

---

## Project overview

- **Product:** Koreazar — Mongolian-language classifieds: **Zarkorea** (KR, https://zarkorea.com) and **ZAR-USA** (Washington DC / DMV, `/us`). JP is scaffolded at `/jp` but not in `ENABLED_COUNTRIES`.
- **Web:** Vite 6 + React 18 SPA at repo root → Vercel `dist/`.
- **Mobile:** Expo in `mobile/` only. KR `production` (`com.zarkorea.twa`); ZAR-USA `production-us` (`com.zarusa.app`, `EXPO_PUBLIC_ACTIVE_COUNTRY=US`). Version scan: `1.0.5` / iOS `47` / Android `43`.
- **Listings:** PHP + MySQL at `https://api.zarkorea.com/index.php` (`api/`). Firestore `listings` is legacy.
- **Firebase (`koreazar-32e7a`):** Auth, Firestore (chat, banners, users, config), Storage, Cloud Functions (chat push).
- **Privacy:** https://zarkorea.com/Privacy

---

## Architecture overview

### Web runtime

| Layer | Choice |
|-------|--------|
| UI | React 18 SPA |
| Build | Vite 6 (`sync-listings` → `sync-admin-roles` → PWA icons → `vite build`) |
| Routing | `/` is KR home; market prefixes `/kr`, `/us`, `/jp`; admin routes unprefixed |
| Markets | `ENABLED_COUNTRIES` = `KR` + `US`; `/us` selector lock is `lockCountrySelector` |
| Hosting | Vercel → `dist/` (`manifest.json` + Workbox SW) |

### Home page data path (performance-critical)

1. Load `index.html` → JS bundle → mount `Home`.
2. `useMarketPageMeta()` sets title / description / icons for the active market.
3. React Query fetches **banners** (Firestore) and **listings** (PHP API with `country_code` / `region_code`).
4. Client applies `filterListingsForMarket` (defense in depth; API `append_kr_listing_read_filter` is authoritative for KR).
5. Image URLs from those responses are fetched from Firebase Storage.

**Bottleneck:** Images cannot start until listing/banner data returns. See `docs/IMAGE_LOAD_ANALYSIS.md`.

### Market isolation (do not weaken)

| Layer | Behavior |
|-------|----------|
| Writes | URL-only `resolveRouteCountryCode()` — never tag from `localStorage`. Unprefixed `/CreateListing` → KR |
| US reads/writes | Default `region_code=washington-dc`; states DC/VA/MD only |
| KR reads | Exclude US/JP and any row with a non-empty `region_code` |
| Admin back-links | `useMarketHomePath` so scoped US admins return to `/us` |
| Post-login return | `/Login` unprefixed: `state.from` / `?redirect=` / `loginRedirect`, else KR `/` |
| Canonical SEO | `index.html` canonical stays `https://zarkorea.com/`; sitemap has no `/us` |

### Firestore query indexes

Chat / banners / saved listings use **`firestore.indexes.json`** (`docs/FIRESTORE_INDEXES.md`). Home listing feeds are **MySQL**, not these Firestore listing indexes.

---

## Deployment notes

### Web (Vercel)

- Build output: `dist/` (`index.html`, hashed assets, `manifest.json`, Workbox `sw.js`).
- Env: `VITE_FIREBASE_*`, `VITE_API_BASE_URL` (names only; values stay in the dashboard).

### PHP API (`api.zarkorea.com`)

Vercel does **not** deploy `api/`. Use `npm run deploy:zarusa-api` (SCP), `deploy:zarusa-api:ftp`, or `package:zarusa-api`. Credentials: gitignored `scripts/deploy-zarusa-api.local.env`. Runbook: `docs/ZARUSA_STAGING_DEPLOY.md`.

### Mobile (EAS)

- KR: `production` / `com.zarkorea.twa` — `mobile/docs/IOS_ANDROID_RELEASE_CHECKLIST.md`
- US: `production-us` / `com.zarusa.app` — `mobile/docs/ZARUSA_BUILD.md`
- TWA/Play historical path: `docs/PLAY_STORE_SETUP.md` (native Expo is the current store path)

### Environment

- Web `VITE_*`, mobile `EXPO_PUBLIC_*`, API `api/.env` — names in `docs/PROJECT_MEMORY.md`, never values.

---

## Admin system notes

Scoped RBAC is implemented. Canonical matrix: `docs/ZARUSA_REGION_PHASES.md` Phase 2.

| Role | Scope |
|------|--------|
| `super_admin` (legacy `admin`) | Global KR + US; only role that assigns roles |
| `country_admin` + `admin_country_code` | One country |
| `region_admin` + `admin_region_code` | One US region (e.g. `washington-dc`); no user management or broadcast |

Source of truth: `src/constants/adminRoles.js` → `npm run sync-admin-roles`. Firestore UI checks and PHP `get_app_admin_scope()` (UID, then email) must stay in sync via `admin_set_user_role` / `user_sync`. Assignment UI: `AdminPanel` (super admin). QA: `qa/admin-rbac-tests.md`.

---

## Important engineering decisions

| Decision | Rationale |
|----------|-----------|
| **Hybrid backend** | Listings in MySQL/PHP; chat, banners, saved, AI, config in Firestore |
| **URL-first market scope** | Stored preference must never change listing country/region ownership |
| **US selector lock ≠ ENABLED list** | US is enabled; `/us` hides KR via `lockCountrySelector` |
| **Dual-layer KR feed isolation** | API filter + client `filterListingsForMarket` |
| **Scoped admin + MySQL mirror** | UI/rules/API all check scope; PHP looks up `firebase_uid` then `email` |
| **Indexes as code** | `firestore.indexes.json` + CLI deploy (`docs/FIRESTORE_INDEXES.md`) |
| **PWA via vite-plugin-pwa** | `manifest.json`, Workbox, `registerType: 'autoUpdate'` |
| **SPA + Workbox fallback** | Non-file navigations serve `index.html` |

---

## Known deployment risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **US rows on KR home** | Cross-market leak | Keep API + client filters; review `api/sql/fix_us_listings_country_code.sql` after backup |
| **Firestore admin works, PHP 403** | Scoped admin cannot moderate listings | Mirror MySQL `users` role/scope (`firebase_uid` or email) |
| **Missing region/RBAC columns** | API filters/roles fail | Staging `SHOW COLUMNS` first; `docs/ZARUSA_STAGING_DEPLOY.md` |
| **Missing Firestore composite indexes** | Chat/banner queries fail | Deploy `firestore.indexes.json` |
| **Wrong EAS Firebase env** | Mobile auth/crash | Match Console; `mobile/docs/EAS_PRODUCTION_ENV.md` |
| **Stale root / archived markdown** | Wrong stack (Base44, Firestore listings) | Prefer `docs/*` + this file; `docs/archive/` is historical |

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
`docs/PROJECT_MEMORY.md` · `docs/ARCHITECTURE.md` · `docs/DEPLOYMENT.md` · `docs/ZARUSA_REGION_PHASES.md` · `docs/TROUBLESHOOTING.md` · `docs/FIRESTORE_INDEXES.md`
