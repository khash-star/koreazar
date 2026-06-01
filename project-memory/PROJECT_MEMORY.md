# Koreazar — AI Project Memory

> **Source:** Canonical project-authored docs in `docs/` and task summaries in `summaries/`.  
> **Updated:** 2026-06-01 · See `summaries/` and `reports/` for broader inventory.  
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
- **Data:** Hybrid model — listings through PHP/MySQL API; Firebase **Firestore** for users, banners, chat, saved-listing pointers, feedback/reports, and push-token state; **Firebase Storage** for images.
- **Android distribution (documented path):** Wrap the deployed PWA as a **TWA** via Bubblewrap for Google Play (`com.zarkorea.twa`).
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
2. Listing cards load through the PHP MySQL API (`api/index.php?action=listings`).
3. Banner ads still load from Firestore (`banner_ads`).
4. Only after listing/banner records return are image URLs known; browser then fetches from Firebase Storage.

**Bottleneck:** Image loading cannot start until the API/Firestore metadata round-trips complete.

### PWA (implemented)

- **vite-plugin-pwa** is configured in `vite.config.js` after `nonBlockingCss()`.
- Manifest is generated as **`manifest.json`** (not `manifest.webmanifest`).
- Workbox uses `registerType: 'autoUpdate'`, SPA `navigateFallback: '/index.html'`, and runtime image caches for Firebase Storage URLs.
- `npm run build` runs `generate-pwa-icons` before `vite build`.
- PWA is a **prerequisite** for Play Store TWA packaging.

### Firestore query indexes

Defined in **`firestore.indexes.json`** (see `docs/FIRESTORE_INDEXES.md`):

| Use case | Fields |
|----------|--------|
| Banners | `is_active` ASC, `order` ASC |
| Chat inbox | `participant_1` / `participant_2` ASC, `last_message_date` DESC |
| Phone OTP chat visibility | `participant_uids` ARRAY_CONTAINS, `last_message_date` DESC |
| Saved listing history | `created_by` ASC, `created_date` DESC |

Listing indexes may remain in `firestore.indexes.json` for legacy/migration data, but primary listing reads/writes now use the PHP MySQL API.

---

## Deployment notes

### Web (Vercel)

- Build output: `dist/` (`index.html` + hashed assets).
- PWA build outputs include `manifest.json`, `sw.js`, and Workbox files in `dist/`.
- Deploy Firestore indexes: `firebase deploy --only firestore:indexes` (or create via Console link on index errors).

### Android Play Store (TWA)

1. PWA live on Vercel with valid **manifest** + **service worker**.
2. `npx @bubblewrap/cli init --manifest=https://zarkorea.com/manifest.json`
3. App ID: `com.zarkorea.twa`; start URL `/`; theme `#ea580c`.
4. Update **`public/.well-known/assetlinks.json`** with real **SHA-256** signing fingerprint from Bubblewrap init.
5. Redeploy web so `assetlinks.json` is served; verify Digital Asset Links.

### Environment

- Firebase keys via Vite `VITE_*` env vars on Vercel (not duplicated here).

---

## Admin system notes

The canonical `docs/` files **do not** define admin RBAC. For AI tasks involving admin:

- Treat admin as **out of scope** in this memory file until `ADMIN_SETUP_GUIDE.md` (repo root) is ingested separately.
- Product areas that typically need admin (banners, listing moderation, broadcast messages) are not specified in the `docs/` quartet.

---

## Important engineering decisions

| Decision | Rationale |
|----------|-----------|
| **Hybrid data architecture** | `docs/DATA_ARCHITECTURE.md` documents which domains use PHP/MySQL vs Firestore. |
| **Indexes as code** | `firestore.indexes.json` + CLI deploy; `docs/FIRESTORE_INDEXES.md` is canonical over root `FIRESTORE_INDEXES.md`. |
| **Metadata-before-images** | Listing/banner records carry image URLs; no image fetch until API/Firestore metadata responds. |
| **Mitigations for LCP** | `preconnect` to `firestore.googleapis.com`; React Query `staleTime` 2–5 min; `loading="eager"` on first two cards. |
| **PWA via vite-plugin-pwa** | Implemented with `manifest.json`; plugin order after `nonBlockingCss` in `vite.config.js`. |
| **TWA over native wrapper (Android doc path)** | Reuses web app; requires correct `assetlinks.json` + manifest URL. |
| **SPA + Workbox fallback** | All navigations serve `index.html` except SW/workbox assets. |

---

## Known deployment risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Missing Firestore composite indexes** | Banner/chat/saved-listing queries fail at runtime | Deploy `firestore.indexes.json`; use Console link from error |
| **PHP API unavailable or stale** | Listing reads/writes fail on web and mobile | Verify `VITE_API_BASE_URL` / `EXPO_PUBLIC_API_BASE_URL` and the deployed `api/index.php` |
| **Wrong or placeholder `assetlinks.json` fingerprint** | TWA / Play integrity fails | Replace `00:00:00:...` with Bubblewrap SHA-256; redeploy |
| **PWA not deployed before TWA** | Bubblewrap init or store review fails | Ship manifest + SW on production domain first |
| **Manifest URL mismatch** | Init uses wrong origin | Use `https://zarkorea.com/manifest.json` |
| **Stale documentation elsewhere in repo** | Wrong paths (`zar-746103b7/`), domains (`zarmongolia.com`), or Firebase project IDs | Prefer this file + `docs/*`; verify against live Vercel/Firebase console |
| **Doc vs code drift on PWA** | `PWA_IMPLEMENTATION_PLAN.md` may lag actual `vite.config.js` | Confirm `vite-plugin-pwa` in repo before Play/TWA steps |

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
`docs/DATA_ARCHITECTURE.md` · `docs/FIRESTORE_INDEXES.md` · `docs/IMAGE_LOAD_ANALYSIS.md` · `docs/PWA_IMPLEMENTATION_PLAN.md` · `docs/PLAY_STORE_SETUP.md`
