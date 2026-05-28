# Workflow: Mobile Change

Work **only** under `mobile/` unless syncing from web constants.

## Preconditions

- [ ] Open workspace at `mobile/` (see `mobile/АЖИЛЛАХ-ГАЗАР.md`)  
- [ ] Same Firebase project as web (`.env` in `mobile/`, not committed)  

## Steps

1. **Platform** — Native vs web Expo; Reanimated only on native (`bootstrap.native.js`).  
2. **Constants** — Prefer `npm run sync-listings` from repo root after web `listings.js` changes.  
3. **Storage** — Use `storageService.native.js` / `.web.js` split; do not break image helpers.  
4. **Store claims** — Do not document push notifications if not implemented (`mobile/README.md`).  
5. **Release** — For store work, see `mobile/docs/IOS_ANDROID_RELEASE_CHECKLIST.md`, `EAS_PRODUCTION_ENV.md`.  

## Stop if

- Change requires editing web `src/` without user asking for web parity  
- EAS / `app.json` changes without explicit request  
