# Test Report (template)

_Fill after running QA playbooks under `project-memory/qa/`._

---

## Change summary

<!-- What changed and why (1–3 sentences) -->

## Test environment

| Field | Value |
|-------|--------|
| Date | YYYY-MM-DD |
| Branch / commit | |
| Web | Local dev / Preview / Production |
| Mobile | Expo Go / dev client / EAS build # |
| Firebase project | (verify Console ID) |

---

## Tests run

| Playbook | Run? |
|----------|------|
| `qa/web-regression-tests.md` | Yes / No / Partial |
| `qa/mobile-regression-tests.md` | Yes / No / N/A |
| `qa/firebase-tests.md` | Yes / No / N/A |
| `qa/pwa-twa-tests.md` | Yes / No / N/A |
| `qa/admin-rbac-tests.md` | Yes / No / N/A |
| `qa/image-upload-tests.md` | Yes / No / N/A |
| `qa/push-notification-tests.md` | Yes / No / N/A |
| `qa/pre-release-qa-checklist.md` | Yes / No |

---

## Pass / fail summary

| Area | Pass | Fail | N/A | Notes |
|------|:----:|:----:|:---:|-------|
| Web routes / listing / auth | ☐ | ☐ | ☐ | |
| Search / filter | ☐ | ☐ | ☐ | |
| Mobile navigation / images | ☐ | ☐ | ☐ | |
| Firebase | ☐ | ☐ | ☐ | |
| PWA / TWA | ☐ | ☐ | ☐ | |
| Admin RBAC | ☐ | ☐ | ☐ | |
| Image upload | ☐ | ☐ | ☐ | |
| Push | ☐ | ☐ | ☐ | |

---

## Bugs found

| # | Severity | Description | Steps | Blocker? |
|---|----------|-------------|-------|----------|
| 1 | | | | Yes / No |

---

## Risks

- Remaining untested areas:
- Production-only concerns:
- Index / rules / deploy drift:

---

## Recommended next action

- [ ] **Merge** — all blockers Pass  
- [ ] **Fix** — address bugs above  
- [ ] **Hold release** — run `../devops/rollback-workflow.md` if deployed  
- [ ] **Memory update** — `../memory-updates/AUTO_MEMORY_UPDATE_RULES.md`  
- [ ] **Waive** — document owner approval: _______________
