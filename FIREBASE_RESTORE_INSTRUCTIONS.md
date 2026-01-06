# Firebase Өгөгдөл Сэргээх Зааварчилгаа

## ⚠️ Одоогийн асуудал

Firebase config `carsmongolia-d410a` руу шилжсэн, гэхдээ өмнөх project (`koreazar-32e7a`) дээр өгөгдөл байсан байх.

## ✅ Шийдэл (2 сонголт)

### Сонголт 1: Firestore Rules Test Mode болгох (Хурдан)

1. Firebase Console: https://console.firebase.google.com
2. **carsmongolia-d410a** project сонгох
3. Firestore Database → Rules
4. Дараах test mode rules оруулах:

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

5. "Publish" button дарах
6. Browser refresh (`Ctrl+Shift+R`)

### Сонголт 2: Өмнөх Firebase Project-ийн Config ашиглах

Хэрэв өмнөх project (`koreazar-32e7a`) дээр өгөгдөл байсан бол:

1. Firebase Console: https://console.firebase.google.com
2. **koreazar-32e7a** project сонгох
3. Project Settings → General → Your apps → Web app → Config
4. Config хуулж авах
5. `.env` файлд оруулах

---

**Хамгийн хурдан:** Сонголт 1 - Firestore Rules test mode болгох!

