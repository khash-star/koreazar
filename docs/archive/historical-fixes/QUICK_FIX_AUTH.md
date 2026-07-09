# Firebase Authentication Quick Fix

## ⚠️ 400 Bad Request Алдаа

Console дээр `400 (Bad Request)` алдаа гарч байгаа нь Firebase Authentication-д Email/Password sign-in method идэвхжээгүй байгааг илтгэж байна.

## ✅ ШИЙДЭЛ (5 минут)

### 1. Firebase Console руу орох

1. Browser дээр: https://console.firebase.google.com
2. **koreazar-32e7a** project сонгох (эсвэл шинээр үүсгэх)

### 2. Authentication идэвхжүүлэх

1. Left sidebar дээр → **Authentication** дээр дарах
2. Хэрэв "Get started" button байвал дарах
3. Дээд талын tab → **Sign-in method** дээр дарах
4. **Email/Password** олоод дарах
5. **Enable** toggle идэвхжүүлэх (ON болгох)
6. **Save** button дарах

### 3. Шалгах

1. Browser дээр refresh хийх (`Ctrl+Shift+R`)
2. Бүртгүүлэх хуудас руу орох
3. Шинэ бүртгэл үүсгэх оролдлого хийх

## 📸 Screenshot Guide

Firebase Console дээр дараах байдлаар харагдах ёстой:

```
Authentication
├── Users (0 users)
├── Sign-in method ← ЭНЭ ДЭЭР ДАРАХ
│   ├── Email/Password ← ЭНЭ ИДЭВХЖҮҮЛЭХ
│   ├── Google
│   ├── Facebook
│   └── ...
└── Templates
```

## 🔧 Хэрэв хэвээр алдаа гарвал

### Алдаа: "API key not valid"

**Шийдэл:**
1. `.env` файл шалгах - Firebase config зөв эсэх
2. Firebase Console → Project Settings → General
3. "Your apps" section → Web app → Config харах
4. `.env` файлд config зөв байгаа эсэхийг шалгах

### Алдаа: "Project not found"

**Шийдэл:**
1. Firebase Console дээр project үүсгэсэн эсэхийг шалгах
2. `.env` файл дээрх `VITE_FIREBASE_PROJECT_ID` зөв эсэхийг шалгах

## ⚡ Quick Test

Browser console дээр дараах код бичээд шалгах:

```javascript
// Firebase config шалгах
console.log('API Key:', import.meta.env.VITE_FIREBASE_API_KEY);
console.log('Project ID:', import.meta.env.VITE_FIREBASE_PROJECT_ID);

// Firebase auth шалгах
import { auth } from '@/firebase/config';
console.log('Auth:', auth);
```

## 📝 Checklist

- [ ] Firebase Console дээр Authentication идэвхжүүлсэн
- [ ] Email/Password sign-in method идэвхжүүлсэн
- [ ] `.env` файл зөв тохируулагдсан
- [ ] Browser refresh хийсэн
- [ ] Бүртгүүлэх оролдлого хийсэн

---

**Хамгийн чухал:** Firebase Console → Authentication → Sign-in method → Email/Password → Enable!

