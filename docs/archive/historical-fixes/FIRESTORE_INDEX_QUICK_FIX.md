# 🔥 Firestore Index засах заавар

## ⚠️ Асуудал:
Console дээр "The query requires an index" алдаа гарч байна.

## ✅ Шалтгаан:
Firestore дээр `where` болон `orderBy` хамт ашиглахад **composite index** шаардлагатай.

---

## 🔧 Засах арга:

### **Арга 1: Console дээрх холбоос ашиглах (ХАМГИЙН ХУРДАН!)**

1. Browser Console дээр алдааны мессежийг олох:
   ```
   Error filtering listings: FirebaseError: The query requires an index. 
   You can create it here: https://console.firebase.google.com/v1/r/project/...
   ```

2. Энэ холбоос дээр дарах
3. Firebase Console дээр нээгдэх
4. **"Create Index"** товч дарах
5. Индекс үүсэх хүртэл хүлээх (1-2 минут)

---

### **Арга 2: Гараар индекс үүсгэх**

1. Firebase Console → **Firestore Database** → **Indexes** таб
2. **"Create Index"** товч дарах
3. Дараах тохиргоонуудыг оруулах:

#### **Index 1: listings - status + created_date**
- Collection ID: `listings`
- Fields to index:
  - Field: `status` | Order: **Ascending**
  - Field: `created_date` | Order: **Descending**
- Query scope: **Collection**

#### **Index 2: listings - created_by + created_date** (MyListings хувьд)
- Collection ID: `listings`
- Fields to index:
  - Field: `created_by` | Order: **Ascending**
  - Field: `created_date` | Order: **Descending**
- Query scope: **Collection**

#### **Index 3: listings - category + status + created_date** (Хэрэв category filter ашиглаж байвал)
- Collection ID: `listings`
- Fields to index:
  - Field: `category` | Order: **Ascending**
  - Field: `status` | Order: **Ascending**
  - Field: `created_date` | Order: **Descending**
- Query scope: **Collection**

4. **"Create"** товч дарах
5. Индекс "Building..." → "Enabled" болтол хүлээх

---

## 🧪 Шалгах:

Индекс үүсээд дууссаны дараа:
1. Browser cache цэвэрлэх (Ctrl+Shift+R)
2. Home хуудас дахин ачаалах
3. Console дээр алдаа гарахгүй байх ёстой

---

## 📝 Тайлбар:

Firestore дээр:
- ✅ Зөвхөн `where` → Index шаардлагагүй
- ✅ Зөвхөн `orderBy` → Index шаардлагагүй
- ❌ `where` + `orderBy` → **Composite index шаардлагатай!**

Тиймээс `status: 'active'` шүүж, `created_date`-ээр эрэмбэлэхэд индекс шаардлагатай.

---

**Одоо:** Console дээрх холбоос дараад индекс үүсгэнэ үү! 🚀

