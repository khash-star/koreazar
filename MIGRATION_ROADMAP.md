# Migration Roadmap - Base44 → Firebase + Vercel

## 🎯 Эхлэхээсээ өмнө

### ✅ Бэлтгэл
- [x] GitHub repository үүсгэх
- [x] Firebase account байгаа
- [ ] Firebase project үүсгэх (`FIREBASE_VERCEL_SETUP.md` харна уу)
- [ ] Vercel account үүсгэх

---

## 📋 Migration Phases

### Phase 1: Firebase Setup (1-2 цаг) ⏱️

**Хийх зүйлс:**
1. Firebase project үүсгэх
2. Firebase Auth идэвхжүүлэх
3. Firestore database үүсгэх
4. Firebase Storage идэвхжүүлэх
5. Firebase config авах
6. `.env` файл үүсгэх

**Файлууд:**
- `src/firebase/config.js` үүсгэх (`config.js.example`-ийг ашиглах)

**Checklist:**
- [ ] Firebase project үүсгэгдсэн
- [ ] Auth, Firestore, Storage идэвхжсэн
- [ ] `.env` файл үүсгэгдсэн
- [ ] `firebase` package суулгасан

---

### Phase 2: Vercel Deploy (30 мин) ⏱️

**Хийх зүйлс:**
1. Vercel account үүсгэх
2. GitHub repository холбох
3. Environment variables тохируулах
4. Deploy хийх

**Checklist:**
- [ ] Vercel дээр project үүсгэгдсэн
- [ ] Environment variables тохируулагдсан
- [ ] Frontend deploy хийгдсэн (одоо base44 SDK байгаа)

---

### Phase 3: Authentication Migration (2-3 цаг) ⏱️

**Хийх зүйлс:**
1. Firebase Auth service үүсгэх
2. Login page үүсгэх
3. Register page үүсгэх
4. Auth context/provider үүсгэх
5. `base44.auth.*` → `firebase.auth.*` солих

**Файлууд:**
- `src/services/authService.js` - Firebase auth wrapper
- `src/contexts/AuthContext.jsx` - Auth context
- `src/pages/Login.jsx` - Login page (шинэ)
- `src/pages/Register.jsx` - Register page (шинэ)

**Солих шаардлагатай файлууд:**
- `src/pages/Layout.jsx` - `base44.auth.me()` → Firebase auth
- `src/pages/CreateListing.jsx` - Auth checks
- `src/pages/MyListings.jsx` - Auth checks
- Бүх файлууд дээр `base44.auth.*` ашигласан газар

**Checklist:**
- [ ] Auth service үүсгэгдсэн
- [ ] Login/Register pages үүсгэгдсэн
- [ ] Auth context тохируулагдсан
- [ ] Бүх auth checks солигдсон
- [ ] Login flow ажиллаж байгаа

---

### Phase 4: Database Schema Design (1 цаг) ⏱️

**Хийх зүйлс:**
1. Firestore collections тодорхойлох
2. Data structure тодорхойлох
3. Indexes тохируулах

**Collections:**
```
/users
  - email (string)
  - displayName (string)
  - role (string: 'user' | 'admin')
  - phone, kakao_id, wechat_id, etc.

/listings
  - title, description, price
  - category, subcategory
  - location, images
  - status: 'pending' | 'active' | 'inactive'
  - created_by (user email)
  - created_date (timestamp)
  - views, listing_type

/banner_ads
  - image_url, link
  - order, is_active
  - created_by, created_date

/banner_requests
  - image_url, link, status
  - created_by, created_date

/saved_listings
  - listing_id, created_by

/conversations
  - participant_1, participant_2
  - last_message, last_message_date
  - unread_count_p1, unread_count_p2

/messages
  - conversation_id, sender_email
  - message, is_read
  - created_date
```

**Checklist:**
- [ ] Schema тодорхойлогдсон
- [ ] Firestore дээр collections үүсгэгдсэн (эсвэл code-оор)

---

### Phase 5: Backend API (Vercel Functions) (4-6 цаг) ⏱️

**Хийх зүйлс:**
1. Vercel API routes үүсгэх
2. Firebase Admin SDK тохируулах
3. API endpoints бичих

**API Structure:**
```
api/
  auth/
    login.js
    register.js
    me.js
  listings/
    index.js          # GET, POST /api/listings
    [id].js           # GET, PUT, DELETE /api/listings/:id
  banners/
    index.js
    [id].js
  conversations/
    index.js
    [id].js
  messages/
    index.js
    [id].js
  upload/
    index.js          # POST /api/upload
```

