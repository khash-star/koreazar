# 🔍 Debug: Админ баталгаажуулсан зар харагдахгүй

## ⚠️ Асуудал:
Админ заруудыг баталгаажуулсны дараа Home хуудас дээр харагдахгүй байна.

## 🔍 Шалгах зүйлс:

### 1. Browser Console шалгах (F12):
Админ "Батлах" товч дарах үед:
- ✅ `Updating listing: [ID] with data: { status: 'active', ... }`
- ✅ `Listing updated successfully: [ID]`

**Хэрэв алдаа гарч байвал:**
- ❌ `Error updating listing: ...`
- Firebase permission алдаа

---

### 2. Firestore Console шалгах:
1. Firebase Console → Firestore Database → Data
2. `listings` collection-ийг харах
3. Баталгаажуулсан зарын `status` field-ийг шалгах:
   - ✅ `status: 'active'` байх ёстой
   - ❌ Хэрэв `status: 'pending'` байвал update хийгдээгүй

---

### 3. Firestore Security Rules шалгах:
Firebase Console → Firestore → Rules дээр:

```javascript
match /listings/{listingId} {
  allow update: if request.auth != null && 
    (resource.data.created_by == request.auth.token.email || isAdmin());
}
```

Админ update хийх эрхтэй эсэхийг шалгах (`isAdmin()` функц байгаа эсэх).

---

### 4. Cache Refresh шалгах:

Одоо код дээр:
- ✅ `queryClient.invalidateQueries({ queryKey: ['listings'] })` - Бүх listings query-үүд invalidate хийгдэх ёстой
- ✅ `queryClient.refetchQueries({ queryKey: ['listings'] })` - Шууд refetch хийх

**Одоо:** Browser refresh хийх (Ctrl+R) - Энэ нь cache-ийг цэвэрлэх бөгөөд шинээр Firestore-аас авах.

---

## 🔧 Зассан зүйлс:

1. ✅ `updateListing` функц дээр console.log нэмсэн
2. ✅ Cache invalidation сайжруулсан - бүх listings query invalidate хийх
3. ✅ Immediate refetch нэмсэн - шууд шинээр авах

---

## 🧪 Тест хийх:

1. **Browser Console нээх (F12)**
2. **AdminNewListings хуудас руу орох**
3. **Зар баталгаажуулах** ("Батлах" товч дарах)
4. **Console шалгах:**
   - "Updating listing: ..." мессеж харагдах ёстой
   - "Listing updated successfully" мессеж харагдах ёстой
5. **Firestore Console шалгах:**
   - Зарын `status` field `'active'` болсон эсэх
6. **Home хуудас руу орох:**
   - Browser refresh (F5)
   - Зарууд харагдах ёстой

---

## ⚠️ Хэрэв харагдахгүй бол:

1. **Firestore Indexes шалгах:**
   - Console дээр "The query requires an index" алдаа гарч байгаа эсэх
   - Хэрэв гарвал алдааны холбоос дараад индекс үүсгэнэ үү

2. **Firestore Rules шалгах:**
   - Админ update хийх эрхтэй эсэх

3. **Browser Cache цэвэрлэх:**
   - Ctrl+Shift+R (hard refresh)
   - Эсвэл DevTools → Network → Disable cache

---

**Одоо:** Админ заруудыг баталгаажуулаад, Console болон Firestore-ийг шалгана уу! 🔍

