# Architecture Memory Update Workflow

## When required

- New subsystem (messaging, AI bot, admin module, etc.)  
- Routing or layout changes (`src/pages/`, `mobile/src/navigation/`)  
- Service layer split or new `src/services/*` pattern  
- Mobile/web responsibility split changed  
- Performance-critical path changed (e.g. Home data load)  

## What to record

- Component boundaries (web root vs `mobile/`)  
- Data flow in ≤5 steps  
- Key files (paths only)  
- What must **not** be duplicated  

## How to summarize

- Prefer tables and short diagrams in memory files  
- Reference deep docs at repo root only by path (e.g. `MESSAGE_SYSTEM_ARCHITECTURE.md`) — do not duplicate 400+ lines  

## Files to update

| Target | Action |
|--------|--------|
| `../summaries/architecture_summary.md` | Update pointers and subsystem list |
| `../architecture/README.md` | Optional one-line pointer |
| `../decisions/DECISION_LOG.md` | Major structural decisions |
| `../templates/adr.md` + `../decisions/ADR-*.md` | For lasting decisions |

## Avoid

- Rewriting `PROJECT_MEMORY.md` without need — link from summaries first  
- Documenting planned-but-unbuilt architecture as shipped  

## Verify against

- Actual imports and routes in `src/`, `mobile/src/`  
- `../reviews/self-review-workflow.md` architecture dimension  
