# Workflow: Firebase Change

**Requires explicit user approval** for rules, indexes, and project switches.

## Preconditions

- [ ] Read `../summaries/deployment_summary.md`  
- [ ] Canonical index doc: repo `docs/FIRESTORE_INDEXES.md`  

## Steps

1. **Scope** — Auth vs Firestore vs Storage vs FCM; web vs mobile env (`VITE_*`, EAS).  
2. **Rules** — Edit `firestore.rules` / `storage.rules` only when requested; deploy via Console or CLI per team practice.  
3. **Indexes** — Change `firestore.indexes.json`; keep `docs/FIRESTORE_INDEXES.md` in sync.  
4. **Queries** — Verify composite fields match index definitions.  
5. **Security** — Cross-check `SECURITY.md` and admin/message permissions.  
6. **Test** — Staging or test project first if available; never assume old project IDs in legacy docs.  

## Stop if

- User did not ask to change production rules or indexes  
- Docs reference `carsmongolia-d410a` vs live `koreazar-32e7a` without verification  
