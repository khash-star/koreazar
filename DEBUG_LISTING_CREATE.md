# Debug: Зар үүсгэх алдаа засах

## ⚠️ Асуудал:
Зар үүсгэх үед "Зар олдсонгүй" гэж гарч байна.

## 🔍 Шалгах зүйлс:

### 1. Browser Console шалгах (F12):
Зар үүсгэх үед console дээр дараах мессежүүд харагдах ёстой:
- ✅ `Creating listing with data: {...}`
- ✅ `Listing created successfully with ID: ...`
- ✅ `Navigating to listing detail: ...`

**Хэрэв алдаа гарч байвал:**
- ❌ `Error creating listing: ...`
- ❌ Firebase алдааны мессеж

---

### 2. Firestore Console шалгах:
1. Firebase Console → Firestore Database → **Data**
2. `listings` collection-ийг харах
3. Listing үүссэн эсэхийг шалгах

**Хэрэв listing байхгүй бол:**
- Firestore rules алдаа байж магадгүй
- Permission denied алдаа байж магадгүй

---

### 3. Firestore Security Rules шалгах:
Firebase Console → Firestore → Rules дээр:

```javascript
match /listings/{listingId} {
  allow read: if true;
  allow create: if request.auth != null; // ✅ Энэ байх ёстой
  ...
}
```

---

### 4. Console дээрх алдааг шалгах:

**Алдаа 1: Permission denied**
```
FirebaseError: Missing or insufficient permissions
```
**Засах:** Firestore Rules дээр `allow create: if request.auth != null;` байгаа эсэхийг шалгах

**Алдаа 2: User not authenticated**
```
Error: Хэрэглэгчийн мэдээлэл олдсонгүй
```
**Засах:** Нэвтэрсэн эсэхийг шалгах, AuthContext зөв ажиллаж байгаа эсэхийг шалгах

**Алдаа 3: Network error**
```
Network request failed
```
**Засах:** Интернэт холболт, Firebase config зөв байгаа эсэхийг шалгах

---

## 🔧 Зассан зүйлс:

1. ✅ `createMutation` дээр `onError` handler нэмсэн
2. ✅ Console дээр алдааны мессеж харагдана
3. ✅ `createListing` функц дээр user email check нэмсэн
4. ✅ Console logging нэмсэн

---

## 🧪 Тест хийх:

1. Browser Console нээх (F12)
2. Зар үүсгэх
3. Console дээрх мессежүүдийг шалгах:
   - "Creating listing with data" харагдах ёстой
   - "Listing created successfully" харагдах ёстой
   - Эсвэл алдааны мессеж харагдана

---

**Одоо:** Зар үүсгэх оролдоод, Console дээрх алдааны мессежийг хуулж илгээнэ үү! 🔍

