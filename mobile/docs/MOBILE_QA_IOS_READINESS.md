# Zarkorea Mobile — QA & iOS TestFlight Readiness Report

**Date:** 2026-05-28  
**Scope:** Android regression + iOS EAS/TestFlight/production review prep  
**App:** `mobile/` (Expo SDK 55, EAS project `96d89595-cf78-48c8-9695-5c2cc7af53f4`)

---

## Executive summary

The mobile app is **functionally ready for iOS TestFlight internal testing** after the fixes in this audit, with **external/production release blocked** until APNs + EAS env + PHP API deploy gates are verified on physical devices.

Android flows (phone OTP, chat uid rules, save/report/feedback) were hardened in prior commits; this pass adds **production dev-UI removal**, **phone account deletion (Apple 5.1.1)**, and **iOS push background mode**.

---

## QA matrix (code-verified + manual device required)

| Area | Status | Notes |
|------|--------|-------|
| Phone OTP login | ✅ Ready (EAS) | Requires dev/production build + `google-services.json` / `GoogleService-Info.plist`. **Not Expo Go.** |
| Session persistence | ✅ Ready | JS Auth + AsyncStorage (`firebase.native.js`) |
| Logout / re-login | ✅ Ready | Clears push token, RN Firebase session, pending OTP |
| Listings browse/detail | ✅ Ready | MySQL API `EXPO_PUBLIC_API_BASE_URL` |
| Create listing | ✅ Ready | Auto-approve via Firestore `config/app.listingAutoApprove` |
| My listings (phone) | ✅ Ready* | `firebase_uid` + multi-status API; **deploy `api/index.php` to cPanel** |
| Save / unsave | ✅ Ready* | `user_uid` + `requireResolvedAuthEmail`; **Firestore rules deployed** |
| Feedback / report | ✅ Ready* | `user_uid` rules + friendly errors |
| Messages list | ✅ Ready* | `participant_uids` + `authEmailLower`; **indexes deployed** |
| Chat send/receive | ✅ Ready* | Same as above |
| Push token register | ✅ Ready (EAS) | Not Expo Go Android; iOS needs APNs in Expo |
| Chat push | ✅ Ready* | Cloud Function `onChatMessageCreatedPush` must be deployed |
| Profile edit | ✅ Ready | `updateUserData` writes resolved email to `users/{uid}` |
| Account deletion (email) | ✅ Ready | Password re-auth |
| Account deletion (phone) | ✅ **Fixed this audit** | No password; `УСТГАХ` confirm; recent session required |
| Dev spike UI | ✅ **Fixed this audit** | Hidden outside `__DEV__` |

\* = Requires Firebase rules/indexes/functions + production API deploy (see gates below).

---

## Bugs found & fixed (this audit)

| Bug | Severity | Fix |
|-----|----------|-----|
| **Phone OTP spike visible in release** via `EXPO_PUBLIC_PHONE_AUTH_SPIKE` | High | `isPhoneAuthSpikeEnabled()` → `__DEV__` only; navigator registers spike screen only in dev |
| **Account deletion broken for phone users** (`user.email` null) | **Critical (Apple 5.1.1)** | `deleteAccountForCurrentUser()` + phone-only delete UI (no password) |
| **Saved listings not purged on delete** (uid-only rows) | Medium | `accountDeletion` deletes by `user_uid` |
| **Push tokens left after account delete** | Low | Delete `user_push_tokens/{uid}/devices/*` |
| Feedback modal flicker / keyboard (prior commit) | Medium | Already in `f7bbfa6`, `92c4e37` |
| Permission-denied on save/report/feedback (phone) | High | Already in `814cd76` + rules deploy |

---

## Files changed (this audit)

| File | Change |
|------|--------|
| `mobile/src/spike/phoneAuthSpikeEnabled.js` | **New** — dev-only gate |
| `mobile/src/spike/phoneAuthSpike.native.js` | Spike flag `__DEV__` only |
| `mobile/src/spike/phoneAuthSpike.js` | Spike flag `__DEV__` only |
| `mobile/src/navigation/AppNavigator.js` | PhoneAuthSpike route dev-only |
| `mobile/src/screens/ProfileTabScreen.js` | Spike import; phone delete UI |
| `mobile/src/services/authService.js` | `deleteAccountForCurrentUser()` |
| `mobile/src/services/accountDeletion.js` | `user_uid` saved + push token cleanup |
| `mobile/app.json` | iOS `UIBackgroundModes: remote-notification` |

Prior related fixes (already on `main`): feedback keyboard, my listings uid query, Firestore uid rules.

---

## iOS configuration audit

### app.json / bundle

| Item | Value | Status |
|------|-------|--------|
| `bundleIdentifier` | `com.zarkorea.twa` | ✅ Matches Android package & `eas.json` submit |
| `buildNumber` | `36` | ✅ Local source (`appVersionSource: local`) |
| `version` | `1.0.1` | ✅ |
| `scheme` | `zarkorea` | ✅ Deep links / reCAPTCHA return |
| `GoogleService-Info.plist` | `./GoogleService-Info.plist` | ✅ Optional skip in `app.config.js` if missing |
| `useFrameworks: static` + RNFB force link | expo-build-properties | ✅ Required for `@react-native-firebase/*` |

### Permissions / Info.plist

| Permission | Source | Status |
|------------|--------|--------|
| Photo library | `expo-image-picker` plugin `photosPermission` | ✅ Localized EN+MN string |
| Push notifications | `expo-notifications` + runtime request | ✅ |
| Background remote | `UIBackgroundModes: remote-notification` | ✅ Added this audit |
| Encryption export | `ITSAppUsesNonExemptEncryption: false` | ✅ |

