# Runbooks

Operational notes for production checks — templates only; verify against live Vercel/Firebase consoles.

| Runbook | Use |
|---------|-----|
| `production-verification.md` | After deploy or infra-related tasks |

Local setup and common pitfalls live in canonical docs (do not duplicate):

- Web install: root `README.md` + `.env.example`
- API upload / Linux vs Windows helpers: `docs/ZARUSA_STAGING_DEPLOY.md`, `docs/DEPLOYMENT.md`
- Failures: `docs/TROUBLESHOOTING.md` (phone OTP chat variants, unprefixed KR writes, KR/US feed leak, US listing detail 404, banner country_code default KR, `/us` login returning to KR `/`, `koreazar.vercel.app` / `/mn` redirects)
