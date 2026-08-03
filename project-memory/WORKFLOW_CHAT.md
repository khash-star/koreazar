# Workflow: Chat (Мессеж систем)

> **Хэзээ ашиглах:** `conversations` / `messages`, `/Messages`, `/Chat`, mobile Messages/Chat, admin broadcast, чаттай холбоотой rules/index өөрчлөлт.  
> **Каноник баримт:** `docs/CHAT_SYSTEM.md` · `docs/FIRESTORE_SCHEMA.md` · `docs/TROUBLESHOOTING.md`  
> **Ерөнхий дараалал:** `AGENT_TASK_WORKFLOW.md` → энэ playbook

---

## Урьдчилсан нөхцөл

- [ ] `docs/CHAT_SYSTEM.md` уншсан  
- [ ] `docs/FIRESTORE_SCHEMA.md` — `conversations`, `messages` талбарууд  
- [ ] `CODING_SAFETY_CHECKLIST.md`  
- [ ] Web + mobile аль платформд өөрчлөлт орж байгааг тодорхойлсон  

---

## Гол файлууд

| Давхарга | Web | Mobile |
|----------|-----|--------|
| UI | `src/pages/Messages.jsx`, `src/pages/Chat.jsx`, `src/pages/ListingDetail.jsx` | `mobile/src/screens/MessagesScreen.js`, `ChatScreen.js` |
| Service | `src/services/conversationService.js` | `mobile/src/services/conversationService.js` |
| Entity | `src/api/entities.js` (`Conversation`, `Message`) | Шууд service дуудлага |
| Rules | `firestore.rules` — `conversations`, `messages` | Ижил |
| Indexes | `firestore.indexes.json` (3× conversations, 1× messages) | Ижил |
| Push (mobile) | — | `mobile/src/services/pushTokenService.js`, `chatPushNotifications.js`, `PushNotificationBootstrap.js` |
| Cloud Function | `functions/index.js` → `onChatMessageCreatedPush` | Ижил |

---

## Өгөгдлийн урсгал (өөрчлөлт хийхээс өмнө)

```
ListingDetail / Messages → Chat UI
  → conversationService (find/create conversation)
  → Firestore conversations/
  → createMessage → Firestore messages/
  → updateConversation (last_message, unread_count_*)
  → [mobile] onChatMessageCreatedPush → Expo Push API
```

**Чухал:** Оролцогчийг **имэйл** (`participant_1/2`) болон **UID** (`participant_uids`) хоёуланд нь шийднэ. Утасны OTP: `resolveAuthEmail` / `resolveChatParticipantEmail()` + `users/{uid}.email` заавал. Mark-read болон participant match — `areEmailVariants` (KR `82` / US `1` prefix parity).

---

## Өөрчлөлтийн алхмууд

### 1. Scope тодорхойлох

| Асуулт | Сонголт |
|--------|---------|
| Зөвхөн UI? | Pages/screens, polling interval, scroll behavior |
| Мессежийн schema? | `conversationService` + rules + indexes |
| Push? | `WORKFLOW_PUSH.md` руу шилжүүлнэ |
| Admin broadcast? | `sendMessageToAllUsers()` — super/app admin only |

### 2. Service layer

- Логикийг `conversationService.js` дотор үлдээнэ; page-д Firestore шууд бүү дууда.  
- Имэйл: `@/utils/emailNormalize` — `normalizeEmail`, `phoneToAuthEmail`, `emailQueryVariants`, `areEmailVariants`, `resolveAuthEmail`.  
- Web UI identity: `AuthContext.authEmail` (token.email хоосон үед profile/phone).  
- Хориглосон үг: `checkBannedContent` (`createMessage` дотор). Admin broadcast-д `skipBannedCheck` зөвхөн дотоод урсгалд.  
- Web/mobile хоёуланд ижил зан төлөв — mobile service-ийг тусад нь шинэчилнэ.

