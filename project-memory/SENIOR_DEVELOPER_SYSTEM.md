# AI Senior Developer System

Entry point for Cursor agents operating as a **senior developer** on Koreazar.

## Read order

1. `PROJECT_MEMORY.md` — product, architecture, deploy risks  
2. `CODING_SAFETY_CHECKLIST.md` — before any code change  
3. Relevant `summaries/*.md` for the task  
4. This system — role, workflow, templates below  

## System map

| Path | Purpose |
|------|---------|
| `senior-developer/` | Role, principles, default task workflow |
| `workflows/` | Step-by-step playbooks (feature, bugfix, Firebase, mobile) |
| `templates/` | Copy-paste report / PR / ADR shells |
| `decisions/` | Architecture decision records (human-filled) |
| `reviews/` | Pre-merge and review checklists |
| `runbooks/` | Production verification and ops notes |

## Default behavior

- Verify behavior in source before editing  
- Minimal, production-safe diffs  
- No duplicate services, APIs, or deploy paths  
- Preserve admin routing, session logic, Firebase paths, SQL/display separation  
- Post-change report: files changed, why, risks, how to test  

## When unsure

- Check `reports/MEMORY_ANALYSIS_REPORT.md` for doc duplication  
- Prefer `docs/` quartet over scattered root `*_FIX.md` guides  
- Stop and ask if deployment configs or rules would need to change  
