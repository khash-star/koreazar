# Vercel Deployment Guide

## 🚀 Vercel хэзээ ашиглах

### ✅ Одоо хийж болно (Phase 1)

**Шалтгаан:**
- Frontend код аль хэдийн GitHub дээр байна
- Environment variables тохируулах хэрэгтэй
- Test deployment хийх боломжтой

**Хийх зүйлс:**
1. Vercel account үүсгэх
2. GitHub repository холбох
3. Environment variables тохируулах (Firebase config)
4. Deploy хийх

**Анхаарах:** Одоо base44 SDK байгаа учраас зарим функцүүд ажиллахгүй байж магадгүй, гэхдээ Login/Register ажиллана.

---

### ✅ Дараа хийх (Phase 2 - Recommended)

**Хэзээ:** Firestore services үүсгэж, frontend файлуудыг migration хийсний дараа

**Шалтгаан:**
- Бүх функцүүд ажиллах болно
- Production-ready байх болно
- Testing хийх боломжтой

**Хийх зүйлс:**
1. Бүх base44.entities.* → Firestore services солих
2. Testing хийх
3. Vercel дээр deploy хийх

---

## 📋 Vercel Deployment Алхмууд

### 1. Vercel Account үүсгэх

1. https://vercel.com руу оч
2. "Sign Up" дарах
3. GitHub account-аараа sign up хийх
4. Vercel-д GitHub access өгөх

### 2. Project Import хийх

**Арга 1: Vercel Dashboard (Web UI)**
1. Vercel Dashboard → "Add New..." → "Project"
2. GitHub repository сонгох: `khash-star/koreazar`
3. Framework Preset: **Vite**
4. Root Directory: `zar-746103b7` (важно!)
5. Build Command: `npm run build`
6. Output Directory: `dist`
7. Install Command: `npm install`

### 3. Environment Variables тохируулах

Vercel Dashboard → Project → Settings → Environment Variables

Дараах variables нэмэх:
```
VITE_FIREBASE_API_KEY=AIzaSyA0eE-wKhem4t7I3G-SKz7-f2IMmfWDjSk
VITE_FIREBASE_AUTH_DOMAIN=koreazar-32e7a.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=koreazar-32e7a
VITE_FIREBASE_STORAGE_BUCKET=koreazar-32e7a.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=384960850116
VITE_FIREBASE_APP_ID=1:384960850116:web:7bfcf963b92dace3b24191
```

**Environment сонгох:**
- ✅ Production
- ✅ Preview
- ✅ Development

### 4. Deploy хийх

1. "Deploy" button дарах
2. Deployment хийгдэхийг хүлээх (1-2 минут)
3. URL авах (жишээ: `koreazar-abc123.vercel.app`)

### 5. Custom Domain тохируулах (Optional)

1. Vercel Dashboard → Project → Settings → Domains
2. Domain нэмэх (жишээ: `koreazar.com`)
3. DNS тохиргоо хийх:
   - A record эсвэл CNAME record нэмэх
   - Vercel заавар өгнө

---

## 🔧 Vercel CLI ашиглах (Optional)

```bash
# Vercel CLI суулгах
npm install -g vercel

# Login хийх
vercel login

# Project folder руу орох
cd C:\Users\khash\OneDrive\Desktop\koreazar\zar-746103b7

# Deploy хийх (preview)
vercel

# Production deploy
vercel --prod
```

---

## ⚠️ Анхаарах зүйлс

1. **Root Directory:** `zar-746103b7` сонгох (важно!)
2. **Environment Variables:** Бүх Firebase config нэмэх
3. **Build Command:** `npm run build` (Vite)
4. **Output Directory:** `dist` (Vite default)

---

## 📝 Deploy хийсний дараа

1. URL-ийг шалгах
2. Login/Register test хийх
3. Custom domain тохируулах (хүсвэл)
4. GitHub push хийх үед automatic deploy идэвхжүүлнэ

---

## 🎯 Recommendation

**Одоо хийх:**
- Vercel account үүсгэх
- GitHub repository import хийх
- Environment variables тохируулах
- Test deploy хийх

**Migration дууссаны дараа:**
- Production deploy хийх
- Custom domain тохируулах
- Monitoring тохируулах