### 3. Firestore rules (хэрэв хүрэлцэх)

- `isConversationParticipant()` — `participant_uids` эсвэл `authEmailLower()`  
- `isMessageSenderOrReceiver()` — `sender_email` / `receiver_email`  
- Admin: scoped helpers (`isSuperAdmin` / app-admin) — binary `role==admin` биш  
- Deploy: `firebase deploy --only firestore:rules` (хэрэглэгчийн зөвшөөрөлтэй)

### 4. Indexes (шинэ query нэмвэл)

`firestore.indexes.json` + `docs/FIRESTORE_INDEXES.md` синк.  
Deploy: `firebase deploy --only firestore:indexes`

### 5. UI / polling / layout

- Web `Chat.jsx`: `refetchInterval` (~3s) — `limits.js` `MESSAGES_REFRESH_INTERVAL` (5s)-тай зөрчилдөхгүй шалгах.  
- Scroll: зөвхөн **нээхэд** болон **өөрийн send**-ийн дараа доош — poll/refetch дунд jump бүү хий.  
- `Layout.jsx`: Chat дээр bottom nav нууна; Chat + Messages дээр footer нууна (`hideFooter`).  
- Unread: `unread_count_p1` / `unread_count_p2` — хоёр талын логикийг хамтад нь шинэчил; mark-read `areEmailVariants` ашиглана.

### 6. Mobile parity

- Navigation: `mobile/src/utils/navigationHelpers.js` → `navigateToMessagesChat`  
- Push tap: `chatPushNotifications.js` → `Chat` screen + `other_user_email`  
- Phone variant parity web-тэй ижил (`emailNormalize`)

---

## Тест checklist

| # | Шалгах |
|---|--------|
| 1 | Имэйл хэрэглэгч A → B рүү мессеж (`/Chat`) |
| 2 | Утас OTP хэрэглэгч чат нээж, мессеж илгээнэ / mark-read |
| 3 | US `+1` vs KR `+82` synthetic variant — thread олдоно |
| 4 | `/Messages` жагсаалт, unread тоо |
| 5 | ListingDetail → «Мессеж илгээх» |
| 6 | `permission-denied` гарахгүй (`users/{uid}.email` байгаа) |
| 7 | Chat нээхэд доош scroll; poll үед jumpгүй |
| 8 | Mobile: ижил thread хоёр талд харагдана |
| 9 | Push (хэрэв scope-д орсон): `WORKFLOW_PUSH.md` |

QA: `qa/push-notification-tests.md` (push орсон үед).

---

## Deploy

| Өөрчлөлт | Deploy |
|----------|--------|
| Web/mobile JS only | Vercel (web) / EAS (mobile) |
| `firestore.rules` | `firebase deploy --only firestore:rules` |
| `firestore.indexes.json` | `firebase deploy --only firestore:indexes` |
| `functions/index.js` (push) | `firebase deploy --only functions` |

---

## Зогсох ёстой нөхцөл

- Rules/index deploy хэрэглэгч зөвшөөрөөгүй  
- Participant-ийг зөвхөн имэйлээр шийдэж UID/утасны хэрэглэгчийг орхих  
- Phone identity-д raw `===` (variant алдах)  
- Message schema өөрчилж Cloud Function (`receiver_email`) эвдэх  
- Poll/refetch бүрт auto-scroll (mobile jump)  
- `MESSAGE_SYSTEM_ARCHITECTURE.md` (root) зөвхөн лавлагаа — **код давуу эрхтэй**

---

## Холбоотой

- `WORKFLOW_PUSH.md` — Expo token, FCM, Cloud Function  
- `WORKFLOW_AUTH.md` — `resolveChatParticipantEmail`, phone synthetic email  
- `workflows/firebase-change.md` — ерөнхий Firebase өөрчлөлт  
- `docs/TROUBLESHOOTING.md` § Firestore permission, § Push
