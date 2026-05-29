# Zarkorea React Native App (Expo)

## Repository layout (бүү холио)

| Бүрэлдэхүүн | GitHub зам | Тайлбар |
|-------------|------------|---------|
| **Вэбсайт** (үндсэн) | [`khash-star/koreazar`](https://github.com/khash-star/koreazar) — репогийн **үндсэн хавтас** | Vite + React (zarkorea.com) |
| **Утасны апп** | [`koreazar/mobile/`](https://github.com/khash-star/koreazar/tree/main/mobile) | **Энэхүү Expo төсөл** — вэбтэй **тусдаа** хавтсанд, код холиолдохгүй |

- Вэб болон апп **нэг GitHub репо** дотор боловч **хавтсаар ялгагдсан**: вэб = root, апп = `mobile/`.
- Аппын ажиллах газар нь энэ README-тай **ижил түвшин** (локалд ихэвчлэн `zarkorea-app` гэж нэрлэсэн хавтас); түлхэхдээ `mobile/` руу хуулна.

This is the **mobile-only** client for iOS and Android. The marketing site stays in the repo root, separate from this folder.

## 1) Setup

1. Copy `.env.example` to `.env`
2. Fill Firebase keys using the same project as the website
3. Install deps:

```bash
npm install
```

**`react-native-reanimated`:** зөвхөн **iOS/Android** дээр ачаална (`bootstrap.native.js`). **Вэб** дээр ачаалахгүй тул Metro `semver` алдаа гардаггүй. Ангилал: `CategoryStrip.native.js` (Reanimated) + `CategoryStrip.web.js` (RN Animated). `babel.config.js` дотор `react-native-reanimated/plugin` (хамгийн сүүлд) заавал. **Custom dev client** дахин build шаардлагатай байж болно.

## 2) Run

```bash
npm run android
npm run ios
npm run web
```

**Хоосон цагаан дэлгэц + `index.bundle` 500 / MIME `application/json`:** ихэвчлэн Metro dev алдаа. Дараахыг туршина уу:

```bash
npx expo start --web -c
```

(`-c` = cache цэвэрлэх). Firebase вэб дээр `firebase.web.js` ашиглана (native persistence вэб bundle-д орохгүй).

## 3) Features (so far)

- **Home:** Banners, categories, featured listings, pull-to-refresh.
- **Listing detail:** Gallery, contact, **Хадгалах** (`saved_listings`).
- **Auth:** Email/password **Нэвтрэх**, **Утас + OTP** (EAS dev/production build, not Expo Go), **Бүртгүүлэх**, нууц үг сэргээх, **Гарах**. OTP нэг удаа → дараагийн нээлтэд session хадгалагдана (Firebase JS Auth + `AsyncStorage`).
- **Хадгалсан:** List + pull-to-refresh.

## 4) Категори / locations (вэбтэй синк)

Ангилал, дэд ангилал, байршил нь вэб дээр `src/constants/listings.js` дээр тодорхойлогдоно. **EAS build** зөвхөн `mobile/` агуулдаг тул `mobile/src/constants/listings.js` нь түүний хуулбар.

Вэб файл өөрчлөсний дараа **репогийн root**-оос:

```bash
npm run sync-listings
```

Дараа нь commit хийж, EAS build ажиллуулна.

## 5) App Store screenshots

Хураангуй: 1242×2688 (босоо), 2688×1242 (хэвтээ) зургуудыг **репогийн root**-оос:

```bash
npm run generate-app-store-screenshots
```

Эх сурвалж: `mobile/screenshots-source/*.png`. Эхний удаа скрипт энэ хавтсыг үүсгэнэ — screenshot-уудаа тэнд тавиад дахин ажиллуулна. Гаралт: `mobile/app-store-screenshots/`.

## 6) Phone OTP (native)

- Setup: [docs/PHONE_OTP_NATIVE_SETUP.md](docs/PHONE_OTP_NATIVE_SETUP.md)
- Login: **Нэвтрэх → Утас** tab (default)
- Dev spike screen: **Профайл → Phone OTP spike (dev)** (`__DEV__` only)
- Requires **EAS development/production build** + `google-services.json` / `GoogleService-Info.plist`

## 7) Next steps

- Search / filters / categories
- Google / Facebook sign-in (Expo auth session)
- **Chat push** (EAS build + Cloud Function deploy): [docs/CHAT_PUSH_SETUP.md](docs/CHAT_PUSH_SETUP.md). Listing/status push — одоогоор байхгүй.
