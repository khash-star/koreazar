# Firebase Storage 403 Forbidden Алдааны Засвар

## ✅ Зассан зүйл

`storage.rules` файлд `/images/` folder-д зөвшөөрөл нэмсэн.

## 🔧 Firebase Console дээр хийх зүйл

### 1. Firebase Console руу орох
1. https://console.firebase.google.com руу оч
2. **koreazar-32e7a** project сонгох

### 2. Storage Rules засах
1. Left menu → **Storage** → **Rules** tab руу орох
2. Дараах rules код-ийг хуулж оруулах:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // Images folder (for listing images) - anyone can read, authenticated users can upload
    match /images/{allPaths=**} {
      allow read: if true; // Anyone can read images
      allow write: if request.auth != null; // Only authenticated users can upload
    }
    
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

3. **"Publish"** button дарах

### 3. Шалгах
- Зураг upload хийх оролдлого хийх
- 403 Forbidden алдаа гарахгүй байх ёстой

## 📝 Тайлбар

**Асуудал:** 
- `storageService.js` дээр зураг `images/` folder-д upload хийж байсан
- Гэхдээ `storage.rules` дээр `/images/` folder-д зөвшөөрөл байгаагүй
- Тиймээс 403 Forbidden алдаа гарч байсан

**Засвар:**
- `/images/{allPaths=**}` match нэмсэн
- Бүх хүн уншиж болно (`allow read: if true`)
- Зөвхөн нэвтэрсэн хэрэглэгчид upload хийж болно (`allow write: if request.auth != null`)

