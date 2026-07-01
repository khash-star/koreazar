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
| Context | `src/contexts/AuthContext.jsx` | Mobile auth context / hooks |
| UI | `src/pages/Login.jsx`, `Register.jsx`, `Profile.jsx` | Login, Register, Profile screens |
| Phone OTP | `Login.jsx` (reCAPTCHA) | `phoneAuth.native.js`, `PHONE_OTP_NATIVE_SETUP.md` |
| Facebook | `facebookAuthService.js` | Planned |
| Firebase config | `src/firebase/config.js` | `config/firebase.native.js`, `firebase.web.js` |
| User profile FS | Firestore `users/{uid}` | `userProfileService.js` |
| MySQL sync | `user_sync` via API | `apiClient.js` |
| Account delete | `accountDeletion.js` | `accountDeletion.js` |
| Email utils | `src/utils/emailNormalize.js` | Ижил pattern |

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

### Утас + OTP (mobile)

```
phoneAuth.native.js → @react-native-firebase/auth
  → confirmPhoneLogin / completePhoneUserProfile
  → synthetic email: phoneToAuthEmail(phone)
  → setDoc users/{uid} (phone, email, authProvider: phone)
  → syncUserToMySql (profile complete болсон үед)
```

`google-services.json` / `GoogleService-Info.plist` — EAS file env эсвэл local gitignored.

### Session

- Web: Firebase Auth persistence (default)  
- Mobile: Firebase JS Auth + `AsyncStorage` (README)  
- AuthContext: `loading` false болгохоос өмнө basic `userData` set — LCP/blocking бүү нэм

---

## Firestore `users/{uid}` чухал талбарууд

| Талбар | Зориулалт |
|--------|-----------|
| `email` | Rules (`authEmailLower`), чат, AI |
| `role` | `user` \| `admin` — client өөрчлөхгүй |
| `customerId` | MySQL `users.id` |
| `phone` / `phoneNumber` | Утасны хэрэглэгч |
| `profileCompleted` | OTP дараах нэр бөглөлт |
| `termsAcceptedAt` | Compliance |

**Protected fields (client):** `role`, `isAdmin`, `customerId` — `PROTECTED_USER_DOC_FIELDS` in `authService.js`

---

## Өөрчлөлтийн алхмууд

### 1. Scope

| Асуулт | Файл |
|--------|------|
| Шинэ provider? | authService + Firebase Console + CSP (`vercel.json`) |
| Profile талбар? | authService + Firestore rules + user_sync payload |
| Route guard? | `redirectToLogin`, `useAuth`, admin check `isAdmin()` |
| Бүртгэл устгах? | `deleteAccountWithPassword` / `accountDeletion.js` — Apple 5.1.1(v) |

### 2. Firestore rules

- `users`: read public; update — owner without `role` change; admin full  
- Admin оноох: Firebase Console гараар (`ADMIN_SETUP_GUIDE.md`) — client code бүү нэм

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
| 5 | `users/{uid}.email` утасны хэрэглэгчид байгаа |
| 6 | Чат / saved listings permission алдаагүй |
| 7 | `user_sync` — MySQL `users` мөр үүссэн |
| 8 | Бүртгэл устгах (хэрэв scope-д орсон) |

QA: `qa/admin-rbac-tests.md`, `qa/firebase-tests.md`

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

- Client-ээс `role: admin` set хийх  
- `firebase/config.js` дотор key hardcode  
- Expo Go дээр native phone OTP «ажиллана» гэж таамаглах  
- Auth flow өөрчилж `ensureUserDocEmailForFirestoreRules` алгасах (чат эвдэнэ)  
- Production `VITE_FIREBASE_PHONE_TEST_MODE=true`

---

## Холбоотой

- `WORKFLOW_CHAT.md` — `resolveChatParticipantEmail`, synthetic email  
- `WORKFLOW_LISTINGS.md` — Bearer token, `customerId`  
- `WORKFLOW_PUSH.md` — login дараах token бүртгэл  
- `mobile/docs/PHONE_OTP_NATIVE_SETUP.md`  
- Root `FACEBOOK_LOGIN_SETUP.md`, `KAKAO_LOGIN_SETUP.md`
