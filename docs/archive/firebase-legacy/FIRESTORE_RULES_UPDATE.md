# Firestore Rules Update - Messages Permission Fix

## ⚠️ ШИНЭЧЛЭЛ: Messages Collection Rules

Messages collection дээрх update permission-ийг өөрчилсөн. Одоо `receiver_email` нь мессежийг update хийж болно (is_read талбарыг).

## 🔒 Одоо оруулах Rules:

Firebase Console → Firestore Database → Rules дээр messages collection-ийн rules-ийг дараах байдлаар солих:

**Хуучин (алдаатай):**
```javascript
// Messages
match /messages/{messageId} {
  allow read: if request.auth != null;
  allow create: if request.auth != null;
  allow update: if request.auth != null && 
    resource.data.sender_email == request.auth.token.email;
}
```

**Шинэ (зассан):**
```javascript
// Messages
match /messages/{messageId} {
  allow read: if request.auth != null;
  allow create: if request.auth != null;
  allow update: if request.auth != null && 
    (resource.data.sender_email == request.auth.token.email ||
     resource.data.receiver_email == request.auth.token.email);
}
```

## 📋 Алхмууд:

1. Firebase Console → Firestore Database → **Rules** tab руу орох
2. `firestore.rules` файл дээрх шинэ rules-ийг оруулах
3. **"Publish"** button дарах
4. Rules идэвхжснийг шалгах

---

## ✅ Тайлбар:

- **sender_email**: Мессежийг илгээсэн хүн мессежийг засах болно
- **receiver_email**: Мессежийг хүлээн авсан хүн мессежийг засах болно (is_read талбарыг update хийх)
- Энэ нь мессежийг уншсан гэж тэмдэглэхэд шаардлагатай

