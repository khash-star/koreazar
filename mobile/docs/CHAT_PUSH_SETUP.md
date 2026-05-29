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
- Configure FCM (Android) and APNs (iOS) in Expo dashboard / `eas credentials` for project `96d89595-cf78-48c8-9695-5c2cc7af53f4`.
- Physical device test recommended.

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
| No token in Firestore | Notification permission denied; Expo Go Android; missing EAS `projectId` |
| Token but no push | Function not deployed; receiver has no `users` doc with matching `email` |
| Expo `DeviceNotRegistered` | Stale token; re-login; function prunes doc automatically |
