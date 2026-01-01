# Firebase Storage Security Rules - Одоо оруулах

## 🔒 Storage Rules оруулах:

### Алхмууд:

1. **Firebase Console дээр:**
   - Storage → **Rules** tab руу орох
   - Дээрх rules код-ийг хуулж оруулах
   - **"Publish"** button дарах

---

## 📋 Оруулах Rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // Public images folder (listings, banners) - anyone can read
    match /public/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null; // Only authenticated users can upload
    }
    
    // User-specific uploads
    match /users/{userId}/{allPaths=**} {
      allow read: if true; // Public read
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Listings images
    match /listings/{listingId}/{allPaths=**} {
      allow read: if true; // Anyone can read listing images
      allow write: if request.auth != null; // Authenticated users can upload
    }
    
    // Banners
    match /banners/{allPaths=**} {
      allow read: if true; // Anyone can read banners
      allow write: if request.auth != null; // Only authenticated users can upload
    }
    
    // Default: deny all other access
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

---

## ✅ Rules-ийн тайлбар:

- **`/public/**`** - Хүн бүр уншиж болно, бүртгүүлсэн хүн upload хийж болно
- **`/users/{userId}/**`** - Хүн бүр уншиж болно, зөвхөн өөрийн folder-д upload хийж болно
- **`/listings/**`** - Хүн бүр уншиж болно, бүртгүүлсэн хүн upload хийж болно
- **`/banners/**`** - Хүн бүр уншиж болно, бүртгүүлсэн хүн upload хийж болно
- **Default** - Бусад бүх folder-ууд хориглогдоно

---

## 📍 Хаана оруулах:

1. Firebase Console → **Storage**
2. Дээд талын tabs-аас **"Rules"** tab сонгох
3. Rules editor харагдана
4. Дээрх код-ийг хуулж оруулах
5. **"Publish"** button дарах

---

## ⚠️ Анхаарах зүйл:

- Test mode сонгосон бол одоогоор rules оруулахгүй байж болно (30 хоног)
- Production mode сонгосон бол **одоо rules оруулах шаардлагатай**!
- Rules оруулахгүй бол бүх read/write хориглогдоно

---

**Одоо:** Storage → Rules tab → Дээрх код оруулаад "Publish" дарна уу! ✅

