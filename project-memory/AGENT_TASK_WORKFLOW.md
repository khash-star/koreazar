# Agent Task Workflow (canonical order)

Follow this sequence for **every coding task** unless the user scope is docs/project-memory only.

| Step | Action | Path |
|------|--------|------|
| 1 | **Task** | Understand request; confirm web / mobile / Firebase / deploy scope |
| 2 | **PROJECT_MEMORY** | Read project context | `PROJECT_MEMORY.md` |
| 3 | **CODING_SAFETY_CHECKLIST** | Pre-change safety rules | `CODING_SAFETY_CHECKLIST.md` |
| 4 | **Relevant summary** | Load by task type | `summaries/architecture_summary.md` · `deployment_summary.md` · `api_summary.md` · `known_bugs.md` |
| 5 | **SENIOR_DEVELOPER_SYSTEM** | Complex / production-sensitive work | `SENIOR_DEVELOPER_SYSTEM.md` + `workflows/*` |
| 6 | **Source verification** | Read affected source; **code wins over stale docs** | `src/`, `mobile/`, `api/` |
| 7 | **Minimal code change** | Smallest safe diff; no vendor / deploy config without approval | — |
| 8 | **Self-review** | Architecture, deploy, Firebase, routing, regressions | `reviews/self-review-workflow.md` |
| 9 | **QA playbooks** | Applicable checklists | `qa/README.md` → `qa/test-strategy.md` → domain playbooks |
| 10 | **Test report** | Handoff after QA | `templates/test-report.md` |
| 11 | **DevOps gate** | PR / release / rollback | `devops/deployment-gates.md` · `pull-request-workflow.md` · `release-workflow.md` · `rollback-workflow.md` |
| 12 | **Memory update check** | Post-task evaluation | `memory-updates/AUTO_MEMORY_UPDATE_RULES.md` → `templates/memory-update-report.md` |

## Skip shortcuts

| Scope | Skip steps |
|-------|------------|
| Docs / project-memory only | 6–10 (no app code); still do 12 if memory edited |
| Trivial one-line fix | 5, 9–10 (note N/A in test report) |
| Release day | Full 9–11 required |

## Handoff minimum (code tasks)

1. Change audit (`reviews/self-review-workflow.md`)  
2. `templates/test-report.md`  
3. Memory update: yes/no + `memory-update-report.md` if yes  
