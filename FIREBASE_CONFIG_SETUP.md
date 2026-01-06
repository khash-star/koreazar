# Firebase Config Тохируулах Зааварчилгаа

## ⚠️ Одоогийн асуудал

Console дээр `API key not valid` алдаа гарч байна. Энэ нь `.env` файлд placeholder утгууд байгаа эсвэл Firebase Console-оос бодит config-ийг оруулаагүй байгааг илтгэж байна.

## ✅ Шийдэл (5-10 минут)

### Алхам 1: Firebase Console руу орох

1. Browser дээр: https://console.firebase.google.com
2. Google account-аараа нэвтрэх
3. Project сонгох эсвэл шинээр үүсгэх:
   - Хэрэв project байхгүй бол: "Add project" → Project нэр: `koreazar-32e7a` → Continue → Continue → Create project

### Алхам 2: Web App үүсгэх (хэрэв байхгүй бол)

1. Firebase Console → Project Overview
2. "Add app" эсвэл `</>` icon дарах
3. Web app сонгох
4. App nickname: `koreazar-web` (эсвэл өөрийн нэр)
5. "Register app" дарах

### Алхам 3: Firebase Config авах

1. Firebase Console → Project Settings (⚙️ gear icon)
2. "General" tab сонгох
3. "Your apps" хэсэг → Web app (`koreazar-web`)
4. "Config" харах (дараах хэлбэртэй):

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyAbc123def456...",
  authDomain: "koreazar-32e7a.firebaseapp.com",
  projectId: "koreazar-32e7a",
  storageBucket: "koreazar-32e7a.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc123def456"
};
```

### Алхам 4: `.env` файл засах

1. `zar-746103b7` folder дотор `.env` файлыг нээх
2. Дараах мөрүүдийг Firebase Console-оос авсан бодит утгуудаар солих:

```env
VITE_FIREBASE_API_KEY=AIzaSyAbc123def456... (Firebase Console-оос авсан apiKey)
VITE_FIREBASE_AUTH_DOMAIN=koreazar-32e7a.firebaseapp.com (Firebase Console-оос авсан authDomain)
VITE_FIREBASE_PROJECT_ID=koreazar-32e7a (Firebase Console-оос авсан projectId)
VITE_FIREBASE_STORAGE_BUCKET=koreazar-32e7a.appspot.com (Firebase Console-оос авсан storageBucket)
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012 (Firebase Console-оос авсан messagingSenderId)
VITE_FIREBASE_APP_ID=1:123456789012:web:abc123def456 (Firebase Console-оос авсан appId)
```

**Жишээ:**
```env
VITE_FIREBASE_API_KEY=AIzaSyC1x2y3z4a5b6c7d8e9f0g1h2i3j4k5l6
VITE_FIREBASE_AUTH_DOMAIN=koreazar-32e7a.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=koreazar-32e7a
VITE_FIREBASE_STORAGE_BUCKET=koreazar-32e7a.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=987654321098
VITE_FIREBASE_APP_ID=1:987654321098:web:xyz789abc123
```

### Алхам 5: Firebase Services идэвхжүүлэх

#### Authentication идэвхжүүлэх:

1. Firebase Console → Authentication
2. "Get started" дарах (хэрэв анх удаа байвал)
3. "Sign-in method" tab сонгох
4. "Email/Password" олоод дарах
5. "Enable" toggle идэвхжүүлэх (ON болгох)
6. "Save" дарах

#### Firestore Database үүсгэх:

1. Firebase Console → Firestore Database
2. "Create database" дарах
3. "Start in test mode" сонгох (development-д)
4. Location сонгох: **asia-northeast3** (Seoul) эсвэл **us-central1**
5. "Enable" дарах

#### Storage идэвхжүүлэх:

1. Firebase Console → Storage
2. "Get started" дарах
3. "Start in test mode" сонгох
4. Location сонгох (Firestore-тай ижил)
5. "Done" дарах

### Алхам 6: Dev Server дахин эхлүүлэх

1. Terminal дээр `Ctrl+C` дарах (dev server зогсоох)
2. Дахин эхлүүлэх:
   ```bash
   cd "C:\Users\khash\OneDrive\Desktop\koreazar\zar-746103b7"
   npm run dev
   ```

### Алхам 7: Browser refresh

- `Ctrl+Shift+R` (hard refresh)
- Console дээрх алдаа арилах ёстой

## ✅ Шалгах

Browser console дээр дараах алдаанууд арилсан эсэхийг шалгах:
- ❌ `API key not valid` → ✅ Алдаа арилсан
- ❌ `Firebase config is missing` → ✅ Алдаа арилсан
- ❌ `auth/invalid-api-key` → ✅ Алдаа арилсан

## 🔧 Хэрэв хэвээр алдаа гарвал

1. `.env` файл зөв байгаа эсэхийг шалгах (placeholder утгууд байхгүй эсэх)
2. Dev server дахин эхлүүлэх
3. Browser cache цэвэрлэх (`Ctrl+Shift+Delete`)
4. Firebase Console дээр Authentication → Sign-in method → Email/Password → Enable байгаа эсэхийг шалгах

---

**Хамгийн чухал:** Firebase Console-оос авсан бодит config-ийг `.env` файлд оруулах!

