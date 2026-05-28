# Deployment Gates

Required before **merge to main** (production path) or **store submission**.

## Gate 1 — Code quality

- [ ] PR template complete (`.github/PULL_REQUEST_TEMPLATE.md`)  
- [ ] `../reviews/self-review-workflow.md` done for code changes  
- [ ] `../reviews/pre-merge-checklist.md` satisfied  
- [ ] CI passing (`.github/workflows/` if applicable)  
- [ ] No vendor / `dist/` / unintended deploy config in diff  

## Gate 2 — Architecture & product

- [ ] Web in `src/`; mobile in `mobile/` only  
- [ ] No duplicate APIs or services  
- [ ] Admin routes and `users.role` preserved  
- [ ] Session/auth behavior unchanged unless scoped  

## Gate 3 — Firebase (if touched)

- [ ] `../reviews/firebase-review.md`  
- [ ] Indexes in `firestore.indexes.json` for new queries  
- [ ] Rules reviewed; production publish planned  
- [ ] No secrets in repo  

## Gate 4 — Deploy (if touched)

- [ ] `../reviews/deployment-review.md`  
- [ ] `npm run build` succeeds locally or in CI  
- [ ] Vercel env vars documented (names only in PR)  
- [ ] PWA/TWA assets if Android path affected  

## Gate 5 — Test evidence

- [ ] Test plan in PR executed or CI covers scope  
- [ ] Web: Home, auth, critical path  
- [ ] Mobile: if `mobile/` changed — Expo smoke noted  

## Gate 6 — Memory & docs

- [ ] `../memory-updates/AUTO_MEMORY_UPDATE_RULES.md` evaluated  
- [ ] “Memory update needed?” answered in PR  
- [ ] If yes: `../templates/memory-update-report.md` or summary patch proposed  

## Production-only gate (release day)

- [ ] `release-workflow.md` full checklist  
- [ ] `../runbooks/production-verification.md` after deploy  

## Block merge if

- Missing Firestore index for merged queries  
- Rules change merged but not published (and code depends on it)  
- No rollback plan for high-risk change  
- Risk level **High** without reviewer approval  
