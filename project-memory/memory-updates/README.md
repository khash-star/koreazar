# Memory Updates

Workflows for keeping `project-memory/` accurate after significant work.

| Workflow | Trigger |
|----------|---------|
| `bug-memory-update.md` | Important bug fixes, regressions |
| `deployment-memory-update.md` | Vercel, DNS, PWA, TWA, EAS, env |
| `architecture-memory-update.md` | Structure, routing, data flow, new subsystems |
| `firebase-memory-update.md` | Rules, indexes, Auth, Storage, FCM |
| `release-memory-update.md` | Store releases, major features |

**Rules:** `AUTO_MEMORY_UPDATE_RULES.md`  
**Report template:** `../templates/memory-update-report.md`  
**System overview:** `../reports/AI_MEMORY_UPDATE_SYSTEM.md`

**Source of truth:** When memory and source code disagree, **source code wins**. Verify in repo before writing memory.
