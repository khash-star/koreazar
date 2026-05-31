# Chat push notifications (Expo + Firestore + Cloud Functions)

## Architecture

1. **Mobile (EAS build)** — After login, `PushNotificationBootstrap` registers `ExponentPushToken[...]` under `user_push_tokens/{firebaseUid}/devices/{tokenId}`.
2. **Firestore** — Any client (web or mobile) creates a document in `messages/`; rules unchanged.
3. **Cloud Function** — `onChatMessageCreatedPush` resolves receiver `uid` from `users.email` (works for email users and phone OTP synthetic emails), loads tokens, sends via [Expo Push API](https://docs.expo.dev/push-notifications/sending-notifications/).

App icon badge + tab badges are unchanged (polling + `appIconBadge.js`).

## Deploy (required for push to work)

From repo root (Firebase CLI logged in, project selected):

```bash
cd functions && npm install && cd ..
firebase deploy --only firestore:rules,functions
```

Function region: `asia-northeast3` (same as Firestore).

## EAS / FCM / APNs

- Use **development or production EAS build** (not Expo Go on Android for push).
- **iOS works but Android does not** → almost always **FCM V1 not uploaded to Expo** (app permission alone is not enough).
- Configure credentials for project `96d89595-cf78-48c8-9695-5c2cc7af53f4`:
  - **iOS:** APNs key (EAS credentials) — already required for iOS push.
  - **Android:** two separate steps:
    1. **`google-services.json`** in the app (EAS file env `GOOGLE_SERVICES_JSON` or local) — device registers with FCM.
    2. **FCM V1 service account JSON on Expo servers** — Expo Push API can deliver to Android.

### Android FCM V1 (required for push delivery)

1. Firebase Console → Project settings → **Service accounts** → **Generate new private key** (JSON).
2. Upload to Expo (either):
   - `cd mobile && npx eas credentials` → Android → production → **Google Service Account** → **FCM V1** → upload JSON, or
   - [expo.dev](https://expo.dev) → project **zarkorea-app** → Credentials → Android → **FCM V1 service account key**.
3. Rebuild Android (`eas build --platform android --profile production`) if you changed `google-services.json`.
4. On device: logout → login (fresh Expo push token).
5. Test with [Expo Push Tool](https://expo.dev/notifications) using token from Firestore `user_push_tokens/{uid}/devices/*`.

Docs: [Expo FCM credentials](https://docs.expo.dev/push-notifications/fcm-credentials/)

- Physical device test recommended (not emulator).

## QA checklist

| Step | Action |
|------|--------|
| 1 | User A (email) and User B (phone OTP) both log in on real builds |
| 2 | Confirm `user_push_tokens/{uid}/devices/*` in Firestore |
| 3 | User A sends chat from web or mobile |
| 4 | User B receives push with app backgrounded / killed |
| 5 | Tap notification → opens Chat with sender |
| 6 | Logout removes device token doc |

## Troubleshooting

| Symptom | Check |
|---------|--------|
| No token in Firestore | Notification permission denied; Expo Go Android; missing EAS `projectId`; `getExpoPushTokenAsync` error (missing `google-services.json` in build) |
| Token in Firestore, iOS OK, **Android silent** | **FCM V1 key missing/wrong on Expo** (`InvalidCredentials` in Expo Push Tool); rebuild + re-login after fixing credentials |
| Token but no push | Function not deployed; receiver has no `users` doc with matching `email` |
| Expo `DeviceNotRegistered` | Stale token; re-login; function prunes doc automatically |
| Permission granted, still no token | Android: wait after login (app retries); check Metro/device logs for `registerPushTokenForUid` / `getExpoPushTokenAsync` |
