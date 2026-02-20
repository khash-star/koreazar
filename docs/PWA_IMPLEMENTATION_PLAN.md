# PWA нэмэх төлөвлөгөө

Одоогийн бүтэц, үйлдлүүдийг эвдэхгүйгээр PWA нэмэх алхмууд. Нэг бүрчлэн шалгаад хэрэгжүүлнэ.

---

## Өмнөх нөхцөл

- **Одоогийн бүтэц:** Vite 6 + React 18, SPA (react-router), Vercel deploy
- **Routing:** `/` = Home, `/Login`, `/ListingDetail?id=...` гэх мэт
- **Build output:** `dist/` — index.html, assets/
- **Төлөв:** manifest, service worker байхгүй

---

## Алхам 1: PWA icon

**Одоо:** `public/favicon.svg`-ийг manifest-д ашиглана (SVG дэмжигддэг).

**Хувилбар:** Дараа нь 192×192, 512×512 PNG нэмж, илүү сайн browser дэмжлэг авах боломжтой.

---

## Алхам 2: vite-plugin-pwa суулгах

**Зорилго:** Manifest болон Service Worker автоматаар үүсгэх.

**Үйлдэл:**
```bash
npm i vite-plugin-pwa -D
```

**Эвдрэл:** Шинэ dependency л нэмэгдэнэ, одоогийн кодыг өөрчлөхгүй.

**Шалгах:** `package.json`-д `vite-plugin-pwa` байгаа эсэх.

---

## Алхам 3: vite.config.js-д PWA plugin нэмэх

**Зорилго:** Plugin-ийг идэвхжүүлж, manifest тохиргоо өгөх.

**Өөрчлөлт:**
- `vite.config.js`-д `VitePWA` import
- `plugins` массивт `VitePWA({ ... })` нэмэх
- `nonBlockingCss`-ийн **дараа** байрлуулах (plugin дараалал чухал)

**Тохиргоо (хөндлөнгийн оролцоо бага):**
```js
VitePWA({
  registerType: 'autoUpdate',      // Шинэ SW хөрвүүлэгдэхэд автоматаар шинэчлэнэ
  includeAssets: ['favicon.svg'],  // precache-д оруулах
  manifest: {
    name: 'Koreazar - Зарын сайт',
    short_name: 'Koreazar',
    description: 'Солонгост буй Монголчуудын зарын сайт',
    theme_color: '#ea580c',        // Tailwind amber-600
    background_color: '#ffffff',
    display: 'standalone',
    start_url: '/',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
    navigateFallback: '/index.html',
    navigateFallbackDenylist: [/^\/sw\.js$/, /^\/workbox-.*\.js$/],
  },
})
```

**Шалгах:** `npm run build` ажиллаж, `dist/` дотор `manifest.webmanifest` болон `sw.js` үүссэн эсэх.

---

## Алхам 4: index.html-д manifest холбох (шаардлагагүй бол зайл)

**Тайлбар:** vite-plugin-pwa ихэвчлэн manifest-ийг автоматаар `<head>`-д нэмдэг. Build хийгээд index.html-ийг шалгаад, manifest link байгаа бол энэ алхамыг алгасна.

**Хэрэв байхгүй бол:**
- `<head>`-д `<link rel="manifest" href="/manifest.webmanifest">` нэмнэ.

---

## Алхам 5: Vercel / CSP — Service Worker зөвшөөрөх

**Зорилго:** Service Worker бүртгэгдэхэд CSP эвдрэхгүй байх.

**Өөрчлөлт:** `vercel.json` → headers → Content-Security-Policy-д `worker-src 'self';` нэмнэ (эсвэл одоогийн `script-src` worker-т тохирох бол үлдээнэ).

**Одоогийн CSP:**
```
script-src 'self' ...
```
Worker-д `worker-src 'self'` нэмбэл найдвартай.

**Шалгах:** Production дээр DevTools → Application → Service Workers хэсгээр SW бүртгэгдсэн эсэхийг шалгана.

---

## Алхам 6: Build ба функцын шалгалт

**Шалгах дараалал:**
1. `npm run build` — build амжилттай
2. `npm run preview` — local preview ажиллана
3. Browser дээр `/` → Home
4. `/Login`, `/Home`, `/ListingDetail?id=xxx` — routing хэвийн
5. Banner, listing картууд, Firestore — өгөгдөл хэвийн ирнэ
6. DevTools → Application → Manifest — manifest зөв ачаалагдана
7. DevTools → Application → Service Workers — SW бүртгэгдсэн

**Эвдэрсэн эсэх:** Хэрэв ямар нэг хуудас, үйлдэл ажиллахгүй бол энэ алхамыг дуустал буцааж засна.

---

## Алхам 7: PWA “Add to Home Screen” шалгах

**Зорилго:** Mobile / desktop дээр PWA шиг суулгагдаж, зөв ажиллаж байгааг шалгах.

**Шалгах:**
- Chrome (desktop): Omnibox-ын баруун талын “Install app” дарж суулгана
- Chrome (mobile): Share → Add to Home Screen
- Апп нээгдэхэд standalone mode-оор ажиллана, URL bar байхгүй

---

## Хийхгүй зүйлс (одоогоор)

- Capacitor / TWA (Play Store) — PWA бэлэн болсны дараа тусад нь төлөвлөнө
- Push notification — дараагийн үе шатанд
- Offline-д Firestore cache — одоо зөвхөн precache (HTML/JS/CSS), API-г онлайнаар л ашиглана

---

## Rollback (хэрэв асуудал гарвал)

1. `vite.config.js`-аас `VitePWA(...)` устгах
2. `package.json`-аас `vite-plugin-pwa` устгах
3. `public/icon-192.png`, `public/icon-512.png` устгах (нэмсэн бол)
4. `vercel.json` CSP-ийн өөрчлөлтийг буцаах
5. `npm run build` дахин ажиллуулна

---

## Дүгнэлт

| Алхам | Өөрчлөлт                         | Эрсдэл |
|-------|-----------------------------------|--------|
| 1     | Icon файлууд нэмэх                | Бага   |
| 2     | npm install vite-plugin-pwa       | Бага   |
| 3     | vite.config.js — plugin тохиргоо  | Дунд   |
| 4     | manifest link (хэрэв шаардлагатай)| Бага   |
| 5     | vercel.json CSP                   | Бага   |
| 6–7   | Шалгалт                           | —      |

Бүх алхамыг дарааллаар хийж, алхам бүрийн дараа build + шалгалт хийнэ.
