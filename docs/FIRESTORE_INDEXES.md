# Firestore Indexes

## Source of truth

Энэ файл нь `firestore.indexes.json`-ийн тайлбар. Индекс нэмэх/устгахдаа
эхлээд `firestore.indexes.json`-ийг өөрчлөөд, дараа нь энэ хүснэгтийг
шинэчилнэ.

> Анхаарах зүйл: web/mobile listings одоо PHP/MySQL API (`api/index.php`) ашигладаг.
> `listings` collection-ийн индексүүд нь legacy/fallback Firestore query болон
> шилжилтийн кодод үлдсэн тул устгахаас өмнө source usage-ийг шалгана.

## Required composite indexes

| Collection group | Fields | Хэрэглээ |
|------------------|--------|----------|
| `banner_ads` | `is_active` ASC, `order` ASC, `__name__` ASC | Home дээр active banner-уудыг дарааллаар авах (`bannerService.filterBannerAds`). |
| `banner_requests` | `created_by` ASC, `created_date` DESC, `__name__` DESC | Хэрэглэгчийн banner request history/admin filter. |
| `conversations` | `participant_1` ASC, `last_message_date` DESC, `__name__` DESC | Legacy email participant chat inbox query. |
| `conversations` | `participant_2` ASC, `last_message_date` DESC, `__name__` DESC | Legacy email participant chat inbox query. |
| `conversations` | `participant_uids` ARRAY_CONTAINS, `last_message_date` DESC, `__name__` DESC | Phone OTP / uid-aware chat inbox query. |
| `listings` | `category` ASC, `status` ASC, `created_date` DESC, `__name__` DESC | Legacy/category Firestore listing query fallback. |
| `listings` | `created_by` ASC, `created_date` DESC, `__name__` DESC | Legacy "my listings" Firestore query fallback. |
| `listings` | `listing_type` ASC, `status` ASC, `created_date` DESC, `__name__` DESC | Legacy VIP/featured listing query fallback. |
| `listings` | `status` ASC, `created_date` DESC, `__name__` DESC | Legacy active listing query fallback. |
| `messages` | `conversation_id` ASC, `created_date` DESC, `__name__` DESC | Chat thread message list. |
| `saved_listings` | `created_by` ASC, `created_date` DESC, `__name__` DESC | Saved listings list by owner. |

## Deploy заавар

```bash
firebase deploy --only firestore:indexes
```

Алдаа гарвал Firebase Console -> Firestore -> Indexes дээр гарсан холбоосоор
индекс үүсгэж болно. Гэхдээ Console-оор үүсгэсэн өөрчлөлтийг дараа нь
`firestore.indexes.json`-д буцааж sync хийнэ.

## Change checklist

- [ ] Query source verified in `src/services/`, `mobile/src/services/`, or
      `firestore.rules`.
- [ ] `firestore.indexes.json` updated first.
- [ ] This doc updated with collection, fields, and usage.
- [ ] Index deploy command run against the intended Firebase project.
