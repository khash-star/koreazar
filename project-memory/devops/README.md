# DevOps & GitHub Workflow

Git workflow, PR/release/rollback playbooks for Koreazar. **Docs only** — does not change CI or deploy configs.

## Before any PR or release

Cursor and contributors should read:

1. `../PROJECT_MEMORY.md`
2. `../CODING_SAFETY_CHECKLIST.md`
3. `../SENIOR_DEVELOPER_SYSTEM.md`
4. `../reviews/self-review-workflow.md`
5. `../memory-updates/AUTO_MEMORY_UPDATE_RULES.md`

## Playbooks

| Doc | Use |
|-----|-----|
| `branch-strategy.md` | Branches and merge targets |
| `commit-message-rules.md` | Commit format |
| `pull-request-workflow.md` | Open → review → merge |
| `release-workflow.md` | Web/mobile release gates |
| `rollback-workflow.md` | Revert deploy or release |
| `deployment-gates.md` | Required checks before production |

## GitHub templates

| Path | Use |
|------|-----|
| `.github/PULL_REQUEST_TEMPLATE.md` | Default PR body |
| `.github/ISSUE_TEMPLATE/bug_report.md` | Bugs |
| `.github/ISSUE_TEMPLATE/feature_request.md` | Features |
| `.github/ISSUE_TEMPLATE/deployment_check.md` | Deploy / infra issues |

## Related memory

- Reviews: `../reviews/deployment-review.md`, `../reviews/firebase-review.md`
- Runbook: `../runbooks/production-verification.md`
- Memory updates: `../memory-updates/`

**Source of truth:** When docs and code disagree, **source code wins** — verify before merging.