### Firebase phone auth (iOS)

1. Add iOS app in Firebase Console with bundle `com.zarkorea.twa`.
2. Download `GoogleService-Info.plist` → `mobile/GoogleService-Info.plist` (gitignored; EAS secret or local).
3. **Upload APNs key** (.p8) to Firebase → Cloud Messaging → Apple app (required for silent phone verification).
4. Enable **Phone** sign-in in Firebase Authentication.
5. Build with **EAS** (not Expo Go) — `@react-native-firebase/auth` native SMS.

Fallback: reCAPTCHA web flow uses `scheme: zarkorea` — test on device if SMS auto-verify fails.

### Push (APNs) — required for chat push on iOS

1. Expo dashboard → project → **Credentials** → iOS → APNs key (or let EAS manage).
2. `eas credentials` — verify push key linked.
3. Physical device test: background/killed app → receive chat push → tap opens Chat.

See `mobile/docs/CHAT_PUSH_SETUP.md`.

### Apple Sign In requirement

| Check | Result |
|-------|--------|
| Third-party OAuth (Google/Facebook/Apple) on mobile? | **No** — only Phone OTP + Email/Password |
| Guideline 4.8 | **Likely not required** today; **required if** Google/Facebook/Apple social login is added |
| Account deletion (5.1.1) | ✅ In-app delete flow (email + phone) |

---

## Production gates (must pass before TestFlight external / App Store)

```bash
# 1. Firestore (from repo root)
firebase deploy --only firestore:rules,firestore:indexes,functions

# 2. PHP API (cPanel) — my listings firebase_uid, status=all, user_sync synthetic email
# Upload api/index.php

# 3. EAS environment (expo.dev → project → Environment variables → production)
# EXPO_PUBLIC_FIREBASE_* (all 6), EXPO_PUBLIC_API_BASE_URL
# See mobile/docs/EAS_PRODUCTION_ENV.md

# 4. Native Firebase files on EAS (secrets or committed for CI)
# mobile/GoogleService-Info.plist (iOS)
# mobile/google-services.json (Android)
```

---

## EAS build commands

From `mobile/` directory:

```bash
# Install EAS CLI (once)
npm install -g eas-cli
eas login

# ─── Android ───
# Internal APK (QA)
eas build --platform android --profile preview

# Play Store AAB
eas build --platform android --profile production

# Local dev client (phone OTP + push)
eas build --platform android --profile development

# ─── iOS ───
# Internal TestFlight / dev client
eas build --platform ios --profile development

# TestFlight / App Store (uses production profile; add ios credentials first)
eas build --platform ios --profile production

# Submit to TestFlight (after successful production build)
eas submit --platform ios --profile production
```

**First iOS build:** run `eas credentials` and configure Apple Developer team + APNs.

---

## TestFlight checklist

### Pre-build
- [ ] Apple Developer account active; App ID `com.zarkorea.twa` registered
- [ ] `GoogleService-Info.plist` in EAS build environment
- [ ] All `EXPO_PUBLIC_FIREBASE_*` set in EAS production environment
- [ ] APNs key in Firebase + Expo credentials
- [ ] Firestore rules/indexes/functions deployed
- [ ] `api/index.php` deployed to production

### Build
- [ ] `eas build --platform ios --profile production` succeeds
- [ ] No missing `GoogleService-Info.plist` in build logs
- [ ] `env: export EXPO_PUBLIC_FIREBASE_...` visible in build log

### Device QA (iOS physical device)
- [ ] Phone OTP send + confirm + session survives app restart
- [ ] Logout → login again
- [ ] Browse listing → detail → save → Saved tab
- [ ] Create listing → appears in My Listings
- [ ] Open Messages → chat → send/receive (email user ↔ phone user)
- [ ] Push notification received (background + killed)
- [ ] Profile edit saves
- [ ] Feedback submit (no flicker, success alert)
- [ ] Listing report submit
- [ ] Account deletion (phone user, type `УСТГАХ`)
- [ ] **No** “Phone OTP spike (dev)” on Profile

### App Store Connect
- [ ] TestFlight internal group smoke test
- [ ] Privacy policy URL (in-app link works)
- [ ] Export compliance: `ITSAppUsesNonExemptEncryption: false`
- [ ] Screenshots + description
- [ ] Account deletion documented in review notes (Profile → Бүртгэл устгах)

---

## Remaining risks

| Risk | Mitigation |
|------|------------|
| **Expo Go** cannot test OTP/push | Always QA on EAS dev/production builds |
| **Phone delete** may need recent login | User re-logs in if `auth/requires-recent-login` |
| **My listings** empty if API not deployed | Deploy `api/index.php` with `firebase_uid` filter |
| **RN Firebase deprecation warnings** | Non-blocking; plan v22 modular migration |
| **Web account deletion** still email-password only | Sync web `authService` if phone users use web Profile |
| **Apple Sign In** | Add before shipping Google/Facebook login |
| **InteractionManager deprecation** | RN 0.83 warning only; no functional impact identified |

---

## Android regression

No intentional Android behavior changes in this audit except shared auth/delete improvements. Re-run smoke test on existing Android dev client after pull.

---

## Console warnings (non-blocking)

| Warning | Action |
|---------|--------|
| RN Firebase namespaced API deprecated (v22) | Track migration; OTP still works |
| `InteractionManager` deprecated | Upstream RN; monitor |
| `fnm` in local shell profile | Dev machine only; ignore |

---

*Generated as part of mobile QA / iOS readiness audit. Update after each TestFlight build.*
