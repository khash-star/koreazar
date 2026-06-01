# Firestore Indexes

## Overview

Эдгээр индексүүд `firestore.indexes.json` дээр тодорхойлогдсон. Firebase Console эсвэл `firebase deploy --only firestore:indexes` ашиглан deploy хийнэ.

Current production data is hybrid:

- **Listings:** primary web/mobile reads and writes use the PHP MySQL API (`api/index.php?action=listings|listing`).
- **Firestore:** still stores banners, chat, saved-listing pointers, users, feedback/reports, and push-token state.

See `docs/DATA_ARCHITECTURE.md` for the source-of-truth data split.

## Active Firestore indexes

### Banners

| Collection | Query | Fields | Хэрэглээ |
|------------|-------|--------|----------|
| `banner_ads` | active/order filter | `is_active` ASC, `order` ASC, `__name__` ASC | Active banner ordering. |
| `banner_requests` | creator history | `created_by` ASC, `created_date` DESC, `__name__` DESC | User/admin banner request lists. |

### Chat

| Collection | Query | Fields | Хэрэглээ |
|------------|-------|--------|----------|
| `conversations` | participant 1 inbox | `participant_1` ASC, `last_message_date` DESC, `__name__` DESC | Legacy email participant query. |
| `conversations` | participant 2 inbox | `participant_2` ASC, `last_message_date` DESC, `__name__` DESC | Legacy email participant query. |
| `conversations` | UID inbox | `participant_uids` ARRAY_CONTAINS, `last_message_date` DESC, `__name__` DESC | Phone OTP and UID-based conversation visibility. |
| `messages` | conversation messages | `conversation_id` ASC, `created_date` DESC, `__name__` DESC | Chat message history. |

### Saved listings

| Collection | Query | Fields | Хэрэглээ |
|------------|-------|--------|----------|
| `saved_listings` | saved list by user | `created_by` ASC, `created_date` DESC, `__name__` DESC | Web saved-listing history. Mobile currently sorts client-side after filtering by `created_by`. |

## Legacy / migration indexes

`firestore.indexes.json` still includes `listings` indexes:

| Query | Fields | Status |
|-------|--------|--------|
| `category` + `status` + `created_date` | `category` ASC, `status` ASC, `created_date` DESC, `__name__` DESC | Legacy Firestore listing path; primary clients now use MySQL. |
| `created_by` + `created_date` | `created_by` ASC, `created_date` DESC, `__name__` DESC | Legacy "My listings" path; primary clients now use MySQL `created_by` / `firebase_uid` filters. |
| `listing_type` + `status` + `created_date` | `listing_type` ASC, `status` ASC, `created_date` DESC, `__name__` DESC | Legacy promoted listing path. |
| `status` + `created_date` | `status` ASC, `created_date` DESC, `__name__` DESC | Legacy active listing path. |

Do not remove these indexes during documentation-only maintenance. Remove or
replace them only as part of an explicit data migration/cleanup task.

## Deploy заавар

```bash
# Firebase CLI суулгасан бол
firebase deploy --only firestore:indexes
```

Алдаа гарвал Firebase Console → Firestore → Indexes дээр гарсан холбоос дараад индекс үүсгэнэ үү.
