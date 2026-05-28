# AI Memory Update System

How **project-memory** evolves over time without replacing application source code as the authority.

---

## How memory evolves

1. **Baseline** — `PROJECT_MEMORY.md`, summaries, decision log, incident templates  
2. **After significant work** — Cursor runs a memory-update workflow and patches concise facts  
3. **Over time** — `known_bugs.md`, `DECISION_LOG.md`, and `incidents/` accumulate; root `*.md` guides may stay stale  
4. **Correction** — When drift is found, update summaries and log; verify against code  

**Golden rule:** When memory and source code disagree, **source code is the source of truth.**

---

## When updates are required

| Event | Workflow |
|-------|----------|
| Important bug fix | `memory-updates/bug-memory-update.md` |
| Production incident | `incidents/INCIDENT_TEMPLATE.md` + bug workflow |
| Architecture change | `memory-updates/architecture-memory-update.md` |
| Deployment change | `memory-updates/deployment-memory-update.md` |
| Firebase change | `memory-updates/firebase-memory-update.md` |
| Major feature / release | `memory-updates/release-memory-update.md` |
| Engineering decision | `decisions/DECISION_LOG.md` (+ optional ADR) |

Evaluation rules: `memory-updates/AUTO_MEMORY_UPDATE_RULES.md`

---

## How Cursor should propose updates

1. Finish code task + `reviews/self-review-workflow.md`  
2. Run **auto memory evaluation** (`AUTO_MEMORY_UPDATE_RULES.md`)  
3. If needed: pick workflow → update **minimal** set of memory files  
4. Report using `templates/memory-update-report.md`  
5. If `PROJECT_MEMORY.md` needs edit: **propose** to user (high-impact file)  

Prefer updating **summaries** over duplicating content in `PROJECT_MEMORY.md`.

---

## Avoiding stale documentation

| Problem | Mitigation |
|---------|------------|
| 52+ root troubleshooting guides | Summaries link + one-line status; don’t copy all |
| Old paths (`zar-746103b7/`) | Verify `package.json`, Vite root, Vercel settings |
| Wrong Firebase project in old docs | Confirm Console project ID |
| Migration docs conflict | Check code + `MIGRATION_COMPLETE.md`; log in decision log if superseded |
| PWA doc vs `vite.config.js` | Read config before memory claims |

Periodic audit: `reports/MEMORY_ANALYSIS_REPORT.md` (inventory, not live truth).

---

## Recommended workflow order

```text
1. Read     → PROJECT_MEMORY.md, CODING_SAFETY_CHECKLIST.md
2. Code     → minimal diff + self-review (reviews/self-review-workflow.md)
3. Evaluate → AUTO_MEMORY_UPDATE_RULES.md
4. Update   → memory-updates/<workflow>.md → summaries / decisions / incidents
5. Report   → templates/memory-update-report.md
6. Complex  → SENIOR_DEVELOPER_SYSTEM.md, AI_SELF_REVIEW_SYSTEM.md
```

---

## System map

| Path | Role |
|------|------|
| `memory-updates/` | Per-domain update playbooks |
| `memory-updates/AUTO_MEMORY_UPDATE_RULES.md` | Post-task evaluation |
| `decisions/DECISION_LOG.md` | Major decisions over time |
| `incidents/` | Production incident records |
| `templates/memory-update-report.md` | Handoff template |
| `summaries/*.md` | Living indexes (preferred update target) |

---

## Integration

- **Before coding:** `CODING_SAFETY_CHECKLIST.md`  
- **After coding:** `reviews/self-review-workflow.md`  
- **Then:** memory update evaluation (this system)  
- **Never:** treat `node_modules` or vendor markdown as memory sources (see `.cursorignore`)
