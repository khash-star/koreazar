# Firestore Database Setup Guide

## 🔥 Firestore Database үүсгэх

### Алхмууд:

1. **Firebase Console руу оч**
   - URL: https://console.firebase.google.com
   - "koreazar-32e7a" project сонгох

2. **Firestore Database олох**
   - Зүүн талын navigation-оос "Build" → "Firestore Database" дээр дарах
   - Эсвэл зөвхөн "Firestore Database" хайж олох

3. **Create database button дарах**
   - "Create database" button харагдана

4. **Security rules сонгох**
   - ✅ **"Start in test mode"** сонгох (development-д тохиромжтой)
   - Test mode нь 30 хоног ашиглах боломжтой
   - Дараа нь production rules-оор солих хэрэгтэй

5. **Location сонгох**
   - **Recommendation:** `asia-northeast1` (Tokyo) - Монгол руу хамгийн ойр
   - Эсвэл `asia-northeast2` (Osaka)
   - Эсвэл `asia-east1` (Taiwan)
   - ⚠️ Location-ийг сольж болохгүй, анхаарах!

6. **Enable button дарах**
   - Database үүсгэгдэхийг хүлээх (1-2 минут)

---

## ✅ Database үүсгэгдсэний дараа

Firestore Database үүсгэгдсэний дараа:

1. **Collections автоматаар үүснэ** (code-оор create хийх үед)
2. **Өгөгдлүүд хадгалагдана**

### Collections (автоматаар үүснэ):
- `/users` - Хэрэглэгчийн мэдээлэл
- `/listings` - Зар мэдээлэл
- `/banner_ads` - Баннер зар
- `/banner_requests` - Баннер захиалга
- `/saved_listings` - Хадгалсан зар
- `/conversations` - Ярилцлага
- `/messages` - Мессеж

---

## 🔒 Security Rules (30 хоногийн дараа)

Test mode 30 хоногийн дараа дуусана. Дараа нь дараах production rules ашиглах:

### Firestore Rules

Firebase Console → Firestore Database → Rules дээр:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is admin
    function isAdmin() {
      return request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Helper function to check if user owns the resource
    function isOwner(userEmail) {
      return request.auth != null && request.auth.token.email == userEmail;
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
      allow read: if request.auth != null && 
        get(/databases/$(database)/documents/conversations/$(resource.data.conversation_id)).data.participant_1 == request.auth.token.email ||
        get(/databases/$(database)/documents/conversations/$(resource.data.conversation_id)).data.participant_2 == request.auth.token.email;
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
        resource.data.sender_email == request.auth.token.email;
    }
  }
}
```

---

## 📝 Одоо хийх зүйлс

1. ✅ Firebase Storage үүсгэсэн
2. ⏭️ **Firestore Database үүсгэх** (одоо хийх)
3. ⏭️ **Dev server эхлүүлэх** (`npm run dev`)
4. ⏭️ **Testing хийх**

---

## 🎯 Дараагийн алхмууд

Firestore үүсгэсний дараа:
1. Dev server эхлүүлэх
2. Login/Register test хийх
3. Listing create test хийх
4. Chat/Messages test хийх

---

**Одоо:** Firebase Console дээр Firestore Database үүсгэх цаг! 🔥

