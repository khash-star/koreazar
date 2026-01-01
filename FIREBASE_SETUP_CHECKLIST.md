# Firebase Setup Checklist

## ⚠️ Одоогийн алдаанууд

Console дээр дараах алдаанууд гарч байна:
1. **400 Bad Request** - Firebase Authentication
2. **Firestore offline** - Database ажиллахгүй байна

## ✅ Firebase Console дээр хийх зүйлс

### 1. Authentication идэвхжүүлэх

1. https://console.firebase.google.com руу оч
2. **koreazar-32e7a** project сонгох
3. Left menu → **Authentication** → **Get started** дарах
4. **Sign-in method** tab сонгох
5. **Email/Password** олоод → **Enable** toggle идэвхжүүлэх
6. **Save** дарах

### 2. Firestore Database үүсгэх

1. Left menu → **Firestore Database** → **Create database** дарах
2. **Start in production mode** эсвэл **Start in test mode** сонгох
   - **Test mode** (development): Бүх хүн read/write хийж болно (30 хоног)
   - **Production mode**: Security rules бичих хэрэгтэй
3. Location сонгох:
   - **asia-northeast3** (Seoul) - Recommended
   - Эсвэл **us-central1**
4. **Enable** дарах

**Test Mode Rules (хэрэв test mode сонговол):**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.time < timestamp.date(2025, 12, 31);
    }
  }
}
```

### 3. Storage идэвхжүүлэх

1. Left menu → **Storage** → **Get started** дарах
2. **Start in production mode** эсвэл **Start in test mode** сонгох
3. Location сонгох (Firestore-тай ижил)
4. **Done** дарах

**Storage Rules:**
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## ✅ Шалгах

Дээрх бүх зүйлсийг хийсний дараа:

1. Browser refresh хийх (`Ctrl+Shift+R`)
2. Login хуудас руу орох
3. Шинэ бүртгэл үүсгэх
4. Нэвтрэх

## 🔧 Хэрэв хэвээр алдаа гарвал

### Authentication 400 Error

**Шалтгаан:**
- Email/Password sign-in method идэвхжээгүй
- Firebase config буруу

**Шийдэл:**
1. Firebase Console → Authentication → Sign-in method
2. Email/Password → Enable
3. `.env` файл шалгах - config зөв эсэх

### Firestore Offline Error

**Шалтгаан:**
- Firestore database үүсгээгүй
- Network асуудал
- Security rules буруу

**Шийдэл:**
1. Firebase Console → Firestore Database → Create database
2. Test mode эсвэл Production mode сонгох
3. Browser refresh

## 📝 Одоогийн байдал

- ✅ Firebase config файл байна
- ✅ Auth service үүсгэгдсэн
- ✅ Login/Register pages байна
- ⚠️ Firebase Console дээр Authentication/Firestore идэвхжүүлэх хэрэгтэй

