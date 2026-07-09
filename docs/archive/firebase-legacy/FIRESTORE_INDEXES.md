# Firestore Indexes - Үүсгэх заавар

## ⚠️ Console дээр алдаа гарч байна!

Firestore дээр queries хийхэд indexes шаардлагатай байна. Дараах indexes-үүдийг үүсгэх хэрэгтэй:

---

## 🔥 Firestore Indexes үүсгэх:

### Арга 1: Firebase Console-оос (Хамгийн хурдан)

1. **Console дээрх алдааны link-ийг дарах:**
   - Console дээр "You can create it here" link-ийг дарах
   - Firebase Console руу автоматаар орох

2. **Эсвэл:**
   - Firebase Console → Firestore Database → **Indexes** tab
   - "Create Index" button дарна

3. **Index үүсгэх:**
   - Collection сонгох
   - Fields нэмэх
   - Query scope сонгох
   - "Create" дарна

---

## 📋 Шаардлагатай Indexes:

### 1. Listings Collection Indexes:

#### Index 1: Filter by status + Order by created_date
```
Collection: listings
Fields:
  - status (Ascending)
  - created_date (Descending)
Query scope: Collection
```

#### Index 2: Filter by created_by + Order by created_date
```
Collection: listings
Fields:
  - created_by (Ascending)
  - created_date (Descending)
Query scope: Collection
```

#### Index 3: Filter by status + category + Order by created_date
```
Collection: listings
Fields:
  - status (Ascending)
  - category (Ascending)
  - created_date (Descending)
Query scope: Collection
```

#### Index 4: Filter by status + subcategory + Order by created_date
```
Collection: listings
Fields:
  - status (Ascending)
  - subcategory (Ascending)
  - created_date (Descending)
Query scope: Collection
```

#### Index 5: Filter by status + location + Order by created_date
```
Collection: listings
Fields:
  - status (Ascending)
  - location (Ascending)
  - created_date (Descending)
Query scope: Collection
```

---

### 2. Banner Ads Collection Indexes:

#### Index 1: Filter by is_active + Order by order
```
Collection: banner_ads
Fields:
  - is_active (Ascending)
  - order (Ascending)
Query scope: Collection
```

---

### 3. Conversations Collection Indexes:

#### Index 1: Filter by participant_1
```
Collection: conversations
Fields:
  - participant_1 (Ascending)
  - last_message_date (Descending)
Query scope: Collection
```

#### Index 2: Filter by participant_2
```
Collection: conversations
Fields:
  - participant_2 (Ascending)
  - last_message_date (Descending)
Query scope: Collection
```

---

### 4. Messages Collection Indexes:

#### Index 1: Filter by conversation_id + Order by created_date
```
Collection: messages
Fields:
  - conversation_id (Ascending)
  - created_date (Descending)
Query scope: Collection
```

---

### 5. Saved Listings Collection Indexes:

#### Index 1: Filter by created_by
```
Collection: saved_listings
Fields:
  - created_by (Ascending)
  - created_date (Descending)
Query scope: Collection
```

---

### 6. Banner Requests Collection Indexes:

#### Index 1: Filter by created_by + Order by created_date
```
Collection: banner_requests
Fields:
  - created_by (Ascending)
  - created_date (Descending)
Query scope: Collection
```

---

## 🚀 Хурдан арга - Console алдаа ашиглах:

**Хамгийн хурдан арга:**
1. Browser console дээр алдаа гарч байгаа link-ийг **дарах**
2. Firebase Console руу автоматаар орох
3. Index үүсгэх form автоматаар бөглөгдсөн байх
4. **"Create Index"** button дарна
5. Index үүсгэгдэхийг хүлээх (1-2 минут)

---

## ⚠️ Анхаарах зүйлс:

- Index үүсгэхэд 1-2 минут зарцуулагдана
- Хэрэв олон index үүсгэх шаардлагатай бол, бүгдийг нь нэг дор үүсгэх боломжтой
- Index үүсгэсний дараа page refresh хийх

---

**Одоо:** Console дээрх алдааны link-ийг дараад index үүсгэнэ үү! 🔥

