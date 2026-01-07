# Facebook Login Setup Guide

## 🔧 Тохиргоо

### 1. Firebase Console дээр Facebook Provider идэвхжүүлэх

1. https://console.firebase.google.com руу орох
2. Проект сонгох
3. **Authentication** → **Sign-in method** tab руу орох
4. **Facebook** provider олоод **Enable** дарах
5. **App ID** оруулах: `2276589366185787`
6. **App Secret** оруулах: `5bad8644795c0b13409d20d7cbf2f881`
7. **Save** дарах

### 2. Facebook App Settings (OAuth Redirect URIs)

1. https://developers.facebook.com/apps руу орох
2. App сонгох (App ID: 2276589366185787)
3. **Settings** → **Basic** руу орох
4. **App Domains** дээр домэйн нэмэх:
   - Local: `localhost`
   - Production: `your-domain.vercel.app`

5. **Settings** → **Basic** → **Add Platform** → **Website** сонгох
6. **Site URL** оруулах:
   - Local: `http://localhost:5173`
   - Production: `https://your-domain.vercel.app`

7. **Settings** → **Facebook Login** → **Settings** руу орох
8. **Valid OAuth Redirect URIs** дээр нэмэх:
   - Local: `http://localhost:5173/__/auth/handler`
   - Production: `https://your-domain.vercel.app/__/auth/handler`
   - Production Firebase Auth Domain: `https://YOUR_PROJECT_ID.firebaseapp.com/__/auth/handler`

### 3. Firebase Auth Domain шалгах

1. Firebase Console → **Authentication** → **Settings** → **Authorized domains**
2. Домэйн нэмсэн эсэхийг шалгах (localhost болон production domain)

---

## 🔐 Код дээр тохиргоо

### Environment Variables

`.env` файлд нэмэх шаардлагагүй - Firebase Console дээр App ID болон App Secret тохируулсан бол хангалттай.

**Note:** Firebase Authentication нь Facebook OAuth flow-ийг өөрөө удирдана. App ID болон App Secret зөвхөн Firebase Console дээр тохируулах шаардлагатай.

---

## ✅ Хэрхэн ажилладаг

1. Хэрэглэгч "Facebook-р нэвтрэх" button дарах
2. Facebook login popup гарч ирэх
3. Хэрэглэгч Facebook-р нэвтрэх
4. Firebase Authentication Facebook provider-ээр нэвтрэх
5. User Firebase Auth-д үүсгэгдэнэ эсвэл одоо байгаа user-тэй холбогдоно

---

## 🐛 Алдаа засах

### "auth/account-exists-with-different-credential"
- Энэ имэйл аль хэдийн өөр аргаар (Email/Password) бүртгэгдсэн байна
- Firebase Authentication нь ижил имэйлтэй хэд хэдэн account үүсгэхгүй

### "auth/popup-closed-by-user"
- Хэрэглэгч popup-ийг хаасан
- Дахин оролдоно уу

### "auth/popup-blocked"
- Браузер popup-ийг блоколсон
- Popup blocker-ийг унтраах эсвэл browser settings-аас зөвшөөрөх хэрэгтэй

### "Firebase: Error (auth/configuration-not-found)"
- Firebase Console дээр Facebook provider идэвхжүүлээгүй байна
- Дээрх "Firebase Console дээр Facebook Provider идэвхжүүлэх" алхмуудыг дагана уу

### "OAuth redirect URI mismatch"
- Facebook App Settings дээр OAuth Redirect URI зөв тохируулаагүй байна
- Firebase Auth Domain-ийг Facebook App дээр нэмэх хэрэгтэй

---

## 📝 Тэмдэглэл

- Firebase Authentication нь Facebook OAuth flow-ийг бүхэлд нь удирдана
- Server-side API route шаардлагагүй (Kakao-аас ялгаатай)
- App Secret зөвхөн Firebase Console дээр ашиглагдана, client code дээр байхгүй
- User UID: Firebase-аас үүсгэсэн UID (жишээ: `facebook:1234567890`)

---

## ✅ Тест хийх

1. Local development: `npm run dev`
2. Login хуудас руу орох
3. "Facebook-р нэвтрэх" button дарах
4. Facebook popup гарч ирэх
5. Facebook-р нэвтрэх
6. Authentication амжилттай бол User Firebase Auth-д үүсгэгдэх ёстой

