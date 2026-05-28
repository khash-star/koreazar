# Workflow: New Feature

## Preconditions

- [ ] Feature does not duplicate an existing service or route  
- [ ] Web vs mobile scope agreed (web root, `mobile/`, or both)  

## Steps

1. **Design** — Data model (Firestore collections?), UI entry points, admin impact.  
2. **Reuse** — Extend `src/services/*`, `src/api/entities.js`, mobile services before adding files.  
3. **Auth** — Protected routes use existing AuthContext / mobile AuthContext patterns.  
4. **Admin** — If moderation/banners: respect `users.role === 'admin'`; do not bypass guards.  
5. **Indexes** — New compound queries → update `firestore.indexes.json` only if user approved Firebase work.  
6. **Mobile parity** — If web constants change, plan `npm run sync-listings`.  
7. **Test** — Manual path per `TESTING_FLOW.md` or feature-specific steps.  

## Stop if

- Requires new deployment platform or duplicate API client  
- Breaks SPA routing or PWA/TWA assumptions without explicit approval  
