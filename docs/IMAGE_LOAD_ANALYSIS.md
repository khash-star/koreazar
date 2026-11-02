# Зургийн ачааллын зам

Home дээрх зураг Firestore `getDocs()` дуустал хүлээдэггүй. Зар MySQL API-аас, баннер Firestore-оос ирнэ. URL ирсний дараа л Storage татагдана.

## Critical path

```
1. index.html + Vite bundle
2. Home mount, useMarketPageMeta (title/icons; canonical-ийг өөрчлөхгүй)
3. Зэрэг:
   - Баннер: BannerAd.filter({ is_active: true }) → Firestore banner_ads
   - Зар: Listing.filter(..., 100) → PHP GET action=listings
4. Client: filterListingsForMarket, promo expiry, VIP эрэмбэ
5. URL → Firebase Storage (эсвэл legacy images/ URL)
```

**Саатуулагч:** эхний зургийн URL нь API/Firestore хариунаас өмнө мэдэгдэхгүй. `index.html` `firebasestorage.googleapis.com`, `firestore.googleapis.com`, `firebaseinstallations.googleapis.com` руу preconnect хийнэ. Listings host (`api.zarkorea.com`) preconnect-д байхгүй.

## Кэш

| Өгөгдөл | staleTime | Эх сурвалж |
|---------|-----------|------------|
| QueryClient default | 3 мин | `src/App.jsx` |
| Home баннер | 30 мин (`gcTime` 60 мин, focus/reconnect refetch байхгүй) | `src/pages/Home.jsx` |
| Home зарууд | default 3 мин (тусдаа staleTime байхгүй) | `Home.jsx` `useQuery` |

## Home feed цонх

`api/index.php` `ORDER BY created_at DESC`, `limit` 1–100 (default 50). Web Home **100**, mobile Home **50** (`getLatestListings(50)`). VIP эрэмбэ (`vip` → `featured` → `regular`, дараа нь `created_date`) client дээр. Цонхноос гадуурх хуучин VIP Home-д гарахгүй. Web search болон min/max үнэ энэ цонхон дотор л шүүнэ.

`listing_type_expires` өнгөрсөн бол client харагдах `listing_type`-ийг `regular` болгоно. MySQL руу буцааж бичихгүй.

Баннер: `entities.BannerAd.filter` нь `is_active` байхад `_orderBy`-г хэрэглэхгүй. `filterBannerAds` үргэлж `order` **ASC**. Home-ийн `'-order'` аргумент эрэмбэд нөлөөлөхгүй.

## Listing зураг

Web upload (`createImageVariants` in `src/components/utils/imageCompressor.jsx`):

- Зөвхөн WebP. `canvas.toBlob(..., 'image/webp')` амжилтгүй бол reject — JPEG/PNG fallback байхгүй.
- 3:2 төв crop, дараа нь resize: `w800` (q 0.78), `w640` (0.76), `w400` (0.75), `w150` (0.72).
- MySQL `images[]` объект: `{ w800, w640, w400, w150 }`.
- Хязгаар: 10 зураг, файл 5MB (`src/utils/limits.js`).

Унших (`src/utils/imageUrl.js`, mobile mirror):

- `getListingImageUrl` variant хоосон бол дараагийн хэмжээнд унана (`w800` → `w640` → `w400` → `w150`).
- String URL (legacy) srcset үүсгэхгүй.
- Home карт: `w400` + srcset `400w/640w/800w`, `sizes` 312px / 350px. Эхний 2 карт `loading="eager"` (`isAboveFold={index < 2}`). `w150` нь blur placeholder.
- LCP: эхний баннерын `image_url`, эсвэл байхгүй бол эхний зарын `w400`-ийг `<link rel="preload">` хийнэ.

Mobile create (`mobile/src/screens/CreateListingScreen.js`) нэг upload хийж **дөрвөн түлхүүрт ижил URL** бичнэ (`quality: 0.85`). Web srcset тэр зар дээр жижиг variant сонгохгүй.

## Баннер зураг

`compressImage` — WebP, aspect crop биш, max box:

| Дуудлага | Хэмжээ | Quality |
|----------|--------|---------|
| `AdminBanners.jsx` | 1200×600 | 0.8 |
| `RequestBannerAd.jsx` | 800×400 | 0.82 |
| Default | 1000×1000 | 0.75 |

Storage зам: `docs/ARCHITECTURE.md` image pipeline.
