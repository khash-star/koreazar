# 🔐 Админ эрх өгөх заавар

## 📋 Админ системийн тайлбар:

Админ эрхийг Firestore `users` collection дээрх `role` field-ээр удирддаг.

- **`role: 'user'`** - Энгийн хэрэглэгч (default)
- **`role: 'admin'`** - Админ хэрэглэгч

---

## 🔧 Админ эрх өгөх (2 арга):

### **Арга 1: Firebase Console-оос (ХАМГИЙН ХУРДАН!)**

1. **Firebase Console** → **Firestore Database** → **Data** таб
2. `users` collection-ийг олох
3. Админ эрх өгөх хэрэглэгчийн document-ийг олох
   - Хэрэв байхгүй бол: User ID (Firebase Auth-аас) ашиглан шинээр үүсгэх
4. Document дээр дарж, `role` field нэмэх:
   ```
   Field: role
   Type: string
   Value: admin
   ```
5. **Save** (Update) дарах

---

### **Арга 2: Firebase Auth UID ашиглах**

1. Firebase Console → **Authentication** → **Users** таб
2. Админ болгох хэрэглэгчийн **UID**-г хуулж авах
3. Firebase Console → **Firestore Database** → **Data** таб
4. `users` collection руу орох
5. **Add document** → Document ID: (UID-г оруулах)
6. Fields нэмэх:
   ```
   Field: email (string) - хэрэглэгчийн имэйл
   Field: role (string) - admin
   Field: displayName (string) - хэрэглэгчийн нэр
   Field: createdAt (timestamp) - одоогийн цаг
   ```
7. **Save** дарах

---

## ✅ Шалгах:

1. Хэрэглэгч logout хийгээд дахин login хийх
2. Admin хуудсууд руу орох оролдох:
   - `/AdminPanel`
   - `/AdminNewListings`
   - `/AdminAllListings`
   - `/AdminBanners`
   - `/AdminBannerRequests`

3. Хэрэв админ эрхтэй бол хуудсууд ажиллах ёстой
4. Хэрэв админ эрхгүй бол "Хандах эрхгүй" мессеж харагдана

---

## 🔒 Firestore Security Rules:

Firestore rules дээр админ check байгаа:

```javascript
function isAdmin() {
  return request.auth != null && 
    exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}
```

Энэ нь Firestore дээрх операциуд (banner ads, banner requests update) зөвхөн админ хийх боломжтой гэсэн үг.

---

## 🎯 Админ хуудсууд:

- ✅ **AdminPanel** - Админ удирдлагын үндсэн хуудас
- ✅ **AdminNewListings** - Шинэ заруудыг батлах
- ✅ **AdminAllListings** - Бүх заруудыг удирдах
- ✅ **AdminBanners** - Баннер зар удирдах
- ✅ **AdminBannerRequests** - Баннер зарын хүсэлтүүдийг удирдах

---

## ⚠️ Анхаарах зүйлс:

1. **UID зөв байх ёстой**: `users` collection дээрх document ID нь Firebase Auth-ийн UID-тай ижил байх ёстой
2. **Role field**: `role` field нь яг `'admin'` байх ёстой (lowercase, тэмдэглэлгүй)
3. **Logout/Login**: Эрх өгсний дараа хэрэглэгч logout/login хийх шаардлагатай (AuthContext шинэчлэгдэх үүднээс)

---

**Одоо:** Firebase Console дээр хэрэглэгчдэд админ эрх өгөөд, Admin хуудсуудыг тест хийж үзнэ үү! 🚀

