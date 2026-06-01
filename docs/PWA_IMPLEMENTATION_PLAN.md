# PWA implementation status

PWA support is implemented. This file now records the current configuration and
keeps the original rollout checklist as maintenance guidance.

---

## Current state

- **App:** Vite 6 + React 18 SPA on Vercel.
- **Routing:** `/`, `/Login`, `/ListingDetail?id=...`, and other SPA routes fall back to `index.html`.
- **Build output:** `dist/` — `index.html`, hashed assets, `manifest.json`, `sw.js`, and Workbox files.
- **Plugin:** `vite-plugin-pwa` in `vite.config.js`, after `nonBlockingCss()`.
- **Manifest URL:** `https://zarkorea.com/manifest.json`.
- **Service worker:** Workbox, `registerType: 'autoUpdate'`.
- **Runtime caching:** Firebase Storage image URLs use `CacheFirst` caches.
- **Icons:** `npm run build` runs `npm run generate-pwa-icons` before `vite build`; the script generates `public/icon-180.png`, `public/icon-192.png`, and `public/icon-512.png` from `scripts/generate-pwa-icons.mjs`.

---

## Алхам 1: PWA icon

**Одоо:** build script generates PNG icons used by the manifest and iOS metadata.

If `public/icon-180.png` is missing, `scripts/generate-pwa-icons.mjs` creates an amber placeholder and derives 192/512 assets. Replace the source icon with branded artwork when available.

---

## Алхам 2: vite-plugin-pwa

**Төлөв:** installed in `devDependencies`.

**Үйлдэл:**
```bash
npm i vite-plugin-pwa -D
```

**Шалгах:** `package.json`-д `vite-plugin-pwa` байгаа эсэх.

---

## Алхам 3: vite.config.js PWA plugin

**Төлөв:** configured in `vite.config.js`.

**Өөрчлөлт:**
- `vite.config.js`-д `VitePWA` import
- `plugins` массивт `VitePWA({ ... })` нэмэх
- `nonBlockingCss`-ийн **дараа** байрлуулах (plugin дараалал чухал)

**Одоогийн тохиргооны гол хэсгүүд:**
```js
VitePWA({
  registerType: 'autoUpdate',
  manifestFilename: 'manifest.json',
  includeAssets: ['favicon.svg', 'icon-180.png', 'icon-192.png', 'icon-512.png'],
  workbox: {
    navigateFallback: '/index.html',
    runtimeCaching: [
      // Firebase Storage image caches
    ],
  },
  manifest: {
    name: 'Zarkorea - Солонгос дахь Монголчуудын зарын сайт',
    short_name: 'Zarkorea',
    theme_color: '#ea580c',
    start_url: '/',
  },
})
```

**Шалгах:** `npm run build` ажиллаж, `dist/` дотор `manifest.json` болон `sw.js` үүссэн эсэх.

---

## Алхам 4: index.html manifest link

**Тайлбар:** vite-plugin-pwa ихэвчлэн manifest-ийг автоматаар `<head>`-д нэмдэг. Build хийгээд index.html-ийг шалгаад, manifest link байгаа бол энэ алхамыг алгасна.

**Хэрэв байхгүй бол:**
- `<head>`-д `<link rel="manifest" href="/manifest.json">` нэмнэ.

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
5. Banner, listing картууд — PHP API + Firestore өгөгдөл хэвийн ирнэ
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

- Web push notification — mobile chat push is documented separately in `mobile/docs/CHAT_PUSH_SETUP.md`.
- Offline Firestore/MySQL data cache — app shell/assets and image runtime caches exist, but API data remains online-first.

---

## Rollback (хэрэв асуудал гарвал)

1. `vite.config.js`-аас `VitePWA(...)` устгах
2. `package.json`-аас `vite-plugin-pwa` устгах
3. Generated icon files устгах (шаардлагатай бол)
4. `vercel.json` CSP-ийн өөрчлөлтийг буцаах
5. `npm run build` дахин ажиллуулна

---

## Дүгнэлт

| Хэсэг | Төлөв | Эрсдэл |
|-------|-------|--------|
| Icons | Build script generates PNG assets | Бага |
| Plugin | `vite-plugin-pwa` configured | Дунд |
| Manifest | `manifest.json` | Бага |
| Service worker | Workbox auto-update | Дунд |
| CSP | Verify on production if SW registration fails | Бага |

PWA-related changes should still be followed by `npm run build` and the
checks in `project-memory/qa/pwa-twa-tests.md`.
