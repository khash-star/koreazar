# Push Notification Tests

**Default:** Push is **not** implemented for store claims (`mobile/README.md`). Run this playbook **only** when FCM/Expo push is in scope.

---

## Scope gate

| Question | Answer |
|----------|--------|
| Is push intentionally implemented in this PR? | Yes / No |
| If No, confirm no new permission prompts or store claims | ☐ |

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
| Tap navigates to correct screen | ☐ | ☐ | |

---

## Background behavior

| Check | Pass | Fail | Notes |
|-------|:----:|:----:|-------|
| Notification received when app backgrounded | ☐ | ☐ | |
| Tap opens app to correct route | ☐ | ☐ | |
| Cold start from notification | ☐ | ☐ | |

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
| Store rejection for undeclared push | Do not claim push in listing if not implemented |
| Token PII in logs | Redact in test reports |
| Web push vs native mismatch | Test only platforms in scope |

---

## Not in scope (document N/A)

If push not implemented: mark all rows **N/A** in `../templates/test-report.md`.
