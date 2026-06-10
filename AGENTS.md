# AGENTS.md

## Cursor Cloud specific instructions

### Overview

Zarkorea is a classified-ads marketplace (React + Vite + Firebase) for Mongolians in South Korea. The web app lives at the repo root (`src/`); a mobile counterpart (Expo) lives in `mobile/`.

### Running the web app

```bash
npm run dev          # Vite dev server on http://localhost:5173
```

The server binds to all interfaces (`host: true` in `vite.config.js`), so it's accessible at both `localhost:5173` and the VM's network IP.

### Key commands

| Task | Command |
|------|---------|
| Dev server | `npm run dev` |
| Lint | `npm run lint` |
| Build | `npm run build` |
| Test | `npm test` (placeholder — echoes "No tests configured") |

### Environment variables

The `.env` file is created from `.env.example`. Firebase config values in `.env.example` point to the live `koreazar-32e7a` project. The only empty value is `VITE_OPENAI_API_KEY` (optional, powers the AI chatbot).

### Gotchas

- **No automated test suite exists** — `npm test` just exits 0. Verify changes via lint + build + manual testing.
- **Build step includes pre-tasks** — `npm run build` runs `sync-listings` and `generate-pwa-icons` before `vite build`. If `sharp` is not installed, the icon generation will fail.
- **ESLint produces warnings** (mostly in `mobile/` files) but exits 0.
- **The PHP API (`api/`) is external** — the web frontend talks to `https://api.zarkorea.com/index.php` by default. You do not need to run the PHP/MySQL backend locally for frontend development; the production API is referenced via `VITE_API_BASE_URL`.
- **Firebase is the primary data layer** — Auth, Firestore, and Storage are used directly from the frontend. Listings displayed on the homepage come from Firebase; the PHP API is a secondary layer for search/CRUD.
- **Mobile app** (`mobile/`) uses Expo. Run `cd mobile && npx expo start` only if mobile changes are needed.
