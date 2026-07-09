# Firebase Өгөгдөл Сэргээх

## ⚠️ Одоогийн асуудал

Firebase config өөрчлөгдсөний дараа зарууд харагдахгүй болсон. Энэ нь:
1. Firestore rules асуудал байна
2. Firebase project өөрчлөгдсөн (carsmongolia-d410a руу шилжсэн)
3. Өмнөх project-ийн өгөгдөл байсан байх

## ✅ Шийдэл

### Алхам 1: Firestore Rules Test Mode болгох

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

### Алхам 2: Өмнөх Firebase Project-ийн Config ашиглах (хэрэв байвал)

Хэрэв өмнөх Firebase project байсан бол:
1. Firebase Console → Өмнөх project сонгох
2. Project Settings → General → Your apps → Web app → Config
3. `.env` файлд өмнөх config-ийг оруулах

### Алхам 3: Dev Server дахин эхлүүлэх

```bash
# Terminal дээр Ctrl+C
npm run dev
```

### Алхам 4: Browser refresh

- `Ctrl+Shift+R` (hard refresh)

---

**Хамгийн чухал:** Firestore Rules test mode болгох!

