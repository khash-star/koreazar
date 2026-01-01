# Firestore Production Rules - Одоо оруулах

## ⚠️ Production Mode сонгосон бол:

Production mode сонгосон бол одоо security rules оруулах шаардлагатай, эс тэгвэл бүх read/write хориглогдоно!

---

## 🔒 Одоо оруулах Rules:

Firebase Console → Firestore Database → Rules дээр дараах код оруулах:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is admin
    function isAdmin() {
      return request.auth != null && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
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
        (resource.data.created_by == request.auth.token.email || isAdmin());
    }
    
    // Banner ads - Admin only
    match /banner_ads/{bannerId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    // Banner requests
    match /banner_requests/{requestId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if isAdmin();
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

## 📋 Алхмууд:

1. Firebase Console → Firestore Database → **Rules** tab руу орох
2. Дээрх rules код-ийг хуулж оруулах
3. **"Publish"** button дарах
4. Rules идэвхжснийг шалгах

---

## ✅ Rules-ийн тайлбар:

- **Users:** Хүн бүр уншиж болно, зөвхөн өөрийн мэдээллийг засах болно
- **Listings:** Хүн бүр уншиж болно, бүртгүүлсэн хүн үүсгэж болно, зөвхөн эзэмшлийн эсвэл админ засах/устгаж болно
- **Banner ads:** Хүн бүр уншиж болно, зөвхөн админ засах болно
- **Banner requests:** Бүртгүүлсэн хүн үүсгэж болно, зөвхөн админ засах болно
- **Conversations/Messages:** Зөвхөн ярилцлагын оролцогчид уншиж/засах болно

---

## ⚠️ Анхаарах зүйл:

- Production mode-д rules оруулахгүй бол **бүх read/write хориглогдоно**!
- Rules оруулсны дараа test хийх шаардлагатай
- Хэрэв алдаа гарвал, дээрх rules-ийг дахин шалгана уу

---

**Одоо:** Дээрх rules оруулаад "Publish" дарна уу! ✅

