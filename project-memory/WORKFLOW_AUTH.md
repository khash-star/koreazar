# Workflow: Auth (Нэвтрэлт, бүртгэл, профайл)

> **Хэзээ ашиглах:** Login/Register/Profile, утас OTP, Facebook, `users` collection, `user_sync`, session, бүртгэл устгах, admin role.
> **Каноник баримт:** `docs/SECURITY.md` · `docs/FIREBASE.md` · `docs/TROUBLESHOOTING.md`
> **Ерөнхий дараалал:** `AGENT_TASK_WORKFLOW.md` → энэ playbook

---

## Урьдчилсан нөхцөл

- [ ] Firebase Auth + Firestore `users` + PHP `user_sync` гурвалсан урсгалыг ойлгосон
- [ ] Web: `VITE_FIREBASE_*` · Mobile: `EXPO_PUBLIC_FIREBASE_*` (нэр л, утга биш)
- [ ] `CODING_SAFETY_CHECKLIST.md`
- [ ] Native OTP бол EAS build шаардлагатай

---

## Гол файлууд

| Давхарга | Web | Mobile |
|----------|-----|--------|
| Service | `src/services/authService.js` | `mobile/src/services/authService.js` |
| Context | `src/contexts/AuthContext.jsx` (`authEmail`) | `mobile/src/context/AuthContext.js` |
| UI | `src/pages/Login.jsx`, `Register.jsx`, `Profile.jsx` | Login, Register, Profile screens |
| Phone OTP | `Login.jsx` (reCAPTCHA); US default `+1` on `/us` | `phoneAuth.native.js`, `PHONE_OTP_NATIVE_SETUP.md` |
| Admin roles | `src/constants/adminRoles.js`, `useAdminAccess.js` | `mobile/src/constants/adminRoles.js` (`sync-admin-roles`) |
| Facebook | `facebookAuthService.js` | Planned |
| Firebase config | `src/firebase/config.js` | `config/firebase.native.js`, `firebase.web.js` |
| User profile FS | Firestore `users/{uid}` | `userProfileService.js` |
| MySQL sync | `user_sync` via API | `apiClient.js` |
| Account delete | `accountDeletion.js` | `accountDeletion.js` |
| Email utils | `src/utils/emailNormalize.js` | Ижил pattern (`emailQueryVariants`, `resolveAuthEmail`) |

**PHP:** `api/index.php?action=user_sync` — `FIREBASE_WEB_API_KEY` (server `.env`)

---

## Auth урсгууд

### Email/password бүртгэл

```
Register.jsx → authService.register
  → createUserWithEmailAndPassword
  → setDoc users/{uid} (role: user, termsAcceptedAt, ...)
  → syncUserToMySql → POST user_sync (Bearer)
```

### Email/password нэвтрэлт

```
Login.jsx → signInWithEmailAndPassword
  → AuthContext onAuthChange
  → ensureUserDocEmailForFirestoreRules
  → getMe() → Firestore users/{uid}
```

### Утас + OTP (mobile / web)

```
phoneAuth → Firebase phone verify
  → synthetic email: phoneToAuthEmail(phone)  # phone_{digits}@phone.zarkorea.com
  → setDoc users/{uid} (phone, email, authProvider: phone)
  → syncUserToMySql (profile complete болсон үед)
```

**Identity resolution:** Firebase `user.email` OTP-д хоосон байж болно. Web `AuthContext.authEmail` = `resolveAuthEmail(user, userData)` — profile email → token email → phone synthetic.

**Phone email variants** (`emailQueryVariants`):

| Market | Variant pattern |
|--------|-----------------|
| KR `+82` | `phone_82…` ↔ national digits without `82` |
| US `+1` | `phone_1` + 10 digits ↔ 10-digit national |

Chat / listings / mark-read must use `areEmailVariants`, not raw string equality.

`google-services.json` / `GoogleService-Info.plist` — EAS file env эсвэл local gitignored.

### Post-login redirect (web)

`/Login` is unprefixed. Destination order in `Login.jsx`:

`state.from` → `?redirect=` → `sessionStorage.loginRedirect` → `/` (KR Home).

| Entry | How the return path is set |
|-------|----------------------------|
| Home “Нэвтрэх” | `<Link to={createPageUrl('Login')} state={{ from: location.pathname }}>` |
| Guarded page | `redirectToLogin()` stores `toSafePath(...)` then `window.location.href = '/Login'` |
| Bare `/Login` | No return path → KR `/`. Phone OTP list is KR, not US |

Phone prefix on Login follows `countryCodeFromPath(redirectUrl)`, so returning
to `/us/...` defaults to `+1`. Do not add an absolute off-site `?redirect=`.

### Session

- Web: Firebase Auth persistence (default)
- Mobile: Firebase JS Auth + `AsyncStorage` (README)
- AuthContext: `loading` false болгохоос өмнө basic `userData` set — LCP/blocking бүү нэм

---

## Firestore `users/{uid}` чухал талбарууд

