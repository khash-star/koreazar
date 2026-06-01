# PWA & TWA Tests

**Production URL:** https://zarkorea.com (verify live after deploy).

---

## PWA — manifest.json

| Check | Pass | Fail | Notes |
|-------|:----:|:----:|-------|
| `GET /manifest.json` returns 200 | ☐ | ☐ | |
| `name`, `short_name`, `start_url` `/` | ☐ | ☐ | |
| `theme_color` / icons present | ☐ | ☐ | |
| Linked from built `index.html` | ☐ | ☐ | |

---

## Service worker

| Check | Pass | Fail | Notes |
|-------|:----:|:----:|-------|
| SW registers (Application tab) | ☐ | ☐ | |
| SPA routes work offline shell / fallback | ☐ | ☐ | |
| Update does not trap stale cache (hard refresh test) | ☐ | ☐ | |
| `vite-plugin-pwa` present in config if claimed | ☐ | ☐ | Read-only check |

---

## Install behavior

| Check | Pass | Fail | Notes |
|-------|:----:|:----:|-------|
| Install prompt or menu install (Chrome) | ☐ | ☐ | |
| Installed app opens to Home | ☐ | ☐ | |
| Icons correct on home screen | ☐ | ☐ | |

---

## TWA — Digital Asset Links

| Check | Pass | Fail | Notes |
|-------|:----:|:----:|-------|
| `GET /.well-known/assetlinks.json` returns 200 | ☐ | ☐ | |
| SHA-256 fingerprint matches signing key | ☐ | ☐ | Not `00:00:00:...` |
| Package `com.zarkorea.twa` (per Play docs) | ☐ | ☐ | |
| Bubblewrap / Play internal test opens app | ☐ | ☐ | |

See `docs/PLAY_STORE_SETUP.md`, `docs/PWA_IMPLEMENTATION_PLAN.md`.

---

## Regression

| Check | Pass | Fail | Notes |
|-------|:----:|:----:|-------|
| PWA live **before** TWA packaging | ☐ | ☐ | |
| HTTPS only; no mixed content | ☐ | ☐ | |
