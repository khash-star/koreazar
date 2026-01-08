# Facebook Login Setup Guide

## 🔧 Тохиргоо

### 1. Firebase Console дээр Facebook Provider идэвхжүүлэх ⚠️ MANDATORY

**⚠️ ЭНЭ АЛХМУУДЫГ ОБЯЗАТЕЛЬ ХИЙХ ХЭРЭГТЭЙ! "auth/operation-not-allowed" алдаа гарч байгаа бол Facebook provider идэвхжээгүй байна.**

1. https://console.firebase.google.com руу орох
2. Проект сонгох
3. **Authentication** → **Sign-in method** tab руу орох
4. **Facebook** provider олох (Google, Email/Password зэрэг provider-үүдийн жагсаалтаас)
5. **Facebook** дээр дарах (эсвэл **Enable** товч дарах)
6. Дараах мэдээллийг оруулах:
   - **App ID**: `2276589366185787`
   - **App Secret**: `5bad8644795c0b13409d20d7cbf2f881`
7. **⚠️ ЧУХАЛ:** **Save** товчийг **обязательно** дарах! (Хэрэв Save дараагүй бол тохиргоо хадгалагдахгүй)
8. **Facebook** provider идэвхтэй болсон эсэхийг шалгах (Status: **Enabled** гэж харагдах ёстой)

**✅ Шалгах:** Sign-in method жагсаалтад Facebook-ийн хажууд "Enabled" гэж харагдах ёстой.

### 2. Facebook App идэвхжүүлэх (MANDATORY) ⚠️

**⚠️ ЭНЭ АЛХМУУДЫГ ОБЯЗАТЕЛЬ ХИЙХ ХЭРЭГТЭЙ! "App not active" алдаа гарч байгаа бол App идэвхгүй байна.**

1. https://developers.facebook.com/apps руу орох
2. App сонгох (App ID: 2276589366185787)
3. Дээд талын **App Dashboard** хуудас руу орох
4. **App Review** хэсгийг шалгах:
   - App Review → **Permissions and Features** таб руу орох
   - `email` болон `public_profile` permissions-ийг шалгах
   - Хэрэв хэрэгтэй бол permissions-үүд нэмэх
5. **Settings** → **Basic** руу орох
6. **App Status** хэсгийг шалгах:
   - **App Mode** dropdown-аас **Live** режим сонгох (хэрэв "Development" байгаа бол)
   - Эсвэл **App Review** хуудас руу очиж App-ийг Live режимд шилжүүлэх
7. **⚠️ ЧУХАЛ:** Development mode-д зөвхөн App Admins, Developers, Testers нэвтрэх боломжтой
8. Production дээр ажиллахын тулд **Live** режим эсвэл App Review хийлгэх шаардлагатай

### 3. Facebook App Settings (OAuth Redirect URIs)

1. https://developers.facebook.com/apps руу орох
2. App сонгох (App ID: 2276589366185787)
3. **Settings** → **Basic** руу орох
4. **App Domains** дээр домэйн нэмэх:
   - Local: `localhost`
   - Production: `zarkorea.com` ⭐

5. **Settings** → **Basic** → **Add Platform** → **Website** сонгох
6. **Site URL** оруулах:
   - Local: `http://localhost:5173`
   - Production: `https://zarkorea.com` ⭐

7. **Settings** → **Facebook Login** → **Settings** руу орох
8. **Valid OAuth Redirect URIs** дээр нэмэх:
   - Local: `http://localhost:5173/__/auth/handler`
   - Production: `https://zarkorea.com/__/auth/handler` ⭐
   - Firebase Auth Domain: `https://YOUR_PROJECT_ID.firebaseapp.com/__/auth/handler` (YOUR_PROJECT_ID-г өөрийн Firebase Project ID-аар солих)

### 4. Firebase Authorized Domains тохируулах (MANDATORY - Required for OAuth)

**⚠️ ЭНЭ АЛХМУУДЫГ ОБЯЗАТЕЛЬ ХИЙХ ХЭРЭГТЭЙ! OAuth нэвтрэх ажиллахгүй болно.**

1. Firebase Console → **Authentication** → **Settings** tab руу орох
2. **Authorized domains** хэсгийг олох (доод хэсэгт байрлана)
3. **Add domain** button дарах
4. Домэйнуудыг нэмэх:
   - **Local development**: `localhost`
   - **Production**: `zarkorea.com` ⭐ (одоо хэрэгтэй!)
   - Vercel domain (хэрэв байгаа бол): `your-app.vercel.app`
5. **Add** дарах

