---
name: Deployment check
about: Deploy, release, Firebase, Vercel, or store submission
title: "[Deploy]: "
labels: deployment
---

## Type

- [ ] Vercel / web release
- [ ] Firebase (rules / indexes / project)
- [ ] PWA / TWA
- [ ] Play Store / App Store / EAS
- [ ] DNS / domain
- [ ] Rollback

## Summary

## Pre-checks

- [ ] `project-memory/devops/release-workflow.md` reviewed
- [ ] `project-memory/devops/deployment-gates.md` satisfied
- [ ] Build: `npm run build` OK

## Firebase

- [ ] Indexes deployed
- [ ] Rules published
- [ ] Correct project ID verified in Console

## Vercel

- [ ] `VITE_*` env vars set
- [ ] Latest commit deployed
- [ ] Domain / manifest / assetlinks (if TWA)

## Mobile (if applicable)

- [ ] EAS production env
- [ ] `IOS_ANDROID_RELEASE_CHECKLIST.md`
- [ ] `sync-listings` if constants changed

## Post-deploy verification

- [ ] `project-memory/runbooks/production-verification.md`

## Rollback plan

<!-- Link to project-memory/devops/rollback-workflow.md -->
