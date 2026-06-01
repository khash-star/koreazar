# Push Notification Tests

**Default:** Chat push is implemented for mobile through Expo push tokens and
`functions/index.js`; listing/status push is not implemented. Run this playbook
when FCM/Expo push is in scope or when store claims mention notifications.

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
| Store rejection for undeclared push | Claim only implemented push flows; chat push exists, listing/status push does not |
| Token PII in logs | Redact in test reports |
| Web push vs native mismatch | Test only platforms in scope |

---

## Not in scope (document N/A)

If the changed release does not touch push and does not claim push behavior,
mark this playbook **N/A** in `../templates/test-report.md`.
