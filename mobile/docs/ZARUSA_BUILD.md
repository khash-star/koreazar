# Zarusa (US) mobile build

Zarusa uses the **same** `mobile/` Expo project as Zarkorea. The active market is selected at build time via `EXPO_PUBLIC_ACTIVE_COUNTRY`.

## Local dev (Zarusa)

```powershell
cd mobile
# In .env:
# EXPO_PUBLIC_ACTIVE_COUNTRY=US
npx expo start
```

Without the env var, the app behaves as **Zarkorea** (KR listings, ₩, `com.zarkorea.twa`).

## EAS production build (Zarusa)

```powershell
cd mobile
npx eas build --platform android --profile production-us
npx eas build --platform ios --profile production-us
```

`production-us` sets `EXPO_PUBLIC_ACTIVE_COUNTRY=US`. `app.config.js` then applies:

| Field | Zarkorea (KR) | Zarusa (US) |
|-------|---------------|-------------|
| App name | Zarkorea | Zarusa |
| Android package | `com.zarkorea.twa` | `com.zarusa.app` |
| iOS bundle ID | `com.zarkorea.twa` | `com.zarusa.app` |
| Scheme | `zarkorea` | `zarusa` |

Push the same Firebase `EXPO_PUBLIC_*` vars to EAS for both profiles (`eas env:push`).

## Submit (after build — do not run until store apps exist)

```powershell
npm run submit:android:us
npm run submit:ios:us
```

Uses `submit.production-us` → `com.zarusa.app` (Zarkorea `submit.production` is unchanged).

## Before store submit

1. Register `com.zarusa.app` in Play Console / App Store Connect (separate listing from Zarkorea).
2. Add Zarusa app icons/splash if you want different branding (optional — same assets work for first build).
3. Create US-scoped banners in admin (`country_code: US`) so the home hero shows US ads only.
4. Complete backend staging: see `docs/ZARUSA_STAGING_DEPLOY.md`.

## Data behavior (Washington DC / DMV MVP)

- **Default region:** `washington-dc` (no city picker, no invite code)
- Home feed: `country_code=US&region_code=washington-dc`
- New listings: `country_code=US`, `region_code=washington-dc`, `state_code` = **DC, VA, or MD**
- Header: **ZARUSA — DC / DMV**
- Storage paths: `listings/us/...` (same as web)
- Other US regions (Chicago, NYC, etc.) exist in config only (`active: false`) — not in UI

## KR / Zarkorea

Default build (no `EXPO_PUBLIC_ACTIVE_COUNTRY=US`) is unchanged — no region filter, no US fields.