**Одоогийн алдаа:**
- Console дээр "auth/unauthorized-domain" алдаа гарч байгаа бол `zarkorea.com` домэйныг дээрх алхмуудаар нэмнэ үү.

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
- Хэрэглэгч Facebook login popup-ийг хаасан
- **ШИЙДЭЛ:**
  1. "Facebook-р нэвтрэх" товчийг дахин дарах
  2. Popup гарч ирэхээс хүлээх (хэрэв гарч ирэхгүй бол popup blocker идэвхтэй байж магадгүй)
  3. Facebook-р нэвтрэх үйл явцыг дуусгах (popup-ийг бүү хаа)
  4. Хэрэв popup гарч ирэхгүй бол:
     - Браузерын address bar дээр popup блоклогдсон тэмдэглэгээ шалгах
     - Browser settings → Site permissions → Pop-ups and redirects → zarkorea.com-д popup-ийг зөвшөөрөх
- **Алдаа:** "Нэвтрэх цонхыг хаасан байна."
- **Шалтгаан:** Хэрэглэгч popup-ийг хаасан эсвэл popup блоклогдсон байна

### "auth/popup-blocked"
- Браузер popup-ийг блоколсон
- Popup blocker-ийг унтраах эсвэл browser settings-аас зөвшөөрөх хэрэгтэй

### "Firebase: Error (auth/unauthorized-domain)" ⚠️
- **Энэ нь хамгийн түгээмэл алдаа!**
- Firebase Console дээр домэйн нэмэгдээгүй байна
- **ШИЙДЭЛ:**
  1. Firebase Console → **Authentication** → **Settings** → **Authorized domains** tab руу орох
  2. **Add domain** button дарах
  3. `zarkorea.com` оруулах
  4. **Add** дарах
  5. Хуудас дахин ачаалах
- **Жишээ алдаа:** "The current domain is not authorized for OAuth operations. Add your domain (zarkorea.com) to the OAuth redirect domains list"

### "Firebase: Error (auth/operation-not-allowed)" ⚠️
- **Энэ нь хамгийн чухал алдаа!**
- Firebase Console дээр Facebook provider идэвхжүүлээгүй байна
- **ШИЙДЭЛ:**
  1. Firebase Console → **Authentication** → **Sign-in method** tab руу орох
  2. **Facebook** provider олох
  3. **Facebook** дээр дарах (эсвэл **Enable** товч дарах)
  4. **App ID**: `2276589366185787` оруулах
  5. **App Secret**: `5bad8644795c0b13409d20d7cbf2f881` оруулах
  6. **⚠️ ЧУХАЛ:** **Save** товчийг дарах!
  7. Status нь **Enabled** болсон эсэхийг шалгах
  8. Хуудас дахин ачаалах
- **Алдаа:** "Firebase: Error (auth/operation-not-allowed). This sign-in method is not enabled."
- **Шалтгаан:** Firebase Console дээр Facebook provider идэвхжээгүй эсвэл Save хийгээгүй

### "Firebase: Error (auth/configuration-not-found)"
- Firebase Console дээр Facebook provider-ийн App ID эсвэл App Secret буруу байна
- Дээрх "Firebase Console дээр Facebook Provider идэвхжүүлэх" алхмуудыг дагана уу
- App ID болон App Secret-ийг дахин шалгах

### "App not active" / "This app is not accessible right now" ⚠️
- Facebook App идэвхгүй байна эсвэл Development mode-д байна
- **ШИЙДЭЛ:**
  1. Facebook Developer Console → https://developers.facebook.com/apps руу орох
  2. App сонгох (App ID: 2276589366185787)
  3. **Settings** → **Basic** руу орох
  4. **App Mode** dropdown-аас **Live** сонгох
  5. Хэрэв Live режим байхгүй бол:
     - **App Review** → **Permissions and Features** руу орох
     - `email` болон `public_profile` permissions-ийг идэвхжүүлэх
     - App Review хийлгэх эсвэл Test Users нэмэх (Development mode-д тест хийхэд)
  6. **Save Changes** дарах
- **Development Mode:** Зөвхөн App Admins, Developers, Testers нэвтрэх боломжтой
- **Production:** Live режим эсвэл App Review хийлгэх шаардлагатай

### "OAuth redirect URI mismatch"
- Facebook App Settings дээр OAuth Redirect URI зөв тохируулаагүй байна
- Firebase Auth Domain-ийг Facebook App дээр нэмэх хэрэгтэй
- **Valid OAuth Redirect URIs** дээр бүх шаардлагатай URI-үүд байгаа эсэхийг шалгах

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

