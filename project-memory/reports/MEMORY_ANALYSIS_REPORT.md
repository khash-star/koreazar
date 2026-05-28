# Markdown Memory Analysis Report

**Repository:** `koreazar-repo` (Koreazar / Zarkorea)  
**Analysis date:** 2026-05-28  
**Scope:** Project-owned `.md` files only (excludes `node_modules/**`, `dist/**`, `mobile/.expo/**`)  
**Method:** Read-only scan and classification; no files were modified except this report.

---

## Executive summary

The repository contains **66** project markdown files, overwhelmingly at the **repository root** (52 files). Documentation grew organically during a **Base44 → Firebase + Vercel** migration: many one-off troubleshooting guides, overlapping Vercel deploy instructions, and point-in-time status snapshots. There is **no dedicated REST/API reference** documentation. **No file** contains autogeneration markers (`@generated`, `DO NOT EDIT`, etc.). Several docs reference **obsolete paths** (`zar-746103b7/`) or **alternate domains/projects** (`zarmongolia.com`, `carsmongolia-d410a` vs `koreazar-32e7a`).

---

## 1. Total markdown files found

| Scope | Count |
|-------|------:|
| **Project documentation (analyzed)** | **66** |
| `node_modules/**` (dependency READMEs) | 1,000+ (excluded) |
| `dist/mobile/readme.md` | 1 (build copy of `public/mobile/readme.md`) |
| `mobile/.expo/README.md` | 1 (Expo tooling; excluded) |

### Location breakdown (66 files)

| Location | Count |
|----------|------:|
| Repository root | 52 |
| `docs/` | 4 |
| `mobile/` | 3 |
| `mobile/docs/` | 3 |
| `mobile/screenshots-source/` | 1 |
| `public/mobile/` | 1 |
| `mobile/АЖИЛЛАХ-ГАЗАР.md` | 1 |
| Other under `mobile/` (non-node_modules) | 2 |

---

## 2. Category breakdown

### 2.1 Important project docs (14)

Canonical or onboarding material developers should keep.

| File | Notes |
|------|--------|
| `README.md` | Main web app entry: stack, quick start, env vars, doc links |
| `SECURITY.md` | Implemented security controls (headers, validation, Firestore rules summary) |
| `GITHUB_SETUP.md` | GitHub repo initialization and push workflow |
| `FIREBASE_VERCEL_SETUP.md` | Long-form Firebase + Vercel setup (339 lines) |
| `FIREBASE_SETUP_CHECKLIST.md` | Firebase onboarding checklist |
| `FIREBASE_CONFIG_SETUP.md` | Firebase config / env setup |
| `TESTING_FLOW.md` | End-to-end manual test flow (auth, listings) |
| `mobile/README.md` | Mobile app setup, features, sync with web constants |
| `mobile/АЖИЛЛАХ-ГАЗАР.md` | Single source of truth for where to open/edit mobile code |
| `FACEBOOK_LOGIN_SETUP.md` | OAuth integration setup |
| `KAKAO_LOGIN_SETUP.md` | OAuth integration setup |
| `OPENAI_SETUP.md` | OpenAI key / AIBot integration (not REST API reference) |
| `ADMIN_SETUP_GUIDE.md` | How to grant admin role in Firestore |
| `mobile/screenshots-source/README.md` | App Store screenshot workflow |

### 2.2 Deployment docs (18)

Hosting, DNS, store release, and production env.

