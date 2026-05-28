# Auto Memory Update Rules

Cursor should **evaluate** after every important task whether project memory needs updating.

---

## Source of truth

> **When memory and source code disagree, source code is the source of truth.**

Verify behavior in the repo (and consoles) before writing or updating memory.

---

## After task completion — evaluate these areas

| Area | Update target if changed |
|------|---------------------------|
| Bug history | `summaries/known_bugs.md`, `incidents/` |
| Deployment procedures | `summaries/deployment_summary.md`, `runbooks/production-verification.md` |
| Architecture summaries | `summaries/architecture_summary.md` |
| Firebase rules/indexes | `docs/FIRESTORE_INDEXES.md` (flag user), `summaries/deployment_summary.md`, `summaries/api_summary.md` |
| Testing procedures | Pointers in summaries; root `TESTING_FLOW.md` (suggest only unless asked) |
| Release notes | `release-memory-update.md` workflow |
| Incident logs | `incidents/YYYY-MM-DD-*.md` |
| Engineering decisions | `decisions/DECISION_LOG.md`, optional `ADR-*.md` |

---

## Triggers (memory update likely needed)

- Important bug fix  
- Production incident  
- Architecture change  
- Deployment change  
- Firebase change  
- Major feature addition  
- Important engineering decision  

---

## If update is needed

1. Pick workflow from `memory-updates/README.md`  
2. Keep updates **concise** (bullets, tables, ≤1 screen per file section)  
3. **Avoid duplication** — one canonical sentence in summaries; link to repo docs or incidents  
4. **Preserve source-of-truth rules:**  
   - Indexes → `firestore.indexes.json` + `docs/FIRESTORE_INDEXES.md`  
   - Security posture → root `SECURITY.md` (suggest edits; don’t silently rewrite)  
   - Deploy facts → verify `vercel.json` / Vite config  
5. Fill `templates/memory-update-report.md` in the agent reply  
6. **Propose** updates to user if unsure — do not bulk-rewrite `PROJECT_MEMORY.md` without approval  

---

## If update is NOT needed

- Trivial typo, comment, or formatting  
- Project-memory-only task already complete  
- Change fully covered by existing memory with no new risks  

State: “No memory update required” in handoff.

---

## Do not

- Copy vendor or `node_modules` docs into memory  
- Paste secrets or env values  
- Duplicate 50+ root-level `*_FIX.md` files into summaries  
- Mark docs “done” when only code changed (or vice versa)  

---

## Workflow order

See `../reports/AI_MEMORY_UPDATE_SYSTEM.md`