| Талбар | Зориулалт |
|--------|-----------|
| `email` | Rules (`authEmailLower`), чат, AI — OTP-д заавал |
| `role` | `user` \| `super_admin` (legacy `admin`) \| `country_admin` \| `region_admin` |
| `admin_country_code` | `country_admin` scope (жишээ: `US`) |
| `admin_region_code` | `region_admin` scope (жишээ: `washington-dc`) |
| `customerId` | MySQL `users.id` |
| `phone` / `phoneNumber` | Утасны хэрэглэгч |
| `profileCompleted` | OTP дараах нэр бөглөлт |
| `termsAcceptedAt` | Compliance |

**Protected fields (client):** `role`, `admin_*`, `isAdmin`, `customerId` — `PROTECTED_USER_DOC_FIELDS` in `authService.js`.
**Assign roles:** Console / super-admin UI + MySQL parity (`admin_set_user_role` / `sync-admin-roles`). Client self-elevate бүү зөвшөөр.

---

## Өөрчлөлтийн алхмууд

### 1. Scope

| Асуулт | Файл |
|--------|------|
| Шинэ provider? | authService + Firebase Console + CSP (`vercel.json`) |
| Profile талбар? | authService + Firestore rules + user_sync payload |
| Route guard? | `redirectToLogin` (sessionStorage + full-page `/Login`), `state.from` on Home, `useAuth`, `useAdminAccess` / `isAppAdmin` |
| Scoped admin? | `adminRoles.js` + Firestore rules + MySQL `users.role` parity |
| Бүртгэл устгах? | `deleteAccountWithPassword` / `accountDeletion.js` — Apple 5.1.1(v) |

### 2. Firestore rules

- `users`: read public; update — owner without `role` / `admin_*` change
- Role assign: `super_admin` only (legacy `admin` = super). See `docs/ZARUSA_REGION_PHASES.md` Phase 2
- PHP API scope: `APP_ADMIN_UIDS` → `firebase_uid` → legacy `email` (`fetch_user_admin_scope_row`)

### 3. PHP sync

- `user_sync` дуудах газар өөрчлөгдвөл MySQL `users` мөр таарна
- `customer_id` listings API-д ашиглагдана

### 4. Env

| Platform | Хувьсагч |
|----------|----------|
| Web | `VITE_FIREBASE_*`, `VITE_FIREBASE_PHONE_TEST_MODE` (dev) |
| Mobile | `EXPO_PUBLIC_FIREBASE_*`, `GOOGLE_SERVICES_JSON`, `GOOGLE_SERVICE_INFO_PLIST` |
| API | `FIREBASE_WEB_API_KEY` |

### 5. Security

- Нууц үг: `validatePassword` (min 6)
- Reauth before delete: `reauthenticateWithCredential`
- Secrets commit хийхгүй

---

## Тест checklist

| # | Шалгах |
|---|--------|
| 1 | Email register → login → logout |
| 2 | Нууц үг сэргээх |
| 3 | Profile засах (хориглосон талбар өөрчлөгдөхгүй) |
| 4 | Утас OTP (EAS build): register → дахин нээхэд session |
| 5 | `users/{uid}.email` утасны хэрэглэгчид байгаа; `authEmail` хоосон биш |
| 6 | KR `+82` / US `+1` variant-аар чат / mark-read ажиллана |
| 7 | `/us` Home login → return `/us` and `+1`; bare `/Login` → KR `/` |
| 8 | Чат / saved listings permission алдаагүй |
| 9 | `user_sync` — MySQL `users` мөр үүссэн |
| 10 | Scoped admin: `region_admin` зөвхөн өөрийн region |
| 11 | Бүртгэл устгах (хэрэв scope-д орсон) |

QA: `qa/web-regression-tests.md`, `qa/admin-rbac-tests.md`, `qa/firebase-tests.md`

---

## Deploy

| Өөрчлөлт | Deploy |
|----------|--------|
| Web auth UI | Vercel + `VITE_FIREBASE_*` |
| Mobile native auth | EAS + `EXPO_PUBLIC_*` + google services files |
| `firestore.rules` (users) | `firebase deploy --only firestore:rules` |
| `user_sync` PHP | API server `.env` + `index.php` |

---

## Зогсох ёстой нөхцөл

- Client-ээс `role` / `admin_*` self-elevate хийх
- `firebase/config.js` дотор key hardcode
- Expo Go дээр native phone OTP «ажиллана» гэж таамаглах
- Auth flow өөрчилж `ensureUserDocEmailForFirestoreRules` / `resolveAuthEmail` алгасах (чат эвдэнэ)
- Phone identity-д raw email `===` ашиглах (`areEmailVariants` хэрэгтэй)
- Production `VITE_FIREBASE_PHONE_TEST_MODE=true`

---

## Холбоотой

- `WORKFLOW_CHAT.md` — `resolveChatParticipantEmail`, synthetic email
- `WORKFLOW_LISTINGS.md` — Bearer token, `customerId`
- `WORKFLOW_PUSH.md` — login дараах token бүртгэл
- `mobile/docs/PHONE_OTP_NATIVE_SETUP.md`
- Root `FACEBOOK_LOGIN_SETUP.md`, `KAKAO_LOGIN_SETUP.md`
