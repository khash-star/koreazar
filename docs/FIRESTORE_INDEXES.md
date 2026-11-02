# Firestore Indexes

Эх сурвалж: `firestore.indexes.json`. Deploy: `firebase deploy --only firestore:indexes`.

Home зарууд эдгээр индексээр явахгүй. Идэвхтэй зарууд PHP `GET action=listings` (`api/index.php`). Доорх `listings` индекс нь legacy Firestore `listings` collection-д үлдсэн.

## Одоогийн query-тай таарсан индекс

| Collection | Fields | Хэн дууддаг |
|------------|--------|-------------|
| `banner_ads` | `is_active` ASC, `order` ASC | `filterBannerAds` — `where is_active` + `orderBy('order','asc')` |
| `banner_requests` | `created_by` ASC, `created_date` DESC | `filterBannerRequests({ created_by })` |
| `conversations` | `participant_1` ASC, `last_message_date` DESC | `listConversations`, account deletion |
| `conversations` | `participant_2` ASC, `last_message_date` DESC | мөн |
| `messages` | `conversation_id` ASC, `created_date` DESC | Chat message list, account deletion |
| `saved_listings` | `created_by` ASC, `created_date` DESC | `SavedListing.filter(..., '-created_date')` |
| `listings` | `created_by` ASC, `created_date` DESC | `accountDeletion.js` (web + mobile) — `where created_by` + `orderBy created_date desc` |

`conversations.participant_uids` CONTAINS + `last_message_date` DESC индекс файлд бий. Одоогийн `findConversation` / `getConversation` зөвхөн `array-contains` (orderBy байхгүй).

## Legacy `listings` индекс (Home биш)

`src/` болон `mobile/src/` дээр дараах composite-ийг уншдаг query алга. Account deletion зөвхөн `created_by` + `created_date`-ийг ашиглана.

| Fields | Хуучин тайлбар (бүү ашигла) |
|--------|------------------------------|
| `category` + `status` + `created_date` | «Категориар шүүсэн Home» |
| `listing_type` + `status` + `created_date` | VIP feed |
| `status` + `created_date` | «Идэвхтэй зарууд Home» |

Home хоосон, VIP харагдахгүй, KR/US зөрүүг эдгээр индексээр бүү оношил. `docs/TROUBLESHOOTING.md` болон `docs/IMAGE_LOAD_ANALYSIS.md`.

## Deploy

```bash
firebase deploy --only firestore:indexes
```

Console дээрх index link нь тухайн алдааны query-д л хамаарна. Шинэ `orderBy` нэмэхээс өмнө энэ файл болон `firestore.indexes.json`-ийг хамтад нь шинэчил.