| File | Notes |
|------|--------|
| `VERCEL_DEPLOY.md` | Deploy via CLI / dashboard |
| `VERCEL_DEPLOYMENT_GUIDE.md` | Phased deploy strategy (migration-era) |
| `VERCEL_QUICK_START.md` | Short deploy guide (contains example env values) |
| `VERCEL_QUICK_SETUP.md` | Extended quick setup for `zarmongolia.com` |
| `VERCEL_ENV_SETUP.md` | Vercel environment variables |
| `VERCEL_UPDATE.md` | Updating an existing Vercel project |
| `VERCEL_FIND_PROJECT.md` | Locating project in Vercel UI |
| `DOMAIN_SETUP_GUIDE.md` | Domain registrar / Vercel domain options |
| `CLOUDFLARE_VERCEL_DNS.md` | Cloudflare DNS records for Vercel |
| `CLOUDFLARE_NAMESERVERS_SETUP.md` | Nameserver migration |
| `DNS_TROUBLESHOOTING.md` | DNS debugging |
| `FIREBASE_STORAGE_PUBLISH_NOW.md` | Urgent: publish storage rules |
| `docs/PLAY_STORE_SETUP.md` | Play Store TWA deployment |
| `mobile/docs/PLAY_STORE_RN_REPLACE_TWA.md` | Replacing TWA with RN app |
| `mobile/docs/EAS_PRODUCTION_ENV.md` | EAS production Firebase env |
| `mobile/docs/IOS_ANDROID_RELEASE_CHECKLIST.md` | Pre-submission QA checklist |
| `FIRESTORE_SETUP_GUIDE.md` | Firestore database creation / setup |
| `STORAGE_RULES_GUIDE.md` | Firebase Storage rules deployment |

### 2.3 Architecture docs (5)

System design, flows, and technical plans.

| File | Notes |
|------|--------|
| `MESSAGE_SYSTEM_ARCHITECTURE.md` | Messages/Chat: files, Firestore schema, flows (~467 lines) |
| `ADMIN_MESSAGE_REPLY_FLOW.md` | Step-by-step admin reply flow (overlaps messages arch) |
| `docs/IMAGE_LOAD_ANALYSIS.md` | Image load critical path and performance |
| `docs/PWA_IMPLEMENTATION_PLAN.md` | PWA rollout plan (vite-plugin-pwa) |
| `MIGRATION_ANALYSIS.md` | Migration strategy and target architecture (historical + structural) |

### 2.4 API docs (0)

No OpenAPI/Swagger, no Vercel serverless route catalog, no entity API reference.

| File | Reclassification |
|------|------------------|
| `OPENAI_SETUP.md` | **Integration setup** (listed under important project docs) |

### 2.5 Bug fix / history docs (22)

Incident-specific fixes, debug sessions, and time-stamped project state.

| File | Notes |
|------|--------|
| `DEBUG_LISTING_CREATE.md` | Listing create / “not found” debug |
| `DEBUG_ADMIN_APPROVE.md` | Admin-approved listings not visible |
| `QUICK_FIX_AUTH.md` | Auth quick fix |
| `LOGIN_TROUBLESHOOTING.md` | Login issues |
| `TROUBLESHOOTING.md` | Base44 SDK redirect (likely obsolete) |
| `TROUBLESHOOTING_LISTING.md` | Listing not found |
| `VERCEL_BUILD_FIX.md` | `vite: command not found` on Vercel |
| `VERCEL_GITHUB_CONNECTION_FIX.md` | Deploy not updating from GitHub |
| `FIREBASE_STORAGE_FIX.md` | Storage 403 fix |
| `FIRESTORE_INDEX_QUICK_FIX.md` | Index error quick fix |
| `FIRESTORE_RULES_UPDATE.md` | Messages `is_read` rules patch |
| `FIREBASE_RULES_SETUP_NOW.md` | Permissions error → rules (references `carsmongolia-d410a`) |
| `FIREBASE_RESTORE_DATA.md` | Data missing after project switch |
| `FIREBASE_RESTORE_INSTRUCTIONS.md` | Same topic, alternate guide |
| `MIGRATION_COMPLETE.md` | Migration completion checklist |
| `MIGRATION_ROADMAP.md` | Migration phases |
| `COMPLETE_MIGRATION_PLAN.md` | Full migration task list |
| `CURRENT_STATUS.md` | Migration status snapshot |
| `NEXT_STEPS.md` | Post-rules “what to do next” snapshot |
| `PROJECT_REVIEW.md` | One-time project audit report |
| `REFACTORING_SUMMARY.md` | Refactoring changelog |
| `COMPLETE_PROJECT_CHECKLIST.md` | Full project audit checklist |

