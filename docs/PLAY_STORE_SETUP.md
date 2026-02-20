# Google Play Store - TWA байршуулах заавар

Koreazar PWA-г Android app болгон Play Store дээр тавих алхамууд.

---

## 1. Урьдчилсан шаардлага

- [x] PWA (manifest, service worker) бэлэн
- [x] Нууцлалын бодлого: https://zarkorea.com/Privacy
- [x] PWA-г Vercel эсвэл өөр хостинг дээр deploy хийсэн
- [ ] Node.js 18+
- [ ] Java 11+ (Bubblewrap)
- [ ] Android Studio / SDK

---

## 2. Bubblewrap ашиглан TWA үүсгэх

### 2.1 Суулгах

```bash
npm install -g @bubblewrap/cli
```

### 2.2 Анхны тохиргоо

```bash
npx @bubblewrap/cli init
```

Хариулах асуултууд:

| Асуулт | Хариулт |
|--------|---------|
| Web App URL | `https://zarkorea.com` |
| Application ID | `com.koreazar.app` |
| App name | `Koreazar` |
| Launcher name | `Koreazar` |
| Theme color | `#ea580c` |
| Background color | `#ffffff` |
| Start URL | `/` |
| Enable site settings shortcut | Yes (optional) |
| Maskable icon URL | `https://zarkorea.com/icon-512.png` |
| Monochrome icon URL | (optional) |

### 2.3 assetlinks.json шинэчлэх

Bubblewrap `init` дууссны дараа гарсан **SHA256 fingerprint**-г аваад:

1. `public/.well-known/assetlinks.json` нээх
2. `00:00:00:...` гэсэн утгыг **жинхэнэ fingerprint**-ээр солих
3. Дахин deploy хийх

```json
"sha256_cert_fingerprints": [
  "XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX"
]
```

### 2.4 Build хийх

```bash
npx @bubblewrap/cli build
```

`app-release-signed.aab` файл гарна — үүнийг Play Console дээр upload хийнэ.

---

## 3. Google Play Console тохиргоо

### 3.1 Developer account

- [Google Play Console](https://play.google.com/console) нээх
- $25 нэг удаагийн төлбөр төлөх

### 3.2 Шинэ апп үүсгэх

1. **Create app** → Нэр, хэл сонгох
2. **App content** хэсэгт:
   - **Privacy policy**: `https://zarkorea.com/Privacy`
   - **App access**: Хэрэв бүх хэрэглэгчид нээлттэй бол "All functionality is available" сонгох
   - **Ads**: Реклам байгаа эсэх — Koreazar-д banner байгаа бол "Yes" сонгох
   - **Content rating**: Анкет бөглөх
   - **Target audience**: Насны бүлэг (жишээ: 13+)
   - **Data safety**: Цуглуулдаг өгөгдлийг тодорхойлох (email, зураг, мессеж гэх мэт)

### 3.3 Store listing

- **App name**: Koreazar
- **Short description**: 80 тэмдэгт
- **Full description**: Дэлгэрэнгүй тайлбар
- **Screenshots**: Дор хаяж 2 (телефон)
- **Feature graphic**: 1024 x 500 px

### 3.4 AAB upload

- **Production** эсвэл **Testing** → **Create new release**
- `app-release-signed.aab` upload
- Release notes бичих → **Review release** → **Start rollout**

---

## 4. Баталгаажуулах

1. **assetlinks.json**: https://zarkorea.com/.well-known/assetlinks.json нээгдэж байгаа эсэх
2. **Digital Asset Links**: [Statement List Generator](https://developers.google.com/digital-asset-links/tools/generator) ашиглан шалгах
3. **TWA**: Build хийсэн APK-г Android төхөөрөмж дээр суулгаад нээгдэж байгаа эсэх шалгах

---

## 5. Асуудал шийдвэрлэх

| Алдаа | Шалтгаан | Шийдэл |
|-------|----------|--------|
| "Site not verified" | assetlinks.json буруу эсвэл fingerprint таарахгүй | Fingerprint-г Bubblewrap-аас дахин аваад assetlinks-д оруулах |
| "Digital links verification failed" | .well-known хуудас 404 | Vercel deploy дахин шалгах, public/.well-known/ нь dist/.well-known/ болж орсон эсэх |
| TWA цонхонд сайт нээгдэхгүй | manifest эсвэл scope буруу | manifest.json start_url, scope зөв эсэх шалгах |

---

## 6. Холбоосууд

- [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap)
- [Trusted Web Activities](https://developer.chrome.com/docs/android/trusted-web-activity/)
- [Digital Asset Links](https://developers.google.com/digital-asset-links/v1/getting-started)
- [Play Console](https://play.google.com/console)
