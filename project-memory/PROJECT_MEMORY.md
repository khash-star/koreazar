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
- **Data:** Firebase **Firestore** (listings, banners) and **Firebase Storage** (images).
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
2. `useQuery` fetches **banner ads** + **listings** via Firestore `getDocs()` (~0.5–2s typical).
3. Only after Firestore returns are image URLs known; browser then fetches from Firebase Storage.

**Bottleneck:** Image loading cannot start until the Firestore round-trip completes.

### PWA (planned / incremental)

- Add **vite-plugin-pwa**: manifest + Workbox service worker, `registerType: 'autoUpdate'`.
- Precache static assets; `navigateFallback: '/index.html'` for SPA routes.
- Manifest branding: name `Koreazar`, theme `#ea580c`, `start_url: '/'`.
- PWA is a **prerequisite** for Play Store TWA packaging.

### Firestore query indexes

Defined in **`firestore.indexes.json`** (see `docs/FIRESTORE_INDEXES.md`):

| Use case | Fields |
|----------|--------|
| Active listings (home) | `status` ASC, `created_date` DESC |
| My listings | `created_by` ASC, `created_date` DESC |
| Category filter | `status` ASC, `category` ASC, `created_date` DESC |

---

## Deployment notes

### Web (Vercel)

- Build output: `dist/` (`index.html` + hashed assets).
- After PWA plugin: expect `manifest.webmanifest` and `sw.js` in `dist/`.
- Deploy Firestore indexes: `firebase deploy --only firestore:indexes` (or create via Console link on index errors).

### Android Play Store (TWA)

1. PWA live on Vercel with valid **manifest** + **service worker**.
2. `npx @bubblewrap/cli init --manifest=https://zarkorea.com/manifest.webmanifest`
3. App ID: `com.zarkorea.twa`; start URL `/`; theme `#ea580c`.
4. Update **`public/.well-known/assetlinks.json`** with real **SHA-256** signing fingerprint from Bubblewrap init.
5. Redeploy web so `assetlinks.json` is served; verify Digital Asset Links.

### Environment

- Firebase keys via Vite `VITE_*` env vars on Vercel (not duplicated here).

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
| **Firestore-before-images** | Listing/banner documents carry image URLs; no image fetch until Firestore responds. |
| **Mitigations for LCP** | `preconnect` to `firestore.googleapis.com`; React Query `staleTime` 2–5 min; `loading="eager"` on first two cards. |
| **PWA via vite-plugin-pwa** | Incremental, non-breaking steps; plugin order after `nonBlockingCss` in `vite.config.js`. |
| **TWA over native wrapper (Android doc path)** | Reuses web app; requires correct `assetlinks.json` + manifest URL. |
| **SPA + Workbox fallback** | All navigations serve `index.html` except SW/workbox assets. |

---

## Known deployment risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Missing Firestore composite indexes** | Home/category/my-listings queries fail at runtime | Deploy `firestore.indexes.json`; use Console link from error |
| **Wrong or placeholder `assetlinks.json` fingerprint** | TWA / Play integrity fails | Replace `00:00:00:...` with Bubblewrap SHA-256; redeploy |
| **PWA not deployed before TWA** | Bubblewrap init or store review fails | Ship manifest + SW on production domain first |
| **Manifest URL mismatch** | Init uses wrong origin | Use `https://zarkorea.com/manifest.webmanifest` |
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
`docs/FIRESTORE_INDEXES.md` · `docs/IMAGE_LOAD_ANALYSIS.md` · `docs/PWA_IMPLEMENTATION_PLAN.md` · `docs/PLAY_STORE_SETUP.md`
