# Firebase Security Rules Одоо Оруулах

## ⚠️ Одоогийн асуудал

Console дээр "Missing or insufficient permissions" алдаа гарч байна. Энэ нь Firestore Security Rules оруулаагүй эсвэл буруу байгааг илтгэж байна.

## ✅ Шийдэл (2 минут)

### Алхам 1: Firebase Console руу орох

1. Browser дээр: https://console.firebase.google.com
2. **carsmongolia-d410a** project сонгох
3. Left menu → **Firestore Database** → **Rules** tab

### Алхам 2: Test Mode Rules оруулах (Development-д)

**Test Mode Rules (30 хоног хүртэл ашиглах):**

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

**Эсвэл Production Rules (firestore.rules файлд байгаа):**

Firebase Console → Firestore Database → Rules дээр `firestore.rules` файлын агуулгыг хуулж оруулах.

### Алхам 3: Rules Publish хийх

1. Rules оруулсны дараа
2. "Publish" button дарах
3. Хүлээх (хэдхэн секунд)

### Алхам 4: Browser refresh

- `Ctrl+Shift+R` (hard refresh)
- Console дээрх "Missing or insufficient permissions" алдаа арилах ёстой

## 📋 Production Rules (30 хоногийн дараа)

30 хоногийн дараа test mode rules дуусна. Дараа нь `firestore.rules` файлд байгаа production rules ашиглах.

---

**Хамгийн чухал:** Firebase Console → Firestore Database → Rules → Rules оруулах → Publish!

