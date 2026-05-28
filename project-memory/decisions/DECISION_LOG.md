# Engineering Decision Log

Chronological log of **major** decisions. For full ADRs use `../templates/adr.md` → `ADR-NNNN-*.md`.

**Rule:** When this log and source code disagree, **source code is the source of truth.**

---

## Log format (new entries)

| Field | Description |
|-------|-------------|
| **Date** | YYYY-MM-DD |
| **Decision** | What we chose |
| **Reason** | Why |
| **Risks** | What could go wrong |
| **Rollback** | How to undo |
| **Related files** | Code + docs paths |

---

## Historical decisions (baseline)

### 2024–2026 — Firebase as backend (Auth, Firestore, Storage)

| | |
|--|--|
| **Decision** | Use Firebase Auth, Firestore, and Storage instead of Base44 SDK. |
| **Reason** | Own domain, cost control, standard BaaS fit for listings, chat, banners. |
| **Risks** | Rules/index drift; project ID confusion during migration. |
| **Rollback** | Revert to prior backend only if data migrated — high effort. |
| **Related files** | `src/firebase/`, `src/services/*`, `firestore.rules`, `firestore.indexes.json`, `MIGRATION_ANALYSIS.md` |

### 2024–2026 — Vercel for web hosting

| | |
|--|--|
| **Decision** | Host Vite SPA on Vercel; build `dist/`; `VITE_*` env for Firebase. |
| **Reason** | Git integration, HTTPS, serverless functions option, fast deploys. |
| **Risks** | Wrong root dir or build cmd (`vite` vs `npm run build`); missing env vars. |
| **Rollback** | Redeploy previous Vercel deployment or repoint DNS. |
| **Related files** | `vercel.json`, `VERCEL_DEPLOYMENT_GUIDE.md`, `FIREBASE_VERCEL_SETUP.md` |

### 2025–2026 — PWA before Play Store TWA

| | |
|--|--|
| **Decision** | Ship PWA (manifest + service worker) on web first; wrap with Bubblewrap TWA for Android. |
| **Reason** | Single codebase for web + store shell; faster than full native rewrite. |
| **Risks** | `assetlinks.json` fingerprint wrong; PWA not live before TWA init. |
| **Rollback** | Fall back to browser-only web; remove store listing until links fixed. |
| **Related files** | `docs/PWA_IMPLEMENTATION_PLAN.md`, `docs/PLAY_STORE_SETUP.md`, `public/.well-known/assetlinks.json` |

### 2025–2026 — Expo mobile in `mobile/` (split from web)

| | |
|--|--|
| **Decision** | Native app in `mobile/`; web at repo root; shared Firebase project; sync `listings.js` via script. |
| **Reason** | Avoid code collision; EAS builds only `mobile/`; clear Cursor workspace boundary. |
| **Risks** | Constants drift if `npm run sync-listings` skipped; editing wrong folder. |
| **Rollback** | N/A — architectural split; deprecate duplicate folders if reintroduced. |
| **Related files** | `mobile/README.md`, `mobile/АЖИЛЛАХ-ГАЗАР.md`, `src/constants/listings.js`, `scripts` / `npm run sync-listings` |

---

## Index (add new entries above this line)

| Date | Decision (short) | Status |
|------|------------------|--------|
| _add new rows here_ | | Active / Superseded |
