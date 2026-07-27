# ZAR-USA (US) mobile build

ZAR-USA uses the **same** `mobile/` Expo project as Zarkorea. The active
market is selected at build time via `EXPO_PUBLIC_ACTIVE_COUNTRY`; this is a
build-time identity choice, not an in-app market switch.

## Local dev (ZAR-USA)

```powershell
cd mobile
# In .env:
# EXPO_PUBLIC_ACTIVE_COUNTRY=US
npx expo start
```

Without the env var, the app behaves as **Zarkorea** (KR listings, ₩, `com.zarkorea.twa`).

## EAS production build (ZAR-USA)

```powershell
cd mobile
npx eas build --platform android --profile production-us
npx eas build --platform ios --profile production-us
```

`production-us` sets `EXPO_PUBLIC_ACTIVE_COUNTRY=US`. `app.config.js` then applies:

| Field | Zarkorea (KR) | ZAR-USA (US) |
|-------|---------------|-------------|
| App name | Zarkorea | ZAR-USA |
| Android package | `com.zarkorea.twa` | `com.zarusa.app` |
| iOS bundle ID | `com.zarkorea.twa` | `com.zarusa.app` |
| Scheme | `zarkorea` | `zarusa` |
| Icons / splash | `mobile/assets/` | `mobile/assets/us/` |

Push the required Firebase `EXPO_PUBLIC_*` vars to EAS for both profiles
(`eas env:push`). Native config resolution in `app.config.js` is:

- Android: `GOOGLE_SERVICES_JSON`, then local `google-services.json`.
- ZAR-USA iOS: `GOOGLE_SERVICE_INFO_PLIST_US`, falling back to
  `GOOGLE_SERVICE_INFO_PLIST`, then local `GoogleService-Info.zarusa.plist`.
- KR iOS: `GOOGLE_SERVICE_INFO_PLIST`, then local
  `GoogleService-Info.plist`.

Never commit those native Firebase files or EAS secret values.

## Submit (after build — do not run until store apps exist)

```powershell
npm run submit:android:us
npm run submit:ios:us
```

Uses `submit.production-us` → `com.zarusa.app` (Zarkorea `submit.production` is unchanged).

## Before store submit

1. Register `com.zarusa.app` in Play Console / App Store Connect (separate listing from Zarkorea).
2. Confirm the ZAR-USA icon and splash assets under `mobile/assets/us/` are present in the resolved Expo config.
3. Create US-scoped banners in admin (`country_code: US`) so the home hero shows US ads only.
4. Complete backend staging: see `docs/ZARUSA_STAGING_DEPLOY.md`.

## Data behavior (Washington DC / DMV MVP)

- **Default region:** `washington-dc` (no city picker, no invite code)
- Home feed: `country_code=US&region_code=washington-dc`
- New listings: `country_code=US`, `region_code=washington-dc`, `state_code` = **DC, VA, or MD**
- Header: **ZAR-USA — DC / DMV**
- Storage paths: `listings/us/...` (same as web)
- Other US regions (Chicago, NYC, etc.) exist in config only (`active: false`) — not in UI

## KR / Zarkorea

Default build (no `EXPO_PUBLIC_ACTIVE_COUNTRY=US`) is unchanged — no region filter, no US fields.
