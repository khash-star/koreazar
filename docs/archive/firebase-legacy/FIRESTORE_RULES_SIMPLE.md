# Firestore Security Rules - Энгийн хувилбар (Test Mode-д ашиглах)

## ⚠️ Одоогоор Test Mode ашиглаж байгаа бол:

**Test mode-д энгийн rules ашиглах (30 хоног):**

Firebase Console → Firestore Database → Rules дээр дараах код оруулах:

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

Энэ нь 30 хоног хүртэл бүх read/write зөвшөөрнө (test хийхэд тохиромжтой).

---

## 🔒 Production Rules (30 хоногийн дараа эсвэл одоо)

Production-д орох үед дараах rules ашиглах:

`firestore.rules` файлыг харна уу - бүрэн production-ready rules байна.

### Одоо хийх:
1. Firebase Console → Firestore Database → Rules
2. Дээрх test mode rules (эсвэл production rules) оруулах
3. "Publish" button дарах

---

## 📋 Rules-ийн тайлбар:

### Test Mode Rules:
- `allow read, write: if request.time < timestamp.date(2025, 12, 31)` - 2025 оны 12 сарын 31 хүртэл бүх read/write зөвшөөрнө
- Зөвхөн development/test-д ашиглах
- Production-д ашиглахгүй!

### Production Rules:
- **Users:** Хүн бүр уншиж болно, зөвхөн өөрийн мэдээллийг засах болно
- **Listings:** Хүн бүр уншиж болно, бүртгүүлсэн хүн үүсгэж болно, зөвхөн эзэмшлийн эсвэл админ засах/устгаж болно
- **Banner ads:** Хүн бүр уншиж болно, зөвхөн админ засах болно
- **Conversations/Messages:** Зөвхөн ярилцлагын оролцогчид уншиж/засах болно

---

**Одоо:** Test mode rules оруулаад "Publish" дарна уу! ✅

