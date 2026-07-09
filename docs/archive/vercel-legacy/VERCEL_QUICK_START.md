# 🚀 Vercel дээр Deploy хийх - Хурдан заавар

## ✅ Одоо хийх зүйл:

### 1. Vercel Website руу орох
- https://vercel.com
- GitHub account-аараа нэвтрэх

### 2. New Project үүсгэх
1. "Add New..." → "Project" дарна
2. GitHub repository сонгох: **khash-star/koreazar**
3. **Import** button дарна

### 3. Project Settings тохируулах
- **Framework Preset:** Vite (автоматаар сонгогдоно)
- **Root Directory:** `zar-746103b7` ⚠️ **ЧУХАЛ!**
- **Build Command:** `npm run build` (default)
- **Output Directory:** `dist` (default)
- **Install Command:** `npm install` (default)

### 4. Environment Variables нэмэх ⚠️ **ЧУХАЛ!**

Settings → Environment Variables дээр дараах variables нэмэх:

**Production, Preview, Development гэсэн 3 environment дээр нэмэх:**

```
VITE_FIREBASE_API_KEY=AIzaSyA0eE-wKhem4t7I3G-SKz7-f2IMmfWDjSk
VITE_FIREBASE_AUTH_DOMAIN=koreazar-32e7a.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=koreazar-32e7a
VITE_FIREBASE_STORAGE_BUCKET=koreazar-32e7a.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=384960850116
VITE_FIREBASE_APP_ID=1:384960850116:web:7bfcf963b92dace3b24191
VITE_OPENAI_API_KEY=your_openai_api_key_here
```

### 5. Deploy хийх
- "Deploy" button дарна
- Build хийгдэх хүлээх (2-3 минут)
- Deploy амжилттай бол URL авна

### 6. Domain тохируулах (zarkorea.com)
1. Project → Settings → Domains
2. `zarkorea.com` нэмэх
3. DNS records тохируулах:
   - Vercel-ийн зааварчилгаа дагах
   - Nameservers эсвэл A/CNAME records тохируулах

## ⚠️ ЧУХАЛ:

1. **Root Directory:** `zar-746103b7` гэж тохируулах (бусад тохиргоо default байна)
2. **Environment Variables:** Бүх 7 variables нэмэх (Production, Preview, Development)
3. **Build хийгдэхэд хүлээх:** Эхний удаа 2-3 минут зарцуулагдана

## ✅ Deploy хийсний дараа шалгах:

1. ✅ Website ажиллаж байгаа эсэх
2. ✅ CSS файлууд зөв load хийгдэж байгаа эсэх
3. ✅ Firebase connection зөв ажиллаж байгаа эсэх
4. ✅ Authentication ажиллаж байгаа эсэх

## 🔄 Автомат Deploy:

`main` branch дээр push хийх бүрт автоматаар deploy хийгдэнэ!

