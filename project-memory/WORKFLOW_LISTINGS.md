# Workflow: Listings (Зарын систем)

> **Хэзээ ашиглах:** Зар үүсгэх/засах/харуулах, Home filter, My Listings, Saved, admin moderation, категори/constants, PHP API listings endpoint.  
> **Каноник баримт:** `docs/ARCHITECTURE.md` · `docs/FIRESTORE_SCHEMA.md` (MySQL хэсэг) · `docs/TROUBLESHOOTING.md`  
> **Ерөнхий дараалал:** `AGENT_TASK_WORKFLOW.md` → энэ playbook

---

## Урьдчилсан нөхцөл

- [ ] Зарууд **MySQL + PHP API** дээр байгааг ойлгосон (Firestore `listings` = legacy)  
- [ ] `api/sql/schema.sql` — `listings`, `listing_images`, `users`  
- [ ] `src/services/listingService.js` уншсан  
- [ ] Web/mobile аль аль нь эсэхийг тодорхойлсон  

---

## Гол файлууд

| Давхарга | Web | Mobile | Backend |
|----------|-----|--------|---------|
| List CRUD | `src/services/listingService.js` | `mobile/src/services/listingService.js` | `api/index.php` (`action=listings`, `listing`) |
| Entity wrapper | `src/api/entities.js` → `Listing` | API client | — |
| UI | `Home.jsx`, `ListingDetail.jsx`, `CreateListing.jsx`, `EditListing.jsx`, `MyListings.jsx` | Home, detail, create screens | — |
| Images | `src/services/storageService.js`, `imageCompressor.jsx` | `storageService.native.js` / `.web.js` | Firebase Storage |
| Constants | `src/constants/listings.js` | `mobile/src/constants/listings.js` (sync) | — |
| Saved | `src/api/entities.js` → `SavedListing` | `savedListingService.js` | Firestore `saved_listings` |
| Admin | `AdminNewListings.jsx`, `AdminAllListings.jsx` | Admin screens | PHP local grant + matching Firestore role |
| Auto-approve | `appConfigService.js` | `appConfigService.js` | Firestore `config/app` |

**API base:** `VITE_API_BASE_URL` / `EXPO_PUBLIC_API_BASE_URL` (default `https://api.zarkorea.com/index.php`)

---

## Өгөгдлийн урсгал

### Унших (Home / filter)

```
Home.jsx → entities.Listing.filter / list
  → listingService.filterListings / listListings
  → GET api/index.php?action=listings&status=active&category=...
  → MySQL listings
  → normalizeListing (id string, images array)
```

### Үүсгэх

```
CreateListing.jsx
  → image upload → Storage (storageService)
  → entities.Listing.create
  → listingService.createListing (POST + Bearer token)
  → MySQL insert
  → [optional] getListingAutoApprove() → status active/pending
```

### Зураг

- Client compression: `createImageVariants` / `imageCompressor`  
- Storage paths: `listings/{id}/`, `images/` (`storage.rules`)  
- Limits: `src/utils/limits.js` — 10 зураг, 5MB

---

## Өөрчлөлтийн алхмууд

### 1. Scope

| Асуулт | Заавар |
|--------|--------|
| Зарын талбар нэмэх? | MySQL schema (`api/sql/`) + `api/index.php` + `listingService` + UI form |
| Зөвхөн UI? | Pages/screens; API contract хөндөхгүй |
| Категори/байршил? | `src/constants/listings.js` → `npm run sync-listings` |
| Firestore `listings`? | Зөвхөн legacy/account deletion — шинэ feature бүү тавь |

### 2. API өөрчлөлт

- Bearer token: `getAuthHeaders()` — `auth.currentUser.getIdToken()`  
- View count: зөвхөн `views` bump — authгүй PATCH зөвшөөрнө (`listingService.isViewCountOnlyBump`)  
- Admin: PHP `APP_ADMIN_UIDS`/MySQL local grant болон Firestore exact admin role хоёулаа таарах ёстой
- `parseMysqlListingId` — зөвхөн positive integer MySQL ID

### 3. Web

- React Query cache: `queryClient.invalidateQueries` after create/update  
- SEO: `ListingDetail.jsx` meta title/description  
- Banned content: `checkBannedListingFields` before submit

### 4. Mobile parity

```bash
# repo root
npm run sync-listings
```

Commit `mobile/src/constants/listings.js` before EAS build.

### 5. Saved listings (Firestore)

- Collection: `saved_listings` — `listing_id` (MySQL ID string), `user_uid`, `created_by`  
- Rules: owner by uid or email

### 6. Admin moderation

- `config/app.listingAutoApprove` — шинэ зар шууд `active`  
- Admin pages: status өөрчлөх → API PATCH

---

## Тест checklist

| # | Шалгах |
|---|--------|
| 1 | `GET ?action=health` → `ok: true` |
| 2 | Home — идэвхтэй зарууд харагдана |
| 3 | Категори/shүүлт |
| 4 | Зар үүсгэх (зурагтай), My Listings дээр гарна |
| 5 | ListingDetail — view count нэмэгдэнэ |
| 6 | Хадгалах (saved_listings) |
| 7 | Засах / устгах — зөвхөн эзэн |
| 8 | Admin approve (хэрэв scope-д орсон) |
| 9 | Mobile — ижил зар ID-аар detail нээгдэнэ |

QA: `qa/image-upload-tests.md`, `qa/web-regression-tests.md`, `qa/mobile-regression-tests.md`

---

## Deploy

| Өөрчлөлт | Deploy |
|----------|--------|
| Web UI/service | Vercel |
| Mobile | EAS build |
| `api/index.php`, SQL | PHP сервер (`api.zarkorea.com`) — DB migration гараар |
| Storage rules | `firebase deploy --only storage` |
| Constants only | Web Vercel + mobile rebuild after sync |

**Анхаар:** `firestore.indexes.json` дахь `listings` индексүүд legacy query-д; шинэ зарын feature-д MySQL index л хэрэгтэй байж болно.

---

## Зогсох ёстой нөхцөл

- Шинэ зарыг Firestore руу шилжүүлэх (одоогийн архитектур MySQL)  
- `VITE_API_BASE_URL` / production API-г кодонд hardcode хийх  
- Категори зөвхөн mobile дээр засах (`sync-listings` алгасах)  
- `customer_id` / `firebase_uid` sync эвдэх (`user_sync` flow)

---

## Холбоотой

- `WORKFLOW_AUTH.md` — Bearer token, `user_sync`, `customerId`  
- `summaries/api_summary.md` — PHP action жагсаалт  
- `docs/DEPLOYMENT.md` — API hosting  
- Root `TESTING_FLOW.md` — гараар regression
