# Bug Memory Update Workflow

## When required

- Production or user-visible bug fixed in `src/`, `mobile/`, or `api/`
- Recurring issue documented in root `DEBUG_*.md` or `*_TROUBLESHOOTING.md`
- Regression found during self-review (`../reviews/regression-review.md`)

Skip for typos, comment-only, or project-memory-only edits.

## What to record (concise)

| Field | Max detail |
|-------|------------|
| Symptom | 1–2 sentences |
| Root cause | Verified in source, not guess from old docs |
| Fix | Files + behavior change |
| Regression risks | What to retest |
| Verification | Commands + routes |

## How to summarize

- One bullet per idea; no copy-paste of stack traces  
- Link symptom → cause → fix → test  
- Date the entry (YYYY-MM-DD)  

## Files to update

| Target | Action |
|--------|--------|
| `../summaries/known_bugs.md` | Add row or short entry; mark resolved if fixed |
| `../incidents/` | Use `INCIDENT_TEMPLATE.md` if production impact |
| `../decisions/DECISION_LOG.md` | Only if fix implies a new engineering policy |
| Root `DEBUG_*.md` | **Do not edit** unless user asks — prefer memory |

## Avoid

- Duplicating full content from root troubleshooting guides  
- Stating “fixed” without naming verification steps  
- Contradicting live code  

## Handoff

Fill `../templates/memory-update-report.md` when memory files change.
