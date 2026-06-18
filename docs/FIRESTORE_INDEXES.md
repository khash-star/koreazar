# Firestore Indexes

## Шаардлагатай индексүүд

Эдгээр индексүүд `firestore.indexes.json` дээр тодорхойлогдсон. Firebase Console эсвэл `firebase deploy --only firestore:indexes` ашиглан deploy хийнэ.

### Listings collection

| Query | Fields | Хэрэглээ |
|-------|--------|----------|
| `status` + `created_date` | status ASC, created_date DESC | Home хуудас - идэвхтэй зарууд |
| `created_by` + `created_date` | created_by ASC, created_date DESC | Миний зарууд |
| `status` + `category` + `created_date` | status ASC, category ASC, created_date DESC | Категориар шүүсэн зарууд |

### Conversations collection

Чат нь web болон mobile дээр ижил `conversations` collection ашиглана. Mobile
phone OTP хэрэглэгчдийн жагсаалт `participant_uids` дээр тулгуурладаг; хуучин
имэйл query-үүд хэвээр байгаа тул дараах индексүүдийг бүгдийг deploy хийнэ.

| Query | Fields | Хэрэглээ |
|-------|--------|----------|
| `participant_1` + `last_message_date` | participant_1 ASC, last_message_date DESC | Legacy/web conversation жагсаалт, нэг талын имэйл query |
| `participant_2` + `last_message_date` | participant_2 ASC, last_message_date DESC | Legacy/web conversation жагсаалт, нөгөө талын имэйл query |
| `participant_uids` + `last_message_date` | participant_uids ARRAY_CONTAINS, last_message_date DESC | Mobile `listConversationsForCurrentUser()` UID-first query; phone OTP visibility |

`participant_uids` байхгүй хуучин conversation-уудыг засах backfill:

```bash
cd functions
node scripts/backfill-conversation-participant-uids.js --dry-run
node scripts/backfill-conversation-participant-uids.js
```

Дэлгэрэнгүй: `mobile/docs/MOBILE_CHAT.md`, `mobile/docs/CHAT_PUSH_SETUP.md`.

### Deploy заавар

```bash
# Firebase CLI суулгасан бол
firebase deploy --only firestore:indexes
```

Алдаа гарвал Firebase Console → Firestore → Indexes дээр гарсан холбоос дараад индекс үүсгэнэ үү.