**Файлууд:**
- `api/_lib/firebaseAdmin.js` - Firebase Admin initialization
- `api/_lib/auth.js` - Auth middleware
- API route files

**Checklist:**
- [ ] API routes үүсгэгдсэн
- [ ] Firebase Admin тохируулагдсан
- [ ] Auth middleware ажиллаж байгаа
- [ ] Listings CRUD ажиллаж байгаа
- [ ] Upload endpoint ажиллаж байгаа

---

### Phase 6: Frontend API Client (2-3 цаг) ⏱️

**Хийх зүйлс:**
1. API client үүсгэх (axios)
2. `base44.entities.*` → API calls солих
3. Error handling
4. Loading states

**Файлууд:**
- `src/api/apiClient.js` - Axios instance
- `src/api/endpoints.js` - API endpoints
- `src/services/listingService.js` - Listing operations
- `src/services/bannerService.js` - Banner operations
- `src/services/conversationService.js` - Chat operations

**Солих шаардлагатай файлууд:**
- `src/pages/Home.jsx` - Listings fetch
- `src/pages/CreateListing.jsx` - Listing create
- `src/pages/EditListing.jsx` - Listing update
- `src/pages/ListingDetail.jsx` - Listing detail
- `src/pages/Admin*.jsx` - Admin operations
- `src/pages/Chat.jsx` - Chat operations
- `src/pages/Messages.jsx` - Messages
- Бусад бүх файлууд

**Checklist:**
- [ ] API client үүсгэгдсэн
- [ ] Services үүсгэгдсэн
- [ ] Бүх `base44.entities.*` солигдсон
- [ ] Error handling тохируулагдсан

---

### Phase 7: File Upload Migration (1-2 цаг) ⏱️

**Хийх зүйлс:**
1. Firebase Storage upload function
2. `base44.integrations.Core.UploadFile` → Firebase Storage солих
3. Image compression (одоо байгаа imageCompressor.js ашиглах)

**Файлууд:**
- `src/services/storageService.js` - Firebase Storage wrapper

**Солих шаардлагатай файлууд:**
- `src/pages/CreateListing.jsx` - Image upload
- `src/pages/EditListing.jsx` - Image upload
- `src/pages/AdminBanners.jsx` - Banner upload
- `src/pages/RequestBannerAd.jsx` - Banner upload

**Checklist:**
- [ ] Storage service үүсгэгдсэн
- [ ] Upload functions солигдсон
- [ ] Files Firebase Storage-д хадгалагдаж байгаа

---

### Phase 8: Testing & Cleanup (2-3 цаг) ⏱️

**Хийх зүйлс:**
1. Бүх функцүүдийг турших
2. Error cases шалгах
3. Base44 SDK uninstall
4. Unused code устгах
5. Documentation update

**Checklist:**
- [ ] Бүх pages ажиллаж байгаа
- [ ] Authentication ажиллаж байгаа
- [ ] CRUD operations ажиллаж байгаа
- [ ] File upload ажиллаж байгаа
- [ ] Chat/Messages ажиллаж байгаа
- [ ] Admin functions ажиллаж байгаа
- [ ] Base44 SDK uninstall хийгдсэн
- [ ] Production deploy хийгдсэн

---

## ⏱️ Нийт цаг: ~14-20 цаг

## 🎯 Priority Order

1. **Phase 1-2** - Setup (Vercel deploy хийгдсэн байх хэрэгтэй)
2. **Phase 3** - Authentication (Хамгийн чухал)
3. **Phase 4-5** - Backend API (Database + API routes)
4. **Phase 6** - Frontend integration
5. **Phase 7** - File upload
6. **Phase 8** - Testing

---

## 🚨 Анхаарах зүйлс

1. **Data Migration**: Base44-с өгөгдөл migration хийх шаардлагатай (хэрэв байгаа бол)
2. **User Migration**: Бүх хэрэглэгчид дахин бүртгүүлэх шаардлагатай (Firebase Auth-д)
3. **File Migration**: Бүх файлуудыг Firebase Storage-д шилжүүлэх
4. **Testing**: Production-д орохоос өмнө бүх зүйлийг тест хийх

---

## 📝 Next Step

**Одоо хийх зүйл:**
1. `FIREBASE_VERCEL_SETUP.md` файлыг унших
2. Firebase project үүсгэх
3. Vercel дээр deploy хийх
4. Phase 3-аас эхлэх (Authentication)

