# Rollback Workflow

## When to rollback

- Production down or core flow broken (auth, listings, payments path)  
- Bad deploy after merge to `main`  
- Firestore rules/index deploy caused widespread `permission-denied` or query failures  
- Mobile store build blocks users (crash on launch)  
- Security issue (exposed rules, auth bypass)  

**Do not rollback** for minor UI bugs — prefer forward fix if faster and lower risk.

---

## What to check first (5 minutes)

1. **Vercel** — last deployment status; error logs; env vars unchanged?  
2. **Firebase Console** — rules version; index builds; Auth status  
3. **Browser console** on https://zarkorea.com — index vs rules vs JS errors  
4. **Git** — which commit/PR introduced the change  
5. **Mobile** — crash scope (one version vs all); EAS build id  

Document in `../incidents/INCIDENT_TEMPLATE.md` if user-impacting.

---

## Vercel rollback

1. Vercel Dashboard → Project → Deployments  
2. Select last **known good** deployment → **Promote to Production** (or Redeploy)  
3. Confirm domain serves good build  
4. If bad change is only env: revert env vars, redeploy  
5. Verify `../runbooks/production-verification.md`  

**Git:** Optionally revert commit on `main` and redeploy — coordinate with team (no force-push without agreement).

---

## Firebase rollback

| Asset | Action |
|-------|--------|
| **Rules** | Console → Firestore/Storage → Rules → restore previous version or git revert `firestore.rules` / `storage.rules` + publish |
| **Indexes** | Revert `firestore.indexes.json` commit; redeploy indexes; note index deletion may take time |
| **Auth** | Re-enable providers; revert config only if changed |
| **Data** | **No automatic rollback** — use backups/export; document in incident |

**Warning:** Rules rollback affects all clients immediately.

---

## Mobile release rollback

| Channel | Action |
|---------|--------|
| **Play Store** | Halt rollout; promote previous release in Play Console |
| **App Store** | Remove version from sale or expedite fix build |
| **EAS** | Ship previous build number if binaries retained |
| **TWA** | Often fixed by **web rollback** (PWA serves broken shell) |

Update store listing only after fix verified.

---

## Communication notes

- **Internal:** Slack/issue — what broke, rollback action, owner, ETA for forward fix  
- **Users:** Only if outward-facing outage; brief status if prolonged  
- **Post-incident:** `../memory-updates/bug-memory-update.md`, `../summaries/known_bugs.md`, incident file  

---

## After rollback

- [ ] Production verification passed  
- [ ] Root cause identified in source (source of truth)  
- [ ] Forward fix PR with test plan + self-review  
- [ ] Memory update if process gap found (`AUTO_MEMORY_UPDATE_RULES.md`)  
