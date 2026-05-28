# API Summary

> AI memory placeholder — no formal REST/OpenAPI docs in repository.  
> **Quick load:** `../PROJECT_MEMORY.md`

## Backend surface

| Layer | Notes |
|-------|--------|
| **Firestore** | Primary data API via client SDK + security rules |
| **Firebase Auth** | Email/password; OAuth setup in separate guides |
| **Firebase Storage** | Image uploads for listings |
| **Vercel serverless** | Functions under repo API folder; undocumented route catalog |
| **Entity wrappers** | `src/api/entities.js` — Conversation/Message helpers |

## Third-party integrations (setup docs only)

| Integration | Source doc |
|-------------|------------|
| OpenAI (AIBot) | `OPENAI_SETUP.md` |
| Kakao login | `KAKAO_LOGIN_SETUP.md` |
| Facebook login | `FACEBOOK_LOGIN_SETUP.md` |

## Gaps (intentional)

- No Swagger / OpenAPI file
- No generated client SDK docs
- Do **not** index `node_modules/**/README.md` as project API memory

## Placeholder slots

- [ ] Vercel function route list (method + path)
- [ ] Firestore collection ↔ service mapping
- [ ] Required env vars matrix (web vs mobile vs serverless)
