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
| Images | `src/services/storageService.js`, `storagePaths.js` | `storageService.native.js` / `.web.js`, `storagePaths.js` | Firebase Storage |
| Market filter | `src/utils/listingCountry.js` | `mobile/src/utils/listingCountry.js` | `api/regions.php` |
| Country/region | `src/config/country.js`, `regions/` | `mobile/src/config/country.js`, `regions/` | `api/regions.php` |
| Constants | `src/constants/listings.js` | `mobile/src/constants/listings.js` (sync) | — |
| Saved | `src/api/entities.js` → `SavedListing` | `savedListingService.js` | Firestore `saved_listings` |
| Admin | Admin pages + `adminRoles.js` | Admin screens + `adminRoles.js` | `get_app_admin_scope` / `admin_can_moderate_listing` |
| Auto-approve | `appConfigService.js` | `appConfigService.js` | Firestore `config/app` |

**API base:** `VITE_API_BASE_URL` / `EXPO_PUBLIC_API_BASE_URL` (default `https://api.zarkorea.com/index.php`)

---

## Өгөгдлийн урсгал

### Унших (Home / filter)

```
Home.jsx → entities.Listing.filter / list
  → listingService.filterListings / listListings
  → GET api/index.php?action=listings&status=active&country_code=KR|US&...
  → MySQL + api/regions.php filters
  → client filterListingsForMarket (listingCountry.js)
  → normalizeListing (id string, images array)
```

**KR isolation (хоёр давхарга):**

| Давхарга | Функц | Зан төлөв |
|----------|-------|-----------|
| API | `append_kr_listing_read_filter` | Зөвхөн KR / legacy NULL `country_code`; `US`/`JP` болон `region_code`тай мөрийг хасна |
| Client | `filterListingsForMarket` | Ижил дүрэм — mis-tagged US regional мөр KR feed-д орохгүй |

**US reads:** `country_code=US` → default `region_code=washington-dc` (server-side). Client-only filter-д бүү найд.

**Detail by id:** `GET action=listing&id=` is public then
`enforce_us_listing_row_visible` — US rows outside active `washington-dc` 404.
Feed isolation (`GET listings`) and detail visibility are separate. Views+1
PATCH is public and does not re-run that helper.

Mis-tagged rows: `api/sql/fix_us_listings_country_code.sql` (ops; production run = explicit approval).

### Үүсгэх

```
CreateListing.jsx
  → resolveRouteCountryCode (URL-only — localStorage биш)
     Unprefixed `/CreateListing` → null → KR. US writes need `/us/CreateListing`.
  → image upload → Storage (country-aware path)
  → entities.Listing.create
  → listingService.createListing (POST + Bearer token)
  → enforce_us_listing_write_region (US → washington-dc, DC/VA/MD)
  → MySQL insert
  → [optional] getListingAutoApprove() → status active/pending
```

### Зураг

- Client compression: `createImageVariants` / `imageCompressor`
- Storage paths: `listings/{kr|us|jp}/{year}/{listingId}/…` (`storagePaths.js`); legacy `images/` still valid
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
- Admin: PHP `APP_ADMIN_UIDS` → MySQL `firebase_uid` → legacy `email`; roles `super_admin` / `country_admin` / `region_admin` (`admin_can_moderate_listing`)
- Write country: `resolveRouteCountryCode()` — URL path only
- `parseMysqlListingId` — зөвхөн positive integer MySQL ID
- Promotions: non-admin `featured`/`vip` (and promo expiry extend) → 403
  (`enforce_listing_promotion_privileges`). Use `AdminAllListings`.
- Banners: `/RequestBannerAd` is unprefixed (`useActiveCountry` may follow
  localStorage). Approve currently creates `banner_ads` without `country_code`
  (Home treats that as KR). Set market on `AdminBanners`.

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
- Admin pages: status өөрчлөх → API PATCH (scope-д багтсан listing л)
- US admin back-link: `useMarketHomePath` → `/us` (KR root `/` руу бүү унагаа)

---

## Тест checklist

| # | Шалгах |
|---|--------|
| 1 | `GET ?action=health` → `ok: true` |
| 2 | KR Home — US/JP/`region_code`тай зар **харагдахгүй** |
| 3 | `/us` Home — зөвхөн US `washington-dc` |
| 4 | Категори/шүүлт (market scope-той) |
| 5 | Зар үүсгэх (зурагтай), My Listings дээр гарна |
| 6 | ListingDetail — view count нэмэгдэнэ |
| 7 | Хадгалах (saved_listings) |
| 8 | Засах / устгах — зөвхөн эзэн |
| 9 | Scoped admin approve (region/country) — scope-оос гадуур 403 |
| 10 | Non-admin cannot self-assign VIP/featured |
| 11 | US listing outside washington-dc → detail 404 |
| 12 | Mobile — ижил зар ID-аар detail нээгдэнэ |

QA: `qa/image-upload-tests.md`, `qa/web-regression-tests.md`, `qa/mobile-regression-tests.md`

---

## Deploy

| Өөрчлөлт | Deploy |
|----------|--------|
| Web UI/service | Vercel |
| Mobile | EAS build |
| `api/index.php` / `regions.php`, SQL | `docs/ZARUSA_STAGING_DEPLOY.md` — `deploy:zarusa-api` / `:ftp` эсвэл `package:zarusa-api` |
| Storage rules | `firebase deploy --only storage` |
| Constants only | Web Vercel + mobile rebuild after sync |

**Анхаар:** `firestore.indexes.json` дахь `listings` индексүүд legacy query-д; шинэ зарын feature-д MySQL index л хэрэгтэй байж болно.

---

## Зогсох ёстой нөхцөл

- Шинэ зарыг Firestore руу шилжүүлэх (одоогийн архитектур MySQL)
- `VITE_API_BASE_URL` / production API-г кодонд hardcode хийх
- Категори зөвхөн mobile дээр засах (`sync-listings` алгасах)
- `customer_id` / `firebase_uid` sync эвдэх (`user_sync` flow)
- Write country-г `localStorage` preference-ээс авах (`resolveRouteCountryCode` л)
- KR feed-д client-only шүүлтээр найдах (API `append_kr_listing_read_filter` заавал)

---

## Холбоотой

- `WORKFLOW_AUTH.md` — Bearer token, `user_sync`, `customerId`
- `summaries/api_summary.md` — PHP action жагсаалт
- `docs/DEPLOYMENT.md` — API hosting
- Root `TESTING_FLOW.md` — гараар regression
