# Complete Migration Plan - Бүх үйлдлийг Migration хийх

## 📊 Одоогийн байдал

### ✅ Хийгдсэн зүйлс
- [x] Firebase config үүсгэсэн
- [x] Authentication service үүсгэсэн (authService.js)
- [x] Auth Context үүсгэсэн (AuthContext.jsx)
- [x] Login/Register pages үүсгэсэн
- [x] Storage service үүсгэсэн (storageService.js)
- [x] CreateListing - Firebase Storage ашиглах
- [x] EditListing - Firebase Storage ашиглах
- [x] AdminBanners - Firebase Storage ашиглах
- [x] RequestBannerAd - Firebase Storage ашиглах
- [x] Layout.jsx - Firebase Auth ашиглах
- [x] CreateListing.jsx - Firebase Auth ашиглах

### ⚠️ Хийгдэх ёстой зүйлс
- [ ] Firestore Database schema үүсгэх
- [ ] Backend API (Vercel Functions) үүсгэх
- [ ] Frontend API services үүсгэх
- [ ] Бүх base44.entities.* солих
- [ ] Vercel deployment

---

## 🎯 Migration Timeline

### Phase 1: Firestore Database Setup (Одоо хийх) ⏱️ 30 мин

**Firebase Console дээр:**
1. Firestore Database үүсгэх
2. Collections үүсгэх (code-оор эсвэл manually)

**Collections:**
```
/users
/listings
/banner_ads
/banner_requests
/saved_listings
/conversations
/messages
```

---

### Phase 2: Vercel Deployment (Authentication ажиллаж эхэлсний дараа) ⏱️ 1 цаг

**Хэзээ хийх:** Authentication migration хийгдсэн, Login/Register ажиллаж байгаа үед

**Алхмууд:**
1. Vercel account үүсгэх
2. GitHub repository холбох
3. Environment variables тохируулах
4. Deploy хийх

**Дэлгэрэнгүй:** `FIREBASE_VERCEL_SETUP.md` файлд байна

---

### Phase 3: Firestore Services (Phase 2-ийн дараа) ⏱️ 2-3 цаг

**Хийх зүйлс:**
- Listing service (Firestore CRUD)
- Banner service
- Conversation/Message service
- SavedListing service

---

### Phase 4: Frontend Integration (Phase 3-ийн дараа) ⏱️ 3-4 цаг

**Солих файлууд:**
- Home.jsx - Listings fetch
- ListingDetail.jsx - Listing detail
- MyListings.jsx - User listings
- Admin*.jsx - Admin operations
- Chat.jsx - Conversations
- Messages.jsx - Messages
- SavedListings.jsx - Saved listings

---

## 🚀 VERCEL DEPLOYMENT - Хэзээ хийх

### Хамгийн зөв цаг

**✅ Одоо хийж болно:**
- Frontend л deploy хийх (base44 SDK ашиглаж байгаа ч)
- Environment variables тохируулах
- Custom domain тохируулах

**✅ Эсвэл Phase 3-ийн дараа хийх (санал болгож байна):**
- Firestore services үүсгэсний дараа
- Бүх функцүүд ажиллаж эхэлсний дараа

### Deploy хийх үед:
1. **Frontend** - Vercel дээр deploy
2. **Backend API** - Vercel Functions (дараа нь)

---

## 📋 Дараагийн алхмууд (Priority)

### 1. Firestore Database үүсгэх (Одоо)
- Firebase Console → Firestore Database → Create database
- Test mode сонгох

### 2. Firestore Services үүсгэх (Дараа)
- `src/services/listingService.js`
- `src/services/bannerService.js`
- `src/services/conversationService.js`

### 3. Frontend файлуудыг шинэчлэх
- Home.jsx
- ListingDetail.jsx
- Бүх Admin*.jsx
- Chat.jsx, Messages.jsx

### 4. Vercel Deployment
- GitHub-д push хийх
- Vercel дээр project үүсгэх
- Deploy хийх

---

## ⏱️ Одоо хийх зүйлс

1. **Firestore Database үүсгэх** (Firebase Console дээр)
2. **Vercel account үүсгэх** (хүсвэл)
3. **Firestore services эхлүүлэх** (би код бичиж эхлүүлэх)

Аль нэгийг эхлүүлэх үү?

