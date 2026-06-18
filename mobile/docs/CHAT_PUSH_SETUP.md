# Chat push notifications (Expo + Firestore + Cloud Functions)

## Architecture

1. **Mobile (EAS build)** — After login, `PushNotificationBootstrap` registers `ExponentPushToken[...]` under `user_push_tokens/{firebaseUid}/devices/{tokenId}`.
2. **Firestore** — Any client (web or mobile) creates a document in `messages/`; rules unchanged.
3. **Cloud Function** — `onChatMessageCreatedPush` resolves receiver `uid` from `users.email` (works for email users and phone OTP synthetic emails), loads tokens, sends via [Expo Push API](https://docs.expo.dev/push-notifications/sending-notifications/).

App icon badge + tab badges are unchanged (polling + `appIconBadge.js`).

Mobile chat architecture, conversation repair, and platform send/keyboard
constraints are documented in [`MOBILE_CHAT.md`](MOBILE_CHAT.md).

### Runtime details

- `pushTokenService.ensureChatPushPermissions()` creates Android notification
  channel `chat` with high importance before requesting a token.
- `PushNotificationBootstrap` retries token registration after login. Android
  waits 1200ms first, then retries with `[0, 2000, 5000]` delays because FCM can
  be late immediately after app start.
- Function payload data is:
  `{ type: "chat", conversation_id, other_user_email }`.
- Notification taps open Chat directly. The thread is still expected to appear in
  Messages because conversations store `participant_uids`; legacy threads may
  need the backfill below.

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
| 6 | Return to Messages; the same thread remains visible for the phone OTP user |
| 7 | Logout removes device token doc |

## Legacy conversation backfill

For conversations created before `participant_uids`, push taps can open Chat while
the Messages list stays empty for phone OTP users. Current clients call
`repairConversationParticipants()`, but run the backfill once for production data
after deploying indexes:

```bash
cd functions
node scripts/backfill-conversation-participant-uids.js --dry-run
node scripts/backfill-conversation-participant-uids.js
```

The script requires Firebase Admin credentials. Use `--dry-run` first and confirm
the target Firebase project before writing.

## Troubleshooting

| Symptom | Check |
|---------|--------|
| No token in Firestore | Notification permission denied; Expo Go Android; missing EAS `projectId`; `getExpoPushTokenAsync` error (missing `google-services.json` in build) |
| Token in Firestore, iOS OK, **Android silent** | **FCM V1 key missing/wrong on Expo** (`InvalidCredentials` in Expo Push Tool); rebuild + re-login after fixing credentials |
| Token but no push | Function not deployed; receiver has no `users` doc with matching `email` |
| Expo `DeviceNotRegistered` | Stale token; re-login; function prunes doc automatically |
| Permission granted, still no token | Android: wait after login (app retries); check Metro/device logs for `registerPushTokenForUid` / `getExpoPushTokenAsync` |
| Push opens Chat but thread missing from Messages | Missing `participant_uids` or phone email variant drift; run the backfill above and verify `firestore.indexes.json` is deployed |
