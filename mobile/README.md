# Zarkorea React Native App (Expo)

This is a separate mobile app client for iOS and Android.
Your existing website remains unchanged.

## 1) Setup

1. Copy `.env.example` to `.env`
2. Fill Firebase keys using the same project as the website
3. Install deps:

```bash
npm install
```

**`react-native-reanimated`:** `babel.config.js` дотор `react-native-reanimated/plugin` (хамгийн сүүлд) заавал байна. **Custom dev client** (`expo-dev-client`) ашиглаж байвал Reanimated нэмсний дараа **шинэ native build** (`eas build` эсвэл `npx expo run:android` / `run:ios`) хэрэгтэй байж болно.

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

- **Home:** Banners (`banner_ads`, `is_active`), **Ангилал** grid (шүүлт + haptics + spring даралт + сонгогдсон нүд pulse), hero 2-up + **Баннер · VIP** strip + **Онцлох зарууд** + main list.
- **Pull to refresh** on the list.
- **Listing detail:** Gallery (w800 + thumbnails), title, price, description, contact, **Хадгалах** (same `saved_listings` as web).
- **Auth:** Email/password **Нэвтрэх**, **Бүртгүүлэх**, нууц үг сэргээх имэйл, **Гарах**. Native persistence via `AsyncStorage` (web uses default).
- **Хадгалсан:** List + pull-to-refresh + хасах.
- **Images:** `expo-image` + same URL helpers as web.

## 4) Next steps

- Search / filters / categories
- Google / Facebook sign-in (Expo auth session)
- Push notifications (Expo)