### 2.6 Autogenerated / generated docs (2)

No explicit codegen markers found. These behave like generated or placeholder artifacts:

| File | Notes |
|------|--------|
| `public/mobile/readme.md` | Single line: `Mobile app folder` (placeholder) |
| `dist/mobile/readme.md` | Build output copy (exclude from repo docs; not in the 66-count) |

**Tooling (excluded from 66):** `mobile/.expo/README.md` — Expo-generated local metadata.

### 2.7 Duplicate / similar docs (clusters)

| Cluster | Files | Relationship |
|---------|--------|----------------|
| **Vercel deploy** | `VERCEL_DEPLOY.md`, `VERCEL_DEPLOYMENT_GUIDE.md`, `VERCEL_QUICK_START.md`, `VERCEL_QUICK_SETUP.md` | Same goal; different length and outdated root paths |
| **Admin setup** | `ADMIN_SETUP.md`, `ADMIN_SETUP_GUIDE.md` | Same Firestore `role: admin` procedure |
| **Firestore indexes** | `FIRESTORE_INDEXES.md` (177 lines, manual Console steps), `docs/FIRESTORE_INDEXES.md` (22 lines, `firestore.indexes.json` + CLI) | **Complementary but confusing** — prefer `docs/` as canonical for deploy |
| **Firestore rules** | `FIRESTORE_RULES_SIMPLE.md`, `FIRESTORE_PRODUCTION_RULES.md`, `FIRESTORE_RULES_UPDATE.md`, `FIREBASE_RULES_SETUP_NOW.md` | Test vs production vs one-off patches |
| **Firebase Storage rules** | `FIREBASE_STORAGE_RULES.md`, `STORAGE_RULES_GUIDE.md`, `FIREBASE_STORAGE_PUBLISH_NOW.md`, `FIREBASE_STORAGE_FIX.md` | Overlapping storage rules guidance |
| **Migration status** | `README.md` (migration section), `CURRENT_STATUS.md`, `MIGRATION_COMPLETE.md`, `MIGRATION_ROADMAP.md`, `MIGRATION_ANALYSIS.md`, `COMPLETE_MIGRATION_PLAN.md` | Multiple truths; may conflict if not updated together |
| **Firebase restore** | `FIREBASE_RESTORE_DATA.md`, `FIREBASE_RESTORE_INSTRUCTIONS.md` | Near-duplicate |
| **Messaging** | `MESSAGE_SYSTEM_ARCHITECTURE.md`, `ADMIN_MESSAGE_REPLY_FLOW.md` | Architecture vs operational walkthrough |
| **Play Store** | `docs/PLAY_STORE_SETUP.md`, `mobile/docs/PLAY_STORE_RN_REPLACE_TWA.md` | TWA vs RN transition |
| **Listing troubleshoot** | `DEBUG_LISTING_CREATE.md`, `TROUBLESHOOTING_LISTING.md` | Same symptom domain |

### 2.8 Unknown / minimal (2)

| File | Notes |
|------|--------|
| `public/mobile/readme.md` | Placeholder only; purpose unclear |
| `ADMIN_SETUP.md` | Could merge with `ADMIN_SETUP_GUIDE.md`; kept separate historically |

---

## 3. Likely autogenerated docs

| File | Confidence | Reason |
|------|------------|--------|
| `dist/mobile/readme.md` | High | Build artifact under `dist/` |
| `mobile/.expo/README.md` | High | Expo local tooling (outside 66-count) |
| `public/mobile/readme.md` | Low | Hand-written stub, not machine-marked |

**None** of the 66 project files declare autogeneration. Dependency READMEs under `node_modules` are package-default documentation and should never be archived into project memory.

---

## 4. Likely critical docs (do not delete; update carefully)

These anchor onboarding, security, mobile workflow, or live system understanding.

