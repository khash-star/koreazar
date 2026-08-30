# Phone OTP native spike — Expo SDK 55 setup

Spike only: validates `@react-native-firebase/auth` vs existing Firebase **JS** SDK auth. Not production OTP UI.

## Prerequisites

1. **Firebase Console** → Authentication → Sign-in method → **Phone** enabled.
2. **SMS region policy** includes South Korea (+82) and Mongolia (+976) if you test those numbers.
3. **Test phone numbers** (optional): Authentication → Phone → Phone numbers for testing (fixed OTP, no SMS).

## Native config files (required for EAS / `expo run:*`)

| File | Location | Source |
|------|----------|--------|
| `google-services.json` | `mobile/google-services.json` | Firebase Console → Android app `com.zarkorea.twa` |
| `GoogleService-Info.plist` | `mobile/GoogleService-Info.plist` | Firebase Console → iOS app `com.zarkorea.twa` |

Templates: `google-services.json.example`, `GoogleService-Info.plist.example`.

**Do not commit** real files (listed in `mobile/.gitignore`). For EAS cloud builds, either commit via EAS Secrets file env or place files in repo on build machine.

If Android/iOS apps are not registered in Firebase yet, add them with package/bundle **`com.zarkorea.twa`** (must match `app.json`).

## Android SHA fingerprints (Phone Auth)

Firebase Console → Project settings → Your apps → Android app → **SHA certificate fingerprints**.

Add **debug** and **release** SHA-1 and SHA-256.

### Debug (local / EAS development)

```bash
cd mobile/android
./gradlew signingReport
```

On Windows (after `npx expo prebuild`):

```bash
cd mobile/android
gradlew.bat signingReport
```

Copy SHA-1 and SHA-256 for the variant you use (`debug` / `release`).

### EAS production

Use the keystore configured in EAS credentials (`eas credentials` → Android → Keystore). Upload that keystore’s SHA-1/SHA-256 to Firebase.

Without correct SHA, Android phone sign-in fails with `auth/missing-client-identifier` or similar.

## iOS notes

- `@react-native-firebase/auth` config plugin enables phone auth + reCAPTCHA flow on iOS.
- `expo-build-properties` uses `useFrameworks: static` (see `app.json`).
- Push/APNs is **not** required for SMS OTP; may be required for other Firebase features later.
- Bundle ID must be **`com.zarkorea.twa`**.

## Build commands (not Expo Go)

Phone auth uses native modules → **development build** only:

```bash
cd mobile
# Copy Firebase native config files first (see above)
npx eas build --profile development --platform android
npx eas build --profile development --platform ios
```

Local native run (after `google-services.json` / plist exist):

```bash
npx expo prebuild
npx expo run:android
# or
npx expo run:ios
```

## Spike screen

1. Set `EXPO_PUBLIC_PHONE_AUTH_SPIKE=true` in `mobile/.env` (optional; also enabled in `__DEV__`).
2. Open app → **Профайл** → **Phone OTP spike (dev)**.
3. Use a **Firebase test phone** + OTP from Console, or a real number.
4. Read **Auth sync** panel: compares `@react-native-firebase/auth` vs `firebase/auth` (JS SDK) `currentUser`.

Record results in your spike notes before building full Login UI.

**Production login:** `LoginScreen` → **Утас** tab uses the same native SMS + JS Auth bridge (session persists across app restarts until logout).

## Chat and Firestore rules after OTP login

Phone OTP users do not have a normal email claim in Firebase Auth. The mobile app
bridges that gap before any chat query:

1. `confirmPhoneLogin()` converts the E.164 phone number to a synthetic email
   with `phoneToAuthEmail()`, for example
   `phone_821012345678@phone.zarkorea.com`.
2. `ensureUserDocEmailForFirestoreRules()` writes that value to
   `users/{uid}.email` so `firestore.rules` can resolve `authEmailLower()`.
3. `MessagesScreen` and `ChatScreen` call `resolveChatParticipantEmail()` before
   listing, opening, or sending messages.
4. Conversations include `participant_uids` in addition to `participant_1` /
   `participant_2`; this lets phone users see threads even when Auth token email
   is empty.

Korean phone-number variants with and without the `82` country prefix are treated
as the same chat identity by `emailQueryVariants()` / `areEmailVariants()`.

If an OTP user can open a chat from push but cannot see it in Messages, verify
that `participant_uids` is present and run the legacy backfill documented in
[`CHAT_PUSH_SETUP.md`](CHAT_PUSH_SETUP.md). The mobile chat data flow is
summarized in [`MOBILE_CHAT.md`](MOBILE_CHAT.md).

## Env (optional spike defaults)

```env
EXPO_PUBLIC_PHONE_AUTH_SPIKE=true
EXPO_PUBLIC_PHONE_SPIKE_E164=+821012345678
```

## EAS env

Existing `EXPO_PUBLIC_FIREBASE_*` vars remain used by the JS SDK. Native config files are **separate** from `EXPO_PUBLIC_*`.
