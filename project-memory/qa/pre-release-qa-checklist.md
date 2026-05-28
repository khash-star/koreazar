# Pre-Release QA Checklist

**Pass/fail gate** before production deploy or store submission.  
Align with `../devops/release-workflow.md` and `../devops/deployment-gates.md`.

**Release version / date:** _______________  
**Tester:** _______________

---

## Build & CI

| Check | Pass | Fail | N/A |
|-------|:----:|:----:|:---:|
| `npm run build` (root) | ☐ | ☐ | ☐ |
| PR merged to `main` with template complete | ☐ | ☐ | ☐ |
| CI workflow green (if applicable) | ☐ | ☐ | ☐ |

---

## Web regression (smoke)

| Check | Pass | Fail | N/A |
|-------|:----:|:----:|:---:|
| Home + listings + banners | ☐ | ☐ | ☐ |
| Auth login / logout | ☐ | ☐ | ☐ |
| Listing create → detail | ☐ | ☐ | ☐ |
| Search / category filter | ☐ | ☐ | ☐ |
| See `web-regression-tests.md` for full matrix | ☐ | ☐ | ☐ |

---

## Mobile (if release includes app)

| Check | Pass | Fail | N/A |
|-------|:----:|:----:|:---:|
| Expo smoke on target platform | ☐ | ☐ | ☐ |
| `sync-listings` if constants changed | ☐ | ☐ | ☐ |
| EAS production env | ☐ | ☐ | ☐ |
| Store checklist signed | ☐ | ☐ | ☐ |

---

## Firebase

| Check | Pass | Fail | N/A |
|-------|:----:|:----:|:---:|
| Correct production project | ☐ | ☐ | ☐ |
| Indexes deployed | ☐ | ☐ | ☐ |
| Rules published | ☐ | ☐ | ☐ |
| Storage rules published | ☐ | ☐ | ☐ |
| `firebase-tests.md` critical rows | ☐ | ☐ | ☐ |

---

## PWA / TWA (if web/Android shell)

| Check | Pass | Fail | N/A |
|-------|:----:|:----:|:---:|
| manifest + SW on production | ☐ | ☐ | ☐ |
| assetlinks.json valid | ☐ | ☐ | ☐ |
| `pwa-twa-tests.md` | ☐ | ☐ | ☐ |

---

## Admin & security

| Check | Pass | Fail | N/A |
|-------|:----:|:----:|:---:|
| `admin-rbac-tests.md` | ☐ | ☐ | ☐ |
| No secrets in repo / PR | ☐ | ☐ | ☐ |

---

## Images & push

| Check | Pass | Fail | N/A |
|-------|:----:|:----:|:---:|
| `image-upload-tests.md` | ☐ | ☐ | ☐ |
| `push-notification-tests.md` or N/A | ☐ | ☐ | ☐ |

---

## Post-deploy

| Check | Pass | Fail | N/A |
|-------|:----:|:----:|:---:|
| `../runbooks/production-verification.md` | ☐ | ☐ | ☐ |
| Rollback owner assigned | ☐ | ☐ | ☐ |

---

## Sign-off

| Result | |
|--------|--|
| **SHIP** | All required rows Pass |
| **HOLD** | Any Fail on required row — fix or rollback plan |
| **WAIVE** | Fail waived by: _______________ Reason: _______________ |

**Required failures block release** unless explicit waive documented.