| Priority | File | Why critical |
|----------|------|----------------|
| P0 | `README.md` | Primary entry point; linked from GitHub |
| P0 | `SECURITY.md` | Documents production security posture |
| P0 | `mobile/README.md` | Mobile developer onboarding |
| P0 | `mobile/АЖИЛЛАХ-ГАЗАР.md` | Prevents editing wrong duplicate folder |
| P1 | `docs/FIRESTORE_INDEXES.md` | Aligns with `firestore.indexes.json` deploy path |
| P1 | `FIREBASE_VERCEL_SETUP.md` | Comprehensive infra setup |
| P1 | `mobile/docs/EAS_PRODUCTION_ENV.md` | Production mobile builds |
| P1 | `mobile/docs/IOS_ANDROID_RELEASE_CHECKLIST.md` | Store submission QA |
| P1 | `MESSAGE_SYSTEM_ARCHITECTURE.md` | Deep reference for messaging subsystem |
| P2 | `TESTING_FLOW.md` | Regression manual tests |
| P2 | `GITHUB_SETUP.md` | Repo workflow for new contributors |

---

## 5. Files likely safe to archive later

Archive = move to `docs/archive/` or similar **after** confirming content is obsolete or merged into a canonical doc. Not recommended until consolidation plan runs.

### High confidence (historical / incident-specific)

- `TROUBLESHOOTING.md` — Base44 SDK redirect (migration largely complete)
- `DEBUG_LISTING_CREATE.md`, `DEBUG_ADMIN_APPROVE.md`
- `VERCEL_BUILD_FIX.md`, `VERCEL_GITHUB_CONNECTION_FIX.md`
- `QUICK_FIX_AUTH.md`, `LOGIN_TROUBLESHOOTING.md`
- `FIRESTORE_INDEX_QUICK_FIX.md`, `FIRESTORE_RULES_UPDATE.md`
- `FIREBASE_STORAGE_FIX.md`
- `FIREBASE_RESTORE_DATA.md` or `FIREBASE_RESTORE_INSTRUCTIONS.md` (keep one)
- `NEXT_STEPS.md`, `CURRENT_STATUS.md`, `MIGRATION_COMPLETE.md` (if migration is done)
- `PROJECT_REVIEW.md`, `REFACTORING_SUMMARY.md`

### Medium confidence (duplicate deploy / rules guides)

- Subset of **Vercel cluster** (retain 1–2: e.g. `VERCEL_DEPLOYMENT_GUIDE.md` + `VERCEL_ENV_SETUP.md`)
- `ADMIN_SETUP.md` if merged into `ADMIN_SETUP_GUIDE.md`
- `FIRESTORE_INDEXES.md` (root) if `docs/FIRESTORE_INDEXES.md` is canonical
- `FIRESTORE_RULES_SIMPLE.md` after production rules documented in `SECURITY.md` / `firestore.rules`
- `FIREBASE_RULES_SETUP_NOW.md` (references old project id)

### Low priority / stub

- `public/mobile/readme.md` — replace or remove when mobile public path is documented elsewhere

---

## 6. Files that should never be touched (without deliberate review)

| Category | Files | Guidance |
|----------|--------|----------|
| **Never delete blindly** | `README.md`, `SECURITY.md`, `mobile/README.md`, `mobile/АЖИЛЛАХ-ГАЗАР.md` | Onboarding and security contract |
| **Never edit without syncing code** | `docs/FIRESTORE_INDEXES.md` | Must match `firestore.indexes.json` |
| **Never archive while features active** | `MESSAGE_SYSTEM_ARCHITECTURE.md`, `KAKAO_LOGIN_SETUP.md`, `FACEBOOK_LOGIN_SETUP.md` | Active integrations |
| **Never commit secrets from docs** | `VERCEL_QUICK_START.md` | Contains example Firebase env values — scrub if publishing docs publicly |
| **Do not treat as project docs** | Anything under `node_modules/`, `dist/` | Dependencies / build output |

---

## 7. Duplicate / similar docs — recommended canonical choices

