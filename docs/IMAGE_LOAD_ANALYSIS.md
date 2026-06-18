# Зургийн ачааллын дүн шинжилгээ

## Асуудал

Сайт эхлэхэд зураг удаан харагдана — skeleton удаан үзэгдэнэ.

## Шалтгаан (Critical Path)

```
1. HTML (index.html) татагдана
2. JS bundle (main.jsx + deps) татагдана
3. React mount → Home component render
4. useQuery:
   - bannerAds → Firestore `banner_ads`
   - listings → `entities.Listing.filter()` → PHP/MySQL API `action=listings`
5. ⏳ Firestore + PHP API хариу хүлээх (гол саатал)
6. Data ирсэн → banner + картууд render, <img> элементүүд үүснэ
7. Browser Firebase Storage-аас зургийг татна
8. Зураг харагдана
```

**Гол саатуулагч:** Зурагны URL нь banner/listing өгөгдөл ирсний дараа л
мэдэгдэнэ. Banner URL Firestore-оос, listing image URL PHP/MySQL API-аас
ирдэг тул зураг татах эхлэхээс өмнө data fetch дуусах ёстой.

## Дэд шалтгаанууд

| Шалтгаан | Нөлөө | Тайлбар |
|----------|-------|---------|
| PHP API latency | Өндөр | `api.zarkorea.com/index.php?action=listings`; DNS/TLS/API/DB round-trip |
| Firestore latency | Дунд/өндөр | Banner query `getDocs()`; сүлжээний хурд, бүс нутаг |
| API/Firestore preconnect дутуу | Дунд | `api.zarkorea.com`, `firestore.googleapis.com`, Storage origin-ууд |
| Cache (staleTime) ашиглаагүй/богино | Дунд | Дахин ороход data fetch давтагдана |
| Эхний картын зураг lazy | Бага | Эхний 1–2 карт above-the-fold боловч loading="lazy" |

## Хийсэн сайжруулалт

1. **React Query caching** — Home banner query урт `staleTime` ашиглаж байна;
   listings query-г өөрчлөхдөө cache key/filter behavior-ийг шалгана.
2. **LCP image preload** — Home эхний banner/listing image URL мэдэгдмэгц
   `<link rel="preload" as="image" fetchpriority="high">` нэмдэг.
3. **Эхний 2 карт eager** — above-the-fold картуудын зураг `loading="eager"`
   / high-priority behavior-тэй байх ёстой.
4. **PWA runtime image cache** — `vite-plugin-pwa` Workbox config Firebase
   Storage image URL-уудыг `CacheFirst` strategy-гаар cache хийдэг.

## Source checkpoints

| Concern | Source |
|---------|--------|
| Home data fetch | `src/pages/Home.jsx` |
| Listing API path | `src/api/entities.js`, `src/services/listingService.js`, `api/index.php` |
| Banner Firestore path | `src/services/bannerService.js` |
| Image URL shaping | `src/utils/imageUrl.js` |
| PWA image runtime cache | `vite.config.js` |

## Хийх боломжтой (нэмэлт)

- **Firebase Auth defer** — Login/Register хэрэггүй үед auth iframe хожимдож ачаалах
- **API preconnect** — PHP API болон Storage origin-уудын бодит waterfall-ийг
  Lighthouse/DevTools дээр хэмжээд preconnect нэмэх эсэхийг шийдэх
- **Listings query cache tuning** — Filter/key өөрчлөлтөөс шалтгаалж дахин fetch
  их байвал `staleTime`/placeholder data-тай туршина
- **SSR/SSG** — анхны HTML-д banner/listings байрлуулбал хамгийн их сайжирна
  (их хөдөлмөр, hybrid backend cache strategy шаардлагатай)
