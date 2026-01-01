# Vercel Environment Variables Setup

## 📋 Зөв Environment Variables

Vercel Dashboard → Build and Output Settings → Environment Variables дээр дараах variables нэмэх:

### Firebase Configuration:

```
VITE_FIREBASE_API_KEY=AIzaSyA0eE-wKhem4t7I3G-SKz7-f2IMmfWDjSk
VITE_FIREBASE_AUTH_DOMAIN=koreazar-32e7a.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=koreazar-32e7a
VITE_FIREBASE_STORAGE_BUCKET=koreazar-32e7a.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=384960850116
VITE_FIREBASE_APP_ID=1:384960850116:web:7bfcf963b92dace3b24191
```

---

## ⚠️ Анхаарах зүйлс:

1. **VITE_FIREBASE_MESSAGING_SENDER_ID** (буруу: `VITE_FIREBASE_MESSAGING_SENDEF` биш!)
2. **VITE_FIREBASE_APP_ID** утга бүтэн байх ёстой: `1:384960850116:web:7bfcf963b92dace3b24191`

---

## 🔧 Vercel дээр нэмэх:

### Арга 1: .env файл Import хийх

1. `.env.example` файлыг хуулж `.env` болгох (local дээр л)
2. Vercel Dashboard → Build and Output Settings
3. **"Import .env"** button дарах
4. `.env` файл сонгох
5. Variables автоматаар нэмэгдэнэ

### Арга 2: Manual нэмэх

1. Vercel Dashboard → Build and Output Settings
2. **"+ Add More"** button дарах
3. Key: `VITE_FIREBASE_API_KEY`
4. Value: `AIzaSyA0eE-wKhem4t7I3G-SKz7-f2IMmfWDjSk`
5. Environment сонгох: Production, Preview, Development (бүгдийг)
6. Repeat бүх variables-уудын хувьд

### Арга 3: Paste .env contents

1. `.env.example` файлын агуулгыг хуулж авах
2. Vercel Dashboard → Build and Output Settings
3. ".env contents" textarea-д paste хийх
4. Variables автоматаар parse хийгдэнэ

---

## ✅ Шалгах:

Deploy хийсний дараа:
- Build logs шалгах (алдаа байхгүй эсэх)
- Browser console дээр Firebase config алдаа байхгүй эсэх
- Login/Register ажиллаж байгаа эсэх