| Topic | Keep (canonical) | Deprecate / archive candidates |
|-------|------------------|--------------------------------|
| Vercel deploy | `VERCEL_DEPLOYMENT_GUIDE.md` + `VERCEL_ENV_SETUP.md` | `VERCEL_DEPLOY.md`, `VERCEL_QUICK_START.md`, `VERCEL_QUICK_SETUP.md` |
| Firestore indexes | `docs/FIRESTORE_INDEXES.md` | Root `FIRESTORE_INDEXES.md` (merge unique Console steps first) |
| Admin role | `ADMIN_SETUP_GUIDE.md` | `ADMIN_SETUP.md` |
| Migration narrative | `MIGRATION_ROADMAP.md` or `README.md` section only | `CURRENT_STATUS.md`, `MIGRATION_COMPLETE.md`, `NEXT_STEPS.md` |
| Firebase restore | `FIREBASE_RESTORE_INSTRUCTIONS.md` | `FIREBASE_RESTORE_DATA.md` |
| Messaging | `MESSAGE_SYSTEM_ARCHITECTURE.md` | `ADMIN_MESSAGE_REPLY_FLOW.md` (or move under `docs/flows/`) |

---

## 8. Content quality flags (for future cleanup)

1. **Stale paths:** Many files reference `zar-746103b7/`; current layout is repo root + `mobile/`.
2. **Stale domains:** `zarmongolia.com` vs `zarkorea.com` / Koreazar branding.
3. **Stale Firebase projects:** `carsmongolia-d410a` vs `koreazar-32e7a` in restore/rules docs.
4. **Language mix:** Mongolian and English; fine for team, but complicates search/indexing.
5. **README doc links:** Point to migration docs that may be outdated relative to `MIGRATION_COMPLETE.md`.
6. **No single `docs/README.md` index** — 52 root-level files are hard to navigate.

---

## 9. Recommended next steps

1. **Do not move or delete anything yet** — use this report as inventory only.
2. **Pick canonical deploy doc** — merge Vercel cluster into one `docs/deploy/vercel.md` (future task).
3. **Pick canonical Firestore indexes doc** — `docs/FIRESTORE_INDEXES.md` + fold root guide’s Console troubleshooting into it.
4. **Archive migration/debug batch** — after team confirms Base44 migration and listed bugs are closed.
5. **Scrub secrets in markdown** — audit `VERCEL_QUICK_START.md` and similar for real API keys vs placeholders.
6. **Update `README.md` Documentation section** — link only to canonical, current docs (separate PR).
7. **Add `docs/README.md` index** — optional navigation hub without moving files yet.
8. **Ignore `node_modules` and `dist` markdown** in any doc tooling or AI memory indexing.
9. **Re-run this analysis** after consolidation to refresh counts and duplicates.

---

## Appendix A — Full file inventory (66)

