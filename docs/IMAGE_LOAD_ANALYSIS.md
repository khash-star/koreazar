# Зургийн ачааллын дүн шинжилгээ

## Асуудал

Сайт эхлэхэд зураг удаан харагдана — skeleton удаан үзэгдэнэ.

## Шалтгаан (Critical Path)

```
1. HTML (index.html) татагдана
2. JS bundle (main.jsx + deps) татагдана
3. React mount → Home component render
4. `useQuery`: listings → PHP MySQL API, bannerAds → Firestore `getDocs()`
5. ⏳ API + Firestore metadata хариу хүлээх (ГҮҮН ШАЛТГААН)
6. Data ирсэн → banner + картууд render, <img> элементүүд үүснэ
7. Browser Firebase Storage-аас зургийг татна
8. Зураг харагдана
```

**Гол саатуулагч:** Зурагны URL нь listing/banner metadata ирсний дараа л мэдэгдэнэ. Иймээс зураг татах эхлэхээс өмнө PHP API болон/эсвэл Firestore-ийн хариуг хүлээх ёстой.

## Дэд шалтгаанууд

| Шалтгаан | Нөлөө | Тайлбар |
|----------|-------|---------|
| API / Firestore latency | Өндөр | Listings API + banner Firestore round-trip; сүлжээний хурд, бүс нутаг |
| Storage discovery late | Өндөр | `<img>` URL нь metadata иртэл DOM-д орохгүй |
| Firestore/Storage preconnect байхгүй | Дунд | `firestore.googleapis.com`, `firebasestorage.googleapis.com` preconnect хэрэгтэй |
| Cache / staleTime | Дунд | Banner query long staleTime ашигладаг; listings query filter солигдоход дахин татна |
| Эхний картын зураг lazy | Бага | Эхний 1–2 карт above-the-fold боловч loading="lazy" |

## Хийсэн сайжруулалт

1. **Preconnect** — `index.html` дээр Firestore, Firebase Storage, Firebase Installations origins preconnect хийгдсэн
2. **Banner cache** — `bannerAds` query 30 мин `staleTime` ашиглана
3. **LCP preload** — Home эхний banner/listing image URL мэдэгдмэгц `<link rel="preload" as="image">` нэмнэ
4. **Progressive listing render** — эхлээд цөөн карт render хийж, scroll хийхэд нэмнэ

## Хийх боломжтой (нэмэлт)

- **Firebase Auth defer** — Login/Register хэрэггүй үед auth iframe хожимдож ачаалах
- **API preconnect** — PHP API origin-д preconnect нэмэх эсэхийг хэмжиж шийдэх
- **SSR/SSG** — анхны HTML-д banner/listings байрлуулбал хамгийн их сайжирна (их хөдөлмөр)
