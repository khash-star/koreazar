# Firebase Storage Security Rules

## Одоо хийх зүйл

### 1. Test Mode сонгох (Development-д)

**Firebase Console дээр:**
- ✅ **"Start in test mode"** сонгох
- "Create" button дарах

Энэ нь 30 хоног ашиглах боломжтой. Дараа нь production rules-оор солих хэрэгтэй.

---

## Production Security Rules (Дараа нь)

30 хоногийн дараа эсвэл одоо production-д deploy хийх үед дараах rules ашиглах:

### Storage Rules

Firebase Console → Storage → Rules дээр дараах rules оруулах:

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

## Firestore Security Rules (Мөн хэрэгтэй)

Firebase Console → Firestore Database → Rules дээр:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users collection
    match /users/{userId} {
      allow read: if true; // Anyone can read user profiles
      allow write: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null && request.auth.uid == userId;
    }
    
    // Listings collection
    match /listings/{listingId} {
      allow read: if true; // Anyone can read listings
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        (resource.data.created_by == request.auth.token.email || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
    
    // Banner ads
    match /banner_ads/{bannerId} {
      allow read: if true;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Banner requests
    match /banner_requests/{requestId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Saved listings
    match /saved_listings/{savedId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow delete: if request.auth != null && 
        resource.data.created_by == request.auth.token.email;
    }
    
    // Conversations
    match /conversations/{conversationId} {
      allow read: if request.auth != null && 
        (resource.data.participant_1 == request.auth.token.email || 
         resource.data.participant_2 == request.auth.token.email);
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
        (resource.data.participant_1 == request.auth.token.email || 
         resource.data.participant_2 == request.auth.token.email);
    }
    
    // Messages
    match /messages/{messageId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
        resource.data.sender_email == request.auth.token.email;
    }
  }
}
```

---

## Одоо хийх алхмууд

1. ✅ **Storage:** "Start in test mode" сонгоод "Create" дарах
2. ✅ **Firestore:** Test mode сонгоод үүсгэх (хэрэв хийгээгүй бол)
3. ⚠️ **30 хоногийн дараа:** Дээрх production rules-уудыг оруулах

---

## Анхаарах зүйлс

- **Test mode** нь зөвхөн development-д ашиглах
- Production-д орохоос өмнө security rules тохируулах
- Admin users-д `role: 'admin'` field нэмэх хэрэгтэй (users collection дээр)