| # | Path | Primary category |
|---|------|------------------|
| 1 | `README.md` | Important project |
| 2 | `SECURITY.md` | Important project |
| 3 | `GITHUB_SETUP.md` | Important project |
| 4 | `FIREBASE_VERCEL_SETUP.md` | Important project |
| 5 | `FIREBASE_SETUP_CHECKLIST.md` | Important project |
| 6 | `FIREBASE_CONFIG_SETUP.md` | Important project |
| 7 | `TESTING_FLOW.md` | Important project |
| 8 | `FACEBOOK_LOGIN_SETUP.md` | Important project |
| 9 | `KAKAO_LOGIN_SETUP.md` | Important project |
| 10 | `OPENAI_SETUP.md` | Important project (integration) |
| 11 | `ADMIN_SETUP_GUIDE.md` | Important project |
| 12 | `ADMIN_SETUP.md` | Duplicate / unknown |
| 13 | `VERCEL_DEPLOY.md` | Deployment |
| 14 | `VERCEL_DEPLOYMENT_GUIDE.md` | Deployment |
| 15 | `VERCEL_QUICK_START.md` | Deployment |
| 16 | `VERCEL_QUICK_SETUP.md` | Deployment |
| 17 | `VERCEL_ENV_SETUP.md` | Deployment |
| 18 | `VERCEL_UPDATE.md` | Deployment |
| 19 | `VERCEL_FIND_PROJECT.md` | Deployment |
| 20 | `DOMAIN_SETUP_GUIDE.md` | Deployment |
| 21 | `CLOUDFLARE_VERCEL_DNS.md` | Deployment |
| 22 | `CLOUDFLARE_NAMESERVERS_SETUP.md` | Deployment |
| 23 | `DNS_TROUBLESHOOTING.md` | Deployment |
| 24 | `FIREBASE_STORAGE_PUBLISH_NOW.md` | Deployment |
| 25 | `FIRESTORE_SETUP_GUIDE.md` | Deployment |
| 26 | `STORAGE_RULES_GUIDE.md` | Deployment |
| 27 | `docs/PLAY_STORE_SETUP.md` | Deployment |
| 28 | `mobile/docs/PLAY_STORE_RN_REPLACE_TWA.md` | Deployment |
| 29 | `mobile/docs/EAS_PRODUCTION_ENV.md` | Deployment |
| 30 | `mobile/docs/IOS_ANDROID_RELEASE_CHECKLIST.md` | Deployment |
| 31 | `MESSAGE_SYSTEM_ARCHITECTURE.md` | Architecture |
| 32 | `ADMIN_MESSAGE_REPLY_FLOW.md` | Architecture |
| 33 | `docs/IMAGE_LOAD_ANALYSIS.md` | Architecture |
| 34 | `docs/PWA_IMPLEMENTATION_PLAN.md` | Architecture |
| 35 | `MIGRATION_ANALYSIS.md` | Architecture / history |
| 36 | `DEBUG_LISTING_CREATE.md` | Bug fix / history |
| 37 | `DEBUG_ADMIN_APPROVE.md` | Bug fix / history |
| 38 | `QUICK_FIX_AUTH.md` | Bug fix / history |
| 39 | `LOGIN_TROUBLESHOOTING.md` | Bug fix / history |
| 40 | `TROUBLESHOOTING.md` | Bug fix / history |
| 41 | `TROUBLESHOOTING_LISTING.md` | Bug fix / history |
| 42 | `VERCEL_BUILD_FIX.md` | Bug fix / history |
| 43 | `VERCEL_GITHUB_CONNECTION_FIX.md` | Bug fix / history |
| 44 | `FIREBASE_STORAGE_FIX.md` | Bug fix / history |
| 45 | `FIRESTORE_INDEX_QUICK_FIX.md` | Bug fix / history |
| 46 | `FIRESTORE_RULES_UPDATE.md` | Bug fix / history |
| 47 | `FIREBASE_RULES_SETUP_NOW.md` | Bug fix / history |
| 48 | `FIREBASE_RESTORE_DATA.md` | Bug fix / history |
| 49 | `FIREBASE_RESTORE_INSTRUCTIONS.md` | Bug fix / history |
| 50 | `MIGRATION_COMPLETE.md` | Bug fix / history |
| 51 | `MIGRATION_ROADMAP.md` | Bug fix / history |
| 52 | `COMPLETE_MIGRATION_PLAN.md` | Bug fix / history |
| 53 | `CURRENT_STATUS.md` | Bug fix / history |
| 54 | `NEXT_STEPS.md` | Bug fix / history |
| 55 | `PROJECT_REVIEW.md` | Bug fix / history |
| 56 | `REFACTORING_SUMMARY.md` | Bug fix / history |
| 57 | `COMPLETE_PROJECT_CHECKLIST.md` | Bug fix / history |
| 58 | `FIRESTORE_INDEXES.md` | Duplicate (deployment) |
| 59 | `docs/FIRESTORE_INDEXES.md` | Important / deployment |
| 60 | `FIRESTORE_PRODUCTION_RULES.md` | Deployment (rules) |
| 61 | `FIRESTORE_RULES_SIMPLE.md` | Deployment (rules) |
| 62 | `FIREBASE_STORAGE_RULES.md` | Deployment (rules) |
| 63 | `mobile/README.md` | Important project |
| 64 | `mobile/АЖИЛЛАХ-ГАЗАР.md` | Important project |
| 65 | `mobile/screenshots-source/README.md` | Important project |
| 66 | `public/mobile/readme.md` | Autogenerated / unknown stub |

---

*End of report.*
