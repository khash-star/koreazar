# Mobile chat architecture

This document is the mobile-specific reference for messages in the Expo app. The
root `MESSAGE_SYSTEM_ARCHITECTURE.md` remains useful for the web React flow, but
mobile has extra identity, push, and platform constraints.

## Runtime surfaces

| Layer | Files | Notes |
|-------|-------|-------|
| Screens | `mobile/src/screens/MessagesScreen.js`, `mobile/src/screens/ChatScreen.js` | Messages list refreshes on focus, foreground resume, explicit refresh events, and a 12s active-app interval. Chat refreshes on focus/foreground and a 10s active-app interval. |
| Service | `mobile/src/services/conversationService.js` | Owns Firestore reads/writes for `conversations` and `messages`, participant repair, unread counts, and admin broadcast. |
| Auth bridge | `mobile/src/services/authService.js`, `mobile/src/utils/emailNormalize.js` | Phone OTP users use a synthetic email such as `phone_821012345678@phone.zarkorea.com`; KR `+82` variants are treated as the same user. |
| Push | `mobile/src/components/PushNotificationBootstrap.js`, `mobile/src/services/pushTokenService.js`, `mobile/src/utils/chatPushNotifications.js`, `functions/index.js` | Registers Expo tokens under `user_push_tokens/{uid}/devices/{tokenId}` and opens Chat from notification payloads. |
| Firestore access | `firestore.rules`, `firestore.indexes.json` | Conversation reads are allowed by `participant_uids` or matching normalized participant email. |

## Conversation identity model

Mobile conversations keep both email fields and UID membership:

```js
{
  participant_1: "seller@example.com",
  participant_2: "phone_821012345678@phone.zarkorea.com",
  participant_uids: ["sellerFirebaseUid", "phoneUserFirebaseUid"],
  last_message: "Сайн уу!",
  last_message_sender: "seller@example.com",
  unread_count_p1: 0,
  unread_count_p2: 1,
  created_date: Timestamp,
  last_message_date: Timestamp
}
```

Why both fields exist:

- `participant_1` / `participant_2` preserve the original web conversation shape
  and support legacy email queries.
- `participant_uids` lets phone OTP users see conversations even when their
  Firebase Auth token has no email claim.
- `authService.ensureUserDocEmailForFirestoreRules()` writes `users/{uid}.email`
  before chat queries so `firestore.rules` can fall back through `authEmailLower()`.

Do not remove email-based fields until web and all historical conversations are
migrated.

## Listing and opening conversations

`listConversationsForCurrentUser()` is the mobile entry point for the Messages
tab:

1. Resolve the current chat email with `resolveChatParticipantEmail()`.
2. Ensure `users/{uid}.email` is written for Firestore rules.
3. Query `conversations` by `participant_uids array-contains uid`.
4. Fall back to `participant_1` / `participant_2` email queries, including phone
   email variants.
5. Call `repairConversationParticipants()` on returned rows so old threads gain
   the current UID and canonical phone email variant.

`ChatScreen` also repairs a loaded conversation before rendering/sending. This is
important when a push notification opens a legacy conversation directly before it
has appeared in the Messages list.

## Sending messages

Mobile send flow in `ChatScreen.handleSend()`:

1. Block empty text and re-entry with `sending` plus `sendingRef`.
2. Create a message with `createMessage()`.
3. Update conversation metadata with `updateConversationAfterMessage()`.
4. Clear the draft, refresh messages, and notify unread badge/list refresh hooks.

Mobile `createMessage()` uses `setDoc()` on a generated message document and
tolerates Firestore `already-exists` errors. This keeps rapid taps or retry races
from surfacing duplicate-send failures to the user. Web still uses its own
`src/services/conversationService.js` path, so do not assume mobile idempotency is
available on web.

## Admin broadcast and replies

Mobile admin broadcast uses `sendMessageToAllUsers()` from
`mobile/src/services/conversationService.js`. For every target user it:

1. Finds or creates the admin/user conversation.
2. Calls `repairConversationParticipants()` with admin and receiver UIDs.
3. Creates the message with `skipBannedCheck: true`.
4. Updates unread counts and `participant_uids` through
   `updateConversationAfterMessage()`.

Replies use the normal Messages tab -> Chat route. Admin rows are labeled `АДМИН`
in `MessagesScreen` when the other participant matches `getAdminEmail()`.

## Push integration

Chat push is implemented for EAS builds:

- `PushNotificationBootstrap` registers/re-registers Expo push tokens after login
  and when the app returns to the foreground.
- `functions/index.js` handles `messages/{messageId}` creates in
  `asia-northeast3`, resolves `receiver_email` to `users/{uid}.email`, and sends
  Expo payloads with `type: "chat"`, `conversation_id`, and `other_user_email`.
- Notification taps route to Chat. If the thread opens but does not later appear
  in the list, check `participant_uids` and run the legacy backfill below.

See `mobile/docs/CHAT_PUSH_SETUP.md` for deployment and troubleshooting.

## Platform UX constraints

| Platform | Chat input behavior |
|----------|---------------------|
| iOS | `KeyboardAvoidingView` uses `behavior="padding"` and `keyboardVerticalOffset={headerHeight}`. The send button is a text `TouchableOpacity` with `hitSlop` and `minWidth: 88` for reliable taps. |
| Android | `KeyboardAvoidingView` uses `behavior="height"`. The input row has Android `elevation` so the send/delete controls remain tappable. |
| Expo web | Uses the same React Native `KeyboardAvoidingView` padding path and blurs the active element when leaving Chat/Messages. There is no custom `VisualViewport` handling yet. |

## Operations: legacy conversation backfill

Recent clients repair conversations opportunistically, but production data created
before `participant_uids` may need a one-time backfill:

```bash
cd functions
node scripts/backfill-conversation-participant-uids.js --dry-run
node scripts/backfill-conversation-participant-uids.js
```

Run this with Admin SDK credentials for the production Firebase project. Use
`--dry-run` first and deploy `firestore.indexes.json` before relying on ordered
`participant_uids` queries.

## Smoke tests after chat changes

- Email user -> phone OTP user: send from web and mobile; phone user sees the
  thread in Messages and can reply.
- Phone OTP user -> email user: send twice quickly; only one send is processed
  and the input recovers.
- Admin broadcast -> phone OTP user: push arrives, tap opens Chat, and the thread
  remains visible in Messages after returning.
- iOS physical device: keyboard open, tap `Илгээх`; button remains tappable.
- Android physical device: keyboard open, send/delete controls remain above the
  keyboard.
