# Push Notification Tests

**Current scope:** Native **chat push** is implemented for the Expo mobile app.
It uses Expo push tokens stored in Firestore and a Firebase Function triggered by
new `messages` documents. Listing/status marketing push is not documented as a
shipped flow.

Source docs/code:

- `mobile/docs/CHAT_PUSH_SETUP.md`
- `mobile/src/components/PushNotificationBootstrap.js`
- `mobile/src/services/pushTokenService.js`
- `functions/index.js`

---

## Scope gate

| Question | Answer |
|----------|--------|
| Is the change touching chat, messages, auth identity, push tokens, Firebase Functions, EAS credentials, or Firestore rules? | Yes / No |
| If Yes, run the relevant sections below on a real development/production EAS build. | ☐ |
| If No, confirm the change does not add push permission prompts or new store claims. | ☐ |

---

## Token registration

| Check | Pass | Fail | Notes |
|-------|:----:|:----:|-------|
| Permission prompt appears only after authenticated mobile session initializes push bootstrap | ☐ | ☐ | |
| Expo push token obtained (`ExponentPushToken[...]`) | ☐ | ☐ | |
| Token stored at `user_push_tokens/{uid}/devices/{tokenId}` | ☐ | ☐ | |
| Token refresh on reinstall | ☐ | ☐ | |
| Logout removes this device token doc | ☐ | ☐ | |
| Android test is not Expo Go; uses an EAS build with `projectId` | ☐ | ☐ | |

---

## Foreground behavior

| Check | Pass | Fail | Notes |
|-------|:----:|:----:|-------|
| Notification received or handled safely while app open | ☐ | ☐ | |
| In-app handling does not crash | ☐ | ☐ | |
| Tap navigates to chat/conversation context | ☐ | ☐ | |

---

## Background behavior

| Check | Pass | Fail | Notes |
|-------|:----:|:----:|-------|
| User A sends chat from web or mobile | ☐ | ☐ | |
| User B receives push when app backgrounded | ☐ | ☐ | |
| User B receives push when app killed/cold | ☐ | ☐ | |
| Tap opens app to chat/conversation context | ☐ | ☐ | |
| Email user -> phone OTP user works | ☐ | ☐ | |
| Phone OTP user -> email user works | ☐ | ☐ | |

---

## Expo push compatibility

| Check | Pass | Fail | Notes |
|-------|:----:|:----:|-------|
| `expo-notifications` config in `app.json` (if used) | ☐ | ☐ | Read-only |
| EAS credentials / FCM v1 for Android production build | ☐ | ☐ | |
| APNs credentials for iOS build | ☐ | ☐ | |
| Physical device test (simulator limits noted) | ☐ | ☐ | |
| Android channel / iOS entitlement errors absent | ☐ | ☐ | |

---

## Firebase Function behavior

| Check | Pass | Fail | Notes |
|-------|:----:|:----:|-------|
| `onChatMessageCreatedPush` deployed in `asia-northeast3` | ☐ | ☐ | |
| New `messages/{messageId}` doc triggers function | ☐ | ☐ | |
| Receiver uid resolves from `users.email` including phone synthetic email users | ☐ | ☐ | |
| Invalid Expo tokens are pruned (`DeviceNotRegistered`, `InvalidCredentials`) | ☐ | ☐ | |

---

## Risks

| Risk | Mitigation |
|------|------------|
| Store rejection for undeclared push | Claim only implemented chat push behavior; do not claim listing/status push unless implemented and tested |
| Token PII in logs | Redact in test reports |
| Web push vs native mismatch | Test only platforms in scope |
| Android silent while iOS works | Verify Expo FCM V1 service account upload and rebuild/re-login |
| Receiver identity mismatch | Test both email users and phone OTP synthetic-email users |

---

## Not in scope (document N/A)

If the change cannot affect chat push, mark this playbook **N/A** in
`../templates/test-report.md`. If a change affects push but credentials/devices
are unavailable, document exactly which checks were blocked and which source
paths were reviewed.
