# Workflow: Push (Чат мэдэгдэл)

> **Хэзээ ашиглах:** Expo push, FCM, `user_push_tokens`, `onChatMessageCreatedPush`, notification tap → Chat, Android/iOS credentials.  
> **Каноник баримт:** `docs/CHAT_SYSTEM.md` · `mobile/docs/CHAT_PUSH_SETUP.md` · `docs/TROUBLESHOOTING.md`  
> **Ерөнхий дараалал:** `AGENT_TASK_WORKFLOW.md` → энэ playbook

---

## Урьдчилсан нөхцөл

- [ ] Push зөвхөн **чат**-д (listing/status push одоогоор байхгүй)  
- [ ] EAS build (Expo Go Android — найдвартай биш)  
- [ ] `functions/index.js` deploy хийгдсэн эсэх  
- [ ] `WORKFLOW_AUTH.md` — login дараа token бүртгэл  

---

## Архитектур

```
Mobile login
  → PushNotificationBootstrap
  → registerPushTokenForUid(uid)
  → Firestore user_push_tokens/{uid}/devices/{tokenId}

Web/Mobile: messages/ шинэ doc
  → Cloud Function onChatMessageCreatedPush (asia-northeast3)
  → users.email → receiver uid
  → load Expo tokens
  → POST exp.host/--/api/v2/push/send
  → Mobile: chatPushNotifications.js (tap → Chat)
```

---

## Гол файлууд

| Файл | Үүрэг |
|------|--------|
| `mobile/src/components/PushNotificationBootstrap.js` | Login дараа token бүртгэх |
| `mobile/src/services/pushTokenService.js` | Permission, `getExpoPushTokenAsync`, Firestore write |
| `mobile/src/utils/chatPushNotifications.js` | Foreground + tap navigation |
| `functions/index.js` | `onChatMessageCreatedPush` |
| `firestore.rules` | `user_push_tokens/{uid}/devices` |
| `mobile/app.json` | `expo-notifications`, channel `chat`, `UIBackgroundModes` |
| `mobile/eas.json` | production build profiles |

**EAS projectId:** `app.json` → `extra.eas.projectId` (`96d89595-cf78-48c8-9695-5c2cc7af53f4`)

---

## Credentials (нэр л)

| Platform | Шаардлага |
|----------|-----------|
| Android app | `GOOGLE_SERVICES_JSON` (EAS file env) эсвэл local `google-services.json` |
| Android delivery | **FCM V1** service account JSON on Expo (`eas credentials`) |
| iOS app | `GOOGLE_SERVICE_INFO_PLIST` |
| iOS delivery | APNs key (EAS credentials) |

`google-services.json` ≠ FCM V1 on Expo — **хоёуланг нь** тохируулна.

---

## Өөрчлөлтийн алхмууд

### 1. Scope gate

| Асуулт | Хариулт |
|--------|---------|
| Зөвхөн UI/badge? | Push function хөндөхгүй |
| Шинэ notification төрөл? | Function payload + mobile handler + store listing шалгах |
| Web push? | Одоогоор scope-д ороогүй — mobile only |

### 2. Token registration

- `registerPushTokenForUid` — `ExponentPushToken[...]` format  
- Doc path: `user_push_tokens/{uid}/devices/{pushTokenDocId(token)}`  
- Logout: `unregisterCurrentPushToken`  
- Expo Go Android: `isExpoGoAndroid()` → skip

### 3. Cloud Function

- Trigger: `messages/{messageId}` onCreate  
- `receiver_email` → `findUidByEmail` → `users` where `email ==`  
- Channel: `chat`, `data.type: chat`, `conversation_id`, `other_user_email`  
- Stale token: `pruneInvalidTokens` (`DeviceNotRegistered`, `InvalidCredentials`)

Function өөрчлөвөл:

```bash
cd functions && npm install && cd ..
firebase deploy --only functions
```

### 4. Mobile notification handler

- `setupChatPushNotificationHandlers()` — `navigateToChatFromNotificationData`  
- Params: `other_user_email`, `conversation_id` (Chat screen-тай тааруул)

### 5. Rules

- `user_push_tokens`: зөвхөн `request.auth.uid == userId`  
- Deploy: `firebase deploy --only firestore:rules`

---

## Тест checklist

| # | Шалгах |
|---|--------|
| 1 | EAS production/dev build (Expo Go биш) |
| 2 | Login → Firestore `user_push_tokens/{uid}/devices/*` үүссэн |
| 3 | User A → B рүү чат (web эсвэл mobile) |
| 4 | B app background/killed → push ирнэ |
| 5 | Tap → Chat screen, зөв хэрэглэгч |
| 6 | Logout → device doc устсан |
| 7 | Android: FCM V1 байхгүй бол silent — Expo credentials шалгах |
| 8 | iOS: APNs + permission |

QA: `qa/push-notification-tests.md`  
Expo Push Tool: token-оор шууд туршилт.

---

## Deploy дараалал

1. `firebase deploy --only firestore:rules,functions`  
2. EAS: `EXPO_PUBLIC_FIREBASE_*` + google services files  
3. `eas credentials` — FCM V1 (Android)  
4. `eas build --profile production`  
5. Device: logout → login (шинэ token)  
6. End-to-end чат туршилт  

---

## Troubleshooting (товч)

| Шинж | Шалгах |
|------|--------|
| Token байхгүй | Permission, `projectId`, `google-services.json` in build |
| Token байгаа, push байхгүй | Function deploy, receiver `users.email` |
| iOS OK, Android чимээгүй | FCM V1 on Expo |
| `InvalidCredentials` | FCM JSON дахин upload, rebuild |
| `DeviceNotRegistered` | Re-login; function auto-prune |

Дэлгэрэнгүй: `docs/TROUBLESHOOTING.md` §6, `mobile/docs/CHAT_PUSH_SETUP.md`

---

## Зогсох ёстой нөхцөл

- Expo Go Android дээр push «засварласан» гэж тайлагнах  
- Store listing-д push тухай бичих (хэрэв feature бүрэн биш)  
- Function deployгүй зөвхөн client өөрчлөх  
- `messages` schema-аас `receiver_email` хасах  
- Push token-ийг өөр хэрэглэгчийн `uid` дор бичих (rules зөрчил)

---

## Холбоотой

- `WORKFLOW_CHAT.md` — мессеж үүсгэх урсгал  
- `WORKFLOW_AUTH.md` — login/session  
- `mobile/docs/EAS_PRODUCTION_ENV.md`  
- `docs/DEPLOYMENT.md` — EAS + Firebase deploy
