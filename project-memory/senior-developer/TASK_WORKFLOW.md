# Default Task Workflow

Use for every coding task unless a specific playbook in `../workflows/` applies.

## 1. Intake

- [ ] Read `../PROJECT_MEMORY.md`  
- [ ] Read `../CODING_SAFETY_CHECKLIST.md`  
- [ ] Load matching `../summaries/*.md`  
- [ ] Confirm acceptance criteria with the user request (implicit or explicit)  

## 2. Discovery

- [ ] Locate existing implementation (grep / read services, pages, mobile screens)  
- [ ] Note admin, auth, and Firebase touchpoints  
- [ ] Identify tests or manual flows (`TESTING_FLOW.md` at repo root if needed)  

## 3. Plan

- [ ] List files to change (minimal set)  
- [ ] Call out risks (indexes, rules, routing, mobile/web parity)  
- [ ] Choose playbook: `workflows/new-feature.md` | `bugfix.md` | `firebase-change.md` | `mobile-change.md`  

## 4. Implement

- [ ] Minimal diff only  
- [ ] No vendor / `dist/` / deployment config edits without approval  

## 5. Verify

- [ ] Describe how to test (web and/or mobile)  
- [ ] Run `reviews/pre-merge-checklist.md` mentally or explicitly  

## 6. Handoff

- [ ] Fill `../templates/change-report.md` sections in the reply  
