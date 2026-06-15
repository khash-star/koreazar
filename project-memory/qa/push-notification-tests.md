# Push Notification Tests

**Default:** Native **chat push** is implemented for EAS mobile builds via Expo
push + Firebase Functions. Listing/status push is not implemented unless a task
explicitly adds it. Run this playbook for mobile chat changes, release QA, or any
change touching `mobile/src/services/pushTokenService.js`,
`mobile/src/components/PushNotificationBootstrap.js`, `functions/index.js`, or
chat notification routing.

---

## Scope gate

| Question | Answer |
|----------|--------|
| Is this change in native chat push scope? | Yes / No |
| If No, confirm it does not add push prompts, notification claims, or token writes | ☐ |
| If Yes, use `mobile/docs/CHAT_PUSH_SETUP.md` for deploy/troubleshooting details | ☐ |

---

## Token registration

| Check | Pass | Fail | Notes |
|-------|:----:|:----:|-------|
| Permission prompt on first use (if designed) | ☐ | ☐ | |
| FCM/Expo token obtained | ☐ | ☐ | |
| Token stored server-side or in Firestore (per design) | ☐ | ☐ | |
| Token refresh on reinstall | ☐ | ☐ | |
| Logout clears or invalidates token (if required) | ☐ | ☐ | |

---

## Foreground behavior

| Check | Pass | Fail | Notes |
|-------|:----:|:----:|-------|
| Notification received while app open | ☐ | ☐ | |
| In-app handling does not crash | ☐ | ☐ | |
| Tap navigates to Chat with `conversation_id` / `other_user_email` payload | ☐ | ☐ | |

---

## Background behavior

| Check | Pass | Fail | Notes |
|-------|:----:|:----:|-------|
| Notification received when app backgrounded | ☐ | ☐ | |
| Tap opens app to Chat | ☐ | ☐ | |
| Cold start from notification | ☐ | ☐ | |
| Phone OTP receiver still sees the conversation in Messages after returning from Chat | ☐ | ☐ | |

---

## Expo push compatibility

| Check | Pass | Fail | Notes |
|-------|:----:|:----:|-------|
| `expo-notifications` config in `app.json` (if used) | ☐ | ☐ | Read-only |
| EAS credentials / FCM v1 for production build | ☐ | ☐ | |
| Physical device test (simulator limits noted) | ☐ | ☐ | |
| Android channel / iOS entitlement errors absent | ☐ | ☐ | |

---

## Risks

| Risk | Mitigation |
|------|------------|
| Store rejection for undeclared push | Claim chat push only when EAS credentials, function deploy, and QA pass |
| Token PII in logs | Redact in test reports |
| Web push vs native mismatch | Test only platforms in scope |
| Push opens Chat but Messages list is empty | Verify `participant_uids` and run the legacy backfill in `mobile/docs/CHAT_PUSH_SETUP.md` |

---

## Not in scope (document N/A)

If a change does not touch chat push or notification behavior, mark rows **N/A**
in `../templates/test-report.md` and note that existing chat push was unchanged.
