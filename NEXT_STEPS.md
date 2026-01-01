# ✅ Бүх Rules Оруулсан - Дараагийн Алхмууд

## ✅ Хийгдсэн зүйлс:
- [x] Firebase Storage үүсгэсэн
- [x] Firebase Storage Rules оруулсан
- [x] Firestore Database үүсгэсэн
- [x] Firestore Security Rules оруулсан
- [x] Бүх migration код бичсэн

---

## 🚀 Одоо хийх зүйлс:

### 1. Dev Server Эхлүүлэх

```bash
cd zar-746103b7
npm run dev
```

Dev server эхлэх үед:
- Localhost:5173 дээр ажиллана
- Browser дээр нээх: http://localhost:5173

---

### 2. Testing хийх

#### A. Authentication Test:
1. **Register (Бүртгүүлэх):**
   - `/Register` хуудас руу орох
   - Шинэ account үүсгэх
   - Firebase Console → Authentication дээр хэрэглэгч үүссэн эсэхийг шалгах

2. **Login (Нэвтрэх):**
   - `/Login` хуудас руу орох
   - Бүртгэлтэй email/password ашиглаж нэвтрэх
   - Амжилттай нэвтэрсэн эсэхийг шалгах

#### B. Create Listing Test:
1. Login хийх
2. `/CreateListing` хуудас руу орох
3. Зар үүсгэх:
   - Title, description, price оруулах
   - Зураг upload хийх
   - "Үүсгэх" button дарнах
4. Firebase Console → Firestore → `listings` collection-д үүссэн эсэхийг шалгах
5. Firebase Console → Storage → `listings/` folder-д зураг upload хийгдсэн эсэхийг шалгах

#### C. Home Page Test:
1. `/Home` хуудас руу орох
2. Listings харагдаж байгаа эсэхийг шалгах
3. Search, filter ажиллаж байгаа эсэхийг шалгах

#### D. Chat/Messages Test:
1. Listing detail хуудас дээр "Мессеж илгээх" button дарнах
2. Conversation үүсэх
3. Message илгээх
4. Firebase Console → Firestore → `conversations` болон `messages` collections-д үүссэн эсэхийг шалгах

---

### 3. Firebase Console-д Шалгах

#### Firestore Collections:
- `/users` - Хэрэглэгчийн мэдээлэл
- `/listings` - Зар мэдээлэл
- `/conversations` - Ярилцлага
- `/messages` - Мессеж
- `/banner_ads` - Баннер зар (хэрэв үүсгэсэн бол)
- `/banner_requests` - Баннер захиалга (хэрэв үүсгэсэн бол)
- `/saved_listings` - Хадгалсан зар (хэрэв хадгалсан бол)

#### Storage Folders:
- `/listings/` - Listing зурагнууд
- `/banners/` - Баннер зурагнууд
- `/users/` - User зурагнууд (хэрэв байгаа бол)

---

### 4. Vercel Deployment (Optional)

Хэрэв одоо deploy хийх бол:
1. `VERCEL_DEPLOYMENT_GUIDE.md` файлыг унших
2. Vercel account үүсгэх
3. GitHub repository холбох
4. Environment variables тохируулах
5. Deploy хийх

---

## ⚠️ Хэрэв Алдаа Гарвал:

### Алдаа 1: Firestore Permission Denied
- Firestore Rules зөв оруулсан эсэхийг шалгах
- Firebase Console → Firestore → Rules дээр rules харагдаж байгаа эсэхийг шалгах

### Алдаа 2: Storage Permission Denied
- Storage Rules зөв оруулсан эсэхийг шалгах
- Firebase Console → Storage → Rules дээр rules харагдаж байгаа эсэхийг шалгах

### Алдаа 3: Authentication Failed
- Firebase Console → Authentication → Sign-in method дээр Email/Password идэвхжсэн эсэхийг шалгах

### Алдаа 4: CORS Error
- `.env` файлд Firebase config зөв оруулсан эсэхийг шалгах
- Environment variables нэрүүд зөв эсэхийг шалгах (`VITE_FIREBASE_*`)

---

## 📝 Checklist:

- [ ] Dev server эхлүүлсэн
- [ ] Register test хийсэн
- [ ] Login test хийсэн
- [ ] Create Listing test хийсэн
- [ ] Home page listings харагдаж байгаа
- [ ] Chat/Messages test хийсэн
- [ ] Firebase Console дээр өгөгдлүүд үүссэн эсэхийг шалгасан

---

## 🎯 Дараагийн Алхмууд:

1. **Одоо:** Dev server эхлүүлж, testing хийх
2. **Дараа нь:** Асуудлууд засах (хэрэв байгаа бол)
3. **Сүүлд:** Vercel deployment хийх

---

**Одоо:** Dev server эхлүүлээд test хийж эхлээрэй! 🚀

