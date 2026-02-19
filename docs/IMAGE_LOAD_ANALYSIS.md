# Зургийн ачааллын дүн шинжилгээ

## Асуудал

Сайт эхлэхэд зураг удаан харагдана — skeleton удаан үзэгдэнэ.

## Шалтгаан (Critical Path)

```
1. HTML (index.html) татагдана
2. JS bundle (main.jsx + deps) татагдана
3. React mount → Home component render
4. useQuery: bannerAds + listings → Firestore getDocs() дуудна
5. ⏳ Firestore хариу хүлээх (ГҮҮН ШАЛТГААН — ~0.5–2s)
6. Data ирсэн → banner + картууд render, <img> элементүүд үүснэ
7. Browser Firebase Storage-аас зургийг татна
8. Зураг харагдана
```

**Гол саатуулагч:** Зурагны URL нь зөвхөн Firestore-аас ирсний дараа л мэдэгдэнэ. Иймээс зураг татах эхлэхээс өмнө Firestore-ийн хариуг хүлээх ёстой.

## Дэд шалтгаанууд

| Шалтгаан | Нөлөө | Тайлбар |
|----------|-------|---------|
| Firestore latency | Өндөр | getDocs() round-trip; сүлжээний хурд, бүс нутаг |
| Firestore preconnect байхгүй | Дунд | firestore.googleapis.com-д preconnect хийгээгүй |
| Cache (staleTime) ашиглаагүй | Дунд | Дахин ороход ч шинээр fetch хийнэ |
| Эхний картын зураг lazy | Бага | Эхний 1–2 карт above-the-fold боловч loading="lazy" |

## Хийсэн сайжруулалт

1. **Firestore preconnect** — index.html дээр `<link rel="preconnect" href="https://firestore.googleapis.com">` нэмнэ
2. **staleTime** — listings/bannerAds 2–5 мин cache; дахин ороход өмнөх өгөгдлийг шууд харуулна
3. **Эхний 2 карт eager** — above-the-fold картуудын зураг loading="eager" болгоно

## Хийх боломжтой (нэмэлт)

- **Firebase Auth defer** — Login/Register хэрэггүй үед auth iframe хожимдож ачаалах
- **SSR/SSG** — анхны HTML-д banner/listings байрлуулбал хамгийн их сайжирна (их хөдөлмөр)
