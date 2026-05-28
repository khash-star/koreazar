# Mobile Regression Tests

**Workspace:** `mobile/` only (`mobile/АЖИЛЛАХ-ГАЗАР.md`)  
**Run:** `cd mobile && npm install && npx expo start`

---

## Launch & build risks

| Check | Pass | Fail | Notes |
|-------|:----:|:----:|-------|
| Expo starts without Metro fatal error | ☐ | ☐ | |
| Android emulator / device loads app | ☐ | ☐ | |
| iOS simulator / device (if available) | ☐ | ☐ | |
| Web target: `npx expo start --web -c` if web touched | ☐ | ☐ | |
| No `semver` / Reanimated error on web | ☐ | ☐ | Native-only Reanimated |
| Custom dev client rebuilt if native deps changed | ☐ | ☐ | |

---

## Navigation

| Check | Pass | Fail | Notes |
|-------|:----:|:----:|-------|
| Home tab loads listings + banners | ☐ | ☐ | |
| Category strip selection filters list | ☐ | ☐ | |
| Listing detail from tap | ☐ | ☐ | |
| Auth screens: Login, Register | ☐ | ☐ | |
| Saved listings tab | ☐ | ☐ | |
| Profile / My listings | ☐ | ☐ | |
| Deep link `zarkorea://` (if navigation changed) | ☐ | ☐ | |

---

## Image orientation & display

| Check | Pass | Fail | Notes |
|-------|:----:|:----:|-------|
| Portrait photos display correct aspect | ☐ | ☐ | |
| Landscape photos not cropped wrong | ☐ | ☐ | |
| Gallery swipe on detail | ☐ | ☐ | |
| `expo-image` loads Storage URLs | ☐ | ☐ | |

---

## Auth & session

| Check | Pass | Fail | Notes |
|-------|:----:|:----:|-------|
| Login persists after app restart (native) | ☐ | ☐ | AsyncStorage |
| Logout clears protected screens | ☐ | ☐ | |
| Same Firebase project as web (`.env`) | ☐ | ☐ | |

---

## Constants sync

| Check | Pass | Fail | Notes |
|-------|:----:|:----:|-------|
| After web `listings.js` change: `npm run sync-listings` run | ☐ | ☐ | From repo root |
| Categories match web | ☐ | ☐ | |

---

## Store / build (release only)

| Check | Pass | Fail | Notes |
|-------|:----:|:----:|-------|
| EAS production env set | ☐ | ☐ | `mobile/docs/EAS_PRODUCTION_ENV.md` |
| No false “push notifications” in store text | ☐ | ☐ | `mobile/README.md` |
| `IOS_ANDROID_RELEASE_CHECKLIST.md` | ☐ | ☐ | |
