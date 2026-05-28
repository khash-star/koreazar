# Pull Request Workflow

## Author checklist (before open)

1. Read `../PROJECT_MEMORY.md` + `../CODING_SAFETY_CHECKLIST.md`  
2. Run `../reviews/self-review-workflow.md` for code changes  
3. Fill `.github/PULL_REQUEST_TEMPLATE.md` completely  
4. Evaluate `../memory-updates/AUTO_MEMORY_UPDATE_RULES.md`  

## Open PR

- Target: `main`  
- Title: same style as commit summary  
- Link issue if exists  
- Label area: `web` | `mobile` | `firebase` | `docs` | `infra`  

## Review focus

| Area | Check |
|------|--------|
| Scope | Minimal diff; no duplicate services |
| Firebase | Indexes, rules, permissions |
| Deploy | Env, build cmd, no accidental config |
| Admin | RBAC and routes intact |
| Mobile/web | Correct folder; `sync-listings` if constants changed |

Use `../reviews/pre-merge-checklist.md` before merge.

## Merge gates

See `deployment-gates.md`. Do not merge if:

- Build failing  
- Missing Firestore index for new queries  
- Undeployed rules change assumed in code only  
- No test plan for user-facing change  

## After merge

- Confirm Vercel preview/production deploy if auto-deploy enabled  
- Update project-memory if `AUTO_MEMORY_UPDATE_RULES.md` applies  
- Close linked issues  

## Docs-only PRs

- `project-memory/`, `.github/` templates, root markdown  
- Skip runtime test plan; note “memory/docs only” in template  
